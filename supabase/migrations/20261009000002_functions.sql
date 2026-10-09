-- =====================================================================
-- Klisto · Funciones, reglas de estados y triggers
-- =====================================================================

-- ---------- Ayudantes de autorización ----------
-- SECURITY DEFINER para que las políticas RLS puedan consultar
-- business_members sin recursión.

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_admins pa where pa.user_id = auth.uid()
  );
$$;

create or replace function public.is_member(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.business_members m
    where m.business_id = p_business_id
      and m.user_id = auth.uid()
      and m.is_active
  );
$$;

create or replace function public.has_role(p_business_id uuid, p_role public.member_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.business_members m
    where m.business_id = p_business_id
      and m.user_id = auth.uid()
      and m.role = p_role
      and m.is_active
  );
$$;

-- El catálogo es público mientras la suscripción no esté suspendida.
create or replace function public.business_is_public(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.businesses b
    where b.id = p_business_id and b.subscription_status <> 'suspended'
  );
$$;

-- ---------- Reglas de estados del pedido ----------
-- Debe coincidir con lib/orders/status.ts (allí están las pruebas).
create or replace function public.is_valid_status_transition(
  p_from public.order_status,
  p_to public.order_status
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when p_from = 'received'  then p_to in ('preparing', 'cancelled')
    when p_from = 'preparing' then p_to in ('packing', 'cancelled')
    when p_from = 'packing'   then p_to in ('ready', 'cancelled')
    when p_from = 'ready'     then p_to in ('delivered', 'cancelled')
    else false -- delivered y cancelled son estados finales
  end;
$$;

-- Qué estados puede asignar cada rol. Debe coincidir con lib/orders/status.ts.
create or replace function public.role_can_set_status(
  p_role public.member_role,
  p_to public.order_status
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case p_role
    when 'owner'  then true
    when 'chef'   then p_to in ('preparing', 'packing', 'ready', 'cancelled')
    when 'waiter' then p_to in ('delivered', 'cancelled')
    else false
  end;
$$;

create or replace function public.orders_guard_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.member_role;
begin
  if new.status is distinct from old.status then
    if not public.is_valid_status_transition(old.status, new.status) then
      raise exception 'Transición de estado no permitida: % → %', old.status, new.status
        using errcode = 'check_violation';
    end if;

    -- Cuando actúa una persona (no el servidor con service_role) se valida su rol.
    if v_uid is not null and not public.is_platform_admin() then
      select m.role into v_role
      from public.business_members m
      where m.user_id = v_uid and m.business_id = old.business_id and m.is_active;

      if v_role is null or not public.role_can_set_status(v_role, new.status) then
        raise exception 'Tu rol no puede pasar el pedido a "%"', new.status
          using errcode = 'insufficient_privilege';
      end if;
    end if;

    case new.status
      when 'preparing' then new.preparing_at := now();
      when 'packing'   then new.packing_at := now();
      when 'ready'     then new.ready_at := now();
      when 'delivered' then new.delivered_at := now();
      when 'cancelled' then new.cancelled_at := now();
      else null;
    end case;
  end if;
  return new;
end;
$$;

create trigger orders_guard_update
  before update on public.orders
  for each row execute function public.orders_guard_update();

-- Historial + aviso en tiempo real al cliente.
-- El cliente escucha un canal Broadcast llamado "order:<tracking_token>":
-- así recibe cambios sin tener permiso de lectura sobre la tabla orders.
create or replace function public.orders_after_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history (order_id, business_id, from_status, to_status, changed_by)
    values (new.id, new.business_id, null, new.status, auth.uid());
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.order_status_history (order_id, business_id, from_status, to_status, changed_by)
    values (new.id, new.business_id, old.status, new.status, auth.uid());

    begin
      perform realtime.send(
        jsonb_build_object('status', new.status, 'updated_at', new.updated_at),
        'status_changed',
        'order:' || new.tracking_token,
        false
      );
    exception when others then
      -- Si Realtime no está disponible, la página del cliente igual
      -- consulta periódicamente; no se bloquea el cambio de estado.
      raise notice 'realtime.send no disponible: %', sqlerrm;
    end;
  end if;
  return new;
end;
$$;

create trigger orders_after_insert
  after insert on public.orders
  for each row execute function public.orders_after_change();

create trigger orders_after_update
  after update on public.orders
  for each row execute function public.orders_after_change();

-- ---------- Consecutivo diario ----------
-- Suma 1 de forma atómica por negocio y por día local (America/Bogota).
-- Solo lo usa el servidor (service_role).
create or replace function public.next_order_number(p_business_id uuid)
returns table (order_date date, daily_number int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tz text;
  v_day date;
begin
  select b.timezone into v_tz from public.businesses b where b.id = p_business_id;
  if v_tz is null then
    raise exception 'Negocio no encontrado' using errcode = 'no_data_found';
  end if;

  v_day := (now() at time zone v_tz)::date;

  return query
  insert into public.daily_order_counters as c (business_id, day, last_number)
  values (p_business_id, v_day, 1)
  on conflict (business_id, day)
    do update set last_number = c.last_number + 1
  returning c.day, c.last_number;
end;
$$;

revoke execute on function public.next_order_number(uuid) from public, anon, authenticated;
grant execute on function public.next_order_number(uuid) to service_role;

-- ---------- Página pública del negocio ----------
create or replace function public.get_public_business(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', b.id,
    'slug', b.slug,
    'name', b.name,
    'business_type', b.business_type,
    'logo_url', b.logo_url,
    'primary_color', b.primary_color,
    'phone', b.phone,
    'address', b.address,
    'opening_hours', b.opening_hours,
    'timezone', b.timezone,
    'accepting_orders', b.accepting_orders,
    'available', b.subscription_status <> 'suspended'
  )
  from public.businesses b
  where b.slug = lower(p_slug);
$$;

-- ---------- Seguimiento del pedido ----------
create or replace function public.get_order_by_token(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'code', o.code,
    'status', o.status,
    'customer_name', o.customer_name,
    'customer_phone_last4', right(o.customer_phone, 4),
    'notes', o.notes,
    'total', o.total,
    'payment_method', o.payment_method,
    'payment_status', o.payment_status,
    'created_at', o.created_at,
    'preparing_at', o.preparing_at,
    'packing_at', o.packing_at,
    'ready_at', o.ready_at,
    'delivered_at', o.delivered_at,
    'cancelled_at', o.cancelled_at,
    'cancel_reason', o.cancel_reason,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'product_name', i.product_name,
        'quantity', i.quantity,
        'unit_price', i.unit_price,
        'line_total', i.line_total,
        'modifiers', i.modifiers,
        'notes', i.notes
      ) order by i.product_name)
      from public.order_items i where i.order_id = o.id
    ), '[]'::jsonb),
    'business', jsonb_build_object(
      'slug', b.slug,
      'name', b.name,
      'logo_url', b.logo_url,
      'primary_color', b.primary_color,
      'phone', b.phone,
      'address', b.address
    )
  )
  from public.orders o
  join public.businesses b on b.id = o.business_id
  where o.tracking_token = p_token
    and char_length(p_token) >= 32;
