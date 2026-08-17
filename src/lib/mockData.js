export const INITIAL_NAVBAR = {
  title: 'DIES NATALIS UMS 2026',
  subtitle: 'Minisoccer Champions League',
  logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=UMSLogo&backgroundColor=003366',
  homeLabel: '🏠 Beranda',
  rulesLabel: '📜 Peraturan',
  managerLabel: '⚽ Manajemen Tim',
  matchCenterLabel: '⏱️ Match Center',
  drawingLabel: '🎲 Undian 16 Tim'
};

export const INITIAL_HOMEPAGE = {
  heroBadge: 'OFFICIAL COMPETITION 7v7 (16 TIM KNOCKOUT)',
  heroTitle: 'TURNAMEN MINISOCCER DIES NATALIS UMS 2026',
  heroSubtitle: 'Kompetisi Minisoccer resmi 16 Tim Fakultas & Unit di Universitas Muhammadiyah Surakarta dengan Sistem Gugur (Knockout). Babak 16 Besar → Perempat Final → Semi Final → Grand Final!',
  totalPrize: 'Rp 15.000.000',
  prizeSub: '+ Trophy & Medali UMS',
  tournamentFormat: 'SYSTEM KNOCKOUT (16 TIM)',
  pitchLocation: 'UMS Stadium Field A & B',
  announcementText: '📢 Pengumuman: Pengundian babak 16 Besar dapat disaksikan secara live. Wajib mengunggah Surat Tugas Dekanat!'
};

export const INITIAL_RULES = [
  {
    id: 'rule-1',
    title: '1. Format Pertandingan & Durasi Waktu',
    icon: '⏱️',
    colorClass: 'text-amber-400',
    items: [
      'Sistem Turnamen: Knockout / Sistem Gugur 16 Tim (Mulai dari Babak 16 Besar → Perempat Final → Semi Final → Final & Juara 3).',
      'Durasi Main: 2 x 10 Menit (Kotor) dengan waktu istirahat antar babak selama 5 Menit.',
      'Penentuan Pemenang (Seri): Apabila hasil imbang hingga waktu normal usai, pertandingan langsung dilanjutkan dengan Adu Penalti (3 Penendang Utama per Tim).'
    ]
  },
  {
    id: 'rule-2',
    title: '2. Komposisi Pemain & Skuad',
    icon: '👥',
    colorClass: 'text-cyan-400',
    items: [
      'Pemain di Lapangan: 7 vs 7 (6 Pemain Lapangan + 1 Penjaga Gawang). Minimum 5 pemain untuk memulai pertandingan.',
      'Batas Skuad Roster: Maksimal 14 Pemain terdaftar, 1 Head Coach, dan 1 Official Tim.',
      'Pergantian Pemain (Substitution): Bebas/Melayang (Rolling Substitution) dari area teknis wasit tanpa membatasi jumlah pergantian.'
    ]
  },
  {
    id: 'rule-3',
    title: '3. Peraturan Lapangan (Minisoccer Standard)',
    icon: '⚽',
    colorClass: 'text-emerald-400',
    items: [
      'Offside: TIDAK ADA OFFSIDE dalam seluruh babak pertandingan.',
      'Bola Out / Garis Samping: Menggunakan Kick-in (Tendangan ke Dalam). Bola harus diam di atas garis saat ditendang (maksimal 4 detik).',
      'Penjaga Gawang (Kiper): Lemparan gawang dari kiper tidak boleh langsung melewati garis tengah lapangan tanpa menyentuh tanah/pemain terlebih dahulu.',
      'Back-pass: Kiper TIDAK BOLEH menangkap bola dengan tangan dari umpan kaki rekan setim.'
    ]
  },
  {
    id: 'rule-4',
    title: '4. Kedisiplinan, Kartu & Berkas Administrasi',
    icon: '🟨',
    colorClass: 'text-rose-400',
    items: [
      'Akumulasi Kartu Kuning: 2 Kartu Kuning dalam pertandingan berbeda → Hukuman Absen 1 Pertandingan Berikutnya.',
      'Kartu Merah Langsung: Pemain wajib keluar lapangan + Absen 1 Pertandingan Berikutnya. Tim bermain dengan 6 pemain selama 2 menit sebelum digantikan.',
      'Persyaratan Berkas: Wajib mengunggah Surat Tugas Resmi Dekanat / Unit UMS serta membawa KTP / NI. Kepegawaian asli saat verifikasi fisik.'
    ]
  }
];

