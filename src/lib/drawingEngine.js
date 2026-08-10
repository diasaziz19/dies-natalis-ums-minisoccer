/**
 * 16-Team Knockout System Drawing Engine
 * Dies Natalis UMS 2026 Minisoccer Tournament
 */

export function execute16TeamKnockoutDraw(teams) {
  const approvedTeams = teams.filter(t => t.status === 'APPROVED');
  if (approvedTeams.length < 16) {
    return {
      success: false,
      message: `Diperlukan 16 tim terverifikasi (APPROVED) untuk sistem Knockout 16 Besar. Saat ini baru ada ${approvedTeams.length} tim.`
    };
  }

  // Shuffle 16 teams
  const shuffled = [...approvedTeams].sort(() => 0.5 - Math.random());

  const matches = [];

  // 1. Round of 16 (Match 1 - 8)
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
      kickoffTime: new Date(Date.now() + (i + 1) * 3600000 * 2).toISOString(),
      status: 'SCHEDULED',
      events: [],
      cards: []
    });
  }

  // 2. Quarter Finals (Match 9 - 12)
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
      kickoffTime: new Date(Date.now() + 86400000 + (i + 1) * 3600000 * 2).toISOString(),
      status: 'SCHEDULED',
      events: [],
      cards: []
    });
  }

  // 3. Semi Finals (Match 13 - 14)
  for (let i = 0; i < 2; i++) {
    matches.push({
      id: `m-${i + 13}`,
      matchNumber: i + 13,
      stage: 'SEMI_FINAL',
      homeTeamId: null,
      homeTeamName: `Pemenang QF Match #${i * 2 + 9}`,
      homeTeamLogo: '',
      awayTeamId: null,
      awayTeamName: `Pemenang QF Match #${i * 2 + 10}`,
      awayTeamLogo: '',
      homeScore: 0,
      awayScore: 0,
      penaltyHome: 0,
      penaltyAway: 0,
      pitchLocation: (i % 2 === 0) ? 'Lapangan A UMS Stadium' : 'Lapangan B UMS Stadium',
      kickoffTime: new Date(Date.now() + 172800000 + (i + 1) * 3600000 * 2).toISOString(),
      status: 'SCHEDULED',
      events: [],
      cards: []
    });
  }

  // 4. 3rd Place Playoff (Match 15)
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
    kickoffTime: new Date(Date.now() + 259200000).toISOString(),
    status: 'SCHEDULED',
    events: [],
    cards: []
  });

  // 5. Grand Final (Match 16)
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
    kickoffTime: new Date(Date.now() + 259200000 + 7200000).toISOString(),
    status: 'SCHEDULED',
    events: [],
    cards: []
  });

  return {
    success: true,
    matches,
    message: 'Pengundian 16 Besar Knockout berhasil! 16 Tim dialokasikan ke bagan pertandingan babak gugur.'
  };
}
