# Panduan Deploy Online Public (Publicly Accessible)
## Sistem Manajemen Turnamen Minisoccer Dies Natalis UMS 2026

Ada 3 opsi utama untuk menjadikan aplikasi web ini dapat diakses publik di internet secara online:

---

### Opsi 1: Instant Sharing dari Komputer Lokal (Tanpa Push Git)
Cocok jika Anda ingin langsung membagikan link publik sementara untuk didemonstrasikan ke panitia/manager tim saat ini juga.

**Menggunakan LocalTunnel:**
1. Jalankan web server lokal aplikasi:
   ```bash
   python3 -m http.server 8080
   ```
2. Di terminal baru, jalankan LocalTunnel:
   ```bash
   npx localtunnel --port 8080
   ```
3. Anda akan mendapatkan URL publik HTTPS seperti: `https://dies-natalis-ums2026.loca.lt`

---

### Opsi 2: Deploy Gratis di Cloud (Vercel / Netlify / GitHub Pages) — RECOMMENDED ⭐️
Cocok untuk publikasi resmi selama event berlangsung (HTTPS gratis, domain cepat, uptime 99.9%).

**Langkah Deploy di Vercel:**
1. Push proyek ini ke repositori **GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit Dies Natalis UMS 2026 Minisoccer System"
   git remote add origin https://github.com/USERNAME/dies-natalis-ums-minisoccer.git
   git push -u origin main
   ```
2. Buka [Vercel.com](https://vercel.com) dan login dengan akun GitHub Anda.
3. Klik **"Add New Project"** $\rightarrow$ Impor repositori `dies-natalis-ums-minisoccer`.
4. Klik **Deploy**. Dalam 30 detik, aplikasi langsung online dengan URL publik gratis (misal: `https://dies-natalis-ums-minisoccer.vercel.app`).
5. (Opsional) Hubungkan Custom Domain kampus UMS (misal: `minisoccer.ums.ac.id`) via menu Domain di Vercel.

---

### Opsi 3: Deploy Full-Stack Production (Next.js + Database Supabase PostgreSQL)
Jika Anda ingin menghubungkan database PostgreSQL produksi nyata dengan Prisma ORM:

1. **Database PostgreSQL Gratis**:
   - Buat database PostgreSQL gratis di [Supabase.com](https://supabase.com) atau [Neon.tech](https://neon.tech).
   - Salin string koneksi database (`DATABASE_URL`).
2. **Migrasi Prisma Schema**:
   ```bash
   npx prisma migrate dev --name init
   ```
3. **Set Environment Variable di Vercel / Cloud**:
   - Tambahkan `DATABASE_URL` pada Environment Variables di dashboard Vercel.
