-- =====================================================================
--  SISTEMCAR RENTAL v5 — numărul și data contractului introduse de tine
--  Rulează în Supabase → SQL Editor → Run (după V4).
--  Nu șterge nimic și poate fi rulat de mai multe ori.
-- =====================================================================

alter table public.rentals add column if not exists numar_contract text;
alter table public.rentals add column if not exists data_contract  date;

-- contractele deja create își păstrează numărul și data de până acum
update public.rentals
set numar_contract = nr_contract::text,
    data_contract  = data_predare::date
where numar_contract is null and nr_contract is not null;

-- Gata. Dacă vezi „Success. No rows returned”, totul e în regulă.