export const INITIAL_TEAMS = [
  { id: 'team-1', name: 'Pendidikan Olahraga (POR FKIP)', facultyUnit: 'FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=PORFKIP&backgroundColor=ff6600', managerId: 'mgr-team-1', managerName: 'Bambang Supriyanto', managerPhone: '081234567801', status: 'APPROVED', suratTugasName: 'Surat_Tugas_Dekan_POR_2026.pdf' },
  { id: 'team-2', name: 'Pendidikan Matematika FC', facultyUnit: 'FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=MATEMATIKAFKIP&backgroundColor=003366', managerId: 'mgr-team-2', managerName: 'Ahmad Dahlan', managerPhone: '081234567802', status: 'APPROVED', suratTugasName: 'Surat_Tugas_Dekan_Matematika_2026.pdf' },
  { id: 'team-3', name: 'Pendidikan Teknik Informatika (PTI)', facultyUnit: 'FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=PTIFKIP&backgroundColor=0099cc', managerId: 'mgr-team-3', managerName: 'Dwi Cahyono', managerPhone: '081234567803', status: 'APPROVED', suratTugasName: 'Surat_Tugas_Dekan_PTI_2026.pdf' },
  { id: 'team-4', name: 'DEE English Dept (PBI FKIP)', facultyUnit: 'FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=DEEFKIP&backgroundColor=990033', managerId: 'mgr-team-4', managerName: 'Siti Rahmawati', managerPhone: '081234567804', status: 'APPROVED', suratTugasName: 'Surat_Tugas_Dekan_PBI_2026.pdf' },
  { id: 'team-5', name: 'Pendidikan Guru SD (PGSD FC)', facultyUnit: 'FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=PGSDFKIP&backgroundColor=009966', managerId: 'mgr-team-5', managerName: 'Eko Prasetyo', managerPhone: '081234567805', status: 'APPROVED', suratTugasName: 'Surat_Tugas_Dekan_PGSD_2026.pdf' },
  { id: 'team-6', name: 'Pendidikan Biologi FC', facultyUnit: 'FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=BIOLOGIFKIP&backgroundColor=339900', managerId: 'mgr-team-6', managerName: 'Fitri Handayani', managerPhone: '081234567806', status: 'APPROVED', suratTugasName: 'Surat_Tugas_Dekan_Biologi_2026.pdf' },
  { id: 'team-7', name: 'Pendidikan Bahasa Indonesia (PBSI)', facultyUnit: 'FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=PBSIFKIP&backgroundColor=cc0099', managerId: 'mgr-team-7', managerName: 'Hendra Setiawan', managerPhone: '081234567807', status: 'APPROVED', suratTugasName: 'Surat_Tugas_Dekan_PBSI_2026.pdf' },
  { id: 'team-8', name: 'Pendidikan Geografi FC', facultyUnit: 'FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=GEOGRAFIFKIP&backgroundColor=669900', managerId: 'mgr-team-8', managerName: 'Indra Wijaya', managerPhone: '081234567808', status: 'APPROVED', suratTugasName: 'Surat_Tugas_Dekan_Geografi_2026.pdf' },
  { id: 'team-9', name: 'Pendidikan Akuntansi FC', facultyUnit: 'FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=AKUNTANSIFKIP&backgroundColor=006699', managerId: 'mgr-team-9', managerName: 'Joko Susilo', managerPhone: '081234567809', status: 'APPROVED', suratTugasName: 'Surat_Tugas_Dekan_Akuntansi_2026.pdf' },
  { id: 'team-10', name: 'PPKn Pancasila FC', facultyUnit: 'FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=PPKNFKIP&backgroundColor=cc0033', managerId: 'mgr-team-10', managerName: 'Kusuma Wardana', managerPhone: '081234567810', status: 'APPROVED', suratTugasName: 'Surat_Tugas_Dekan_PPKn_2026.pdf' },
  { id: 'team-11', name: 'PAUD Ceria FC (PAUD FKIP)', facultyUnit: 'FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=PAUDFKIP&backgroundColor=ff3399', managerId: 'mgr-team-11', managerName: 'Lestari Putri', managerPhone: '081234567811', status: 'APPROVED', suratTugasName: 'Surat_Tugas_Dekan_PAUD_2026.pdf' },
  { id: 'team-12', name: 'Unit Rektorat Star (Rektorat UMS)', facultyUnit: 'Unit UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=REKTORATUMS&backgroundColor=6600cc', managerId: 'mgr-team-12', managerName: 'Muhammad Arifin', managerPhone: '081234567812', status: 'APPROVED', suratTugasName: 'Surat_Tugas_Unit_Rektorat_2026.pdf' },
  { id: 'team-13', name: 'Perpustakaan UMS FC', facultyUnit: 'Unit UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=PERPUSUMS&backgroundColor=006666', managerId: 'mgr-team-13', managerName: 'Nugroho Adi', managerPhone: '081234567813', status: 'APPROVED', suratTugasName: 'Surat_Tugas_Unit_Perpus_2026.pdf' },
  { id: 'team-14', name: 'Unit IT & Pesma UMS', facultyUnit: 'Unit UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=PESMAUMS&backgroundColor=003399', managerId: 'mgr-team-14', managerName: 'Oki Kurniawan', managerPhone: '081234567814', status: 'APPROVED', statusTugasName: 'Surat_Tugas_Unit_IT_2026.pdf' },
  { id: 'team-15', name: 'Sarpras & Keamanan UMS', facultyUnit: 'Unit UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=SARPRASUMS&backgroundColor=993300', managerId: 'mgr-team-15', managerName: 'Purnomo Shiddiq', managerPhone: '081234567815', status: 'APPROVED', suratTugasName: 'Surat_Tugas_Unit_Sarpras_2026.pdf' },
  { id: 'team-16', name: 'Lab-School & Dekanat FKIP', facultyUnit: 'FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=LABFKIP&backgroundColor=00cc99', managerId: 'mgr-team-16', managerName: 'Qomaruddin Hidayat', managerPhone: '081234567816', status: 'APPROVED', suratTugasName: 'Surat_Tugas_Dekanat_FKIP_2026.pdf' }
];

