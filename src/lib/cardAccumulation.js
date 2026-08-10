/**
 * Card Accumulation & Automatic Player Suspension Engine
 * Dies Natalis UMS 2026 Minisoccer Tournament
 */

export function evaluatePlayerSuspensions(players, allMatches) {
  // Map player card counts
  const playerStats = {};

  players.forEach(p => {
    playerStats[p.id] = {
      playerId: p.id,
      fullName: p.fullName,
      teamId: p.teamId,
      yellowCardsCount: 0,
      redCardsCount: 0,
      isSuspended: false,
      suspensionReason: ''
    };
  });

  const finishedOrLiveMatches = allMatches.filter(m => m.status === 'FINISHED' || m.status === 'LIVE');

  finishedOrLiveMatches.forEach(match => {
    (match.cards || []).forEach(card => {
      const pStat = playerStats[card.playerId];
      if (!pStat) return;

      if (card.isRedCard || card.isSecondYellow) {
        pStat.redCardsCount += 1;
        pStat.isSuspended = true;
        pStat.suspensionReason = card.isSecondYellow ? 
          `Suspended (2x Yellow Card in Match #${match.matchNumber})` : 
          `Suspended (Direct Red Card in Match #${match.matchNumber})`;
      } else {
        pStat.yellowCardsCount += 1;
        if (pStat.yellowCardsCount >= 2) {
          pStat.isSuspended = true;
          pStat.suspensionReason = `Suspended (Accumulation of ${pStat.yellowCardsCount} Yellow Cards)`;
        }
      }
    });
  });

  // Apply suspension status to player objects
  return players.map(p => {
    const stat = playerStats[p.id];
    return {
      ...p,
      isSuspended: stat ? stat.isSuspended : false,
      suspensionReason: stat ? stat.suspensionReason : '',
      yellowCardsCount: stat ? stat.yellowCardsCount : 0,
      redCardsCount: stat ? stat.redCardsCount : 0
    };
  });
}
