/**
 * Initial Seed & Mock Data
 * Dies Natalis UMS 2026 Minisoccer Tournament (FKIP UMS & Unit Rektorat Special Edition)
 */

// SUPER ADMIN LOGIN
export const ADMIN_CREDENTIALS = {
  username: 'superadmin',
  password: 'ums2026admin'
};

// MANAGER CREDENTIALS — 1 akun per tim
export const MANAGER_CREDENTIALS = [
  { username: 'mgr-team-1', password: 'tim01ums', teamId: 'team-1', displayName: 'Dr. Nur Subekti, M.Or' },
  { username: 'mgr-team-2', password: 'tim02ums', teamId: 'team-2', displayName: 'Dr. Rita P Khotimah' },
  { username: 'mgr-team-3', password: 'tim03ums', teamId: 'team-3', displayName: 'Aris Rakhmadi, M.Eng' },
  { username: 'mgr-team-4', password: 'tim04ums', teamId: 'team-4', displayName: 'Titis Setyabudi, M.Hum' },
  { username: 'mgr-team-5', password: 'tim05ums', teamId: 'team-5', displayName: 'Anam Sutopo, M.Hum' },
  { username: 'mgr-team-6', password: 'tim06ums', teamId: 'team-6', displayName: 'Dr. Triastuti Rahayu' },
  { username: 'mgr-team-7', password: 'tim07ums', teamId: 'team-7', displayName: 'Dr. Main Sufanti' },
  { username: 'mgr-team-8', password: 'tim08ums', teamId: 'team-8', displayName: 'Drs. Suharjo, M.Si' },
  { username: 'mgr-team-9', password: 'tim09ums', teamId: 'team-9', displayName: 'Dr. Suranto, ST, MM' },
  { username: 'mgr-team-10', password: 'tim10ums', teamId: 'team-10', displayName: 'Dr. Yulia Maftuhah' },
  { username: 'mgr-team-11', password: 'tim11ums', teamId: 'team-11', displayName: 'Dra. Juninah, M.Pd' },
  { username: 'mgr-team-12', password: 'tim12ums', teamId: 'team-12', displayName: 'Drs. Sugeng Mulyono' },
  { username: 'mgr-team-13', password: 'tim13ums', teamId: 'team-13', displayName: 'Mustafa, S.IP, M.Hum' },
  { username: 'mgr-team-14', password: 'tim14ums', teamId: 'team-14', displayName: 'Ir. Budi Santoso' },
  { username: 'mgr-team-15', password: 'tim15ums', teamId: 'team-15', displayName: 'Bambang Sukojo' },
  { username: 'mgr-team-16', password: 'tim16ums', teamId: 'team-16', displayName: 'Prof. Dr. Sutama, M.Pd' }
];

