/**
 * Main Application Logic
 * Dies Natalis UMS 2026 Minisoccer Tournament System
 */

import { INITIAL_TEAMS, INITIAL_PLAYERS, INITIAL_OFFICIALS, INITIAL_MATCHES, MOCK_KNOCKOUT_BRACKET } from './src/lib/mockData.js';
import { calculateGroupStandings } from './src/lib/standingsCalculator.js';
import { executeUCLDraw } from './src/lib/drawingEngine.js';
import { evaluatePlayerSuspensions } from './src/lib/cardAccumulation.js';

// State Management
let currentRole = 'VISITOR';
let currentVisitorTab = 'standings';
let activeRefereeMatchId = null;

let teams = JSON.parse(localStorage.getItem('ums_teams')) || INITIAL_TEAMS;
let players = JSON.parse(localStorage.getItem('ums_players')) || INITIAL_PLAYERS;
let officials = JSON.parse(localStorage.getItem('ums_officials')) || INITIAL_OFFICIALS;
let matches = JSON.parse(localStorage.getItem('ums_matches')) || INITIAL_MATCHES;
let knockoutBracket = JSON.parse(localStorage.getItem('ums_bracket')) || MOCK_KNOCKOUT_BRACKET;

function saveState() {
  localStorage.setItem('ums_teams', JSON.stringify(teams));
  localStorage.setItem('ums_players', JSON.stringify(players));
  localStorage.setItem('ums_officials', JSON.stringify(officials));
  localStorage.setItem('ums_matches', JSON.stringify(matches));
  localStorage.setItem('ums_bracket', JSON.stringify(knockoutBracket));
}

// Global window bindings for HTML onclick handlers
window.switchRole = switchRole;
window.switchVisitorTab = switchVisitorTab;
window.openRegisterTeamModal = openRegisterTeamModal;
window.openAddPlayerModal = openAddPlayerModal;
window.openAddOfficialModal = openAddOfficialModal;
window.deletePlayer = deletePlayer;
window.deleteOfficial = deleteOfficial;
window.approveTeam = approveTeam;
window.rejectTeam = rejectTeam;
window.triggerUCLDrawingUI = triggerUCLDrawingUI;
window.resetTournamentData = resetTournamentData;
window.selectRefereeMatch = selectRefereeMatch;
window.addMatchEvent = addMatchEvent;
window.finishMatch = finishMatch;
window.openMatchSheetModal = openMatchSheetModal;
window.openTeamDetailModal = openTeamDetailModal;
window.renderVisitorMatches = renderVisitorMatches;
window.closeModal = closeModal;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  renderApp();
});

