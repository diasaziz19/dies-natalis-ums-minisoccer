/**
 * Initial Seed & Mock Data
 * Dies Natalis UMS 2026 Minisoccer Tournament
 */

export const INITIAL_TEAMS = [
  {
    id: 'team-1',
    name: 'Teknik FC (FT UMS)',
    facultyUnit: 'Fakultas Teknik',
    logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=FTUMS&backgroundColor=003366',
    managerId: 'mgr-1',
    managerName: 'Ir. Ahmad Subagyo, M.T.',
    managerPhone: '081234567890',
    status: 'APPROVED',
    groupName: 'Group A',
    potNumber: 1,
    rejectionNote: ''
  },
  {
    id: 'team-2',
    name: 'Ekonomi Squad (FEB UMS)',
    facultyUnit: 'Fakultas Ekonomi & Bisnis',
    logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=FEBUMS&backgroundColor=006699',
    managerId: 'mgr-2',
    managerName: 'Dr. Endang Rahayu, M.Si.',
    managerPhone: '081298765432',
    status: 'APPROVED',
    groupName: 'Group A',
    potNumber: 2,
    rejectionNote: ''
  },
  {
    id: 'team-3',
    name: 'Kedokteran FC (FK UMS)',
    facultyUnit: 'Fakultas Kedokteran',
    logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=FKUMS&backgroundColor=009966',
    managerId: 'mgr-3',
    managerName: 'dr. Rizky Kurniawan, Sp.OT',
    managerPhone: '081311223344',
    status: 'APPROVED',
    groupName: 'Group A',
    potNumber: 3,
    rejectionNote: ''
  },
  {
    id: 'team-4',
    name: 'Hukum United (FH UMS)',
    facultyUnit: 'Fakultas Hukum',
    logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=FHUMS&backgroundColor=990033',
    managerId: 'mgr-4',
    managerName: 'Prof. Bambang Setiawan, S.H.',
    managerPhone: '081355667788',
    status: 'APPROVED',
    groupName: 'Group A',
    potNumber: 4,
    rejectionNote: ''
  },
  {
    id: 'team-5',
    name: 'FIK Warriors (FIK UMS)',
    facultyUnit: 'Fakultas Ilmu Kesehatan',
    logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=FIKUMS&backgroundColor=ff6600',
    managerId: 'mgr-5',
    managerName: 'Nrs. Tri Astuti, M.Kep',
    managerPhone: '081788990011',
    status: 'APPROVED',
    groupName: 'Group B',
    potNumber: 1,
    rejectionNote: ''
  },
  {
    id: 'team-6',
    name: 'FKIP All Star (FKIP UMS)',
    facultyUnit: 'Keguruan & Ilmu Pendidikan',
    logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=FKIPUMS&backgroundColor=cc0099',
    managerId: 'mgr-6',
    managerName: 'Drs. Wahyu Hidayat, M.Pd.',
    managerPhone: '081822334455',
    status: 'APPROVED',
    groupName: 'Group B',
    potNumber: 2,
    rejectionNote: ''
  },
  {
    id: 'team-7',
    name: 'Farmasi Knights (FF UMS)',
    facultyUnit: 'Fakultas Farmasi',
    logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=FFUMS&backgroundColor=00cc99',
    managerId: 'mgr-7',
    managerName: 'apt. Fitriani, M.Sc',
    managerPhone: '081933445566',
    status: 'APPROVED',
    groupName: 'Group B',
    potNumber: 3,
    rejectionNote: ''
  },
  {
    id: 'team-8',
    name: 'Rektorat Star (Unit Rektorat)',
    facultyUnit: 'Unit Rektorat & Staf UMS',
    logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=REKTORAT&backgroundColor=6600cc',
    managerId: 'mgr-8',
    managerName: 'Drs. Sugeng Mulyono',
    managerPhone: '081244556677',
    status: 'APPROVED',
    groupName: 'Group B',
    potNumber: 4,
    rejectionNote: ''
  }
];

