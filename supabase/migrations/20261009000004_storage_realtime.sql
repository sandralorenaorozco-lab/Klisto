-- =====================================================================
-- Klisto · Storage (logos y fotos) y Realtime
-- =====================================================================

-- Bucket público de lectura. Las rutas son "<business_id>/<archivo>".
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-assets',
  'business-assets',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create or replace function public.owns_business_folder(p_object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.business_members m
    where m.user_id = auth.uid()
      and m.role = 'owner'
      and m.is_active
      and m.business_id::text = split_part(p_object_name, '/', 1)
  );
$$;

create policy "dueño sube archivos a su carpeta"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'business-assets' and public.owns_business_folder(name));

create policy "dueño actualiza archivos de su carpeta"
  on storage.objects for update to authenticated
  using (bucket_id = 'business-assets' and public.owns_business_folder(name));

create policy "dueño borra archivos de su carpeta"
  on storage.objects for delete to authenticated
  using (bucket_id = 'business-assets' and public.owns_business_folder(name));

-- Realtime: la pantalla de cocina escucha cambios en orders (respetando RLS).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.orders;
  end if;
end;
$$;
