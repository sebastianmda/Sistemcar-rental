-- =====================================================================
--  SISTEMCAR RENTAL v2 — configurare bază de date
--  Rulează TOT scriptul o singură dată în Supabase → SQL Editor → Run.
--  Poate fi rulat și de mai multe ori fără să strice datele existente.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. VEHICULE
-- ---------------------------------------------------------------------
create table if not exists public.vehicles (
  id            uuid primary key default gen_random_uuid(),
  nume_model    text not null,
  inmatriculare text not null unique,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.vehicles add column if not exists vin                 text;
alter table public.vehicles add column if not exists an_fabricatie       integer;
alter table public.vehicles add column if not exists culoare             text;
alter table public.vehicles add column if not exists capacitate_pasageri integer default 5;
alter table public.vehicles add column if not exists tip_combustibil     text default 'Benzină';
alter table public.vehicles add column if not exists cutie_viteze        text default 'Manuală';
alter table public.vehicles add column if not exists km_actuali          integer default 0;
alter table public.vehicles add column if not exists status              text default 'Disponibil';
alter table public.vehicles add column if not exists tarif_zilnic        numeric(10,2);
alter table public.vehicles add column if not exists rca_expira          date;
alter table public.vehicles add column if not exists itp_expira          date;
alter table public.vehicles add column if not exists rovinieta_expira    date;
alter table public.vehicles add column if not exists casco_expira        date;
alter table public.vehicles add column if not exists observatii          text;
alter table public.vehicles add column if not exists is_archived         boolean default false;

-- statusul „Sold” nu mai există
update public.vehicles set status = 'Disponibil' where status not in ('Disponibil', 'În chirie', 'Service') or status is null;

-- ---------------------------------------------------------------------
-- 2. SETĂRI (tarif implicit)
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  id                   text primary key,
  tarif_zilnic_default numeric(10,2) default 150,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

insert into public.settings (id, tarif_zilnic_default)
values ('default_tariff', 150)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 3. CLIENȚI (chiriași)
-- ---------------------------------------------------------------------
create table if not exists public.clients (
  id             uuid primary key default gen_random_uuid(),
  nume           text not null,
  telefon        text,
  email          text,
  cnp            text,
  act_identitate text,
  adresa         text,
  permis_numar   text,
  permis_expira  date,
  firma          text,
  cui            text,
  observatii     text,
  created_at     timestamptz default now()
);

-- ---------------------------------------------------------------------
-- 4. ÎNCHIRIERI (predare / primire)
-- ---------------------------------------------------------------------
create table if not exists public.rentals (
  id                          uuid primary key default gen_random_uuid(),
  vehicle_id                  uuid not null references public.vehicles(id) on delete restrict,
  client_id                   uuid not null references public.clients(id)  on delete restrict,
  status                      text not null default 'activa',
  data_predare                timestamptz not null default now(),
  data_returnare_planificata  timestamptz not null,
  data_returnare              timestamptz,
  tarif_zilnic                numeric(10,2) not null default 0,
  garantie                    numeric(10,2) default 0,
  km_predare                  integer,
  km_primire                  integer,
  combustibil_predare         text,
  combustibil_primire         text,
  observatii_predare          text,
  observatii_primire          text,
  total_final                 numeric(10,2),
  created_at                  timestamptz default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'rentals_status_check') then
    alter table public.rentals
      add constraint rentals_status_check check (status in ('activa', 'finalizata', 'anulata'));
  end if;
end $$;

-- un vehicul nu poate avea două închirieri active în același timp
create unique index if not exists rentals_one_active_per_vehicle
  on public.rentals (vehicle_id) where status = 'activa';

create index if not exists rentals_client_idx on public.rentals (client_id);

-- ---------------------------------------------------------------------
-- 5. FOTO / VIDEO la predare și primire
-- ---------------------------------------------------------------------
create table if not exists public.rental_media (
  id         uuid primary key default gen_random_uuid(),
  rental_id  uuid not null references public.rentals(id) on delete cascade,
  etapa      text not null check (etapa in ('predare', 'primire')),
  tip        text not null check (tip in ('foto', 'video')),
  path       text not null,
  created_at timestamptz default now()
);

create index if not exists rental_media_rental_idx on public.rental_media (rental_id);

-- ---------------------------------------------------------------------
-- 6. SECURITATE: doar utilizatorii autentificați au acces la date
--    (șterge regulile vechi „acces pentru oricine”)
-- ---------------------------------------------------------------------
do $$
declare
  t text;
  p record;
begin
  foreach t in array array['vehicles', 'settings', 'clients', 'rentals', 'rental_media', 'pricing_rules']
  loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      for p in select policyname from pg_policies where schemaname = 'public' and tablename = t
      loop
        execute format('drop policy %I on public.%I', p.policyname, t);
      end loop;
      execute format(
        'create policy "doar_utilizatori_autentificati" on public.%I for all to authenticated using (true) with check (true)',
        t
      );
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 7. STOCARE FIȘIERE (bucket privat pentru poze/video)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('rental-media', 'rental-media', false)
on conflict (id) do nothing;

drop policy if exists "sistemcar_media_citire"  on storage.objects;
drop policy if exists "sistemcar_media_incarcare" on storage.objects;
drop policy if exists "sistemcar_media_stergere"  on storage.objects;

create policy "sistemcar_media_citire" on storage.objects
  for select to authenticated using (bucket_id = 'rental-media');

create policy "sistemcar_media_incarcare" on storage.objects
  for insert to authenticated with check (bucket_id = 'rental-media');

create policy "sistemcar_media_stergere" on storage.objects
  for delete to authenticated using (bucket_id = 'rental-media');

-- ---------------------------------------------------------------------
-- 8. POZĂ PROFIL + GALERIE FOTO VEHICULE (v3)
-- ---------------------------------------------------------------------
alter table public.vehicles add column if not exists foto_profil text;

create table if not exists public.vehicle_media (
  id         uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  categorie  text not null default 'masina',
  path       text not null,
  created_at timestamptz default now()
);
alter table public.vehicle_media enable row level security;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'vehicle_media_categorie_check') then
    alter table public.vehicle_media
      add constraint vehicle_media_categorie_check check (categorie in ('document', 'masina', 'bord', 'altele'));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'vehicle_media') then
    create policy "doar_utilizatori_autentificati" on public.vehicle_media
      for all to authenticated using (true) with check (true);
  end if;
end $$;

create index if not exists vehicle_media_vehicle_idx on public.vehicle_media (vehicle_id);

-- Gata. Dacă vezi „Success. No rows returned”, totul e în regulă.
