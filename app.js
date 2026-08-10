/**
 * Main Application Logic
 * Dies Natalis UMS 2026 Minisoccer Tournament System (16-Team Knockout System)
 */

import { INITIAL_TEAMS, INITIAL_PLAYERS, INITIAL_OFFICIALS, INITIAL_MATCHES } from './src/lib/mockData.js';
import { execute16TeamKnockoutDraw } from './src/lib/drawingEngine.js';
import { evaluatePlayerSuspensions } from './src/lib/cardAccumulation.js';

// State Management
let currentRole = 'VISITOR';
let currentVisitorTab = 'bracket';
let activeRefereeMatchId = null;

let teams = JSON.parse(localStorage.getItem('ums_teams')) || INITIAL_TEAMS;
let players = JSON.parse(localStorage.getItem('ums_players')) || INITIAL_PLAYERS;
let officials = JSON.parse(localStorage.getItem('ums_officials')) || INITIAL_OFFICIALS;
let matches = JSON.parse(localStorage.getItem('ums_matches')) || INITIAL_MATCHES;

function saveState() {
  localStorage.setItem('ums_teams', JSON.stringify(teams));
  localStorage.setItem('ums_players', JSON.stringify(players));
  localStorage.setItem('ums_officials', JSON.stringify(officials));
  localStorage.setItem('ums_matches', JSON.stringify(matches));
}

// Global window bindings for HTML onclick handlers
window.switchRole = switchRole;
window.switchVisitorTab = switchVisitorTab;
window.openRegisterTeamModal = openRegisterTeamModal;
window.openEditTeamModal = openEditTeamModal;
window.openAddPlayerModal = openAddPlayerModal;
window.openAddOfficialModal = openAddOfficialModal;
window.deletePlayer = deletePlayer;
window.deleteOfficial = deleteOfficial;
window.approveTeam = approveTeam;
window.rejectTeam = rejectTeam;
window.trigger16TeamDrawingUI = trigger16TeamDrawingUI;
window.resetTournamentData = resetTournamentData;
window.hardResetAndReload = hardResetAndReload;
window.selectRefereeMatch = selectRefereeMatch;
window.addMatchEvent = addMatchEvent;
window.finishMatch = finishMatch;
window.startMatch = startMatch;
window.openEditScoreModal = openEditScoreModal;
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
  const approvedCount = teams.filter(t => t.status === 'APPROVED').length;
  const statEl = document.getElementById('statTotalTeams');
  if (statEl) statEl.textContent = `${approvedCount} Tim Approved`;

  if (currentVisitorTab === 'bracket') {
    render16TeamKnockoutBracket();
  } else if (currentVisitorTab === 'matches') {
    renderVisitorMatches();
  } else if (currentVisitorTab === 'stats') {
    renderPlayerLeaderboards();
  } else if (currentVisitorTab === 'teams') {
    renderPublicTeamsGrid();
  }
}

