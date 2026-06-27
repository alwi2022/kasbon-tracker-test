# Kasbon Tracker

Kasbon Tracker adalah web app sederhana untuk mencatat utang piutang pribadi. User bisa daftar, login, mencatat siapa yang hutang ke dia atau dia hutang ke siapa, melihat ringkasan saldo, lalu menandai catatan sebagai lunas.

## Demo

Live app: https://kasbon-tracker-test.vercel.app/login

Loom demo akan dikirim terpisah ke recruiter.

## Stack

- Next.js 16 App Router
- TypeScript strict
- Tailwind CSS v4
- Supabase PostgreSQL + Auth
- Lucide React untuk ikon
- Zod untuk validasi input client dan server

Saya menambahkan Zod karena schema yang sama bisa dipakai untuk validasi form dan API. Ini mengurangi risiko input beda aturan antara client dan server, terutama untuk amount, due date, note max 200 karakter, dan filter query.

## Fitur

- Signup, login, dan logout dengan Supabase Auth.
- Protected dashboard, user yang belum login diarahkan ke `/login`.
- Summary total piutang, total utang, dan saldo bersih.
- Format Rupiah memakai `Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })`.
- Relative date Bahasa Indonesia seperti `hari ini`, `kemarin`, dan `3 hari lalu`.
- CRUD kasbon lewat API route.
- Toggle lunas tersimpan ke database.
- Filter status dan tipe.
- Search nama orang.
- Sort tanggal dan jumlah.
- Pagination 5 catatan per halaman.
- Group saldo terbuka per orang.
- Bar chart sederhana untuk piutang vs utang.
- Empty, loading, dan error state.
- Responsive layout untuk mobile dan desktop.

## Setup Local

1. Install dependency.

```bash
npm install
```

2. Copy env.

```bash
cp .env.example .env.local
```

3. Isi env berikut.

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

4. Jalankan migration ke Supabase.

Jika memakai Supabase CLI:

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

Atau jalankan SQL dari folder `supabase/migrations/` lewat Supabase SQL Editor.

5. Jalankan development server.

```bash
npm run dev
```

App berjalan di `http://localhost:3000`.

## Supabase Auth

Untuk demo yang lebih lancar, email confirmation bisa dimatikan di Supabase Dashboard:

`Authentication -> Sign In / Providers -> Confirm email`

Requirement hanya meminta signup dan login email password. Email confirmation tidak wajib untuk task ini.

## API

- `GET /api/debts?status=&type=`
- `POST /api/debts`
- `PATCH /api/debts/[id]`
- `DELETE /api/debts/[id]`

Semua endpoint wajib auth. User diambil dari Supabase session, bukan dari body request. Field `user_id` tidak dipercaya dari client.

## Database dan RLS

Migration ada di `supabase/migrations/`.

Tabel utama: `debts`

- `id`
- `user_id`
- `type`
- `counterpart_name`
- `amount`
- `note`
- `due_date`
- `settled_at`
- `created_at`
- `updated_at`

RLS aktif untuk `SELECT`, `INSERT`, `UPDATE`, dan `DELETE`. Policy membatasi akses hanya untuk row dengan `auth.uid() = user_id`.

## RLS Test Evidence

RLS sudah dites memakai dua user berbeda via Postman dan Supabase REST API langsung.

| Test | Hasil yang Diharapkan | Status |
| --- | --- | --- |
| Login User A | Berhasil login | Pass |
| Login User B | Berhasil login | Pass |
| User A Insert | Berhasil membuat data sendiri | Pass |
| User B Read | Tidak bisa melihat data User A (`[]`) | Pass |
| User B Patch | Tidak bisa mengubah data User A | Pass |
| User B Delete | Tidak bisa menghapus data User A | Pass |
| User A Verify | Data User A masih utuh | Pass |
| User B Fake Insert | Gagal insert dengan `user_id` User A | Pass |

Kesimpulan: user tidak bisa membaca, mengubah, menghapus, atau membuat data atas nama user lain.

## Quality Check

Command yang dipakai sebelum submit:

```bash
npm run lint
npm run build
```

## Approach

Saya memisahkan logic penting ke beberapa layer: schema validasi di `src/lib/api/debt-schemas.ts`, helper business logic di `src/lib/debts/business.ts`, dan akses database lewat Supabase server client. Bagian yang paling saya jaga adalah semua request API selalu mengambil user dari session Supabase, bukan dari body, supaya RLS dan API sama-sama melindungi data per user.

## Trade-off

Kalau ada satu hari lagi, saya akan menambahkan automated test untuk API dan RLS, lalu polish aksesibilitas modal seperti focus trap yang lebih lengkap. Saya juga akan menambahkan test responsive visual untuk beberapa ukuran layar utama.

## Time Spent

Sekitar 1-2 hari pengerjaan efektif.
