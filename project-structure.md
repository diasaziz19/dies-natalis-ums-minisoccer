# Struktur Folder Proyek Modular & Scalable
## Dies Natalis UMS 2026 Minisoccer Tournament Management System

Aplikasi ini mengadopsi arsitektur Next.js 14 / React App Router yang modular, bersih, dan memisahkan kepentingan (Separation of Concerns) antara UI Components, Application State, API Routes/Services, dan Database Layer.

```text
dies-natalis-ums-minisoccer/
├── prisma/
│   ├── schema.prisma               # Skema ORM Database (Users, Teams, Players, Matches, Events, Standings)
│   └── seed.ts                     # Seed data awal (Super Admin, Wasit, Tim sampel Dies Natalis UMS)
├── public/
│   ├── images/
│   │   ├── logo-ums.png            # Logo Universitas Muhammadiyah Surakarta
│   │   ├── ucl-starball-bg.svg     # Asset latar belakang Champions League
│   │   └── default-avatar.png      # Fallback foto profil pemain & logo tim
│   └── uploads/                    # Folder media foto identitas & profil
├── src/
│   ├── app/                        # Pages & Routing (Next.js App Router Structure)
│   │   ├── (public)/               # Visitor Public Views
│   │   │   ├── page.tsx            # Landing Page (Banner Champions League, Live Standings, Recent Matches)
│   │   │   ├── standings/page.tsx  # Halaman Klasemen Lengkap Fase Grup
│   │   │   ├── matches/page.tsx    # Halaman Jadwal & Hasil Pertandingan
│   │   │   ├── bracket/page.tsx    # Visual Bagan Fase Knockout (8 Besar s/d Final)
│   │   │   ├── stats/page.tsx      # Leaderboard Top Scorer, Top Assist, Clean Sheet, & Kartu
│   │   │   └── teams/[id]/page.tsx # Profil Tim & Roster Pemain
│   │   ├── (auth)/                 # Autentikasi User & Role Switcher
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/            # Dashboard Terproteksi Berdasarkan Role
│   │   │   ├── manager/            # Portal Manager Tim
│   │   │   │   ├── page.tsx        # Status Registrasi & Ringkasan Tim
│   │   │   │   └── roster/page.tsx # Kelola Squad Roster (Validation: Max 14 Pemain, 1 Coach, 1 Official)
│   │   │   ├── referee/            # Portal Wasit & Panitia
│   │   │   │   ├── page.tsx        # Daftar Match Hari Ini & Kontrol Kickoff
│   │   │   │   └── match/[id]/page.tsx # Match Center (Live Score, Input Gol, Kartu, Match Sheet Digital)
│   │   │   └── admin/              # Portal Super Admin
│   │   │       ├── page.tsx        # Statistik Utama Turnamen
│   │   │       ├── approvals/page.tsx  # Verifikasi & Approval Berkas Tim
│   │   │       ├── draw/page.tsx       # Simualasi & Execution UCL Group Drawing (Pot 1-4)
│   │   │       └── matches/page.tsx    # Penjadwalan Pertandingan & Lapangan
│   │   └── api/                    # RESTful Endpoints
│   │       ├── teams/route.ts      # CRUD Pendaftaran Tim
│   │       ├── roster/route.ts     # CRUD Pemain & Official dengan Validasi Ketat
│   │       ├── draw/route.ts       # Endpoint Trigger UCL Drawing Engine
│   │       ├── standings/route.ts  # Endpoint Dynamic Recalculation Klasemen UEFA
│   │       └── matches/[id]/events/route.ts # Live Score Input & Automatic Card Suspension
│   ├── components/                 # UI Components System (Sporty UCL Theme)
│   │   ├── ui/                     # UI Primitives (Button, Input, Modal, Badge, Card, Select)
│   │   ├── layout/                 # Navbar, HeroBanner, Footer, RoleSelectorBar
│   │   ├── public/                 # StandingsTable, KnockoutBracketVisualizer, LeaderboardCard
│   │   ├── manager/                # RosterFormModal, PlayerIdentityCard
│   │   ├── referee/                # MatchCenterController, EventTimelineLog, MatchSheetPDF
│   │   └── admin/                  # PotDrawingVisualizer, ApprovalTable
│   ├── lib/                        # Business Logic & Core Algorithms
│   │   ├── prisma.ts               # Prisma ORM Singleton / Local Store Engine
│   │   ├── drawingEngine.ts        # Algoritma Pengundian Pot & Grup Champions League
│   │   ├── standingsCalculator.ts  # Logic Klasemen & Tie-Breaker Resmi UEFA (Poin, H2H, Selisih Gol, Fair Play)
│   │   ├── cardAccumulation.ts     # Tracking Akumulasi Kartu & Suspensi Otomatis Match Berikutnya
│   │   └── mockData.ts             # Sample Datasets untuk Dies Natalis UMS 2026
│   └── types/                      # Type Definitions (TypeScript Interfaces)
│       └── index.ts
├── index.html                      # Standalone Preview Entrypoint (Interactive Web Application)
├── styles.css                      # Styling Design System (Champions League Theme + Glassmorphism)
├── app.js                          # Core Interactive Client Engine & Router
├── package.json
└── project-structure.md
```