$$;

-- Consulta con código + celular completo. Devuelve el token si ambos coinciden.
create or replace function public.lookup_order(p_slug text, p_code text, p_phone text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select o.tracking_token
  from public.orders o
  join public.businesses b on b.id = o.business_id
  where b.slug = lower(p_slug)
    and o.code = upper(trim(p_code))
    and o.customer_phone = regexp_replace(p_phone, '\D', '', 'g')
  order by o.created_at desc
  limit 1;
$$;

grant execute on function public.get_public_business(text) to anon, authenticated;
grant execute on function public.get_order_by_token(text) to anon, authenticated;
grant execute on function public.lookup_order(text, text, text) to anon, authenticated;

-- ---------- Reportes (respetan RLS: SECURITY INVOKER) ----------
create or replace function public.report_sales_by_day(
  p_business_id uuid,
  p_from date,
  p_to date
)
returns table (day date, orders_count bigint, sales bigint)
language sql
stable
set search_path = ''
as $$
  select o.order_date, count(*), coalesce(sum(o.total), 0)
  from public.orders o
  where o.business_id = p_business_id
    and o.order_date between p_from and p_to
    and o.status <> 'cancelled'
  group by o.order_date
  order by o.order_date;
$$;

create or replace function public.report_top_products(
  p_business_id uuid,
  p_from date,
  p_to date,
  p_limit int default 10
)
returns table (product_name text, quantity bigint, revenue bigint)
language sql
stable
set search_path = ''
as $$
  select i.product_name, sum(i.quantity), sum(i.line_total)
  from public.order_items i
  join public.orders o on o.id = i.order_id
  where o.business_id = p_business_id
    and o.order_date between p_from and p_to
    and o.status <> 'cancelled'
  group by i.product_name
  order by 2 desc, 3 desc
  limit greatest(1, least(p_limit, 50));
$$;