export const INITIAL_PLAYERS = [
  // Team 1: POR FKIP
  { id: 'p1-1', teamId: 'team-1', fullName: 'Bagus Setyawan', identityNumber: '3372010101950001', usia: 29, position: 'FORWARD', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=BagusSetyawan' },
  { id: 'p1-2', teamId: 'team-1', fullName: 'Rian Hidayat', identityNumber: '3372010202960002', usia: 28, position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=RianHidayat' },
  { id: 'p1-3', teamId: 'team-1', fullName: 'Doni Pratama', identityNumber: '3372010303970003', usia: 27, position: 'DEFENDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=DoniPratama' },
  { id: 'p1-4', teamId: 'team-1', fullName: 'Kiper Utama POR', identityNumber: '3372010404980004', usia: 26, position: 'GOALKEEPER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=KiperPOR' },
  { id: 'p1-5', teamId: 'team-1', fullName: 'Fajar Nugroho', identityNumber: '3372010505990005', usia: 25, position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=FajarNugroho' },
  { id: 'p1-6', teamId: 'team-1', fullName: 'Galih Permana', identityNumber: '3372010606000006', usia: 24, position: 'DEFENDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=GalihPermana' },
  { id: 'p1-7', teamId: 'team-1', fullName: 'Hendy Wijaya', identityNumber: '3372010707010007', usia: 23, position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=HendyWijaya' },
  { id: 'p1-8', teamId: 'team-1', fullName: 'Irfan Bachdim', identityNumber: '3372010808020008', usia: 22, position: 'FORWARD', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=IrfanPOR' },

  // Team 2: Pend. Matematika
  { id: 'p2-1', teamId: 'team-2', fullName: 'Ahmad Syukri', identityNumber: '3372020101950001', usia: 29, position: 'FORWARD', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=AhmadSyukri' },
  { id: 'p2-2', teamId: 'team-2', fullName: 'Rahmat Hidayatullah', identityNumber: '3372020202960002', usia: 28, position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=RahmatH' },
  { id: 'p2-3', teamId: 'team-2', fullName: 'Suryo Utomo', identityNumber: '3372020303970003', usia: 27, position: 'DEFENDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=SuryoUtomo' },
  { id: 'p2-4', teamId: 'team-2', fullName: 'Taufik Hidayat', identityNumber: '3372020404980004', usia: 26, position: 'GOALKEEPER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=TaufikH' },
  { id: 'p2-5', teamId: 'team-2', fullName: 'Utomo Prasetyo', identityNumber: '3372020505990005', usia: 25, position: 'DEFENDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=UtomoP' },
  { id: 'p2-6', teamId: 'team-2', fullName: 'Vicky Nitinegoro', identityNumber: '3372020606000006', usia: 24, position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=VickyN' },
  { id: 'p2-7', teamId: 'team-2', fullName: 'Wawan Febrianto', identityNumber: '3372020707010007', usia: 23, position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=WawanF' },
  { id: 'p2-8', teamId: 'team-2', fullName: 'Yusuf Mansur', identityNumber: '3372020808020008', usia: 22, position: 'FORWARD', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=YusufM' },

  // Team 3: PTI FKIP
  { id: 'p3-1', teamId: 'team-3', fullName: 'Andi Wijaya', identityNumber: '3372030101950001', usia: 28, position: 'GOALKEEPER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=AndiPTI' },
  { id: 'p3-2', teamId: 'team-3', fullName: 'Bima Sakti', identityNumber: '3372030202960002', usia: 27, position: 'DEFENDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=BimaPTI' },
  { id: 'p3-3', teamId: 'team-3', fullName: 'Candra Wijaya', identityNumber: '3372030303970003', usia: 26, position: 'DEFENDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=CandraPTI' },
  { id: 'p3-4', teamId: 'team-3', fullName: 'Dedi Kusnandar', identityNumber: '3372030404980004', usia: 25, position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=DediPTI' },
  { id: 'p3-5', teamId: 'team-3', fullName: 'Evan Dimas', identityNumber: '3372030505990005', usia: 24, position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=EvanPTI' },
  { id: 'p3-6', teamId: 'team-3', fullName: 'Febri Hariyadi', identityNumber: '3372030606000006', usia: 23, position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=FebriPTI' },
  { id: 'p3-7', teamId: 'team-3', fullName: 'Guruh Soekarno', identityNumber: '3372030707010007', usia: 22, position: 'FORWARD', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=GuruhPTI' },

  // Team 4: DEE English PBI
  { id: 'p4-1', teamId: 'team-4', fullName: 'Hendra Setiawan', identityNumber: '3372040101950001', usia: 29, position: 'GOALKEEPER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=HendraPBI' },
  { id: 'p4-2', teamId: 'team-4', fullName: 'Irfan Jaya', identityNumber: '3372040202960002', usia: 28, position: 'DEFENDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=IrfanPBI' },
  { id: 'p4-3', teamId: 'team-4', fullName: 'Jajang Sukmara', identityNumber: '3372040303970003', usia: 27, position: 'DEFENDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=JajangPBI' },
  { id: 'p4-4', teamId: 'team-4', fullName: 'Kurnia Meiga', identityNumber: '3372040404980004', usia: 26, position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=KurniaPBI' },
  { id: 'p4-5', teamId: 'team-4', fullName: 'Luthfi Kamal', identityNumber: '3372040505990005', usia: 25, position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=LuthfiPBI' },
  { id: 'p4-6', teamId: 'team-4', fullName: 'Marc Klok', identityNumber: '3372040606000006', usia: 24, position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=KlokPBI' },
  { id: 'p4-7', teamId: 'team-4', fullName: 'Nadeo Argawinata', identityNumber: '3372040707010007', usia: 23, position: 'FORWARD', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=NadeoPBI' },

  // Team 5: PGSD FC
  { id: 'p5-1', teamId: 'team-5', fullName: 'Oktovianus Maniani', identityNumber: '3372050101950001', usia: 29, position: 'GOALKEEPER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=OktoPGSD' },
  { id: 'p5-2', teamId: 'team-5', fullName: 'Pratama Arhan', identityNumber: '3372050202960002', usia: 28, position: 'DEFENDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=ArhanPGSD' },
  { id: 'p5-3', teamId: 'team-5', fullName: 'Qischil Gandrum', identityNumber: '3372050303970003', usia: 27, position: 'DEFENDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=QischilPGSD' },
  { id: 'p5-4', teamId: 'team-5', fullName: 'Rachmat Irianto', identityNumber: '3372050404980004', usia: 26, position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=IriantoPGSD' },
  { id: 'p5-5', teamId: 'team-5', fullName: 'Saddil Ramdani', identityNumber: '3372050505990005', usia: 25, position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=SaddilPGSD' },
  { id: 'p5-6', teamId: 'team-5', fullName: 'Terens Puhiri', identityNumber: '3372050606000006', usia: 24, position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=TerensPGSD' },
  { id: 'p5-7', teamId: 'team-5', fullName: 'Utam Rusdiana', identityNumber: '3372050707010007', usia: 23, position: 'FORWARD', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=UtamPGSD' },

  // Team 6-16 Auto-Generators for complete dataset
  ...Array.from({ length: 11 }, (_, tIdx) => {
    const tNum = tIdx + 6;
    const teamId = `team-${tNum}`;
    const roles = ['GOALKEEPER', 'DEFENDER', 'DEFENDER', 'MIDFIELDER', 'MIDFIELDER', 'MIDFIELDER', 'FORWARD'];
    const names = ['Agung', 'Budi', 'Cahyo', 'Dharma', 'Erwin', 'Faris', 'Giri'];
    return roles.map((pos, pIdx) => ({
      id: `p${tNum}-${pIdx + 1}`,
      teamId,
      fullName: `${names[pIdx]} ${teamId.toUpperCase()}`,
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
  { id: 'm-1', matchNumber: 1, stage: 'ROUND_OF_16', homeTeamId: 't1', homeTeamName: 'Tim 1', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Tim1', awayTeamId: 't2', awayTeamName: 'Tim 2', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Tim2', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan A UMS Stadium', kickoffTime: 'Hari 1 (08:00 WIB)', matchDate: 'Sabtu, 14 Maret 2026', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-2', matchNumber: 2, stage: 'ROUND_OF_16', homeTeamId: 't3', homeTeamName: 'Tim 3', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Tim3', awayTeamId: 't4', awayTeamName: 'Tim 4', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Tim4', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan B UMS Stadium', kickoffTime: 'Hari 1 (08:00 WIB)', matchDate: 'Sabtu, 14 Maret 2026', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-3', matchNumber: 3, stage: 'ROUND_OF_16', homeTeamId: 't5', homeTeamName: 'Tim 5', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Tim5', awayTeamId: 't6', awayTeamName: 'Tim 6', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Tim6', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan A UMS Stadium', kickoffTime: 'Hari 1 (09:15 WIB)', matchDate: 'Sabtu, 14 Maret 2026', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-4', matchNumber: 4, stage: 'ROUND_OF_16', homeTeamId: 't7', homeTeamName: 'Tim 7', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Tim7', awayTeamId: 't8', awayTeamName: 'Tim 8', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Tim8', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan B UMS Stadium', kickoffTime: 'Hari 1 (09:15 WIB)', matchDate: 'Sabtu, 14 Maret 2026', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-5', matchNumber: 5, stage: 'ROUND_OF_16', homeTeamId: 't9', homeTeamName: 'Tim 9', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Tim9', awayTeamId: 't10', awayTeamName: 'Tim 10', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Tim10', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan A UMS Stadium', kickoffTime: 'Hari 1 (14:00 WIB)', matchDate: 'Sabtu, 14 Maret 2026', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-6', matchNumber: 6, stage: 'ROUND_OF_16', homeTeamId: 't11', homeTeamName: 'Tim 11', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Tim11', awayTeamId: 't12', awayTeamName: 'Tim 12', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Tim12', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan B UMS Stadium', kickoffTime: 'Hari 1 (14:00 WIB)', matchDate: 'Sabtu, 14 Maret 2026', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-7', matchNumber: 7, stage: 'ROUND_OF_16', homeTeamId: 't13', homeTeamName: 'Tim 13', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Tim13', awayTeamId: 't14', awayTeamName: 'Tim 14', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Tim14', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan A UMS Stadium', kickoffTime: 'Hari 1 (15:30 WIB)', matchDate: 'Sabtu, 14 Maret 2026', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-8', matchNumber: 8, stage: 'ROUND_OF_16', homeTeamId: 't15', homeTeamName: 'Tim 15', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Tim15', awayTeamId: 't16', awayTeamName: 'Tim 16', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=Tim16', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan B UMS Stadium', kickoffTime: 'Hari 1 (15:30 WIB)', matchDate: 'Sabtu, 14 Maret 2026', status: 'SCHEDULED', events: [], cards: [] },

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

export const MANAGER_CREDENTIALS = Array.from({ length: 16 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, '0');
  return {
    username: `mgr-team-${i + 1}`,
    password: `tim${num}ums`,
    teamId: `team-${i + 1}`,
    role: 'MANAGER',
    displayName: `Manager Tim ${i + 1}`
  };
});
