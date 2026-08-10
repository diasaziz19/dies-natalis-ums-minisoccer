/**
 * Champions League Style Drawing Engine
 * Dies Natalis UMS 2026 Minisoccer Tournament
 */

export function executeUCLDraw(teams, numGroups = 4) {
  // 1. Filter only APPROVED teams
  const approvedTeams = teams.filter(t => t.status === 'APPROVED');
  if (approvedTeams.length === 0) {
    return { success: false, message: 'Tidak ada tim terverifikasi (APPROVED) untuk didaftarkan ke drawing.' };
  }

  // 2. Determine Pots (Pot 1, Pot 2, Pot 3, Pot 4)
  const teamsPerPot = Math.ceil(approvedTeams.length / numGroups);
  const shuffled = [...approvedTeams].sort(() => 0.5 - Math.random());
  
  const pots = Array.from({ length: numGroups }, () => []);
  shuffled.forEach((team, index) => {
    const potIndex = Math.floor(index / numGroups);
    if (pots[potIndex]) {
      team.potNumber = potIndex + 1;
      pots[potIndex].push(team);
    }
  });

  // 3. Draw Teams into Groups (Group A, Group B, Group C, Group D, etc.)
  const groupNames = ['Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F', 'Group G', 'Group H'].slice(0, numGroups);
  const groups = {};
  groupNames.forEach(g => { groups[g] = []; });

  // For each pot, pick 1 team per group
  pots.forEach((pot) => {
    const potShuffled = [...pot].sort(() => 0.5 - Math.random());
    potShuffled.forEach((team, groupIndex) => {
      const gName = groupNames[groupIndex % numGroups];
      team.groupName = gName;
      groups[gName].push(team);
    });
  });

  // 4. Generate Round Robin Matches for each Group
  const matches = [];
  let matchCounter = 1;

  Object.keys(groups).forEach(gName => {
    const gTeams = groups[gName];
    // Create pairings
    for (let i = 0; i < gTeams.length; i++) {
      for (let j = i + 1; j < gTeams.length; j++) {
        matches.push({
          id: `match-${matchCounter}`,
          matchNumber: matchCounter,
          stage: 'GROUP_STAGE',
          groupName: gName,
          homeTeamId: gTeams[i].id,
          homeTeamName: gTeams[i].name,
          homeTeamLogo: gTeams[i].logoUrl,
          awayTeamId: gTeams[j].id,
          awayTeamName: gTeams[j].name,
          awayTeamLogo: gTeams[j].logoUrl,
          homeScore: 0,
          awayScore: 0,
          pitchLocation: (matchCounter % 2 === 1) ? 'Lapangan A UMS Stadium' : 'Lapangan B UMS Stadium',
          kickoffTime: new Date(Date.now() + matchCounter * 3600000 * 4).toISOString(),
          status: 'SCHEDULED',
          events: [],
          cards: []
        });
        matchCounter++;
      }
    }
  });

  return {
    success: true,
    groups,
    matches,
    message: `Pengundian berhasil! ${approvedTeams.length} Tim dialokasikan ke ${numGroups} Grup dengan total ${matches.length} pertandingan fase grup.`
  };
}
