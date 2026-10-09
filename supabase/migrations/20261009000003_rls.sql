-- =====================================================================
-- Klisto · Row Level Security
-- Regla general: cada negocio solo ve y modifica sus propios datos.
-- El público (anon) solo lee el catálogo de negocios no suspendidos y
-- crea leads. Los pedidos se crean desde el servidor (service_role),
-- que recalcula precios y asigna el consecutivo.
-- =====================================================================

alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.platform_admins enable row level security;
alter table public.leads enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.modifier_groups enable row level security;
alter table public.modifier_options enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.daily_order_counters enable row level security;
alter table public.notifications_log enable row level security;

-- ---------- businesses ----------
create policy "miembros y admin leen su negocio"
  on public.businesses for select to authenticated
  using (public.is_member(id) or public.is_platform_admin());

create policy "dueño actualiza su negocio"
  on public.businesses for update to authenticated
  using (public.has_role(id, 'owner'))
  with check (public.has_role(id, 'owner'));

-- El dueño solo puede cambiar estos campos. Plan, estado de suscripción y
-- slug solo los cambia el superadministrador (desde el servidor).
revoke insert, update, delete on public.businesses from anon, authenticated;
grant update (name, logo_url, primary_color, phone, address, opening_hours, accepting_orders)
  on public.businesses to authenticated;

-- ---------- business_members ----------
create policy "ver mi membresía o el equipo si soy dueño"
  on public.business_members for select to authenticated
  using (
    user_id = auth.uid()
    or public.has_role(business_id, 'owner')
    or public.is_platform_admin()
  );
-- Crear/editar personal requiere crear usuarios de Auth: se hace en el
-- servidor con service_role tras verificar que quien lo pide es el dueño.
revoke insert, update, delete on public.business_members from anon, authenticated;

-- ---------- platform_admins ----------
create policy "ver mi registro de admin"
  on public.platform_admins for select to authenticated
  using (user_id = auth.uid());
revoke insert, update, delete on public.platform_admins from anon, authenticated;

-- ---------- leads ----------
create policy "cualquiera deja sus datos con autorización"
  on public.leads for insert to anon, authenticated
  with check (data_consent_at is not null);

create policy "solo admin lee leads"
  on public.leads for select to authenticated
  using (public.is_platform_admin());

-- ---------- Catálogo ----------
create policy "catálogo público"
  on public.categories for select to anon, authenticated
  using (public.business_is_public(business_id) or public.is_member(business_id) or public.is_platform_admin());
create policy "dueño gestiona categorías"
  on public.categories for all to authenticated
  using (public.has_role(business_id, 'owner'))
  with check (public.has_role(business_id, 'owner'));

create policy "productos públicos"
  on public.products for select to anon, authenticated
  using (public.business_is_public(business_id) or public.is_member(business_id) or public.is_platform_admin());
create policy "dueño gestiona productos"
  on public.products for all to authenticated
  using (public.has_role(business_id, 'owner'))
  with check (public.has_role(business_id, 'owner'));

create policy "grupos de modificadores públicos"
  on public.modifier_groups for select to anon, authenticated
  using (public.business_is_public(business_id) or public.is_member(business_id) or public.is_platform_admin());
create policy "dueño gestiona grupos de modificadores"
  on public.modifier_groups for all to authenticated
  using (public.has_role(business_id, 'owner'))
  with check (public.has_role(business_id, 'owner'));

create policy "opciones de modificadores públicas"
  on public.modifier_options for select to anon, authenticated
  using (public.business_is_public(business_id) or public.is_member(business_id) or public.is_platform_admin());
create policy "dueño gestiona opciones de modificadores"
  on public.modifier_options for all to authenticated
  using (public.has_role(business_id, 'owner'))
  with check (public.has_role(business_id, 'owner'));

revoke insert, update, delete on public.categories, public.products,
  public.modifier_groups, public.modifier_options from anon;

-- ---------- Pedidos ----------
create policy "el equipo ve los pedidos de su negocio"
  on public.orders for select to authenticated
  using (public.is_member(business_id) or public.is_platform_admin());

create policy "el equipo actualiza pedidos de su negocio"
  on public.orders for update to authenticated
  using (public.is_member(business_id))
  with check (public.is_member(business_id));

-- Solo se pueden cambiar estas columnas; el trigger orders_guard_update
-- valida además la transición y el rol.
revoke insert, update, delete on public.orders from anon, authenticated;
grant update (status, cancel_reason, payment_status) on public.orders to authenticated;

create policy "el equipo ve los productos del pedido"
  on public.order_items for select to authenticated
  using (public.is_member(business_id) or public.is_platform_admin());
revoke insert, update, delete on public.order_items from anon, authenticated;

create policy "el equipo ve el historial"
  on public.order_status_history for select to authenticated
  using (public.is_member(business_id) or public.is_platform_admin());
revoke insert, update, delete on public.order_status_history from anon, authenticated;

-- daily_order_counters: sin políticas. Solo service_role (next_order_number).
revoke all on public.daily_order_counters from anon, authenticated;

-- ---------- notifications_log ----------
create policy "dueño y admin ven las notificaciones"
  on public.notifications_log for select to authenticated
  using (public.has_role(business_id, 'owner') or public.is_platform_admin());
revoke insert, update, delete on public.notifications_log from anon, authenticated;
