-- =====================================================================
--  SISTEMCAR RENTAL v3 — poză de profil + galerie foto pentru vehicule
--  Rulează în Supabase → SQL Editor → Run (după ce ai rulat deja V2).
--  Nu șterge nimic și poate fi rulat de mai multe ori.
-- =====================================================================

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