export const INITIAL_PLAYERS = [
  // Teknik FC Players
  { id: 'p-1', teamId: 'team-1', fullName: 'Dimas Anggara', identityNumber: 'D100220101', position: 'GOALKEEPER', jerseyNumber: 1, photoProfileUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
  { id: 'p-2', teamId: 'team-1', fullName: 'Farhan Putra', identityNumber: 'D100220105', position: 'DEFENDER', jerseyNumber: 4, photoProfileUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
  { id: 'p-3', teamId: 'team-1', fullName: 'Reza Pratama', identityNumber: 'D100220112', position: 'MIDFIELDER', jerseyNumber: 8, photoProfileUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200' },
  { id: 'p-4', teamId: 'team-1', fullName: 'Bagus Kahfi', identityNumber: 'D100220120', position: 'FORWARD', jerseyNumber: 9, photoProfileUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=200' },
  { id: 'p-5', teamId: 'team-1', fullName: 'Alfi Syahrin', identityNumber: 'D100220130', position: 'FORWARD', jerseyNumber: 10, photoProfileUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200' },
  
  // Ekonomi Squad Players
  { id: 'p-6', teamId: 'team-2', fullName: 'Bayu Saputra', identityNumber: 'B100220050', position: 'GOALKEEPER', jerseyNumber: 12, photoProfileUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200' },
  { id: 'p-7', teamId: 'team-2', fullName: 'Faris Ramadhan', identityNumber: 'B100220058', position: 'DEFENDER', jerseyNumber: 3, photoProfileUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200' },
  { id: 'p-8', teamId: 'team-2', fullName: 'Hendra Setiawan', identityNumber: 'B100220072', position: 'MIDFIELDER', jerseyNumber: 7, photoProfileUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200' },
  { id: 'p-9', teamId: 'team-2', fullName: 'Gilang Dirga', identityNumber: 'B100220090', position: 'FORWARD', jerseyNumber: 11, photoProfileUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200' },

  // Kedokteran FC Players
  { id: 'p-10', teamId: 'team-3', fullName: 'dr. Kevin Sanjaya', identityNumber: 'J500210015', position: 'MIDFIELDER', jerseyNumber: 10, photoProfileUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
  { id: 'p-11', teamId: 'team-3', fullName: 'dr. Marcus Gideon', identityNumber: 'J500210022', position: 'DEFENDER', jerseyNumber: 5, photoProfileUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },

  // FIK Warriors Players
  { id: 'p-12', teamId: 'team-5', fullName: 'Taufik Hidayat', identityNumber: 'J410220010', position: 'FORWARD', jerseyNumber: 9, photoProfileUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200' }
];

export const INITIAL_OFFICIALS = [
  { id: 'off-1', teamId: 'team-1', fullName: 'Coach Bambang Nurdiansyah', identityNumber: '0012057201', role: 'HEAD_COACH' },
  { id: 'off-2', teamId: 'team-1', fullName: 'Dr. Aris Triyono (Official)', identityNumber: '0014088002', role: 'OFFICIAL' },
  { id: 'off-3', teamId: 'team-2', fullName: 'Coach Rahmad Darmawan', identityNumber: '0018116503', role: 'HEAD_COACH' },
  { id: 'off-4', teamId: 'team-5', fullName: 'Coach Indra Sjafri', identityNumber: '0020026304', role: 'HEAD_COACH' }
];

export const INITIAL_MATCHES = [
  {
    id: 'match-1',
    matchNumber: 1,
    stage: 'GROUP_STAGE',
    groupName: 'Group A',
    homeTeamId: 'team-1',
    homeTeamName: 'Teknik FC (FT UMS)',
    homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=FTUMS&backgroundColor=003366',
    awayTeamId: 'team-2',
    awayTeamName: 'Ekonomi Squad (FEB UMS)',
    awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=FEBUMS&backgroundColor=006699',
    homeScore: 3,
    awayScore: 1,
    pitchLocation: 'Lapangan A UMS Stadium',
    kickoffTime: new Date(Date.now() - 86400000).toISOString(),
    status: 'FINISHED',
    events: [
      { id: 'ev-1', minute: 12, eventType: 'GOAL', teamId: 'team-1', playerId: 'p-4', playerFullName: 'Bagus Kahfi', assistId: 'p-3', assistFullName: 'Reza Pratama' },
      { id: 'ev-2', minute: 28, eventType: 'YELLOW_CARD', teamId: 'team-2', playerId: 'p-7', playerFullName: 'Faris Ramadhan' },
      { id: 'ev-3', minute: 34, eventType: 'GOAL', teamId: 'team-2', playerId: 'p-9', playerFullName: 'Gilang Dirga', assistId: null },
      { id: 'ev-4', minute: 41, eventType: 'GOAL', teamId: 'team-1', playerId: 'p-5', playerFullName: 'Alfi Syahrin', assistId: 'p-4', assistFullName: 'Bagus Kahfi' },
      { id: 'ev-5', minute: 48, eventType: 'PENALTY_GOAL', teamId: 'team-1', playerId: 'p-4', playerFullName: 'Bagus Kahfi', assistId: null }
    ],
    cards: [
      { id: 'c-1', matchId: 'match-1', teamId: 'team-2', playerId: 'p-7', minute: 28, isRedCard: false, isSecondYellow: false }
    ]
  },
  {
    id: 'match-2',
    matchNumber: 2,
    stage: 'GROUP_STAGE',
    groupName: 'Group A',
    homeTeamId: 'team-3',
    homeTeamName: 'Kedokteran FC (FK UMS)',
    homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=FKUMS&backgroundColor=009966',
    awayTeamId: 'team-4',
    awayTeamName: 'Hukum United (FH UMS)',
    awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=FHUMS&backgroundColor=990033',
    homeScore: 2,
    awayScore: 2,
    pitchLocation: 'Lapangan B UMS Stadium',
    kickoffTime: new Date(Date.now() - 43200000).toISOString(),
    status: 'FINISHED',
    events: [
      { id: 'ev-6', minute: 15, eventType: 'GOAL', teamId: 'team-3', playerId: 'p-10', playerFullName: 'dr. Kevin Sanjaya' },
      { id: 'ev-7', minute: 30, eventType: 'GOAL', teamId: 'team-4', playerId: null, playerFullName: 'Pemain FH' }
    ],
    cards: []
  },
  {
    id: 'match-3',
    matchNumber: 3,
    stage: 'GROUP_STAGE',
    groupName: 'Group B',
    homeTeamId: 'team-5',
    homeTeamName: 'FIK Warriors (FIK UMS)',
    homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=FIKUMS&backgroundColor=ff6600',
    awayTeamId: 'team-6',
    awayTeamName: 'FKIP All Star (FKIP UMS)',
    awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=FKIPUMS&backgroundColor=cc0099',
    homeScore: 1,
    awayScore: 0,
    pitchLocation: 'Lapangan A UMS Stadium',
    kickoffTime: new Date(Date.now() + 3600000).toISOString(),
    status: 'LIVE',
    events: [
      { id: 'ev-8', minute: 22, eventType: 'GOAL', teamId: 'team-5', playerId: 'p-12', playerFullName: 'Taufik Hidayat' }
    ],
    cards: []
  },
  {
    id: 'match-4',
    matchNumber: 4,
    stage: 'GROUP_STAGE',
    groupName: 'Group B',
    homeTeamId: 'team-7',
    homeTeamName: 'Farmasi Knights (FF UMS)',
    homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=FFUMS&backgroundColor=00cc99',
    awayTeamId: 'team-8',
    awayTeamName: 'Rektorat Star (Unit Rektorat)',
    awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=REKTORAT&backgroundColor=6600cc',
    homeScore: 0,
    awayScore: 0,
    pitchLocation: 'Lapangan B UMS Stadium',
    kickoffTime: new Date(Date.now() + 86400000).toISOString(),
    status: 'SCHEDULED',
    events: [],
    cards: []
  }
];

export const MOCK_KNOCKOUT_BRACKET = {
  quarterFinals: [
    { id: 'qf-1', home: 'Teknik FC (Juara Group A)', away: 'FKIP All Star (Runner-up Group B)', scoreHome: 2, scoreAway: 1, status: 'FINISHED' },
    { id: 'qf-2', home: 'FIK Warriors (Juara Group B)', away: 'Ekonomi Squad (Runner-up Group A)', scoreHome: 3, scoreAway: 0, status: 'FINISHED' },
    { id: 'qf-3', home: 'Juara Group C', away: 'Runner-up Group D', scoreHome: 0, scoreAway: 0, status: 'SCHEDULED' },
    { id: 'qf-4', home: 'Juara Group D', away: 'Runner-up Group C', scoreHome: 0, scoreAway: 0, status: 'SCHEDULED' }
  ],
  semiFinals: [
    { id: 'sf-1', home: 'Teknik FC', away: 'FIK Warriors', scoreHome: 1, scoreAway: 1, status: 'LIVE' },
    { id: 'sf-2', home: 'Pemenang QF 3', away: 'Pemenang QF 4', scoreHome: 0, scoreAway: 0, status: 'SCHEDULED' }
  ],
  thirdPlace: { id: 'tp-1', home: 'Kalah SF 1', away: 'Kalah SF 2', scoreHome: 0, scoreAway: 0, status: 'SCHEDULED' },
  final: { id: 'fn-1', home: 'Pemenang SF 1', away: 'Pemenang SF 2', scoreHome: 0, scoreAway: 0, status: 'SCHEDULED' }
};