export const INITIAL_TEAMS = [
  { id: 'team-1', name: 'Pendidikan Olahraga (POR FKIP)', facultyUnit: 'Prodi Pendidikan Olahraga FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=PORFKIP&backgroundColor=ff6600', managerName: 'Dr. Nur Subekti, M.Or', managerPhone: '081234567801', status: 'APPROVED', suratTugasName: 'Surat_Tugas_POR_FKIP.pdf' },
  { id: 'team-2', name: 'Pendidikan Matematika FC', facultyUnit: 'Prodi Pendidikan Matematika FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=MATEMATIKAFKIP&backgroundColor=003366', managerName: 'Dr. Rita P Khotimah', managerPhone: '081234567802', status: 'APPROVED', suratTugasName: 'Surat_Tugas_Matematika.pdf' },
  { id: 'team-3', name: 'Pendidikan Teknik Informatika (PTI)', facultyUnit: 'Prodi PTI FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=PTIFKIP&backgroundColor=0099cc', managerName: 'Aris Rakhmadi, M.Eng', managerPhone: '081234567803', status: 'APPROVED', suratTugasName: 'Surat_Tugas_PTI.pdf' },
  { id: 'team-4', name: 'DEE English Dept (PBI FKIP)', facultyUnit: 'Prodi Pendidikan Bahasa Inggris FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=DEEFKIP&backgroundColor=990033', managerName: 'Titis Setyabudi, M.Hum', managerPhone: '081234567804', status: 'APPROVED', suratTugasName: null },
  { id: 'team-5', name: 'Pendidikan Guru SD (PGSD FC)', facultyUnit: 'Prodi PGSD FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=PGSDFKIP&backgroundColor=009966', managerName: 'Anam Sutopo, M.Hum', managerPhone: '081234567805', status: 'APPROVED', suratTugasName: null },
  { id: 'team-6', name: 'Pendidikan Biologi FC', facultyUnit: 'Prodi Pendidikan Biologi FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=BIOLOGIFKIP&backgroundColor=339900', managerName: 'Dr. Triastuti Rahayu', managerPhone: '081234567806', status: 'APPROVED', suratTugasName: null },
  { id: 'team-7', name: 'Pendidikan Bahasa Indonesia (PBSI)', facultyUnit: 'Prodi PBSI FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=PBSIFKIP&backgroundColor=cc0099', managerName: 'Dr. Main Sufanti', managerPhone: '081234567807', status: 'APPROVED', suratTugasName: null },
  { id: 'team-8', name: 'Pendidikan Geografi FC', facultyUnit: 'Prodi Pendidikan Geografi FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=GEOGRAFIFKIP&backgroundColor=669900', managerName: 'Drs. Suharjo, M.Si', managerPhone: '081234567808', status: 'APPROVED', suratTugasName: null },
  { id: 'team-9', name: 'Pendidikan Akuntansi FC', facultyUnit: 'Prodi Pendidikan Akuntansi FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=AKUNTANSIFKIP&backgroundColor=006699', managerName: 'Dr. Suranto, ST, MM', managerPhone: '081234567809', status: 'APPROVED', suratTugasName: null },
  { id: 'team-10', name: 'PPKn Pancasila FC', facultyUnit: 'Prodi PPKn FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=PPKNFKIP&backgroundColor=cc0033', managerName: 'Dr. Yulia Maftuhah', managerPhone: '081234567810', status: 'APPROVED', suratTugasName: null },
  { id: 'team-11', name: 'PAUD Ceria FC (PAUD FKIP)', facultyUnit: 'Prodi Pendidikan PAUD FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=PAUDFKIP&backgroundColor=ff3399', managerName: 'Dra. Juninah, M.Pd', managerPhone: '081234567811', status: 'APPROVED', suratTugasName: null },
  { id: 'team-12', name: 'Unit Rektorat Star (Rektorat UMS)', facultyUnit: 'Unit Rektorat & Staf UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=REKTORATUMS&backgroundColor=6600cc', managerName: 'Drs. Sugeng Mulyono', managerPhone: '081234567812', status: 'APPROVED', suratTugasName: null },
  { id: 'team-13', name: 'Perpustakaan UMS FC', facultyUnit: 'Unit Perpustakaan Pusat UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=PERPUSUMS&backgroundColor=006666', managerName: 'Mustafa, S.IP, M.Hum', managerPhone: '081234567813', status: 'APPROVED', suratTugasName: null },
  { id: 'team-14', name: 'Unit IT & Pesma UMS', facultyUnit: 'LIT & Pesma KH Mas Mansur UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=PESMAUMS&backgroundColor=003399', managerName: 'Ir. Budi Santoso', managerPhone: '081234567814', status: 'APPROVED', suratTugasName: null },
  { id: 'team-15', name: 'Sarpras & Keamanan UMS', facultyUnit: 'Unit Keamanan & Sarpras UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=SARPRASUMS&backgroundColor=993300', managerName: 'Bambang Sukojo', managerPhone: '081234567815', status: 'APPROVED', suratTugasName: null },
  { id: 'team-16', name: 'Lab-School & Dekanat FKIP', facultyUnit: 'Laboratorium & Dekanat FKIP UMS', logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=LABFKIP&backgroundColor=00cc99', managerName: 'Prof. Dr. Sutama, M.Pd', managerPhone: '081234567816', status: 'APPROVED', suratTugasName: null }
];

// Player data: Nama, No. KTP/NI. Kepegawaian, Usia, Posisi
export const INITIAL_PLAYERS = [
  { id: 'p-1', teamId: 'team-1', fullName: 'Dimas Anggara', identityNumber: '3372012345670001', usia: 22, position: 'GOALKEEPER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=DimasAnggara' },
  { id: 'p-2', teamId: 'team-1', fullName: 'Farhan Putra', identityNumber: '3372012345670002', usia: 21, position: 'DEFENDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=FarhanPutra' },
  { id: 'p-3', teamId: 'team-1', fullName: 'Reza Pratama', identityNumber: '3372012345670003', usia: 23, position: 'MIDFIELDER', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=RezaPratama' },
  { id: 'p-4', teamId: 'team-1', fullName: 'Bagus Kahfi', identityNumber: '3372012345670004', usia: 20, position: 'FORWARD', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=BagusKahfi' },
  { id: 'p-5', teamId: 'team-3', fullName: 'Alfi Syahrin', identityNumber: '3372012345670005', usia: 22, position: 'FORWARD', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=AlfiSyahrin' },
  { id: 'p-6', teamId: 'team-5', fullName: 'Taufik Hidayat', identityNumber: '3372012345670006', usia: 24, position: 'FORWARD', photoProfileUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=TaufikHidayat' }
];

export const INITIAL_OFFICIALS = [
  { id: 'off-1', teamId: 'team-1', fullName: 'Coach Nur Subekti', identityNumber: '0012057201', role: 'HEAD_COACH' },
  { id: 'off-2', teamId: 'team-3', fullName: 'Coach Aris Rakhmadi', identityNumber: '0014088002', role: 'HEAD_COACH' }
];

// INITIAL BRACKET MATCHES - ALL SCHEDULED (0-0)
export const INITIAL_MATCHES = [
  { id: 'm-1', matchNumber: 1, stage: 'ROUND_OF_16', homeTeamId: 'team-1', homeTeamName: 'Pendidikan Olahraga (POR FKIP)', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=PORFKIP&backgroundColor=ff6600', awayTeamId: 'team-3', awayTeamName: 'Pendidikan Teknik Informatika (PTI)', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=PTIFKIP&backgroundColor=0099cc', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan A UMS Stadium', kickoffTime: 'Hari 1 (08:00 WIB)', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-2', matchNumber: 2, stage: 'ROUND_OF_16', homeTeamId: 'team-5', homeTeamName: 'Pendidikan Guru SD (PGSD FC)', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=PGSDFKIP&backgroundColor=009966', awayTeamId: 'team-2', awayTeamName: 'Pendidikan Matematika FC', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=MATEMATIKAFKIP&backgroundColor=003366', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan B UMS Stadium', kickoffTime: 'Hari 1 (08:00 WIB)', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-3', matchNumber: 3, stage: 'ROUND_OF_16', homeTeamId: 'team-4', homeTeamName: 'DEE English Dept (PBI FKIP)', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=DEEFKIP&backgroundColor=990033', awayTeamId: 'team-6', awayTeamName: 'Pendidikan Biologi FC', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=BIOLOGIFKIP&backgroundColor=339900', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan A UMS Stadium', kickoffTime: 'Hari 1 (09:15 WIB)', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-4', matchNumber: 4, stage: 'ROUND_OF_16', homeTeamId: 'team-7', homeTeamName: 'Pendidikan Bahasa Indonesia (PBSI)', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=PBSIFKIP&backgroundColor=cc0099', awayTeamId: 'team-8', awayTeamName: 'Pendidikan Geografi FC', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=GEOGRAFIFKIP&backgroundColor=669900', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan B UMS Stadium', kickoffTime: 'Hari 1 (09:15 WIB)', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-5', matchNumber: 5, stage: 'ROUND_OF_16', homeTeamId: 'team-9', homeTeamName: 'Pendidikan Akuntansi FC', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=AKUNTANSIFKIP&backgroundColor=006699', awayTeamId: 'team-12', awayTeamName: 'Unit Rektorat Star (Rektorat UMS)', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=REKTORATUMS&backgroundColor=6600cc', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan A UMS Stadium', kickoffTime: 'Hari 1 (14:00 WIB)', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-6', matchNumber: 6, stage: 'ROUND_OF_16', homeTeamId: 'team-10', homeTeamName: 'PPKn Pancasila FC', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=PPKNFKIP&backgroundColor=cc0033', awayTeamId: 'team-11', awayTeamName: 'PAUD Ceria FC (PAUD FKIP)', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=PAUDFKIP&backgroundColor=ff3399', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan B UMS Stadium', kickoffTime: 'Hari 1 (14:00 WIB)', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-7', matchNumber: 7, stage: 'ROUND_OF_16', homeTeamId: 'team-13', homeTeamName: 'Perpustakaan UMS FC', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=PERPUSUMS&backgroundColor=006666', awayTeamId: 'team-14', awayTeamName: 'Unit IT & Pesma UMS', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=PESMAUMS&backgroundColor=003399', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan A UMS Stadium', kickoffTime: 'Hari 1 (15:30 WIB)', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-8', matchNumber: 8, stage: 'ROUND_OF_16', homeTeamId: 'team-15', homeTeamName: 'Sarpras & Keamanan UMS', homeTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=SARPRASUMS&backgroundColor=993300', awayTeamId: 'team-16', awayTeamName: 'Lab-School & Dekanat FKIP', awayTeamLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=LABFKIP&backgroundColor=00cc99', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan B UMS Stadium', kickoffTime: 'Hari 1 (15:30 WIB)', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-9', matchNumber: 9, stage: 'QUARTER_FINAL', homeTeamId: null, homeTeamName: 'Pemenang Match #1', homeTeamLogo: '', awayTeamId: null, awayTeamName: 'Pemenang Match #2', awayTeamLogo: '', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan A UMS Stadium', kickoffTime: 'Hari 2 (08:30 WIB)', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-10', matchNumber: 10, stage: 'QUARTER_FINAL', homeTeamId: null, homeTeamName: 'Pemenang Match #3', homeTeamLogo: '', awayTeamId: null, awayTeamName: 'Pemenang Match #4', awayTeamLogo: '', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan B UMS Stadium', kickoffTime: 'Hari 2 (08:30 WIB)', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-11', matchNumber: 11, stage: 'QUARTER_FINAL', homeTeamId: null, homeTeamName: 'Pemenang Match #5', homeTeamLogo: '', awayTeamId: null, awayTeamName: 'Pemenang Match #6', awayTeamLogo: '', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan A UMS Stadium', kickoffTime: 'Hari 2 (10:00 WIB)', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-12', matchNumber: 12, stage: 'QUARTER_FINAL', homeTeamId: null, homeTeamName: 'Pemenang Match #7', homeTeamLogo: '', awayTeamId: null, awayTeamName: 'Pemenang Match #8', awayTeamLogo: '', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan B UMS Stadium', kickoffTime: 'Hari 2 (10:00 WIB)', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-13', matchNumber: 13, stage: 'SEMI_FINAL', homeTeamId: null, homeTeamName: 'Pemenang Match #9', homeTeamLogo: '', awayTeamId: null, awayTeamName: 'Pemenang Match #10', awayTeamLogo: '', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan A UMS Stadium', kickoffTime: 'Hari 3 (08:30 WIB)', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-14', matchNumber: 14, stage: 'SEMI_FINAL', homeTeamId: null, homeTeamName: 'Pemenang Match #11', homeTeamLogo: '', awayTeamId: null, awayTeamName: 'Pemenang Match #12', awayTeamLogo: '', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan B UMS Stadium', kickoffTime: 'Hari 3 (09:45 WIB)', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-15', matchNumber: 15, stage: 'THIRD_PLACE', homeTeamId: null, homeTeamName: 'Kalah Semi Final 1', homeTeamLogo: '', awayTeamId: null, awayTeamName: 'Kalah Semi Final 2', awayTeamLogo: '', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan B UMS Stadium', kickoffTime: 'Hari 3 (14:30 WIB)', status: 'SCHEDULED', events: [], cards: [] },
  { id: 'm-16', matchNumber: 16, stage: 'FINAL', homeTeamId: null, homeTeamName: 'Pemenang Semi Final 1', homeTeamLogo: '', awayTeamId: null, awayTeamName: 'Pemenang Semi Final 2', awayTeamLogo: '', homeScore: 0, awayScore: 0, pitchLocation: 'Lapangan A UMS Stadium', kickoffTime: 'Hari 3 (16:00 WIB)', status: 'SCHEDULED', events: [], cards: [] }
];
