/**
 * Mock Data & Initial Configurations
 * Dies Natalis UMS 2026 Minisoccer Tournament System (16-Team Knockout Format)
 */

export const INITIAL_HOMEPAGE = {
  heroTitle: "DIES NATALIS UMS 2026",
  heroSubtitle: "MINISOCCER CHAMPIONS LEAGUE (7 vs 7)",
  welcomeMessage: "Selamat datang di Portal Resmi Turnamen Minisoccer Dies Natalis Universitas Muhammadiyah Surakarta 2026. Saksikan pertandingan seru antar unit, fakultas, dan lembaga sivitas akademika UMS!",
  location: "Stadion Mini Soccer Kampus 4 UMS / Lapangan Edupark UMS",
  dates: "14 - 15 Maret 2026",
  bannerUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80"
};

export const INITIAL_NAVBAR = {
  title: "DIES NATALIS UMS 2026",
  subtitle: "MINISOCCER CHAMPIONS LEAGUE",
  logoUrl: "https://upload.wikimedia.org/wikipedia/id/0/05/Logo_Universitas_Muhammadiyah_Surakarta.png"
};

export const INITIAL_RULES = [
  {
    category: 'Ketentuan Umum & Format Turnamen',
    items: [
      'Format Turnamen: Sistem Gugur Tunggal (Single Elimination Knockout) 16 Tim.',
      'Sistem Pertandingan Lapangan Minisoccer: 7 vs 7 (1 Penjaga Gawang + 6 Pemain Lapangan).',
      'Komposisi Usia Pemain di Lapangan (Lineup 7 Orang): Maksimal 2 orang pemain berusia di bawah 35 tahun (< 35 tahun), sisanya minimal 5 orang wajib berusia di atas / sama dengan 35 tahun (≥ 35 tahun).',
      'Durasi Pertandingan: 2 x 15 Menit dengan jeda istirahat 5 menit.',
      'Bila Skor Imbang: Langsung dilakukan Adu Penalti (3 Penendang Utama + 1 Sudden Death).',
      'Pergantian Pemain (Substitusi): Bebas (Rolling Subs) dengan tetap mematuhi batasan maksimal 2 pemain < 35 tahun di lapangan.'
    ]
  },
  {
    category: 'Persyaratan Pemain, Official & Skuad',
    items: [
      'Kuota Skuad: Maksimal 14 pemain, 1 manajer tim, dan 1 official tim.',
      'Ketentuan Usia Skuad: Tim dapat mendaftarkan pemain dengan variasi usia, namun saat bermain di lapangan wajib mematuhi aturan usia (maksimal 2 pemain usia < 35 tahun secara bersamaan).',
      'Status Pemain: Wajib Dosen Tetap/Tidak Tetap, Tenaga Kependidikan (Tendik), atau Staf Resmi Unit/Fakultas UMS.',
      'Verifikasi Dokumen: Wajib mengunggah Surat Tugas Resmi dari Pimpinan Unit/Fakultas serta membawa KTP / Kartu Pegawai (NI) asli saat registrasi fisik.',
      'Perlengkapan Pertandingan: Wajib memakai Jersey Bernomor Punggung, Kaos Kaki Panjang, Shin Guard (Pelindung Tulang Kering), dan Sepatu Minisoccer (TF/AG) - Dilarang memakai Pul Besi (SG).'
    ]
  },
  {
    category: 'Akumulasi Kartu & Regulasi Disiplin',
    items: [
      'Akumulasi Kartu Kuning: Pemain yang menerima 2 Kartu Kuning dalam 2 pertandingan berbeda DILARANG bermain pada 1 pertandingan berikutnya (Suspension Otomatis).',
      'Kartu Kuning Ganda (Merah Tidak Langsung): Pemain wajib keluar lapangan + Absen 1 Pertandingan Berikutnya.',
      'Kartu Merah Langsung: Pemain wajib keluar lapangan + Absen 1 Pertandingan Berikutnya. Tim bermain dengan 6 pemain selama 2 menit sebelum digantikan.',
      'Fair Play & Sportivitas: Seluruh pemain, official, dan suporter wajib menjunjung tinggi sportivitas dan nilai keislaman UMS.'
    ]
  }
];

