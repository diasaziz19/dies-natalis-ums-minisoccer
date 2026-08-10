/**
 * 16-Team Knockout System Drawing Engine with Schedule Generator
 * Dies Natalis UMS 2026 Minisoccer Tournament (FKIP UMS & Unit Rektorat)
 */

export function execute16TeamKnockoutDraw(teams) {
  const approvedTeams = teams.filter(t => t.status === 'APPROVED');
  if (approvedTeams.length < 16) {
    return {
      success: false,
      message: `Diperlukan 16 tim terverifikasi (APPROVED) untuk sistem Knockout 16 Besar. Saat ini baru ada ${approvedTeams.length} tim.`
    };
  }

  // Shuffle 16 teams randomly
  const shuffled = [...approvedTeams].sort(() => 0.5 - Math.random());

  const matches = [];

  const round16Times = [
    'Hari 1 (08:00 WIB)', 'Hari 1 (08:00 WIB)',
    'Hari 1 (09:15 WIB)', 'Hari 1 (09:15 WIB)',
    'Hari 1 (14:00 WIB)', 'Hari 1 (14:00 WIB)',
    'Hari 1 (15:30 WIB)', 'Hari 1 (15:30 WIB)'
  ];

  // 1. Round of 16 (Match 1 - 8) - Hari 1
  for (let i = 0; i < 8; i++) {
    const home = shuffled[i * 2];
    const away = shuffled[i * 2 + 1];

    matches.push({
      id: `m-${i + 1}`,
      matchNumber: i + 1,
      stage: 'ROUND_OF_16',
      homeTeamId: home.id,
      homeTeamName: home.name,
      homeTeamLogo: home.logoUrl,
      awayTeamId: away.id,
      awayTeamName: away.name,
      awayTeamLogo: away.logoUrl,
      homeScore: 0,
      awayScore: 0,
      penaltyHome: 0,
      penaltyAway: 0,
      pitchLocation: (i % 2 === 0) ? 'Lapangan A UMS Stadium' : 'Lapangan B UMS Stadium',
      kickoffTime: round16Times[i],
      status: 'SCHEDULED',
      events: [],
      cards: []
    });
  }

  const qfTimes = [
    'Hari 2 (08:30 WIB)', 'Hari 2 (08:30 WIB)',
    'Hari 2 (10:00 WIB)', 'Hari 2 (10:00 WIB)'
  ];

  // 2. Quarter Finals (Match 9 - 12) - Hari 2
  for (let i = 0; i < 4; i++) {
    matches.push({
      id: `m-${i + 9}`,
      matchNumber: i + 9,
      stage: 'QUARTER_FINAL',
      homeTeamId: null,
      homeTeamName: `Pemenang Match #${i * 2 + 1}`,
      homeTeamLogo: '',
      awayTeamId: null,
      awayTeamName: `Pemenang Match #${i * 2 + 2}`,
      awayTeamLogo: '',
      homeScore: 0,
      awayScore: 0,
      penaltyHome: 0,
      penaltyAway: 0,
      pitchLocation: (i % 2 === 0) ? 'Lapangan A UMS Stadium' : 'Lapangan B UMS Stadium',
      kickoffTime: qfTimes[i],
      status: 'SCHEDULED',
      events: [],
      cards: []
    });
  }

  // 3. Semi Finals (Match 13 - 14) - Hari 3
  matches.push({
    id: 'm-13',
    matchNumber: 13,
    stage: 'SEMI_FINAL',
    homeTeamId: null,
    homeTeamName: 'Pemenang Match #9',
    homeTeamLogo: '',
    awayTeamId: null,
    awayTeamName: 'Pemenang Match #10',
    awayTeamLogo: '',
    homeScore: 0,
    awayScore: 0,
    pitchLocation: 'Lapangan A UMS Stadium',
    kickoffTime: 'Hari 3 (08:30 WIB)',
    status: 'SCHEDULED',
    events: [],
    cards: []
  });

  matches.push({
    id: 'm-14',
    matchNumber: 14,
    stage: 'SEMI_FINAL',
    homeTeamId: null,
    homeTeamName: 'Pemenang Match #11',
    homeTeamLogo: '',
    awayTeamId: null,
    awayTeamName: 'Pemenang Match #12',
    awayTeamLogo: '',
    homeScore: 0,
    awayScore: 0,
    pitchLocation: 'Lapangan B UMS Stadium',
    kickoffTime: 'Hari 3 (09:45 WIB)',
    status: 'SCHEDULED',
    events: [],
    cards: []
  });

  // 4. 3rd Place Playoff (Match 15) - Hari 3 Sore
  matches.push({
    id: 'm-15',
    matchNumber: 15,
    stage: 'THIRD_PLACE',
    homeTeamId: null,
    homeTeamName: 'Kalah Semi Final 1',
    homeTeamLogo: '',
    awayTeamId: null,
    awayTeamName: 'Kalah Semi Final 2',
    awayTeamLogo: '',
    homeScore: 0,
    awayScore: 0,
    pitchLocation: 'Lapangan B UMS Stadium',
    kickoffTime: 'Hari 3 (14:30 WIB)',
    status: 'SCHEDULED',
    events: [],
    cards: []
  });

  // 5. Grand Final (Match 16) - Hari 3 Sore
  matches.push({
    id: 'm-16',
    matchNumber: 16,
    stage: 'FINAL',
    homeTeamId: null,
    homeTeamName: 'Pemenang Semi Final 1',
    homeTeamLogo: '',
    awayTeamId: null,
    awayTeamName: 'Pemenang Semi Final 2',
    awayTeamLogo: '',
    homeScore: 0,
    awayScore: 0,
    pitchLocation: 'Lapangan A UMS Stadium',
    kickoffTime: 'Hari 3 (16:00 WIB)',
    status: 'SCHEDULED',
    events: [],
    cards: []
  });

  return {
    success: true,
    matches,
    message: 'Pengundian acak 16 Besar Knockout berhasil! Jadwal pertandingan Hari 1, 2, dan 3 telah disusun.'
  };
}
