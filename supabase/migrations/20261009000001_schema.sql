-- =====================================================================
-- Klisto · Esquema principal (multi-empresa)
-- Todas las tablas de negocio llevan business_id y se protegen con RLS
-- (ver 20261009000002_rls.sql).
-- =====================================================================

-- ---------- Tipos ----------
create type public.business_type as enum ('restaurant', 'services');
create type public.subscription_status as enum ('trial', 'active', 'suspended');
create type public.plan_tier as enum ('basico', 'pro', 'premium');
create type public.member_role as enum ('owner', 'waiter', 'chef');
create type public.order_status as enum (
  'received', 'preparing', 'packing', 'ready', 'delivered', 'cancelled'
);
create type public.payment_method as enum ('pay_at_pickup', 'wompi');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');

-- ---------- Utilidad: updated_at ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- Negocios ----------
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$')
    check (slug not in (
      'admin', 'panel', 'api', 'login', 'politica-de-datos', 'terminos',
      'demo-panel', 'app', 'www', 'klisto', 'soporte', 'ayuda', 'precios',
      'planes', 'blog', 'static', 'assets', 'pedido', 'consultar'
    )),
  name text not null check (char_length(name) between 2 and 80),
  business_type public.business_type not null default 'restaurant',
  logo_url text,
  primary_color text not null default '#FF6A2B'
    check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  phone text check (phone ~ '^3[0-9]{9}$'),
  address text,
  -- {"mon": {"open": "08:00", "close": "20:00", "closed": false}, ...}
  opening_hours jsonb not null default '{}'::jsonb,
  timezone text not null default 'America/Bogota',
  accepting_orders boolean not null default true,
  plan public.plan_tier not null default 'basico',
  subscription_status public.subscription_status not null default 'trial',
  trial_ends_at timestamptz default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger businesses_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

-- ---------- Personal del negocio ----------
-- Un usuario pertenece a un solo negocio (simplifica el panel).
-- Dueño: entra con correo. Mesero y chef: entran con usuario + número de
-- documento; internamente se les crea un correo sintético.
create table public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  role public.member_role not null,
  display_name text not null check (char_length(display_name) between 2 and 80),
  username text check (username ~ '^[a-z0-9][a-z0-9._]{2,29}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, username)
);
create index business_members_business_idx on public.business_members (business_id);

-- ---------- Superadministradores de Klisto ----------
create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------- Interesados (formulario de la landing) ----------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  business_name text not null check (char_length(business_name) between 2 and 120),
  phone text not null check (phone ~ '^3[0-9]{9}$'),
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  city text check (city is null or char_length(city) <= 80),
  business_type text check (business_type is null or char_length(business_type) <= 60),
  message text check (message is null or char_length(message) <= 1000),
  data_consent_at timestamptz not null,
  data_policy_version text not null,
  created_at timestamptz not null default now()
);

-- ---------- Catálogo ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, business_id)
);
create index categories_business_idx on public.categories (business_id, sort_order);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  category_id uuid not null,
  name text not null check (char_length(name) between 1 and 80),
  description text check (description is null or char_length(description) <= 400),
  price int not null check (price >= 0),
  image_url text,
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, business_id),
  -- La categoría debe ser del mismo negocio.
  foreign key (category_id, business_id)
    references public.categories (id, business_id) on delete cascade
);
create index products_business_idx on public.products (business_id, category_id, sort_order);

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Grupo de modificadores de un producto ("Término de la carne", "Adiciones").
create table public.modifier_groups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  product_id uuid not null,
  name text not null check (char_length(name) between 1 and 60),
  min_select int not null default 0 check (min_select >= 0),
  max_select int not null default 1 check (max_select >= 1),
  sort_order int not null default 0,
  unique (id, business_id),
  check (min_select <= max_select),
  foreign key (product_id, business_id)
    references public.products (id, business_id) on delete cascade
);
create index modifier_groups_product_idx on public.modifier_groups (product_id, sort_order);

create table public.modifier_options (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  group_id uuid not null,
  name text not null check (char_length(name) between 1 and 60),
  price_delta int not null default 0 check (price_delta >= 0),
  is_available boolean not null default true,
  sort_order int not null default 0,
  foreign key (group_id, business_id)
    references public.modifier_groups (id, business_id) on delete cascade
);
create index modifier_options_group_idx on public.modifier_options (group_id, sort_order);

-- ---------- Pedidos ----------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  -- Fecha local del negocio (America/Bogota) y consecutivo de ese día.
  order_date date not null,
  daily_number int not null check (daily_number > 0),
  code text not null,
  -- Token aleatorio e impredecible para la página de seguimiento.
  tracking_token text not null unique
    default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''))
    check (char_length(tracking_token) >= 32),
  customer_name text not null check (char_length(customer_name) between 2 and 80),
  customer_phone text not null check (customer_phone ~ '^3[0-9]{9}$'),
  notes text check (notes is null or char_length(notes) <= 300),
  status public.order_status not null default 'received',
  payment_method public.payment_method not null default 'pay_at_pickup',
  payment_status public.payment_status not null default 'pending',
  payment_reference text,
  subtotal int not null check (subtotal >= 0),
  total int not null check (total >= 0),
  data_consent_at timestamptz not null,
  data_policy_version text not null,
  cancel_reason text check (cancel_reason is null or char_length(cancel_reason) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  preparing_at timestamptz,
  packing_at timestamptz,
  ready_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  unique (business_id, order_date, daily_number),
  unique (id, business_id)
);
create index orders_business_created_idx on public.orders (business_id, created_at desc);
create index orders_business_status_idx on public.orders (business_id, status);
create index orders_business_code_idx on public.orders (business_id, code);

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  business_id uuid not null references public.businesses (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  -- Copia del producto al momento de pedir: si el menú cambia, el pedido no.
  product_name text not null,
  unit_price int not null check (unit_price >= 0),
  quantity int not null check (quantity between 1 and 99),
  -- [{"group": "Término", "option": "Tres cuartos", "price_delta": 0}]
  modifiers jsonb not null default '[]'::jsonb,
  notes text check (notes is null or char_length(notes) <= 200),
  line_total int not null check (line_total >= 0),
  foreign key (order_id, business_id)
    references public.orders (id, business_id) on delete cascade
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_business_idx on public.order_items (business_id, product_id);

create table public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  changed_by uuid references auth.users (id) on delete set null,
  changed_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history (order_id);

-- Consecutivo diario por negocio.
create table public.daily_order_counters (
  business_id uuid not null references public.businesses (id) on delete cascade,
  day date not null,
  last_number int not null default 0,
  primary key (business_id, day)
);

-- ---------- Notificaciones ----------
create table public.notifications_log (
  id bigint generated always as identity primary key,
  business_id uuid references public.businesses (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  channel text not null default 'whatsapp',
  template text not null,
  to_phone text not null,
  payload jsonb not null default '{}'::jsonb,
  mode text not null check (mode in ('simulated', 'live')),
  status text not null check (status in ('sent', 'failed')),
  provider_message_id text,
  error text,
  created_at timestamptz not null default now()
);
create index notifications_log_business_idx on public.notifications_log (business_id, created_at desc);

-- =====================================================================
-- Módulo de citas (peluquerías, barberías…): se construirá después.
-- Seguirá el mismo patrón: tablas services, staff_schedules y appointments
-- con business_id + RLS, usando businesses.business_type = 'services'.
-- =====================================================================