function switchRole(role) {
  currentRole = role;
  document.querySelectorAll('#roleSelectorContainer .role-badge').forEach(el => {
    if (el.getAttribute('data-role') === role) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  document.querySelectorAll('.app-view').forEach(el => el.classList.add('hidden'));
  const activeView = document.getElementById(`view-${role}`);
  if (activeView) activeView.classList.remove('hidden');

  renderApp();
}

function switchVisitorTab(tabName) {
  currentVisitorTab = tabName;
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.vtab-content').forEach(el => el.classList.add('hidden'));

  const activeTabBtn = document.querySelector(`.tab-btn[onclick*="${tabName}"]`);
  if (activeTabBtn) activeTabBtn.classList.add('active');

  const activeContent = document.getElementById(`vtab-${tabName}`);
  if (activeContent) activeContent.classList.remove('hidden');

  renderVisitorTabContent();
}

function renderApp() {
  // Update evaluate suspensions
  players = evaluatePlayerSuspensions(players, matches);
  saveState();

  if (currentRole === 'VISITOR') {
    renderVisitorTabContent();
  } else if (currentRole === 'TEAM_MANAGER') {
    renderTeamManagerPortal();
  } else if (currentRole === 'REFEREE') {
    renderRefereePortal();
  } else if (currentRole === 'ADMIN') {
    renderAdminPortal();
  }
}

// ----------------------------------------------------
// 1. VISITOR PORTAL RENDERING
// ----------------------------------------------------
function renderVisitorTabContent() {
  // Update Hero Stat Badge
  const approvedCount = teams.filter(t => t.status === 'APPROVED').length;
  const statEl = document.getElementById('statTotalTeams');
  if (statEl) statEl.textContent = `${approvedCount} Tim Approved`;

  if (currentVisitorTab === 'standings') {
    renderStandingsTables();
  } else if (currentVisitorTab === 'bracket') {
    renderKnockoutBracket();
  } else if (currentVisitorTab === 'matches') {
    renderVisitorMatches();
  } else if (currentVisitorTab === 'stats') {
    renderPlayerLeaderboards();
  } else if (currentVisitorTab === 'teams') {
    renderPublicTeamsGrid();
  }
}

function renderStandingsTables() {
  const container = document.getElementById('standingsTablesContainer');
  if (!container) return;

  // Group teams by groupName
  const groups = {};
  teams.filter(t => t.status === 'APPROVED' && t.groupName).forEach(t => {
    if (!groups[t.groupName]) groups[t.groupName] = [];
    groups[t.groupName].push(t);
  });

  if (Object.keys(groups).length === 0) {
    container.innerHTML = `
      <div class="col-span-2 glass-panel p-8 text-center text-slate-400">
        Belum ada grup yang dibentuk. Silakan jalankan <strong>Drawing Pot UCL</strong> di Dashboard Admin.
      </div>
    `;
    return;
  }

  let html = '';
  Object.keys(groups).sort().forEach(gName => {
    const groupTeams = groups[gName];
    const groupMatches = matches.filter(m => m.groupName === gName);
    const standings = calculateGroupStandings(groupTeams, groupMatches);

    html += `
      <div class="glass-panel p-5">
        <h3 class="text-lg font-bold text-cyan-400 mb-3 flex items-center justify-between">
          <span>🛡️ ${gName}</span>
          <span class="text-xs text-slate-400 font-normal">${groupTeams.length} Tim</span>
        </h3>
        <div style="overflow-x: auto;">
          <table class="table-ucl">
            <thead>
              <tr>
                <th>#</th>
                <th>Tim</th>
                <th>P</th>
                <th>W</th>
                <th>D</th>
                <th>L</th>
                <th>GF</th>
                <th>GA</th>
                <th>GD</th>
                <th>PTS</th>
              </tr>
            </thead>
            <tbody>
              ${standings.map((s, idx) => `
                <tr class="${idx < 2 ? 'qualify-knockout' : ''}">
                  <td><strong style="color: ${idx < 2 ? 'var(--ucl-cyan)' : 'var(--text-muted)'}">${s.rank}</strong></td>
                  <td class="flex items-center gap-2 cursor-pointer" onclick="openTeamDetailModal('${s.teamId}')">
                    <img src="${s.logoUrl}" style="width: 22px; height: 22px; border-radius: 50%; background: #000;">
                    <span class="font-semibold text-white hover:text-cyan-400">${s.teamName}</span>
                  </td>
                  <td>${s.played}</td>
                  <td>${s.won}</td>
                  <td>${s.drawn}</td>
                  <td>${s.lost}</td>
                  <td>${s.goalsFor}</td>
                  <td>${s.goalsAgainst}</td>
                  <td>${s.goalDifference > 0 ? '+' + s.goalDifference : s.goalDifference}</td>
                  <td><strong style="color: var(--ucl-gold); font-size: 15px;">${s.points}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderKnockoutBracket() {
  const container = document.getElementById('knockoutBracketContainer');
  if (!container) return;

  container.innerHTML = `
    <!-- Perempat Final -->
    <div class="bracket-column">
      <h4 class="text-xs uppercase text-slate-400 font-bold mb-3 text-center">Quarter Finals (8 Besar)</h4>
      ${knockoutBracket.quarterFinals.map(m => `
        <div class="bracket-match mb-4">
          <div class="bracket-team ${m.scoreHome > m.scoreAway ? 'winner' : ''}">
            <span>${m.home}</span>
            <span class="bracket-score">${m.scoreHome}</span>
          </div>
          <div class="bracket-team ${m.scoreAway > m.scoreHome ? 'winner' : ''}">
            <span>${m.away}</span>
            <span class="bracket-score">${m.scoreAway}</span>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Semi Final -->
    <div class="bracket-column">
      <h4 class="text-xs uppercase text-cyan-400 font-bold mb-3 text-center">Semi Finals</h4>
      ${knockoutBracket.semiFinals.map(m => `
        <div class="bracket-match mb-6">
          <div class="bracket-team ${m.scoreHome > m.scoreAway ? 'winner' : ''}">
            <span>${m.home}</span>
            <span class="bracket-score">${m.scoreHome}</span>
          </div>
          <div class="bracket-team ${m.scoreAway > m.scoreHome ? 'winner' : ''}">
            <span>${m.away}</span>
            <span class="bracket-score">${m.scoreAway}</span>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Final & 3rd Place -->
    <div class="bracket-column">
      <h4 class="text-xs uppercase text-amber-400 font-bold mb-3 text-center">🏆 GRAND FINAL</h4>
      <div class="bracket-match mb-6" style="border-color: var(--ucl-gold); background: rgba(255, 215, 0, 0.05);">
        <div class="bracket-team">
          <span>${knockoutBracket.final.home}</span>
          <span class="bracket-score">${knockoutBracket.final.scoreHome}</span>
        </div>
        <div class="bracket-team">
          <span>${knockoutBracket.final.away}</span>
          <span class="bracket-score">${knockoutBracket.final.scoreAway}</span>
        </div>
      </div>

      <h4 class="text-xs uppercase text-slate-400 font-bold mb-3 text-center">3rd Place Playoff</h4>
      <div class="bracket-match">
        <div class="bracket-team">
          <span>${knockoutBracket.thirdPlace.home}</span>
          <span class="bracket-score">${knockoutBracket.thirdPlace.scoreHome}</span>
        </div>
        <div class="bracket-team">
          <span>${knockoutBracket.thirdPlace.away}</span>
          <span class="bracket-score">${knockoutBracket.thirdPlace.scoreAway}</span>
        </div>
      </div>
    </div>
  `;
}

function renderVisitorMatches() {
  const container = document.getElementById('matchesListContainer');
  if (!container) return;

  const statusFilter = document.getElementById('matchFilterStatus') ? document.getElementById('matchFilterStatus').value : 'ALL';
  let filtered = matches;
  if (statusFilter !== 'ALL') {
    filtered = matches.filter(m => m.status === statusFilter);
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div class="glass-panel p-6 text-center text-slate-400">Tidak ada pertandingan dengan filter status ini.</div>`;
    return;
  }

  container.innerHTML = filtered.map(m => `
    <div class="glass-panel p-5 flex justify-between items-center flex-wrap gap-4 glass-panel-hover">
      <div class="flex items-center gap-3">
        <span class="badge-cyan text-xs">${m.groupName || m.stage}</span>
        <span class="text-xs text-slate-400">📍 ${m.pitchLocation}</span>
      </div>

      <div class="flex items-center gap-6 my-2">
        <div class="flex items-center gap-3 text-right" style="min-width: 160px; justify-content: flex-end;">
          <span class="font-bold text-white text-sm">${m.homeTeamName}</span>
          <img src="${m.homeTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + m.homeTeamName}" style="width: 32px; height: 32px; border-radius: 50%; background: #000;">
        </div>

        <div class="glass-panel px-4 py-2 text-center" style="background: rgba(0, 240, 255, 0.1); border-color: rgba(0, 240, 255, 0.3);">
          <span class="font-black text-xl text-cyan-400">${m.homeScore} - ${m.awayScore}</span>
          <span class="block text-xs font-bold ${m.status === 'LIVE' ? 'text-red-400' : 'text-slate-400'}">${m.status}</span>
        </div>

        <div class="flex items-center gap-3 text-left" style="min-width: 160px;">
          <img src="${m.awayTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + m.awayTeamName}" style="width: 32px; height: 32px; border-radius: 50%; background: #000;">
          <span class="font-bold text-white text-sm">${m.awayTeamName}</span>
        </div>
      </div>

      <button class="btn-ucl-secondary" style="padding: 6px 14px; font-size: 12px;" onclick="openMatchSheetModal('${m.id}')">📄 Match Sheet</button>
    </div>
  `).join('');
}

function renderPlayerLeaderboards() {
  // 1. Top Scorers
  const scorerMap = {};
  matches.forEach(m => {
    (m.events || []).forEach(e => {
      if ((e.eventType === 'GOAL' || e.eventType === 'PENALTY_GOAL') && e.playerId) {
        if (!scorerMap[e.playerId]) {
          scorerMap[e.playerId] = { id: e.playerId, name: e.playerFullName || 'Player', teamId: e.teamId, goals: 0 };
        }
        scorerMap[e.playerId].goals += 1;
      }
    });
  });
  const sortedScorers = Object.values(scorerMap).sort((a, b) => b.goals - a.goals).slice(0, 5);

  const topScorersEl = document.getElementById('topScorersList');
  if (topScorersEl) {
    topScorersEl.innerHTML = sortedScorers.length === 0 ? '<p class="text-xs text-slate-400">Belum ada gol dicetak.</p>' :
      sortedScorers.map((s, idx) => {
        const pObj = players.find(p => p.id === s.id);
        const tObj = teams.find(t => t.id === s.teamId);
        return `
          <div class="flex justify-between items-center p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div class="flex items-center gap-3">
              <span class="font-bold text-amber-400 text-sm">#${idx + 1}</span>
              <img src="${pObj?.photoProfileUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + s.name}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
              <div>
                <span class="font-bold text-white text-sm block">${s.name}</span>
                <span class="text-xs text-slate-400">${tObj?.name || ''}</span>
              </div>
            </div>
            <span class="badge-gold">${s.goals} Gol</span>
          </div>
        `;
      }).join('');
  }

  // 2. Top Assist
  const assistMap = {};
  matches.forEach(m => {
    (m.events || []).forEach(e => {
      if (e.assistId) {
        if (!assistMap[e.assistId]) {
          assistMap[e.assistId] = { id: e.assistId, name: e.assistFullName || 'Player', teamId: e.teamId, assists: 0 };
        }
        assistMap[e.assistId].assists += 1;
      }
    });
  });
  const sortedAssists = Object.values(assistMap).sort((a, b) => b.assists - a.assists).slice(0, 5);

  const topAssistsEl = document.getElementById('topAssistsList');
  if (topAssistsEl) {
    topAssistsEl.innerHTML = sortedAssists.length === 0 ? '<p class="text-xs text-slate-400">Belum ada assist tercatat.</p>' :
      sortedAssists.map((a, idx) => {
        const pObj = players.find(p => p.id === a.id);
        const tObj = teams.find(t => t.id === a.teamId);
        return `
          <div class="flex justify-between items-center p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div class="flex items-center gap-3">
              <span class="font-bold text-cyan-400 text-sm">#${idx + 1}</span>
              <img src="${pObj?.photoProfileUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + a.name}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
              <div>
                <span class="font-bold text-white text-sm block">${a.name}</span>
                <span class="text-xs text-slate-400">${tObj?.name || ''}</span>
              </div>
            </div>
            <span class="badge-cyan">${a.assists} Assist</span>
          </div>
        `;
      }).join('');
  }

  // 3. Discipline (Yellow / Red Cards)
  const disciplineList = players.filter(p => p.yellowCardsCount > 0 || p.redCardsCount > 0 || p.isSuspended);
  const disciplineEl = document.getElementById('disciplineList');
  if (disciplineEl) {
    disciplineEl.innerHTML = disciplineList.length === 0 ? '<p class="text-xs text-slate-400">Semua pemain bermain fair play.</p>' :
      disciplineList.map(p => {
        const tObj = teams.find(t => t.id === p.teamId);
        return `
          <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex justify-between items-center">
            <div>
              <span class="font-bold text-white text-sm block">${p.fullName}</span>
              <span class="text-xs text-slate-400">${tObj?.name || ''}</span>
              ${p.isSuspended ? `<span class="block text-xs text-rose-400 font-semibold mt-1">⛔ ${p.suspensionReason}</span>` : ''}
            </div>
            <div class="flex gap-2 text-xs font-bold">
              ${p.yellowCardsCount > 0 ? `<span class="px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500 rounded">🟨 ${p.yellowCardsCount}</span>` : ''}
              ${p.redCardsCount > 0 ? `<span class="px-2 py-1 bg-rose-500/20 text-rose-400 border border-rose-500 rounded">🟥 ${p.redCardsCount}</span>` : ''}
            </div>
          </div>
        `;
      }).join('');
  }
}

function renderPublicTeamsGrid() {
  const container = document.getElementById('publicTeamsGrid');
  if (!container) return;

  const approvedTeams = teams.filter(t => t.status === 'APPROVED');
  container.innerHTML = approvedTeams.map(t => {
    const tPlayers = players.filter(p => p.teamId === t.id);
    const headCoach = officials.find(o => o.teamId === t.id && o.role === 'HEAD_COACH');
    return `
      <div class="glass-panel p-5 text-center glass-panel-hover cursor-pointer" onclick="openTeamDetailModal('${t.id}')">
        <img src="${t.logoUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + t.name}" style="width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 12px; background: #000; padding: 4px; border: 2px solid var(--ucl-cyan);">
        <h3 class="font-bold text-white text-base mb-1">${t.name}</h3>
        <span class="text-xs text-cyan-400 block mb-3">${t.facultyUnit}</span>
        <div class="text-xs text-slate-400 pt-3 border-t border-slate-800 space-y-1">
          <div>👥 <strong>${tPlayers.length}</strong> Pemain</div>
          <div>👨‍💼 Coach: <strong>${headCoach?.fullName || 'Belum diisi'}</strong></div>
        </div>
      </div>
    `;
  }).join('');
}

// ----------------------------------------------------
// 2. TEAM MANAGER PORTAL
// ----------------------------------------------------
function renderTeamManagerPortal() {
  const container = document.getElementById('managerTeamsContainer');
  if (!container) return;

  if (teams.length === 0) {
    container.innerHTML = `
      <div class="glass-panel p-12 text-center">
        <p class="text-slate-400 mb-4">Belum ada tim terdaftar. Silakan daftarkan tim fakultas/unit Anda untuk mengikuti Dies Natalis UMS 2026.</p>
        <button class="btn-ucl-primary" onclick="openRegisterTeamModal()">+ Daftarkan Tim Sekarang</button>
      </div>
    `;
    return;
  }

  container.innerHTML = teams.map(team => {
    const teamPlayers = players.filter(p => p.teamId === team.id);
    const teamOfficials = officials.filter(o => o.teamId === team.id);
    const headCoach = teamOfficials.find(o => o.role === 'HEAD_COACH');
    const teamOfficial = teamOfficials.find(o => o.role === 'OFFICIAL');

    const isPlayerFull = teamPlayers.length >= 14;

    return `
      <div class="glass-panel p-6">
        <div class="flex justify-between items-start flex-wrap gap-4 mb-6 pb-4 border-b border-slate-800">
          <div class="flex items-center gap-4">
            <img src="${team.logoUrl}" style="width: 54px; height: 54px; border-radius: 50%; background: #000;">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-xl font-bold text-white">${team.name}</h3>
                <span class="badge-${team.status === 'APPROVED' ? 'gold' : team.status === 'REJECTED' ? 'danger' : 'cyan'}">${team.status}</span>
              </div>
              <span class="text-xs text-cyan-400 block">${team.facultyUnit} | Manager: ${team.managerName} (${team.managerPhone})</span>
            </div>
          </div>
        </div>

        <!-- Squad Roster Section -->
        <div class="mb-6">
          <div class="flex justify-between items-center mb-3">
            <h4 class="font-bold text-white text-base flex items-center gap-2">
              <span>🏃 Squad Roster Pemain</span>
              <span class="text-xs text-slate-400">(${teamPlayers.length} / 14 Pemain)</span>
            </h4>
            <button class="btn-ucl-primary" style="padding: 6px 12px; font-size: 12px;" ${isPlayerFull ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} onclick="openAddPlayerModal('${team.id}')">
              + Tambah Pemain ${isPlayerFull ? '(Maks 14)' : ''}
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            ${teamPlayers.map(p => `
              <div class="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                <div class="flex items-center gap-3">
                  <span class="font-black text-cyan-400 text-base style='width:24px;'>#${p.jerseyNumber}</span>
                  <img src="${p.photoProfileUrl}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;">
                  <div>
                    <span class="font-bold text-white text-sm block">${p.fullName}</span>
                    <span class="text-xs text-slate-400 block">${p.position} | NIM: ${p.identityNumber}</span>
                    ${p.isSuspended ? `<span class="text-xs text-rose-400 font-bold block">⛔ ${p.suspensionReason}</span>` : ''}
                  </div>
                </div>
                <button onclick="deletePlayer('${p.id}')" class="text-xs text-rose-400 hover:text-rose-300">Hapus</button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Officials Section -->
        <div>
          <div class="flex justify-between items-center mb-3">
            <h4 class="font-bold text-white text-base">👨‍💼 Tim Official & Pelatih</h4>
            <button class="btn-ucl-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="openAddOfficialModal('${team.id}')">+ Tambah Official / Coach</button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span class="text-xs font-bold text-cyan-400 block">HEAD COACH (Maks 1)</span>
              <span class="font-bold text-white text-sm">${headCoach ? headCoach.fullName : 'Belum diisi'}</span>
              ${headCoach ? `<span class="text-xs text-slate-400 block">NIDN/NIM: ${headCoach.identityNumber}</span>` : ''}
            </div>
            <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span class="text-xs font-bold text-amber-400 block">OFFICIAL TIM (Maks 1)</span>
              <span class="font-bold text-white text-sm">${teamOfficial ? teamOfficial.fullName : 'Belum diisi'}</span>
              ${teamOfficial ? `<span class="text-xs text-slate-400 block">NIDN/NIM: ${teamOfficial.identityNumber}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ----------------------------------------------------
// 3. REFEREE / MATCH CENTER PORTAL
// ----------------------------------------------------
function renderRefereePortal() {
  const selectorEl = document.getElementById('refereeMatchSelector');
  if (!selectorEl) return;

  selectorEl.innerHTML = matches.map(m => `
    <div class="p-3 rounded-lg bg-slate-900/80 border ${activeRefereeMatchId === m.id ? 'border-cyan-400 bg-slate-800' : 'border-slate-800'} cursor-pointer hover:border-cyan-500" onclick="selectRefereeMatch('${m.id}')">
      <div class="flex justify-between items-center text-xs mb-1">
        <span class="text-cyan-400 font-bold">${m.groupName || m.stage}</span>
        <span class="badge-${m.status === 'LIVE' ? 'live' : 'cyan'}">${m.status}</span>
      </div>
      <div class="font-bold text-white text-sm">
        ${m.homeTeamName} <span class="text-cyan-400 font-mono">${m.homeScore} - ${m.awayScore}</span> ${m.awayTeamName}
      </div>
    </div>
  `).join('');

  if (!activeRefereeMatchId && matches.length > 0) {
    activeRefereeMatchId = matches[0].id;
  }

  renderActiveRefereeMatchPanel();
}

function selectRefereeMatch(matchId) {
  activeRefereeMatchId = matchId;
  renderRefereePortal();
}

function renderActiveRefereeMatchPanel() {
  const panel = document.getElementById('matchCenterActivePanel');
  if (!panel || !activeRefereeMatchId) return;

  const match = matches.find(m => m.id === activeRefereeMatchId);
  if (!match) return;

  const homePlayers = players.filter(p => p.teamId === match.homeTeamId);
  const awayPlayers = players.filter(p => p.teamId === match.awayTeamId);

  panel.innerHTML = `
    <div class="flex justify-between items-center pb-4 border-b border-slate-800 mb-6 flex-wrap gap-2">
      <div>
        <span class="badge-cyan text-xs">${match.groupName || match.stage} | ${match.pitchLocation}</span>
        <h3 class="text-2xl font-bold text-white mt-1">${match.homeTeamName} vs ${match.awayTeamName}</h3>
      </div>
      <div class="flex gap-2">
        <button class="btn-ucl-primary" style="padding: 6px 14px; font-size: 13px;" onclick="finishMatch('${match.id}')">Peluit Akhir (Finish Match)</button>
        <button class="btn-ucl-secondary" style="padding: 6px 14px; font-size: 13px;" onclick="openMatchSheetModal('${match.id}')">📄 Generate Match Sheet</button>
      </div>
    </div>

    <!-- Score Board -->
    <div class="flex justify-center items-center gap-8 my-6 py-6 bg-slate-900/60 rounded-xl border border-slate-800">
      <div class="text-center">
        <img src="${match.homeTeamLogo}" style="width: 50px; height: 50px; border-radius: 50%; margin: 0 auto 6px; background: #000;">
        <span class="font-bold text-white block text-sm">${match.homeTeamName}</span>
      </div>
      <div class="text-center px-6 py-2 bg-black/50 border border-cyan-400/40 rounded-xl">
        <span class="font-black text-4xl text-cyan-400 font-mono">${match.homeScore} - ${match.awayScore}</span>
        <span class="block text-xs text-slate-400 mt-1 font-bold">${match.status}</span>
      </div>
      <div class="text-center">
        <img src="${match.awayTeamLogo}" style="width: 50px; height: 50px; border-radius: 50%; margin: 0 auto 6px; background: #000;">
        <span class="font-bold text-white block text-sm">${match.awayTeamName}</span>
      </div>
    </div>

    <!-- Event Logger Form -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <h4 class="font-bold text-cyan-400 text-sm mb-3">+ Input Event Pertandingan</h4>
        <form onsubmit="addMatchEvent(event, '${match.id}')" class="space-y-3">
          <div>
            <label class="form-label">Menit Kejadian</label>
            <input type="number" id="eventMinute" class="form-input" min="1" max="60" value="15" required>
          </div>
          <div>
            <label class="form-label">Tipe Event</label>
            <select id="eventTypeSelect" class="form-input" required>
              <option value="GOAL">⚽ Gol biasa</option>
              <option value="PENALTY_GOAL">⚽ Gol Penalti</option>
              <option value="OWN_GOAL">⚽ Gol Bunuh Diri</option>
              <option value="YELLOW_CARD">🟨 Kartu Kuning</option>
              <option value="RED_CARD">🟥 Kartu Merah Langsung</option>
              <option value="SECOND_YELLOW_RED">🟨🟥 Kartu Kuning Kedua (Red)</option>
            </select>
          </div>
          <div>
            <label class="form-label">Tim</label>
            <select id="eventTeamSelect" class="form-input" required onchange="updatePlayerOptionsForMatch('${match.homeTeamId}', '${match.awayTeamId}')">
              <option value="${match.homeTeamId}">${match.homeTeamName}</option>
              <option value="${match.awayTeamId}">${match.awayTeamName}</option>
            </select>
          </div>
          <div>
            <label class="form-label">Pemain Bersangkutan</label>
            <select id="eventPlayerSelect" class="form-input" required>
              ${homePlayers.map(p => `<option value="${p.id}">${p.fullName} (#${p.jerseyNumber}) ${p.isSuspended ? '[SUSPENDED]' : ''}</option>`).join('')}
            </select>
          </div>
          <button type="submit" class="btn-ucl-primary w-full" style="justify-content: center;">Simpan Event Match</button>
        </form>
      </div>

      <!-- Live Match Timeline -->
      <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <h4 class="font-bold text-white text-sm mb-3">Live Timeline Log</h4>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          ${(match.events || []).length === 0 ? '<p class="text-xs text-slate-400 py-4">Belum ada kejadian tercatat.</p>' :
            (match.events || []).map(e => `
              <div class="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                <span class="font-mono text-cyan-400 font-bold">'${e.minute}</span>
                <span class="font-bold text-white">${e.eventType} - ${e.playerFullName || 'Pemain'}</span>
                <span class="text-slate-400">${e.teamId === match.homeTeamId ? match.homeTeamName : match.awayTeamName}</span>
              </div>
            `).join('')}
        </div>
      </div>
    </div>
  `;
}

function addMatchEvent(e, matchId) {
  e.preventDefault();
  const match = matches.find(m => m.id === matchId);
  if (!match) return;

  const minute = parseInt(document.getElementById('eventMinute').value);
  const eventType = document.getElementById('eventTypeSelect').value;
  const teamId = document.getElementById('eventTeamSelect').value;
  const playerId = document.getElementById('eventPlayerSelect').value;

  const playerObj = players.find(p => p.id === playerId);
  const playerFullName = playerObj ? playerObj.fullName : 'Player';

  // Create match event
  const newEvent = {
    id: 'ev-' + Date.now(),
    minute,
    eventType,
    teamId,
    playerId,
    playerFullName
  };

  if (!match.events) match.events = [];
  match.events.push(newEvent);

  // Update Score or Cards
  if (eventType === 'GOAL' || eventType === 'PENALTY_GOAL') {
    if (teamId === match.homeTeamId) match.homeScore += 1;
    else match.awayScore += 1;
  } else if (eventType === 'OWN_GOAL') {
    if (teamId === match.homeTeamId) match.awayScore += 1;
    else match.homeScore += 1;
  } else if (eventType.includes('CARD')) {
    if (!match.cards) match.cards = [];
    match.cards.push({
      id: 'c-' + Date.now(),
      matchId: match.id,
      teamId,
      playerId,
      minute,
      isRedCard: eventType === 'RED_CARD',
      isSecondYellow: eventType === 'SECOND_YELLOW_RED'
    });
  }

  match.status = 'LIVE';
  saveState();
  renderApp();
}

function finishMatch(matchId) {
  const match = matches.find(m => m.id === matchId);
  if (!match) return;
  match.status = 'FINISHED';
  saveState();
  renderApp();
  alert(`Pertandingan #${match.matchNumber} (${match.homeTeamName} vs ${match.awayTeamName}) resmi selesai! Klasemen grup otomatis diperbarui.`);
}

// ----------------------------------------------------
// 4. SUPER ADMIN PORTAL
// ----------------------------------------------------
function renderAdminPortal() {
  const pendingCount = teams.filter(t => t.status === 'PENDING').length;
  const badgeEl = document.getElementById('adminPendingBadge');
  if (badgeEl) badgeEl.textContent = `${pendingCount} Pending`;

  const container = document.getElementById('adminTeamsApprovalList');
  if (!container) return;

  container.innerHTML = teams.map(t => `
    <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center flex-wrap gap-3">
      <div class="flex items-center gap-3">
        <img src="${t.logoUrl}" style="width: 40px; height: 40px; border-radius: 50%; background: #000;">
        <div>
          <span class="font-bold text-white text-base block">${t.name}</span>
          <span class="text-xs text-cyan-400">${t.facultyUnit} | Manager: ${t.managerName}</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="badge-${t.status === 'APPROVED' ? 'gold' : t.status === 'REJECTED' ? 'danger' : 'cyan'}">${t.status}</span>
        ${t.status === 'PENDING' ? `
          <button onclick="approveTeam('${t.id}')" class="btn-ucl-primary" style="padding: 4px 10px; font-size: 11px;">Approve</button>
          <button onclick="rejectTeam('${t.id}')" class="btn-danger" style="padding: 4px 10px; font-size: 11px;">Reject</button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

function approveTeam(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (team) {
    team.status = 'APPROVED';
    saveState();
    renderApp();
  }
}

function rejectTeam(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (team) {
    team.status = 'REJECTED';
    saveState();
    renderApp();
  }
}

function triggerUCLDrawingUI() {
  const res = executeUCLDraw(teams, 2); // 2 Groups (A & B)
  if (!res.success) {
    alert(res.message);
    return;
  }

  teams = teams.map(t => {
    const updated = Object.values(res.groups).flat().find(gTeam => gTeam.id === t.id);
    return updated ? updated : t;
  });

  matches = res.matches;
  saveState();
  renderApp();

  const visualizer = document.getElementById('adminDrawingVisualizer');
  if (visualizer) {
    visualizer.innerHTML = `
      <div class="p-4 rounded-xl bg-slate-900 border border-cyan-400/40">
        <span class="text-xs font-bold text-emerald-400 block mb-2">🎉 ${res.message}</span>
        <div class="grid grid-cols-2 gap-4">
          ${Object.keys(res.groups).map(gName => `
            <div class="p-3 bg-slate-950 rounded border border-slate-800">
              <strong class="text-cyan-400 text-xs block mb-2">${gName}</strong>
              <ul class="text-xs text-white space-y-1">
                ${res.groups[gName].map(t => `<li>🛡️ ${t.name} (Pot ${t.potNumber})</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

function resetTournamentData() {
  if (confirm('Apakah Anda yakin ingin mengembalikan dataset ke awal (Initial Seed)?')) {
    localStorage.clear();
    teams = INITIAL_TEAMS;
    players = INITIAL_PLAYERS;
    officials = INITIAL_OFFICIALS;
    matches = INITIAL_MATCHES;
    knockoutBracket = MOCK_KNOCKOUT_BRACKET;
    saveState();
    renderApp();
  }
}

// ----------------------------------------------------
// MODALS (REGISTRATION, MATCH SHEET, PLAYER PROFILE)
// ----------------------------------------------------
function closeModal() {
  const modal = document.getElementById('modalContainer');
  if (modal) modal.classList.add('hidden');
}

function openModal(htmlContent) {
  const modal = document.getElementById('modalContainer');
  const body = document.getElementById('modalBody');
  if (modal && body) {
    body.innerHTML = htmlContent;
    modal.classList.remove('hidden');
  }
}

function openRegisterTeamModal() {
  openModal(`
    <h3 class="text-xl font-bold text-white mb-4">Form Pendaftaran Tim Baru</h3>
    <form onsubmit="handleRegisterTeamSubmit(event)" class="space-y-4">
      <div>
        <label class="form-label">Nama Tim</label>
        <input type="text" id="regTeamName" class="form-input" placeholder="Contoh: Farmasi United FC" required>
      </div>
      <div>
        <label class="form-label">Fakultas / Unit UMS</label>
        <input type="text" id="regFacultyUnit" class="form-input" placeholder="Contoh: Fakultas Farmasi UMS" required>
      </div>
      <div>
        <label class="form-label">Nama Manager Tim</label>
        <input type="text" id="regManagerName" class="form-input" placeholder="Nama Lengkap Manager" required>
      </div>
      <div>
        <label class="form-label">No WhatsApp Manager</label>
        <input type="text" id="regManagerPhone" class="form-input" placeholder="0812xxxxxxxx" required>
      </div>
      <button type="submit" class="btn-ucl-primary w-full" style="justify-content: center;">Kirim Pendaftaran Tim</button>
    </form>
  `);
}

window.handleRegisterTeamSubmit = function(e) {
  e.preventDefault();
  const name = document.getElementById('regTeamName').value;
  const facultyUnit = document.getElementById('regFacultyUnit').value;
  const managerName = document.getElementById('regManagerName').value;
  const managerPhone = document.getElementById('regManagerPhone').value;

  const newTeam = {
    id: 'team-' + Date.now(),
    name,
    facultyUnit,
    logoUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
    managerId: 'mgr-' + Date.now(),
    managerName,
    managerPhone,
    status: 'APPROVED', // Default approval for testing convenience
    groupName: 'Group A',
    potNumber: 3
  };

  teams.push(newTeam);
  saveState();
  closeModal();
  renderApp();
  alert(`Tim ${name} berhasil terdaftar! Silakan tambahkan squad pemain & official.`);
};

function openAddPlayerModal(teamId) {
  const teamPlayers = players.filter(p => p.teamId === teamId);
  if (teamPlayers.length >= 14) {
    alert('Aturan Minisoccer: Kuota skuad tim sudah mencapai batas maksimal 14 pemain.');
    return;
  }

  openModal(`
    <h3 class="text-xl font-bold text-white mb-4">Form Tambah Pemain Skuad (Maks 14)</h3>
    <form onsubmit="handleAddPlayerSubmit(event, '${teamId}')" class="space-y-3">
      <div>
        <label class="form-label">Nama Lengkap Pemain</label>
        <input type="text" id="pFullName" class="form-input" placeholder="Nama Lengkap" required>
      </div>
      <div>
        <label class="form-label">Nomor Identitas (NIM / NIDN / KTP)</label>
        <input type="text" id="pIdentityNumber" class="form-input" placeholder="D100220xxx" required>
      </div>
      <div>
        <label class="form-label">Posisi Bermain</label>
        <select id="pPosition" class="form-input" required>
          <option value="GOALKEEPER">Penjaga Gawang (GK)</option>
          <option value="DEFENDER">Bait / Bek (DF)</option>
          <option value="MIDFIELDER">Gelandang (MF)</option>
          <option value="FORWARD">Penyerang / Striker (FW)</option>
        </select>
      </div>
      <div>
        <label class="form-label">Nomor Punggung (Unik per tim, 1-99)</label>
        <input type="number" id="pJerseyNumber" class="form-input" min="1" max="99" placeholder="10" required>
      </div>
      <button type="submit" class="btn-ucl-primary w-full" style="justify-content: center;">Simpan Pemain</button>
    </form>
  `);
}

window.handleAddPlayerSubmit = function(e, teamId) {
  e.preventDefault();
  const fullName = document.getElementById('pFullName').value;
  const identityNumber = document.getElementById('pIdentityNumber').value;
  const position = document.getElementById('pPosition').value;
  const jerseyNumber = parseInt(document.getElementById('pJerseyNumber').value);

  // Validation: Duplicate Jersey Number within team
  const duplicateJersey = players.some(p => p.teamId === teamId && p.jerseyNumber === jerseyNumber);
  if (duplicateJersey) {
    alert(`Nomor punggung #${jerseyNumber} sudah dipakai oleh pemain lain di tim ini! Gunakan nomor punggung lain.`);
    return;
  }

  const newPlayer = {
    id: 'p-' + Date.now(),
    teamId,
    fullName,
    identityNumber,
    position,
    jerseyNumber,
    photoProfileUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(fullName)}`
  };

  players.push(newPlayer);
  saveState();
  closeModal();
  renderApp();
};

function deletePlayer(playerId) {
  if (confirm('Hapus pemain dari skuad?')) {
    players = players.filter(p => p.id !== playerId);
    saveState();
    renderApp();
  }
}

function openAddOfficialModal(teamId) {
  openModal(`
    <h3 class="text-xl font-bold text-white mb-4">Tambah Official / Pelatih Tim</h3>
    <form onsubmit="handleAddOfficialSubmit(event, '${teamId}')" class="space-y-3">
      <div>
        <label class="form-label">Nama Lengkap</label>
        <input type="text" id="offFullName" class="form-input" required>
      </div>
      <div>
        <label class="form-label">Nomor Identitas (NIDN / NIM / KTP)</label>
        <input type="text" id="offIdentityNumber" class="form-input" required>
      </div>
      <div>
        <label class="form-label">Jabatan Official</label>
        <select id="offRole" class="form-input" required>
          <option value="HEAD_COACH">Head Coach (Maksimal 1)</option>
          <option value="OFFICIAL">Official Tim (Maksimal 1)</option>
        </select>
      </div>
      <button type="submit" class="btn-ucl-primary w-full" style="justify-content: center;">Simpan Official</button>
    </form>
  `);
}

window.handleAddOfficialSubmit = function(e, teamId) {
  e.preventDefault();
  const fullName = document.getElementById('offFullName').value;
  const identityNumber = document.getElementById('offIdentityNumber').value;
  const role = document.getElementById('offRole').value;

  const existing = officials.find(o => o.teamId === teamId && o.role === role);
  if (existing) {
    alert(`Tim ini sudah memiliki ${role === 'HEAD_COACH' ? 'Head Coach' : 'Official Tim'}. Batas maksimal adalah 1.`);
    return;
  }

  officials.push({
    id: 'off-' + Date.now(),
    teamId,
    fullName,
    identityNumber,
    role
  });

  saveState();
  closeModal();
  renderApp();
};

function deleteOfficial(officialId) {
  if (confirm('Hapus official ini?')) {
    officials = officials.filter(o => o.id !== officialId);
    saveState();
    renderApp();
  }
}

function openMatchSheetModal(matchId) {
  const match = matches.find(m => m.id === matchId);
  if (!match) return;

  const homeTeamPlayers = players.filter(p => p.teamId === match.homeTeamId);
  const awayTeamPlayers = players.filter(p => p.teamId === match.awayTeamId);

  openModal(`
    <div class="p-4" style="background: white; color: black; border-radius: 12px;">
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
        <h2 style="font-size: 18px; font-weight: 800; text-transform: uppercase;">LAPORAN RESMI PERTANDINGAN (MATCH SHEET)</h2>
        <h3 style="font-size: 14px; font-weight: 700; color: #003366;">DIES NATALIS UMS 2026 MINISOCCER TOURNAMENT</h3>
        <p style="font-size: 11px;">Stadion UMS | ${match.groupName || match.stage} | Pitch: ${match.pitchLocation}</p>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; background: #f1f5f9; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
        <div style="font-weight: 700; font-size: 14px;">${match.homeTeamName}</div>
        <div style="font-size: 24px; font-weight: 900; color: #0077ff;">${match.homeScore} - ${match.awayScore}</div>
        <div style="font-weight: 700; font-size: 14px;">${match.awayTeamName}</div>
      </div>

      <div style="margin-bottom: 16px;">
        <h4 style="font-size: 12px; font-weight: 800; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px;">LOG KEJADIAN PERTANDINGAN</h4>
        ${(match.events || []).length === 0 ? '<p style="font-size: 11px; color: #666;">Tidak ada catatan kejadian gol / kartu.</p>' :
          (match.events || []).map(e => `
            <div style="font-size: 11px; margin-bottom: 4px;">
              <strong>Menit ${e.minute}'</strong>: ${e.eventType} - ${e.playerFullName} (${e.teamId === match.homeTeamId ? match.homeTeamName : match.awayTeamName})
            </div>
          `).join('')}
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 11px; margin-bottom: 16px;">
        <div>
          <strong style="display: block; border-bottom: 1px solid #000; margin-bottom: 4px;">ROSTER ${match.homeTeamName}</strong>
          ${homeTeamPlayers.map(p => `<div>#${p.jerseyNumber} ${p.fullName} (${p.position})</div>`).join('')}
        </div>
        <div>
          <strong style="display: block; border-bottom: 1px solid #000; margin-bottom: 4px;">ROSTER ${match.awayTeamName}</strong>
          ${awayTeamPlayers.map(p => `<div>#${p.jerseyNumber} ${p.fullName} (${p.position})</div>`).join('')}
        </div>
      </div>

      <div style="text-align: right;">
        <button onclick="window.print()" class="btn-ucl-primary" style="padding: 6px 16px; font-size: 12px;">🖨️ Cetak / Download Match Sheet</button>
      </div>
    </div>
  `);
}

function openTeamDetailModal(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (!team) return;

  const teamPlayers = players.filter(p => p.teamId === teamId);
  const headCoach = officials.find(o => o.teamId === teamId && o.role === 'HEAD_COACH');

  openModal(`
    <div class="text-center mb-6">
      <img src="${team.logoUrl}" style="width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 12px; background: #000;">
      <h2 class="text-2xl font-bold text-white">${team.name}</h2>
      <span class="text-sm text-cyan-400">${team.facultyUnit}</span>
      <p class="text-xs text-slate-400 mt-1">Head Coach: ${headCoach?.fullName || 'N/A'} | Manager: ${team.managerName}</p>
    </div>

    <h3 class="font-bold text-white text-sm mb-3">Daftar Skuad Pemain (${teamPlayers.length})</h3>
    <div class="space-y-2 max-h-80 overflow-y-auto">
      ${teamPlayers.map(p => `
        <div class="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <span class="font-bold text-cyan-400 text-sm">#${p.jerseyNumber}</span>
            <img src="${p.photoProfileUrl}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
            <div>
              <span class="font-bold text-white text-sm block">${p.fullName}</span>
              <span class="text-xs text-slate-400">${p.position} | NIM: ${p.identityNumber}</span>
            </div>
          </div>
          ${p.isSuspended ? `<span class="badge-danger text-xs">⛔ Suspended</span>` : `<span class="badge-cyan text-xs">Active</span>`}
        </div>
      `).join('')}
    </div>
  `);
}