export const INITIAL_TEAMS = [
  { id: 'team-1', name: 'Parkir', facultyUnit: 'Unit Sarpras & Parkir UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=ParkirUMS&backgroundColor=ff6600', managerId: 'mgr-team-1', managerName: 'Bambang Supriyanto', managerPhone: '081234567801', status: 'APPROVED', suratTugasName: null },
  { id: 'team-2', name: 'Satpam', facultyUnit: 'Unit Keamanan / Satpam UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=SatpamUMS&backgroundColor=003366', managerId: 'mgr-team-2', managerName: 'Ahmad Dahlan', managerPhone: '081234567802', status: 'APPROVED', suratTugasName: null },
  { id: 'team-3', name: 'FKIP', facultyUnit: 'Fakultas Keguruan & Ilmu Pendidikan', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=FKIPUMS&backgroundColor=0099cc', managerId: 'mgr-team-3', managerName: 'Dwi Cahyono', managerPhone: '081234567803', status: 'APPROVED', suratTugasName: null },
  { id: 'team-4', name: 'Geo + Hukum + LPIDB', facultyUnit: 'Geografi, Hukum & LPIDB UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=GeoHukumLPIDB&backgroundColor=990033', managerId: 'mgr-team-4', managerName: 'Siti Rahmawati', managerPhone: '081234567804', status: 'APPROVED', suratTugasName: null },
  { id: 'team-5', name: 'FKI Teknik', facultyUnit: 'Fakultas Komunikasi, Informatika & Teknik', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=FKITeknik&backgroundColor=009966', managerId: 'mgr-team-5', managerName: 'Eko Prasetyo', managerPhone: '081234567805', status: 'APPROVED', suratTugasName: null },
  { id: 'team-6', name: 'Kedokteran + Pasma', facultyUnit: 'Fakultas Kedokteran & Pasma UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=KedokteranPasma&backgroundColor=339900', managerId: 'mgr-team-6', managerName: 'Fitri Handayani', managerPhone: '081234567806', status: 'APPROVED', suratTugasName: null },
  { id: 'team-7', name: 'RSGM + GIGI', facultyUnit: 'RSGM & Kedokteran Gigi UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=RSGMGIGI&backgroundColor=cc0099', managerId: 'mgr-team-7', managerName: 'Hendra Setiawan', managerPhone: '081234567807', status: 'APPROVED', suratTugasName: null },
  { id: 'team-8', name: 'KAU + BAA + BAU + MAWA', facultyUnit: 'KAU, BAA, BAU & Kemahasiswaan', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=KAUBAABAUMAWA&backgroundColor=669900', managerId: 'mgr-team-8', managerName: 'Indra Wijaya', managerPhone: '081234567808', status: 'APPROVED', suratTugasName: null },
  { id: 'team-9', name: 'Psikologi + Farmasi + Pasca', facultyUnit: 'Fakultas Psikologi, Farmasi & Pascasarjana', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=PsikologiFarmasiPasca&backgroundColor=006699', managerId: 'mgr-team-9', managerName: 'Joko Susilo', managerPhone: '081234567809', status: 'APPROVED', suratTugasName: null },
  { id: 'team-10', name: 'FIK', facultyUnit: 'Fakultas Ilmu Kesehatan UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=FIKUMS&backgroundColor=cc0033', managerId: 'mgr-team-10', managerName: 'Kusuma Wardana', managerPhone: '081234567810', status: 'APPROVED', suratTugasName: null },
  { id: 'team-11', name: 'FAI + Sobron', facultyUnit: 'Fakultas Agama Islam & Ponpes Sobron', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=FAISobron&backgroundColor=ff3399', managerId: 'mgr-team-11', managerName: 'Lestari Putri', managerPhone: '081234567811', status: 'APPROVED', suratTugasName: null },
  { id: 'team-12', name: 'FEB', facultyUnit: 'Fakultas Ekonomi & Bisnis UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=FEBUMS&backgroundColor=6600cc', managerId: 'mgr-team-12', managerName: 'Muhammad Arifin', managerPhone: '081234567812', status: 'APPROVED', suratTugasName: null },
  { id: 'team-13', name: 'LPPIK + Perpus + LP3A', facultyUnit: 'LPPIK, Perpustakaan & LP3A UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=LPPIKPerpusLP3A&backgroundColor=006666', managerId: 'mgr-team-13', managerName: 'Nugroho Adi', managerPhone: '081234567813', status: 'APPROVED', suratTugasName: null },
  { id: 'team-14', name: 'DAREN + BPH + Rektorat + LPM + BKU + BPSDM + LPPIP + SAI + DRPPS', facultyUnit: 'Unit Rektorat, BPH & Lembaga Universitas', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=RektoratBPHLembaga&backgroundColor=003399', managerId: 'mgr-team-14', managerName: 'Oki Kurniawan', managerPhone: '081234567814', status: 'APPROVED', suratTugasName: null },
  { id: 'team-15', name: 'PALMASI + MANAD', facultyUnit: 'Unit PALMASI & MANAD UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=PALMASIMANAD&backgroundColor=993300', managerId: 'mgr-team-15', managerName: 'Purnomo Shiddiq', managerPhone: '081234567815', status: 'APPROVED', suratTugasName: null },
  { id: 'team-16', name: 'BPI + AMAS + UMMI + MMC', facultyUnit: 'BPI, AMAS, UMMI & MMC UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=BPIAMASUMMIMMC&backgroundColor=00cc99', managerId: 'mgr-team-16', managerName: 'Qomaruddin Hidayat', managerPhone: '081234567816', status: 'APPROVED', suratTugasName: null },
  { id: 'team-17', name: 'BKU', facultyUnit: 'Biro Keuangan Universitas (BKU UMS)', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=BKUUMS&backgroundColor=e65100', managerId: 'mgr-team-17', managerName: 'Rahmat Basuki', managerPhone: '081234567817', status: 'APPROVED', suratTugasName: null }
];

export const INITIAL_PLAYERS = [
  // Team 1: Parkir
  { id: 'p1-1', teamId: 'team-1', fullName: 'Bagus Setyawan', identityNumber: '3372010101950001', usia: 29, umur: 29, unit: 'Sarpras & Parkir', position: 'FORWARD', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=BagusSetyawan' },
  { id: 'p1-2', teamId: 'team-1', fullName: 'Rian Hidayat', identityNumber: '3372010202960002', usia: 28, umur: 28, unit: 'Sarpras & Parkir', position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=RianHidayat' },
  { id: 'p1-3', teamId: 'team-1', fullName: 'Doni Pratama', identityNumber: '3372010303970003', usia: 27, umur: 27, unit: 'Sarpras & Parkir', position: 'DEFENDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=DoniPratama' },
  { id: 'p1-4', teamId: 'team-1', fullName: 'Kiper Utama Parkir', identityNumber: '3372010404980004', usia: 26, umur: 26, unit: 'Sarpras & Parkir', position: 'GOALKEEPER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=KiperParkir' },
  { id: 'p1-5', teamId: 'team-1', fullName: 'Fajar Nugroho', identityNumber: '3372010505990005', usia: 25, umur: 25, unit: 'Sarpras & Parkir', position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=FajarNugroho' },
  { id: 'p1-6', teamId: 'team-1', fullName: 'Galih Permana', identityNumber: '3372010606000006', usia: 24, umur: 24, unit: 'Sarpras & Parkir', position: 'DEFENDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=GalihPermana' },
  { id: 'p1-7', teamId: 'team-1', fullName: 'Hendy Wijaya', identityNumber: '3372010707010007', usia: 23, umur: 23, unit: 'Sarpras & Parkir', position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=HendyWijaya' },
  { id: 'p1-8', teamId: 'team-1', fullName: 'Irfan Bachdim', identityNumber: '3372010808020008', usia: 22, umur: 22, unit: 'Sarpras & Parkir', position: 'FORWARD', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=IrfanParkir' },

  // Team 2: Satpam
  { id: 'p2-1', teamId: 'team-2', fullName: 'Ahmad Syukri', identityNumber: '3372020101950001', usia: 29, umur: 29, unit: 'Sarpras & Parkir', position: 'FORWARD', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=AhmadSyukri' },
  { id: 'p2-2', teamId: 'team-2', fullName: 'Rahmat Hidayatullah', identityNumber: '3372020202960002', usia: 28, umur: 28, unit: 'Sarpras & Parkir', position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=RahmatH' },
  { id: 'p2-3', teamId: 'team-2', fullName: 'Suryo Utomo', identityNumber: '3372020303970003', usia: 27, umur: 27, unit: 'Sarpras & Parkir', position: 'DEFENDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=SuryoUtomo' },
  { id: 'p2-4', teamId: 'team-2', fullName: 'Taufik Hidayat', identityNumber: '3372020404980004', usia: 26, umur: 26, unit: 'Sarpras & Parkir', position: 'GOALKEEPER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=TaufikH' },
  { id: 'p2-5', teamId: 'team-2', fullName: 'Utomo Prasetyo', identityNumber: '3372020505990005', usia: 25, umur: 25, unit: 'Sarpras & Parkir', position: 'DEFENDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=UtomoP' },
  { id: 'p2-6', teamId: 'team-2', fullName: 'Vicky Nitinegoro', identityNumber: '3372020606000006', usia: 24, umur: 24, unit: 'Sarpras & Parkir', position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=VickyN' },
  { id: 'p2-7', teamId: 'team-2', fullName: 'Wawan Febrianto', identityNumber: '3372020707010007', usia: 23, umur: 23, unit: 'Sarpras & Parkir', position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=WawanF' },
  { id: 'p2-8', teamId: 'team-2', fullName: 'Yusuf Mansur', identityNumber: '3372020808020008', usia: 22, umur: 22, unit: 'Sarpras & Parkir', position: 'FORWARD', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=YusufM' },

  // Team 3: FKIP
  { id: 'p3-1', teamId: 'team-3', fullName: 'Andi Wijaya', identityNumber: '3372030101950001', usia: 28, umur: 28, unit: 'Sarpras & Parkir', position: 'GOALKEEPER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=AndiFKIP' },
  { id: 'p3-2', teamId: 'team-3', fullName: 'Bima Sakti', identityNumber: '3372030202960002', usia: 27, umur: 27, unit: 'Sarpras & Parkir', position: 'DEFENDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=BimaFKIP' },
  { id: 'p3-3', teamId: 'team-3', fullName: 'Candra Wijaya', identityNumber: '3372030303970003', usia: 26, umur: 26, unit: 'Sarpras & Parkir', position: 'DEFENDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=CandraFKIP' },
  { id: 'p3-4', teamId: 'team-3', fullName: 'Dedi Kusnandar', identityNumber: '3372030404980004', usia: 25, umur: 25, unit: 'Sarpras & Parkir', position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=DediFKIP' },
  { id: 'p3-5', teamId: 'team-3', fullName: 'Evan Dimas', identityNumber: '3372030505990005', usia: 24, umur: 24, unit: 'Sarpras & Parkir', position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=EvanFKIP' },
  { id: 'p3-6', teamId: 'team-3', fullName: 'Febri Hariyadi', identityNumber: '3372030606000006', usia: 23, umur: 23, unit: 'Sarpras & Parkir', position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=FebriFKIP' },
  { id: 'p3-7', teamId: 'team-3', fullName: 'Guruh Soekarno', identityNumber: '3372030707010007', usia: 22, umur: 22, unit: 'Sarpras & Parkir', position: 'FORWARD', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=GuruhFKIP' },

  // Team 4: Geo + Hukum + LPIDB
  { id: 'p4-1', teamId: 'team-4', fullName: 'Hendra Setiawan', identityNumber: '3372040101950001', usia: 29, umur: 29, unit: 'Sarpras & Parkir', position: 'GOALKEEPER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=HendraGH' },
  { id: 'p4-2', teamId: 'team-4', fullName: 'Irfan Jaya', identityNumber: '3372040202960002', usia: 28, umur: 28, unit: 'Sarpras & Parkir', position: 'DEFENDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=IrfanGH' },
  { id: 'p4-3', teamId: 'team-4', fullName: 'Jajang Sukmara', identityNumber: '3372040303970003', usia: 27, umur: 27, unit: 'Sarpras & Parkir', position: 'DEFENDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=JajangGH' },
  { id: 'p4-4', teamId: 'team-4', fullName: 'Kurnia Meiga', identityNumber: '3372040404980004', usia: 26, umur: 26, unit: 'Sarpras & Parkir', position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=KurniaGH' },
  { id: 'p4-5', teamId: 'team-4', fullName: 'Luthfi Kamal', identityNumber: '3372040505990005', usia: 25, umur: 25, unit: 'Sarpras & Parkir', position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=LuthfiGH' },
  { id: 'p4-6', teamId: 'team-4', fullName: 'Marc Klok', identityNumber: '3372040606000006', usia: 24, umur: 24, unit: 'Sarpras & Parkir', position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=KlokGH' },
  { id: 'p4-7', teamId: 'team-4', fullName: 'Nadeo Argawinata', identityNumber: '3372040707010007', usia: 23, umur: 23, unit: 'Sarpras & Parkir', position: 'FORWARD', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=NadeoGH' },

  // Team 5: FKI Teknik
  { id: 'p5-1', teamId: 'team-5', fullName: 'Oktovianus Maniani', identityNumber: '3372050101950001', usia: 29, umur: 29, unit: 'Sarpras & Parkir', position: 'GOALKEEPER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=OktoFKIT' },
  { id: 'p5-2', teamId: 'team-5', fullName: 'Pratama Arhan', identityNumber: '3372050202960002', usia: 28, umur: 28, unit: 'Sarpras & Parkir', position: 'DEFENDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=ArhanFKIT' },
  { id: 'p5-3', teamId: 'team-5', fullName: 'Qischil Gandrum', identityNumber: '3372050303970003', usia: 27, umur: 27, unit: 'Sarpras & Parkir', position: 'DEFENDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=QischilFKIT' },
  { id: 'p5-4', teamId: 'team-5', fullName: 'Rachmat Irianto', identityNumber: '3372050404980004', usia: 26, umur: 26, unit: 'Sarpras & Parkir', position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=IriantoFKIT' },
  { id: 'p5-5', teamId: 'team-5', fullName: 'Saddil Ramdani', identityNumber: '3372050505990005', usia: 25, umur: 25, unit: 'Sarpras & Parkir', position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=SaddilFKIT' },
  { id: 'p5-6', teamId: 'team-5', fullName: 'Terens Puhiri', identityNumber: '3372050606000006', usia: 24, umur: 24, unit: 'Sarpras & Parkir', position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=TerensFKIT' },
  { id: 'p5-7', teamId: 'team-5', fullName: 'Utam Rusdiana', identityNumber: '3372050707010007', usia: 23, umur: 23, unit: 'Sarpras & Parkir', position: 'FORWARD', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=UtamFKIT' },

  // Teams 6 to 17 Dynamic Squad Generators
  ...Array.from({ length: 12 }, (_, tIdx) => {
    const tNum = tIdx + 6;
    const teamId = `team-${tNum}`;
    const roles = ['GOALKEEPER', 'DEFENDER', 'DEFENDER', 'MIDFIELDER', 'MIDFIELDER', 'MIDFIELDER', 'FORWARD'];
    const names = ['Agung', 'Budi', 'Cahyo', 'Dharma', 'Erwin', 'Faris', 'Giri'];
    return roles.map((pos, pIdx) => ({
      id: `p${tNum}-${pIdx + 1}`,
      teamId,
      fullName: `${names[pIdx]} (T${tNum})`,
      identityNumber: `3372${tNum.toString().padStart(2, '0')}010${pIdx + 1}950001`,
      usia: 22 + pIdx,
      position: pos,
      photoProfileUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${names[pIdx]}${teamId}`
    }));
  }).flat()
];

export const INITIAL_OFFICIALS = [
  { id: 'off1', teamId: 'team-1', fullName: 'Dr. Agus Kristianto, M.Pd.', identityNumber: '197501012000121001', role: 'HEAD_COACH' },
  { id: 'off2', teamId: 'team-1', fullName: 'Suratno, S.Pd.', identityNumber: '198002022005011002', role: 'OFFICIAL' },
  { id: 'off3', teamId: 'team-2', fullName: 'Prof. Dr. Sutama, M.Pd.', identityNumber: '196503031990031003', role: 'HEAD_COACH' }
];

// INITIAL BRACKET MATCHES - DEFAULT PLACEHOLDERS BEFORE DRAWING IS APPLIED (TIM 1 - TIM 16)
export const INITIAL_MATCHES = [
  { id: 'm-1', matchNumber: 1, stage: 'ROUND_OF_16', homeTeamId: 'team-1', homeTeamName: 'Parkir', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=ParkirUMS&backgroundColor=ff6600', awayTeamId: 'team-2', awayTeamName: 'Satpam', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=SatpamUMS&backgroundColor=003366', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan A UMS Stadium', kickoffTime: 'Hari 1 (08:00 WIB)', matchDate: 'Sabtu, 14 Maret 2026', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-2', matchNumber: 2, stage: 'ROUND_OF_16', homeTeamId: 'team-3', homeTeamName: 'FKIP', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=FKIPUMS&backgroundColor=0099cc', awayTeamId: 'team-4', awayTeamName: 'Geo + Hukum + LPIDB', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=GeoHukumLPIDB&backgroundColor=990033', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan B UMS Stadium', kickoffTime: 'Hari 1 (08:00 WIB)', matchDate: 'Sabtu, 14 Maret 2026', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-3', matchNumber: 3, stage: 'ROUND_OF_16', homeTeamId: 'team-5', homeTeamName: 'FKI Teknik', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=FKITeknik&backgroundColor=009966', awayTeamId: 'team-6', awayTeamName: 'Kedokteran + Pasma', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=KedokteranPasma&backgroundColor=339900', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan A UMS Stadium', kickoffTime: 'Hari 1 (09:15 WIB)', matchDate: 'Sabtu, 14 Maret 2026', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-4', matchNumber: 4, stage: 'ROUND_OF_16', homeTeamId: 'team-7', homeTeamName: 'RSGM + GIGI', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=RSGMGIGI&backgroundColor=cc0099', awayTeamId: 'team-8', awayTeamName: 'KAU + BAA + BAU + MAWA', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=KAUBAABAUMAWA&backgroundColor=669900', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan B UMS Stadium', kickoffTime: 'Hari 1 (09:15 WIB)', matchDate: 'Sabtu, 14 Maret 2026', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-5', matchNumber: 5, stage: 'ROUND_OF_16', homeTeamId: 'team-9', homeTeamName: 'Psikologi + Farmasi + Pasca', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=PsikologiFarmasiPasca&backgroundColor=006699', awayTeamId: 'team-10', awayTeamName: 'FIK', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=FIKUMS&backgroundColor=cc0033', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan A UMS Stadium', kickoffTime: 'Hari 1 (14:00 WIB)', matchDate: 'Sabtu, 14 Maret 2026', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-6', matchNumber: 6, stage: 'ROUND_OF_16', homeTeamId: 'team-11', homeTeamName: 'FAI + Sobron', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=FAISobron&backgroundColor=ff3399', awayTeamId: 'team-12', awayTeamName: 'FEB', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=FEBUMS&backgroundColor=6600cc', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan B UMS Stadium', kickoffTime: 'Hari 1 (14:00 WIB)', matchDate: 'Sabtu, 14 Maret 2026', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-7', matchNumber: 7, stage: 'ROUND_OF_16', homeTeamId: 'team-13', homeTeamName: 'LPPIK + Perpus + LP3A', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=LPPIKPerpusLP3A&backgroundColor=006666', awayTeamId: 'team-14', awayTeamName: 'DAREN + BPH + Rektorat + LPM + BKU + BPSDM + LPPIP + SAI + DRPPS', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=RektoratBPHLembaga&backgroundColor=003399', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan A UMS Stadium', kickoffTime: 'Hari 1 (15:30 WIB)', matchDate: 'Sabtu, 14 Maret 2026', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-8', matchNumber: 8, stage: 'ROUND_OF_16', homeTeamId: 'team-15', homeTeamName: 'PALMASI + MANAD', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=PALMASIMANAD&backgroundColor=993300', awayTeamId: 'team-16', awayTeamName: 'BPI + AMAS + UMMI + MMC', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=BPIAMASUMMIMMC&backgroundColor=00cc99', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan B UMS Stadium', kickoffTime: 'Hari 1 (15:30 WIB)', matchDate: 'Sabtu, 14 Maret 2026', status: 'SCHEDULED', events: [], cards: [] },

  { id: 'm-9', matchNumber: 9, stage: 'QUARTER_FINAL', homeTeamId: null, homeTeamName: 'Pemenang Match #1', homeTeamLogo: '', awayTeamId: null, awayTeamName: 'Pemenang Match #2', awayTeamLogo: '', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan A UMS Stadium', kickoffTime: 'Hari 2 (08:30 WIB)', matchDate: 'Sabtu, 14 Maret 2026', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-10', matchNumber: 10, stage: 'QUARTER_FINAL', homeTeamId: null, homeTeamName: 'Pemenang Match #3', homeTeamLogo: '', awayTeamId: null, awayTeamName: 'Pemenang Match #4', awayTeamLogo: '', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan B UMS Stadium', kickoffTime: 'Hari 2 (08:30 WIB)', matchDate: 'Sabtu, 14 Maret 2026', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-11', matchNumber: 11, stage: 'QUARTER_FINAL', homeTeamId: null, homeTeamName: 'Pemenang Match #5', homeTeamLogo: '', awayTeamId: null, awayTeamName: 'Pemenang Match #6', awayTeamLogo: '', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan A UMS Stadium', kickoffTime: 'Hari 2 (10:00 WIB)', matchDate: 'Sabtu, 14 Maret 2026', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-12', matchNumber: 12, stage: 'QUARTER_FINAL', homeTeamId: null, homeTeamName: 'Pemenang Match #7', homeTeamLogo: '', awayTeamId: null, awayTeamName: 'Pemenang Match #8', awayTeamLogo: '', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan B UMS Stadium', kickoffTime: 'Hari 2 (10:00 WIB)', matchDate: 'Sabtu, 14 Maret 2026', status: 'SCHEDULED', events: [], cards: [] },

  { id: 'm-13', matchNumber: 13, stage: 'SEMI_FINAL', homeTeamId: null, homeTeamName: 'Pemenang Match #9', homeTeamLogo: '', awayTeamId: null, awayTeamName: 'Pemenang Match #10', awayTeamLogo: '', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan A UMS Stadium', kickoffTime: 'Hari 3 (08:30 WIB)', matchDate: 'Minggu, 15 Maret 2026', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-14', matchNumber: 14, stage: 'SEMI_FINAL', homeTeamId: null, homeTeamName: 'Pemenang Match #11', homeTeamLogo: '', awayTeamId: null, awayTeamName: 'Pemenang Match #12', awayTeamLogo: '', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan B UMS Stadium', kickoffTime: 'Hari 3 (09:45 WIB)', matchDate: 'Minggu, 15 Maret 2026', status: 'SCHEDULED', events: [], cards: [] },

  { id: 'm-15', matchNumber: 15, stage: 'THIRD_PLACE', homeTeamId: null, homeTeamName: 'Kalah Semi Final 1', homeTeamLogo: '', awayTeamId: null, awayTeamName: 'Kalah Semi Final 2', awayTeamLogo: '', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan B UMS Stadium', kickoffTime: 'Hari 3 (14:30 WIB)', matchDate: 'Minggu, 15 Maret 2026', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-16', matchNumber: 16, stage: 'FINAL', homeTeamId: null, homeTeamName: 'Pemenang Semi Final 1', homeTeamLogo: '', awayTeamId: null, awayTeamName: 'Pemenang Semi Final 2', awayTeamLogo: '', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan A UMS Stadium', kickoffTime: 'Hari 3 (16:00 WIB)', matchDate: 'Minggu, 15 Maret 2026', status: 'SCHEDULED', events: [], cards: [] }
];

export const ADMIN_CREDENTIALS = {
  username: 'superadmin',
  password: 'ums2026admin',
  role: 'ADMIN'
};

export const MANAGER_CREDENTIALS = Array.from({ length: 17 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, '0');
  const teamObj = INITIAL_TEAMS[i];
  return {
    username: `mgr-team-${i + 1}`,
    password: `tim${num}ums`,
    teamId: `team-${i + 1}`,
    role: 'MANAGER',
    displayName: teamObj ? `Manager ${teamObj.name}` : `Manager Tim ${i + 1}`
  };
});