function render16TeamKnockoutBracket() {
  const container = document.getElementById('knockoutBracketContainer');
  if (!container) return;

  const roundOf16 = matches.filter(m => m.stage === 'ROUND_OF_16');
  const quarterFinals = matches.filter(m => m.stage === 'QUARTER_FINAL');
  const semiFinals = matches.filter(m => m.stage === 'SEMI_FINAL');
  const thirdPlace = matches.find(m => m.stage === 'THIRD_PLACE');
  const grandFinal = matches.find(m => m.stage === 'FINAL');

  container.innerHTML = `
    <!-- Round of 16 -->
    <div class="bracket-column" style="min-width: 220px;">
      <h4 class="text-xs uppercase text-cyan-400 font-bold mb-3 text-center">Babak 16 Besar (Octofinals)</h4>
      ${roundOf16.map(m => `
        <div class="bracket-match mb-3 cursor-pointer" onclick="openMatchSheetModal('${m.id}')">
          <div class="text-xs text-slate-400 font-bold mb-1">Match #${m.matchNumber} (${m.status})</div>
          <div class="bracket-team ${m.homeScore > m.awayScore && m.status === 'FINISHED' ? 'winner' : ''}">
            <span class="truncate">${m.homeTeamName}</span>
            <span class="bracket-score">${m.homeScore}</span>
          </div>
          <div class="bracket-team ${m.awayScore > m.homeScore && m.status === 'FINISHED' ? 'winner' : ''}">
            <span class="truncate">${m.awayTeamName}</span>
            <span class="bracket-score">${m.awayScore}</span>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Quarter Finals -->
    <div class="bracket-column" style="min-width: 220px;">
      <h4 class="text-xs uppercase text-amber-400 font-bold mb-3 text-center">Perempat Final (8 Besar)</h4>
      ${quarterFinals.map(m => `
        <div class="bracket-match mb-8 cursor-pointer" onclick="openMatchSheetModal('${m.id}')">
          <div class="text-xs text-slate-400 font-bold mb-1">Match #${m.matchNumber} (${m.status})</div>
          <div class="bracket-team ${m.homeScore > m.awayScore && m.status === 'FINISHED' ? 'winner' : ''}">
            <span class="truncate">${m.homeTeamName}</span>
            <span class="bracket-score">${m.homeScore}</span>
          </div>
          <div class="bracket-team ${m.awayScore > m.homeScore && m.status === 'FINISHED' ? 'winner' : ''}">
            <span class="truncate">${m.awayTeamName}</span>
            <span class="bracket-score">${m.awayScore}</span>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Semi Finals -->
    <div class="bracket-column" style="min-width: 220px;">
      <h4 class="text-xs uppercase text-purple-400 font-bold mb-3 text-center">Semi Finals</h4>
      ${semiFinals.map(m => `
        <div class="bracket-match mb-16 cursor-pointer" onclick="openMatchSheetModal('${m.id}')">
          <div class="text-xs text-slate-400 font-bold mb-1">Match #${m.matchNumber} (${m.status})</div>
          <div class="bracket-team ${m.homeScore > m.awayScore && m.status === 'FINISHED' ? 'winner' : ''}">
            <span class="truncate">${m.homeTeamName}</span>
            <span class="bracket-score">${m.homeScore}</span>
          </div>
          <div class="bracket-team ${m.awayScore > m.homeScore && m.status === 'FINISHED' ? 'winner' : ''}">
            <span class="truncate">${m.awayTeamName}</span>
            <span class="bracket-score">${m.awayScore}</span>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Grand Final & 3rd Place -->
    <div class="bracket-column" style="min-width: 240px;">
      <h4 class="text-xs uppercase text-yellow-400 font-bold mb-3 text-center">🏆 GRAND FINAL</h4>
      ${grandFinal ? `
        <div class="bracket-match mb-8" style="border-color: var(--ucl-gold); background: rgba(255, 215, 0, 0.08);">
          <div class="text-xs text-amber-400 font-bold mb-1">Match #${grandFinal.matchNumber} (${grandFinal.status})</div>
          <div class="bracket-team">
            <span>${grandFinal.homeTeamName}</span>
            <span class="bracket-score">${grandFinal.homeScore}</span>
          </div>
          <div class="bracket-team">
            <span>${grandFinal.awayTeamName}</span>
            <span class="bracket-score">${grandFinal.awayScore}</span>
          </div>
        </div>
      ` : ''}

      <h4 class="text-xs uppercase text-slate-400 font-bold mb-3 text-center">Perebutan Juara 3</h4>
      ${thirdPlace ? `
        <div class="bracket-match">
          <div class="text-xs text-slate-400 font-bold mb-1">Match #${thirdPlace.matchNumber} (${thirdPlace.status})</div>
          <div class="bracket-team">
            <span>${thirdPlace.homeTeamName}</span>
            <span class="bracket-score">${thirdPlace.homeScore}</span>
          </div>
          <div class="bracket-team">
            <span>${thirdPlace.awayTeamName}</span>
            <span class="bracket-score">${thirdPlace.awayScore}</span>
          </div>
        </div>
      ` : ''}
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
    container.innerHTML = `<div class="glass-panel p-6 text-center text-slate-400">Tidak ada pertandingan dengan status ini.</div>`;
    return;
  }

  container.innerHTML = filtered.map(m => `
    <div class="glass-panel p-5 flex justify-between items-center flex-wrap gap-4 glass-panel-hover">
      <div class="flex items-center gap-3">
        <span class="badge-cyan text-xs">Match #${m.matchNumber} | ${m.stage}</span>
        <span class="text-xs text-slate-400">📍 ${m.pitchLocation}</span>
      </div>

      <div class="flex items-center gap-6 my-2">
        <div class="flex items-center gap-3 text-right" style="min-width: 170px; justify-content: flex-end;">
          <span class="font-bold text-white text-sm">${m.homeTeamName}</span>
          <img src="${m.homeTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + m.homeTeamName}" style="width: 32px; height: 32px; border-radius: 50%; background: #000;">
        </div>

        <div class="glass-panel px-4 py-2 text-center" style="background: rgba(0, 240, 255, 0.1); border-color: rgba(0, 240, 255, 0.3);">
          <span class="font-black text-xl text-cyan-400">${m.homeScore} - ${m.awayScore}</span>
          <span class="block text-xs font-bold ${m.status === 'LIVE' ? 'text-red-400' : 'text-slate-400'}">${m.status}</span>
        </div>

        <div class="flex items-center gap-3 text-left" style="min-width: 170px;">
          <img src="${m.awayTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + m.awayTeamName}" style="width: 32px; height: 32px; border-radius: 50%; background: #000;">
          <span class="font-bold text-white text-sm">${m.awayTeamName}</span>
        </div>
      </div>

      <button class="btn-ucl-secondary" style="padding: 6px 14px; font-size: 12px;" onclick="openMatchSheetModal('${m.id}')">📄 Match Sheet</button>
    </div>
  `).join('');
}

function renderPlayerLeaderboards() {
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
            <img src="${team.logoUrl}" style="width: 54px; height: 54px; border-radius: 50%; background: #000; border: 2px solid rgba(34,211,238,0.3);">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-xl font-bold text-white">${team.name}</h3>
                <span class="badge-${team.status === 'APPROVED' ? 'gold' : team.status === 'REJECTED' ? 'danger' : 'cyan'}">${team.status}</span>
              </div>
              <span class="text-xs text-cyan-400 block mt-1">${team.facultyUnit} | Manager: ${team.managerName} (${team.managerPhone})</span>
            </div>
          </div>
          <button onclick="openEditTeamModal('${team.id}')" style="padding: 7px 14px; font-size: 12px; font-weight: 700; border-radius: 8px; border: 1px solid rgba(34,211,238,0.4); background: rgba(34,211,238,0.08); color: #22d3ee; cursor: pointer; display:flex; align-items:center; gap:6px; transition: all 0.2s;" onmouseover="this.style.background='rgba(34,211,238,0.18)'" onmouseout="this.style.background='rgba(34,211,238,0.08)'">✏️ Edit Info Tim</button>
        </div>

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
                  <span class="font-black text-cyan-400 text-base">#${p.jerseyNumber}</span>
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
// 3. REFEREE / MATCH CENTER PORTAL (WITH AUTOMATIC KNOCKOUT PROGRESSION)
// ----------------------------------------------------
function renderRefereePortal() {
  const selectorEl = document.getElementById('refereeMatchSelector');
  if (!selectorEl) return;

  selectorEl.innerHTML = matches.map(m => `
    <div class="p-3 rounded-lg bg-slate-900/80 border ${activeRefereeMatchId === m.id ? 'border-cyan-400 bg-slate-800' : 'border-slate-800'} cursor-pointer hover:border-cyan-500" onclick="selectRefereeMatch('${m.id}')">
      <div class="flex justify-between items-center text-xs mb-1">
        <span class="text-cyan-400 font-bold">Match #${m.matchNumber} (${m.stage})</span>
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

  const homePlayers = match.homeTeamId ? players.filter(p => p.teamId === match.homeTeamId) : [];
  const awayPlayers = match.awayTeamId ? players.filter(p => p.teamId === match.awayTeamId) : [];
  const allPlayersForMatch = homePlayers.concat(awayPlayers);

  const isScheduled = match.status === 'SCHEDULED';
  const isLive = match.status === 'LIVE';
  const isFinished = match.status === 'FINISHED';

  // Status badge color
  const statusColor = isLive ? '#22c55e' : isFinished ? '#f59e0b' : '#64748b';
  const statusLabel = isLive ? '🔴 LIVE' : isFinished ? '✅ SELESAI' : '⏳ BELUM MULAI';

  panel.innerHTML = `
    <!-- Header -->
    <div class="flex justify-between items-start pb-4 border-b border-slate-800 mb-6 flex-wrap gap-3">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="badge-cyan text-xs">Match #${match.matchNumber} | ${match.stage}</span>
          <span style="font-size:11px; font-weight:700; color:${statusColor}; background: ${statusColor}22; padding: 2px 8px; border-radius:999px; border: 1px solid ${statusColor}55;">${statusLabel}</span>
        </div>
        <h3 class="text-xl font-bold text-white">${match.homeTeamName} vs ${match.awayTeamName}</h3>
        <p class="text-xs text-slate-400 mt-1">📍 ${match.pitchLocation} | 🕐 ${match.kickoffTime}</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        ${isScheduled ? `<button class="btn-ucl-primary" style="padding: 7px 14px; font-size: 13px; background: linear-gradient(135deg,#16a34a,#15803d);" onclick="startMatch('${match.id}')">▶ Mulai Pertandingan</button>` : ''}
        ${isLive ? `<button class="btn-ucl-primary" style="padding: 7px 14px; font-size: 13px;" onclick="finishMatch('${match.id}')">🏁 Peluit Akhir & Majukan Pemenang</button>` : ''}
        <button class="btn-ucl-secondary" style="padding: 7px 14px; font-size: 13px;" onclick="openEditScoreModal('${match.id}')">✏️ Edit Skor Manual</button>
        ${!isScheduled ? `<button class="btn-ucl-secondary" style="padding: 7px 14px; font-size: 13px;" onclick="openMatchSheetModal('${match.id}')">📄 Match Sheet</button>` : ''}
      </div>
    </div>

    <!-- Score Board -->
    <div class="flex justify-center items-center gap-6 my-5 py-6 rounded-2xl" style="background: linear-gradient(135deg, rgba(0,0,0,0.7), rgba(15,23,42,0.9)); border: 1px solid rgba(100,116,139,0.3);">
      <div class="text-center" style="min-width: 130px;">
        <img src="${match.homeTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(match.homeTeamName)}" style="width: 52px; height: 52px; border-radius: 50%; margin: 0 auto 8px; background: #111; border: 2px solid #334155;">
        <span class="font-bold text-white block text-sm">${match.homeTeamName}</span>
        <span class="text-xs text-slate-500">Tim Kandang</span>
      </div>
      <div class="text-center px-8 py-4 rounded-2xl" style="background: rgba(0,0,0,0.6); border: 1px solid rgba(34,211,238,0.3);">
        <span class="font-black text-5xl font-mono" style="color: #22d3ee; text-shadow: 0 0 20px rgba(34,211,238,0.4);">${match.homeScore} - ${match.awayScore}</span>
        <div class="mt-2 text-xs font-bold" style="color: ${statusColor};">${statusLabel}</div>
      </div>
      <div class="text-center" style="min-width: 130px;">
        <img src="${match.awayTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(match.awayTeamName)}" style="width: 52px; height: 52px; border-radius: 50%; margin: 0 auto 8px; background: #111; border: 2px solid #334155;">
        <span class="font-bold text-white block text-sm">${match.awayTeamName}</span>
        <span class="text-xs text-slate-500">Tim Tandang</span>
      </div>
    </div>

    ${isScheduled ? `
    <!-- Match Belum Dimulai Info -->
    <div class="p-4 rounded-xl text-center" style="background: rgba(100,116,139,0.1); border: 1px solid rgba(100,116,139,0.3); margin-bottom: 16px;">
      <p class="text-slate-400 text-sm">⏳ Pertandingan belum dimulai. Klik <strong class="text-white">"▶ Mulai Pertandingan"</strong> untuk mengubah status ke LIVE, atau <strong class="text-white">"✏️ Edit Skor Manual"</strong> untuk langsung input skor akhir.</p>
    </div>` : ''}

    ${isLive || isFinished ? `
    <!-- Event Logger Form -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
      <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <h4 class="font-bold text-cyan-400 text-sm mb-3">⚽ + Input Event Pertandingan</h4>
        <form onsubmit="addMatchEvent(event, '${match.id}')" class="space-y-3">
          <div>
            <label class="form-label">Menit Kejadian</label>
            <input type="number" id="eventMinute" class="form-input" min="1" max="60" value="1" required>
          </div>
          <div>
            <label class="form-label">Tipe Event</label>
            <select id="eventTypeSelect" class="form-input" required>
              <option value="GOAL">⚽ Gol Biasa</option>
              <option value="PENALTY_GOAL">⚽ Gol Penalti</option>
              <option value="OWN_GOAL">⚽ Gol Bunuh Diri</option>
              <option value="YELLOW_CARD">🟨 Kartu Kuning</option>
              <option value="RED_CARD">🟥 Kartu Merah Langsung</option>
              <option value="SECOND_YELLOW_RED">🟨🟥 Kartu Kuning Kedua (Red)</option>
            </select>
          </div>
          <div>
            <label class="form-label">Tim yang Mendapat Event</label>
            <select id="eventTeamSelect" class="form-input" required>
              <option value="${match.homeTeamId}">${match.homeTeamName}</option>
              <option value="${match.awayTeamId}">${match.awayTeamName}</option>
            </select>
          </div>
          <div>
            <label class="form-label">Pemain (Opsional)</label>
            <select id="eventPlayerSelect" class="form-input">
              <option value="">-- Tidak Ada / Skip --</option>
              ${allPlayersForMatch.map(p => `<option value="${p.id}">${p.fullName} (#${p.jerseyNumber})${p.isSuspended ? ' [SUSPENDED]' : ''}</option>`).join('')}
            </select>
            ${allPlayersForMatch.length === 0 ? '<p class="text-xs text-amber-400 mt-1">⚠ Belum ada pemain terdaftar — pilih "Tidak Ada" dan tetap bisa simpan event.</p>' : ''}
          </div>
          <button type="submit" class="btn-ucl-primary w-full" style="justify-content: center;">💾 Simpan Event</button>
        </form>
      </div>

      <!-- Live Match Timeline -->
      <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <h4 class="font-bold text-white text-sm mb-3">📋 Timeline Pertandingan</h4>
        <div class="space-y-2 max-h-72 overflow-y-auto">
          ${(match.events || []).length === 0
            ? '<p class="text-xs text-slate-400 py-6 text-center">Belum ada kejadian tercatat.</p>'
            : (match.events || []).slice().sort((a,b) => (a.minute||0)-(b.minute||0)).map(e => `
              <div class="p-2 rounded-lg flex justify-between items-center text-xs" style="background: rgba(15,23,42,0.8); border: 1px solid rgba(51,65,85,0.5);">
                <span class="font-mono font-bold" style="color:#22d3ee; min-width:30px;">${e.minute}'</span>
                <span class="font-bold text-white flex-1 mx-2">${e.eventType === 'GOAL' ? '⚽' : e.eventType === 'PENALTY_GOAL' ? '⚽P' : e.eventType === 'OWN_GOAL' ? '⚽OG' : e.eventType === 'YELLOW_CARD' ? '🟨' : e.eventType === 'RED_CARD' ? '🟥' : '🟨🟥'} ${e.playerFullName || '-'}</span>
                <span class="text-slate-400 text-right" style="max-width:100px; overflow:hidden;">${e.teamId === match.homeTeamId ? match.homeTeamName.split(' ')[0] : match.awayTeamName.split(' ')[0]}</span>
              </div>
            `).join('')
          }
        </div>
      </div>
    </div>` : ''}
  `;
}

function startMatch(matchId) {
  const match = matches.find(m => m.id === matchId);
  if (!match) return;
  if (match.status !== 'SCHEDULED') { alert('Match ini sudah dimulai atau selesai.'); return; }
  match.status = 'LIVE';
  saveState();
  renderApp();
}

function openEditScoreModal(matchId) {
  const match = matches.find(m => m.id === matchId);
  if (!match) return;

  openModal(`
    <h3 class="text-xl font-bold text-white mb-1">✏️ Edit Skor Manual</h3>
    <p class="text-sm text-slate-400 mb-5">Match #${match.matchNumber}: <strong class="text-cyan-300">${match.homeTeamName}</strong> vs <strong class="text-cyan-300">${match.awayTeamName}</strong></p>
    <form onsubmit="handleEditScoreSubmit(event, '${matchId}')" class="space-y-5">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Skor ${match.homeTeamName}</label>
          <input type="number" id="editHomeScore" class="form-input" min="0" max="99" value="${match.homeScore}" required>
        </div>
        <div>
          <label class="form-label">Skor ${match.awayTeamName}</label>
          <input type="number" id="editAwayScore" class="form-input" min="0" max="99" value="${match.awayScore}" required>
        </div>
      </div>
      <div>
        <label class="form-label">Status Pertandingan</label>
        <select id="editMatchStatus" class="form-input">
          <option value="SCHEDULED" ${match.status === 'SCHEDULED' ? 'selected' : ''}>⏳ BELUM MULAI (SCHEDULED)</option>
          <option value="LIVE" ${match.status === 'LIVE' ? 'selected' : ''}>🔴 SEDANG BERLANGSUNG (LIVE)</option>
          <option value="FINISHED" ${match.status === 'FINISHED' ? 'selected' : ''}>✅ SELESAI (FINISHED)</option>
        </select>
      </div>
      <div class="p-3 rounded-lg" style="background: rgba(34,211,238,0.05); border: 1px solid rgba(34,211,238,0.2);">
        <p class="text-xs text-slate-300">💡 Jika pilih status <strong>SELESAI</strong>, pemenang akan otomatis dimajukan ke babak berikutnya di bracket.</p>
      </div>
      <div class="flex gap-3">
        <button type="submit" class="btn-ucl-primary flex-1" style="justify-content: center;">💾 Simpan Perubahan</button>
        <button type="button" onclick="closeModal()" class="btn-ucl-secondary" style="padding: 10px 16px;">Batal</button>
      </div>
    </form>
  `);
}

window.handleEditScoreSubmit = function(e, matchId) {
  e.preventDefault();
  const match = matches.find(m => m.id === matchId);
  if (!match) return;

  const newHomeScore = parseInt(document.getElementById('editHomeScore').value);
  const newAwayScore = parseInt(document.getElementById('editAwayScore').value);
  const newStatus = document.getElementById('editMatchStatus').value;

  match.homeScore = isNaN(newHomeScore) ? 0 : newHomeScore;
  match.awayScore = isNaN(newAwayScore) ? 0 : newAwayScore;

  const wasFinished = match.status === 'FINISHED';
  match.status = newStatus;

  // If status changed to FINISHED, automatically advance winner in bracket
  if (newStatus === 'FINISHED' && !wasFinished) {
    const winningTeamId = match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId;
    const losingTeamId = match.homeScore > match.awayScore ? match.awayTeamId : match.homeTeamId;
    const winningTeam = teams.find(t => t.id === winningTeamId);
    const losingTeam = teams.find(t => t.id === losingTeamId);

    if (match.matchNumber >= 1 && match.matchNumber <= 8) {
      const qfMatchNumber = 8 + Math.ceil(match.matchNumber / 2);
      const qfMatch = matches.find(m => m.matchNumber === qfMatchNumber);
      if (qfMatch) {
        if (match.matchNumber % 2 === 1) {
          qfMatch.homeTeamId = winningTeamId;
          qfMatch.homeTeamName = winningTeam ? winningTeam.name : 'Pemenang';
          qfMatch.homeTeamLogo = winningTeam ? winningTeam.logoUrl : '';
        } else {
          qfMatch.awayTeamId = winningTeamId;
          qfMatch.awayTeamName = winningTeam ? winningTeam.name : 'Pemenang';
          qfMatch.awayTeamLogo = winningTeam ? winningTeam.logoUrl : '';
        }
      }
    } else if (match.matchNumber >= 9 && match.matchNumber <= 12) {
      const sfMatchNumber = 12 + Math.ceil((match.matchNumber - 8) / 2);
      const sfMatch = matches.find(m => m.matchNumber === sfMatchNumber);
      if (sfMatch) {
        if ((match.matchNumber - 8) % 2 === 1) {
          sfMatch.homeTeamId = winningTeamId;
          sfMatch.homeTeamName = winningTeam ? winningTeam.name : 'Pemenang';
          sfMatch.homeTeamLogo = winningTeam ? winningTeam.logoUrl : '';
        } else {
          sfMatch.awayTeamId = winningTeamId;
          sfMatch.awayTeamName = winningTeam ? winningTeam.name : 'Pemenang';
          sfMatch.awayTeamLogo = winningTeam ? winningTeam.logoUrl : '';
        }
      }
    } else if (match.matchNumber === 13 || match.matchNumber === 14) {
      const finalMatch = matches.find(m => m.matchNumber === 16);
      const thirdMatch = matches.find(m => m.matchNumber === 15);
      if (match.matchNumber === 13) {
        if (finalMatch) { finalMatch.homeTeamId = winningTeamId; finalMatch.homeTeamName = winningTeam?.name; finalMatch.homeTeamLogo = winningTeam?.logoUrl; }
        if (thirdMatch) { thirdMatch.homeTeamId = losingTeamId; thirdMatch.homeTeamName = losingTeam?.name; thirdMatch.homeTeamLogo = losingTeam?.logoUrl; }
      } else {
        if (finalMatch) { finalMatch.awayTeamId = winningTeamId; finalMatch.awayTeamName = winningTeam?.name; finalMatch.awayTeamLogo = winningTeam?.logoUrl; }
        if (thirdMatch) { thirdMatch.awayTeamId = losingTeamId; thirdMatch.awayTeamName = losingTeam?.name; thirdMatch.awayTeamLogo = losingTeam?.logoUrl; }
      }
    }
  }

  closeModal();
  saveState();
  renderApp();
  alert(`✅ Skor berhasil diperbarui: ${match.homeTeamName} ${match.homeScore} - ${match.awayScore} ${match.awayTeamName} [${match.status}]`);
};

function addMatchEvent(e, matchId) {
  e.preventDefault();
  const match = matches.find(m => m.id === matchId);
  if (!match) return;

  const minute = parseInt(document.getElementById('eventMinute').value);
  const eventType = document.getElementById('eventTypeSelect').value;
  const teamId = document.getElementById('eventTeamSelect').value;
  const playerId = document.getElementById('eventPlayerSelect').value || null;

  const playerObj = playerId ? players.find(p => p.id === playerId) : null;
  const playerFullName = playerObj ? playerObj.fullName : 'Pemain tidak terdaftar';

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

  if (match.status === 'SCHEDULED') match.status = 'LIVE';
  saveState();
  renderApp();
}

function finishMatch(matchId) {
  const match = matches.find(m => m.id === matchId);
  if (!match) return;

  match.status = 'FINISHED';

  // AUTOMATIC KNOCKOUT WINNER ADVANCEMENT LOGIC
  const winningTeamId = match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId;
  const losingTeamId = match.homeScore > match.awayScore ? match.awayTeamId : match.homeTeamId;

  const winningTeam = teams.find(t => t.id === winningTeamId);
  const losingTeam = teams.find(t => t.id === losingTeamId);

  // Advance winner from Round of 16 (Match 1 - 8) -> Quarter Finals (Match 9 - 12)
  if (match.matchNumber >= 1 && match.matchNumber <= 8) {
    const qfMatchNumber = 8 + Math.ceil(match.matchNumber / 2);
    const qfMatch = matches.find(m => m.matchNumber === qfMatchNumber);
    if (qfMatch) {
      if (match.matchNumber % 2 === 1) {
        qfMatch.homeTeamId = winningTeamId;
        qfMatch.homeTeamName = winningTeam ? winningTeam.name : 'Pemenang';
        qfMatch.homeTeamLogo = winningTeam ? winningTeam.logoUrl : '';
      } else {
        qfMatch.awayTeamId = winningTeamId;
        qfMatch.awayTeamName = winningTeam ? winningTeam.name : 'Pemenang';
        qfMatch.awayTeamLogo = winningTeam ? winningTeam.logoUrl : '';
      }
    }
  }

  // Advance winner from Quarter Finals (Match 9 - 12) -> Semi Finals (Match 13 - 14)
  if (match.matchNumber >= 9 && match.matchNumber <= 12) {
    const sfMatchNumber = 12 + Math.ceil((match.matchNumber - 8) / 2);
    const sfMatch = matches.find(m => m.matchNumber === sfMatchNumber);
    if (sfMatch) {
      if ((match.matchNumber - 8) % 2 === 1) {
        sfMatch.homeTeamId = winningTeamId;
        sfMatch.homeTeamName = winningTeam ? winningTeam.name : 'Pemenang';
        sfMatch.homeTeamLogo = winningTeam ? winningTeam.logoUrl : '';
      } else {
        sfMatch.awayTeamId = winningTeamId;
        sfMatch.awayTeamName = winningTeam ? winningTeam.name : 'Pemenang';
        sfMatch.awayTeamLogo = winningTeam ? winningTeam.logoUrl : '';
      }
    }
  }

  // Advance winner from Semi Finals (Match 13 & 14) -> Grand Final (Match 16) & 3rd Place (Match 15)
  if (match.matchNumber === 13 || match.matchNumber === 14) {
    const finalMatch = matches.find(m => m.matchNumber === 16);
    const thirdMatch = matches.find(m => m.matchNumber === 15);

    if (match.matchNumber === 13) {
      if (finalMatch) { finalMatch.homeTeamId = winningTeamId; finalMatch.homeTeamName = winningTeam?.name; finalMatch.homeTeamLogo = winningTeam?.logoUrl; }
      if (thirdMatch) { thirdMatch.homeTeamId = losingTeamId; thirdMatch.homeTeamName = losingTeam?.name; thirdMatch.homeTeamLogo = losingTeam?.logoUrl; }
    } else {
      if (finalMatch) { finalMatch.awayTeamId = winningTeamId; finalMatch.awayTeamName = winningTeam?.name; finalMatch.awayTeamLogo = winningTeam?.logoUrl; }
      if (thirdMatch) { thirdMatch.awayTeamId = losingTeamId; thirdMatch.awayTeamName = losingTeam?.name; thirdMatch.awayTeamLogo = losingTeam?.logoUrl; }
    }
  }

  saveState();
  renderApp();
  alert(`Match #${match.matchNumber} (${match.homeTeamName} vs ${match.awayTeamName}) selesai! ${winningTeam ? winningTeam.name : 'Pemenang'} melaju ke babak berikutnya di bagan Knockout.`);
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

function trigger16TeamDrawingUI() {
  const res = execute16TeamKnockoutDraw(teams);
  if (!res.success) {
    alert(res.message);
    return;
  }

  matches = res.matches;
  saveState();
  renderApp();

  const visualizer = document.getElementById('adminDrawingVisualizer');
  if (visualizer) {
    visualizer.innerHTML = `
      <div class="p-4 rounded-xl bg-slate-900 border border-cyan-400/40">
        <span class="text-xs font-bold text-emerald-400 block mb-2">🎉 ${res.message}</span>
        <p class="text-xs text-slate-300">16 Tim telah acak diundi ke dalam 8 Pertandingan Babak 16 Besar (Octofinals). Silakan periksa bagan Knockout di Visitor View.</p>
      </div>
    `;
  }
}

function resetTournamentData() {
  if (confirm('Reset data ke awal?\n\nSemua skor, event, dan perubahan akan dihapus.\nSemua pertandingan kembali ke status SCHEDULED (0-0).\nBagan QF/SF/Final kembali ke "Pemenang Match #X".')) {
    localStorage.clear();
    // Reload halaman agar JS module di-import ulang dari server (bersih dari cache)
    location.reload(true);
  }
}

function hardResetAndReload() {
  if (confirm('🗑️ Hard Reset Total?\n\nIni akan menghapus SEMUA data localStorage dan reload halaman.\nBagan akan kembali ke kondisi awal: semua 0-0, SCHEDULED.')) {
    localStorage.clear();
    sessionStorage.clear();
    location.reload(true);
  }
}

function openEditTeamModal(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (!team) return;

  openModal(`
    <h3 class="text-xl font-bold text-white mb-1">✏️ Edit Info Tim</h3>
    <p class="text-sm text-slate-400 mb-5">Perbarui informasi tim <strong class="text-cyan-300">${team.name}</strong></p>
    <form onsubmit="handleEditTeamSubmit(event, '${teamId}')" class="space-y-4">
      <div>
        <label class="form-label">Nama Tim <span class="text-rose-400">*</span></label>
        <input type="text" id="editTeamName" class="form-input" value="${team.name}" placeholder="Contoh: POR FC FKIP UMS" required>
      </div>
      <div>
        <label class="form-label">Fakultas / Unit UMS <span class="text-rose-400">*</span></label>
        <input type="text" id="editTeamFaculty" class="form-input" value="${team.facultyUnit}" placeholder="Contoh: FKIP UMS" required>
      </div>
      <div>
        <label class="form-label">Nama Manager Tim <span class="text-rose-400">*</span></label>
        <input type="text" id="editTeamManager" class="form-input" value="${team.managerName}" placeholder="Nama Lengkap" required>
      </div>
      <div>
        <label class="form-label">No WhatsApp Manager</label>
        <input type="text" id="editTeamPhone" class="form-input" value="${team.managerPhone || ''}" placeholder="0812xxxxxxxx">
      </div>
      <div>
        <label class="form-label">Logo Tim (Seed Identicon)</label>
        <div class="flex gap-3 items-center">
          <img id="editLogoPreview" src="${team.logoUrl}" style="width:48px;height:48px;border-radius:50%;border:2px solid rgba(34,211,238,0.4);background:#111;">
          <div class="flex-1">
            <input type="text" id="editTeamLogoSeed" class="form-input" value="${(team.logoUrl.match(/seed=([^&]+)/) || ['',''])[1]}" placeholder="Kata unik logo, misal: PORFKIP2026" oninput="document.getElementById('editLogoPreview').src='https://api.dicebear.com/7.x/identicon/svg?seed='+this.value">
            <p class="text-xs text-slate-500 mt-1">Ganti kata unik ini untuk mengubah logo identicon tim.</p>
          </div>
        </div>
      </div>
      <div class="p-3 rounded-lg" style="background: rgba(34,211,238,0.05); border: 1px solid rgba(34,211,238,0.2);">
        <p class="text-xs text-slate-300">💡 Perubahan nama tim akan langsung terlihat di bagan turnamen dan Match Center.</p>
      </div>
      <div class="flex gap-3 pt-1">
        <button type="submit" class="btn-ucl-primary flex-1" style="justify-content: center;">💾 Simpan Perubahan</button>
        <button type="button" onclick="closeModal()" class="btn-ucl-secondary" style="padding: 10px 16px;">Batal</button>
      </div>
    </form>
  `);
}

window.handleEditTeamSubmit = function(e, teamId) {
  e.preventDefault();
  const team = teams.find(t => t.id === teamId);
  if (!team) return;

  const newName = document.getElementById('editTeamName').value.trim();
  const newFaculty = document.getElementById('editTeamFaculty').value.trim();
  const newManager = document.getElementById('editTeamManager').value.trim();
  const newPhone = document.getElementById('editTeamPhone').value.trim();
  const newLogoSeed = document.getElementById('editTeamLogoSeed').value.trim();

  if (!newName || !newFaculty || !newManager) {
    alert('Nama tim, fakultas/unit, dan nama manager wajib diisi.');
    return;
  }

  const oldName = team.name;
  team.name = newName;
  team.facultyUnit = newFaculty;
  team.managerName = newManager;
  team.managerPhone = newPhone || team.managerPhone;
  if (newLogoSeed) {
    team.logoUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(newLogoSeed)}`;
  }

  // Sync nama tim di semua data matches (homeTeamName / awayTeamName)
  matches.forEach(m => {
    if (m.homeTeamId === teamId) {
      m.homeTeamName = newName;
      m.homeTeamLogo = team.logoUrl;
    }
    if (m.awayTeamId === teamId) {
      m.awayTeamName = newName;
      m.awayTeamLogo = team.logoUrl;
    }
  });

  closeModal();
  saveState();
  renderApp();
  alert(`✅ Info tim berhasil diperbarui!\n"${oldName}" → "${newName}"`);
};

// ----------------------------------------------------
// MODALS
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
    status: 'APPROVED'
  };

  teams.push(newTeam);
  saveState();
  closeModal();
  renderApp();
  alert(`Tim ${name} berhasil terdaftar!`);
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

  const duplicateJersey = players.some(p => p.teamId === teamId && p.jerseyNumber === jerseyNumber);
  if (duplicateJersey) {
    alert(`Nomor punggung #${jerseyNumber} sudah dipakai oleh pemain lain di tim ini!`);
    return;
  }

  players.push({
    id: 'p-' + Date.now(),
    teamId,
    fullName,
    identityNumber,
    position,
    jerseyNumber,
    photoProfileUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(fullName)}`
  });

  saveState();
  closeModal();
  renderApp();
};

function deletePlayer(playerId) {
  if (confirm('Hapus pemain ini dari skuad?')) {
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
    alert(`Tim ini sudah memiliki ${role === 'HEAD_COACH' ? 'Head Coach' : 'Official Tim'}.`);
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

  const homeTeamPlayers = match.homeTeamId ? players.filter(p => p.teamId === match.homeTeamId) : [];
  const awayTeamPlayers = match.awayTeamId ? players.filter(p => p.teamId === match.awayTeamId) : [];

  openModal(`
    <div class="p-4" style="background: white; color: black; border-radius: 12px;">
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
        <h2 style="font-size: 18px; font-weight: 800; text-transform: uppercase;">LAPORAN RESMI PERTANDINGAN (MATCH SHEET)</h2>
        <h3 style="font-size: 14px; font-weight: 700; color: #003366;">DIES NATALIS UMS 2026 MINISOCCER (SISTEM KNOCKOUT 16 TIM)</h3>
        <p style="font-size: 11px;">Stadion UMS | Match #${match.matchNumber} (${match.stage}) | Pitch: ${match.pitchLocation}</p>
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
