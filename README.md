# Sistemcar Rent a Car — v2

Aplicație de gestionare flotă și închirieri: vehicule cu RCA / ITP / rovinietă / CASCO și alerte la 30 și 7 zile,
predare și primire cu fotografii, galerie foto pe fiecare mașină, clienți, încasări.

Tehnologii: React + Vite + Tailwind, Supabase (bază de date, autentificare, stocare fișiere), Vercel.

## Instalare (o singură dată)

1. **Supabase → SQL Editor → New query**: lipește tot conținutul din `SUPABASE_SETUP_V2.sql` și apasă **Run** (instalare nouă). Dacă ai rulat deja V2, rulează doar `SUPABASE_UPDATE_V3.sql`.
2. **Supabase → Authentication → Users → Add user → Create new user**: email + parolă, bifează **Auto Confirm User**.
3. **Supabase → Authentication → Sign In / Providers**: dezactivează **Allow new users to sign up**
   (astfel doar conturile create de tine pot intra).
4. Urcă fișierele pe GitHub. Vercel face deploy automat.

Variabile de mediu necesare în Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Limite plan gratuit Supabase

- 1 GB fișiere: pozele sunt micșorate automat (~0,3–1 MB/poză), deci încap câteva mii.
- Doar fotografii (fără video), micșorate automat înainte de încărcare.
- Proiectul se pune pe pauză după 7 zile fără activitate; se reactivează din panoul Supabase.
