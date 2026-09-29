-- =====================================================================
--  SISTEMCAR RENTAL v4 — contract de închiriere generat automat
--  Rulează în Supabase → SQL Editor → Run (după V2 și V3).
--  Nu șterge nimic și poate fi rulat de mai multe ori.
-- =====================================================================

-- Client: categoria permisului
alter table public.clients add column if not exists permis_categorie text default 'B';

-- Închiriere: câmpurile din contract și din Anexa 1
alter table public.rentals add column if not exists nr_contract            integer;
alter table public.rentals add column if not exists loc_predare            text default 'sediul Locatorului';
alter table public.rentals add column if not exists sofer2_nume            text;
alter table public.rentals add column if not exists sofer2_permis          text;
alter table public.rentals add column if not exists nr_chei                integer default 1;
alter table public.rentals add column if not exists dotari_predare         jsonb;
alter table public.rentals add column if not exists dotari_lipsa           text;
alter table public.rentals add column if not exists avarii_noi             boolean default false;
alter table public.rentals add column if not exists taxa_curatare          boolean default false;
alter table public.rentals add column if not exists taxa_igienizare        boolean default false;
alter table public.rentals add column if not exists realimentare           boolean default false;
alter table public.rentals add column if not exists cost_combustibil       numeric(10,2) default 0;
alter table public.rentals add column if not exists zile_facturabile       integer;
alter table public.rentals add column if not exists semnatura_locatar_predare text;
alter table public.rentals add column if not exists semnatura_locator_predare text;
alter table public.rentals add column if not exists semnatura_locatar_retur   text;
alter table public.rentals add column if not exists semnatura_locator_retur   text;
alter table public.rentals add column if not exists contract_pdf           text;
alter table public.rentals add column if not exists contract_semnat_la     timestamptz;

-- Setări: datele firmei, semnătura/ștampila salvată, numărul de pornire al contractelor
alter table public.settings add column if not exists date_firma        jsonb;
alter table public.settings add column if not exists semnatura_locator text;
alter table public.settings add column if not exists contract_nr_start integer default 1;

update public.settings
set date_firma = '{
  "nume": "SISTEMCAR SRL",
  "denumire_contract": "S.C. SISTEMCAR S.R.L.",
  "adresa": "Comuna Nojorid, sat Leș nr. 16/A, jud. Bihor, 417348",
  "sediu_contract": "Comuna Nojorid, sat Leș nr. 16/A, jud. Bihor",
  "telefon": "0746 089 174",
  "email": "sistemcarauto@gmail.com",
  "reg_com": "J2006002518053",
  "cif": "RO19249704",
  "iban": "RO35BTRLRONCRT0286900001",
  "banca": "Banca Transilvania",
  "reprezentant": "Ghile Ioan Marius",
  "functie": "administrator"
}'::jsonb
where id = 'default_tariff' and date_firma is null;

-- Numerotare automată a contractelor (1, 2, 3 … sau de la numărul setat în aplicație)
create or replace function public.sistemcar_nr_contract()
returns trigger
language plpgsql
as $$
begin
  if new.nr_contract is null then
    select greatest(
             coalesce((select max(nr_contract) from public.rentals), 0),
             coalesce((select contract_nr_start from public.settings where id = 'default_tariff'), 1) - 1
           ) + 1
      into new.nr_contract;
  end if;
  return new;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'rentals_nr_contract') then
    create trigger rentals_nr_contract
      before insert on public.rentals
      for each row execute function public.sistemcar_nr_contract();
  end if;
end $$;

-- închirierile existente primesc numere în ordinea predării
update public.rentals r
set nr_contract = x.nr
from (
  select id, row_number() over (order by data_predare, created_at) as nr
  from public.rentals
) x
where r.id = x.id and r.nr_contract is null
  and not exists (select 1 from public.rentals where nr_contract is not null);

create unique index if not exists rentals_nr_contract_unique on public.rentals (nr_contract);

-- Gata. Dacă vezi „Success. No rows returned”, totul e în regulă.
