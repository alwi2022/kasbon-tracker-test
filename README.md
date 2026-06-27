# kasbon-tracker-test

**Audit Singkat**

Repo saat ini masih kosong: hanya ada [README.md](C:/Users/IMAM/Desktop/kasbon-tracker-test/README.md:1) berisi judul project. Belum ada Next.js app, Supabase config, migration, API, auth, UI, atau test RLS.

Dari PDF, task ini cukup serius untuk hiring karena auto-reject-nya jelas:

- RLS bocor = gagal.
- Rupiah salah format = gagal.
- Status lunas cuma client-side = gagal.
- Banyak `any` = red flag.
- Data mock/hardcode = gagal.
- Deploy Vercel tidak jalan = gagal.

Prioritas pengerjaan harus urut dari fondasi ke polish: database/RLS, auth, API strict, dashboard/form, lalu README/deploy/commit hygiene.

**Plan Pengerjaan**

1. **Setup project**
   - Init Next.js 16 App Router + TypeScript.
   - Setup Tailwind CSS v4.
   - Install `@supabase/supabase-js`, `@supabase/ssr`, `lucide-react`.
   - Aktifkan TypeScript strict dan rapikan struktur folder.

2. **Supabase & Database**
   - Buat migration di `supabase/migrations/`.
   - Buat enum `debt_type`: `owed_to_me`, `i_owe`.
   - Buat tabel `debts` sesuai PDF.
   - Tambah trigger `updated_at`.
   - Enable RLS.
   - Policy SELECT/INSERT/UPDATE/DELETE hanya untuk `auth.uid() = user_id`.
   - Ini harus dites pakai user berbeda karena bobot DB + RLS paling rawan auto-reject.

3. **Auth**
   - Signup/login email password pakai Supabase Auth.
   - Logout button.
   - Middleware/protected layout supaya halaman app hanya bisa diakses user login.
   - Redirect user belum login ke `/login`.

4. **API Endpoints**
   - `GET /api/debts?status=&type=`
   - `POST /api/debts`
   - `PATCH /api/debts/[id]`
   - `DELETE /api/debts/[id]`
   - Semua endpoint ambil user dari Supabase session, bukan dari body.
   - Validasi server pakai schema, idealnya `zod` karena mengurangi bug input dan tetap mudah dijelaskan.
   - Error response Bahasa Indonesia dengan status code benar.
   - Tidak pakai `any`.

5. **Business Logic**
   - Summary:
     - Total dihutang ke saya = sum `owed_to_me` belum lunas.
     - Total saya hutang = sum `i_owe` belum lunas.
     - Net = X - Y, hijau kalau positif, merah kalau negatif.
   - Format Rupiah wajib `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })`.
   - Relative date Bahasa Indonesia: `hari ini`, `kemarin`, `3 hari lalu`.
   - Toggle lunas harus PATCH ke database.

6. **UI Dashboard**
   - 3 summary cards di atas.
   - Filter status dan tipe.
   - List entry dengan nama, tipe, jumlah, relative date, status, aksi.
   - Empty/loading/error state.
   - Mobile-first layout.
   - Gunakan lucide icons untuk aksi seperti tambah, edit, hapus, logout.

7. **Form Catat/Edit**
   - Modal atau halaman form.
   - Radio tipe.
   - Nama wajib.
   - Jumlah wajib dalam Rupiah utuh.
   - Tanggal default hari ini.
   - Catatan opsional max 200 char.
   - Validasi client + server.

8. **Bonus yang paling worth it**
   - Search by nama orang.
   - Sort tanggal/jumlah.
   - Empty/loading/error states.
   - Mobile polish.
   - Bar chart opsional, hanya kalau core sudah aman.

9. **README & Submission**
   - Setup env.
   - Cara migrate Supabase.
   - Cara jalan local.
   - Link demo Vercel.
   - Approach 1 paragraf.
   - Trade-off kalau ada 1 hari lagi.
   - Time spent jujur.
   - Jelaskan library tambahan seperti `zod` kalau dipakai.

10. **Commit Strategy Minimal 5 Commit**
   - `chore: initialize next app with tailwind`
   - `feat: add supabase schema and rls policies`
   - `feat: implement auth flow`
   - `feat: add debts api with validation`
   - `feat: build dashboard and debt form`
   - `docs: add setup and submission notes`

**Urutan Paling Aman**

Kerjakan dulu: Supabase schema/RLS → auth → API → dashboard/form → polish → README/deploy.  
Ini menghindari jebakan paling fatal: UI sudah bagus tapi data/auth/RLS belum aman.