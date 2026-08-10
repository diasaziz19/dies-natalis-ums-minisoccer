/**
 * UEFA Champions League Dynamic Standings Calculator & Tie-Breaker Engine
 * Dies Natalis UMS 2026 Minisoccer Tournament
 */

export function calculateGroupStandings(teamsInGroup, matchesInGroup) {
  // Initialize base standings for each team
  const standingsMap = {};

  teamsInGroup.forEach(team => {
    standingsMap[team.id] = {
      teamId: team.id,
      teamName: team.name,
      facultyUnit: team.facultyUnit,
      logoUrl: team.logoUrl || '',
      groupName: team.groupName,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      yellowCards: 0,
      redCards: 0,
      fairPlayPoints: 0,
      rank: 0
    };
  });

  // Calculate stats from finished matches
  const finishedMatches = matchesInGroup.filter(m => m.status === 'FINISHED');

  finishedMatches.forEach(m => {
    const home = standingsMap[m.homeTeamId];
    const away = standingsMap[m.awayTeamId];

    if (!home || !away) return;

    home.played += 1;
    away.played += 1;

    home.goalsFor += m.homeScore;
    home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (m.awayScore > m.homeScore) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }

    // Calculate cards & fair play points
    (m.cards || []).forEach(c => {
      const teamStat = standingsMap[c.teamId];
      if (teamStat) {
        if (c.isRedCard || c.isSecondYellow) {
          teamStat.redCards += 1;
          teamStat.fairPlayPoints -= c.isSecondYellow ? 3 : 4; // -3 for 2nd yellow, -4 for direct red
        } else {
          teamStat.yellowCards += 1;
          teamStat.fairPlayPoints -= 1; // -1 for yellow card
        }
      }
    });
  });

  // Calculate goal differences
  Object.values(standingsMap).forEach(s => {
    s.goalDifference = s.goalsFor - s.goalsAgainst;
  });

  // Sort by UEFA Champions League Criteria:
  // 1. Points
  // 2. Head-to-head points
  // 3. Head-to-head goal difference
  // 4. Overall Goal Difference
  // 5. Overall Goals Scored
  // 6. Fair Play Points (Higher / closer to 0 is better)
  const standingsList = Object.values(standingsMap);

  standingsList.sort((a, b) => {
    // 1. Poin
    if (b.points !== a.points) return b.points - a.points;

    // 2 & 3. Head to Head between a and b
    const h2hMatches = finishedMatches.filter(
      m => (m.homeTeamId === a.teamId && m.awayTeamId === b.teamId) ||
           (m.homeTeamId === b.teamId && m.awayTeamId === a.teamId)
    );

    if (h2hMatches.length > 0) {
      let aH2HPoints = 0;
      let bH2HPoints = 0;
      let aH2HGoals = 0;
      let bH2HGoals = 0;

      h2hMatches.forEach(m => {
        const isAHome = m.homeTeamId === a.teamId;
        const aScore = isAHome ? m.homeScore : m.awayScore;
        const bScore = isAHome ? m.awayScore : m.homeScore;

        aH2HGoals += aScore;
        bH2HGoals += bScore;

        if (aScore > bScore) aH2HPoints += 3;
        else if (bScore > aScore) bH2HPoints += 3;
        else { aH2HPoints += 1; bH2HPoints += 1; }
      });

      if (bH2HPoints !== aH2HPoints) return bH2HPoints - aH2HPoints;
      const h2hDiff = (aH2HGoals - bH2HGoals) - (bH2HGoals - aH2HGoals);
      if (h2hDiff !== 0) return h2hDiff < 0 ? 1 : -1;
    }

    // 4. Overall Goal Difference
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;

    // 5. Overall Goals Scored
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

    // 6. Fair Play Points (higher/closer to zero is better, e.g. -1 is better than -5)
    return b.fairPlayPoints - a.fairPlayPoints;
  });

  // Assign ranks
  standingsList.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  return standingsList;
}
