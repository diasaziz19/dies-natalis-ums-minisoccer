/**
 * Main Application Logic
 * Dies Natalis UMS 2026 Minisoccer Tournament System (16-Team Knockout)
 */

import { INITIAL_TEAMS, INITIAL_PLAYERS, INITIAL_OFFICIALS, INITIAL_MATCHES, ADMIN_CREDENTIALS, MANAGER_CREDENTIALS } from './src/lib/mockData.js';
import { execute16TeamKnockoutDraw } from './src/lib/drawingEngine.js';
import { evaluatePlayerSuspensions } from './src/lib/cardAccumulation.js';

// ========== STATE ==========
let currentRole = 'VISITOR';
let currentVisitorTab = 'bracket';
let currentAdminTab = 'matchcenter';
let activeRefereeMatchId = null;
let draggedTeamInfo = null;

// Drawing Engine State
let drawnSlots = JSON.parse(localStorage.getItem('ums_drawn_slots')) || []; // [{ matchNumber, teamType: 'home'|'away', teamId }]
let isSpinning = false;
let currentWheelAngle = 0;

// Auth State
let authState = JSON.parse(sessionStorage.getItem('ums_auth')) || {
  isLoggedIn: false,
  role: 'GUEST', // 'GUEST', 'MANAGER', 'ADMIN'
  teamId: null,
  displayName: null
};

// Data
let teams = JSON.parse(localStorage.getItem('ums_teams')) || INITIAL_TEAMS;
let players = JSON.parse(localStorage.getItem('ums_players')) || INITIAL_PLAYERS;
let officials = JSON.parse(localStorage.getItem('ums_officials')) || INITIAL_OFFICIALS;
let matches = JSON.parse(localStorage.getItem('ums_matches')) || INITIAL_MATCHES;

function saveState() {
  localStorage.setItem('ums_teams', JSON.stringify(teams));
  localStorage.setItem('ums_players', JSON.stringify(players));
  localStorage.setItem('ums_officials', JSON.stringify(officials));
  localStorage.setItem('ums_matches', JSON.stringify(matches));
  localStorage.setItem('ums_drawn_slots', JSON.stringify(drawnSlots));
  sessionStorage.setItem('ums_auth', JSON.stringify(authState));
}

// ========== WINDOW BINDINGS ==========
window.switchRole = switchRole;
window.switchVisitorTab = switchVisitorTab;
window.switchAdminTab = switchAdminTab;
window.handleUnifiedLogin = handleUnifiedLogin;
window.handleLogout = handleLogout;
window.openRegisterTeamModal = openRegisterTeamModal;
window.openEditTeamModal = openEditTeamModal;
window.openUploadSuratTugasModal = openUploadSuratTugasModal;
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

// Drag & Drop Window Bindings
window.handleTeamDragStart = handleTeamDragStart;
window.handleTeamDragOver = handleTeamDragOver;
window.handleTeamDragLeave = handleTeamDragLeave;
window.handleTeamDrop = handleTeamDrop;

// Drawing Wheel Window Bindings
window.spinDrawingWheel = spinDrawingWheel;
window.quickAutoDrawAll = quickAutoDrawAll;
window.resetDrawingState = resetDrawingState;
window.removeDrawnTeam = removeDrawnTeam;
window.applyDrawingToBracket = applyDrawingToBracket;

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  renderApp();
});

// ========== DRAG & DROP FOR ROUND OF 16 BRACKET (SUPER ADMIN ONLY) ==========
function handleTeamDragStart(e, matchId, teamType) {
  if (authState.role !== 'ADMIN') return;
  draggedTeamInfo = { matchId, teamType };
  e.dataTransfer.setData('text/plain', JSON.stringify({ matchId, teamType }));
  e.currentTarget.style.opacity = '0.4';
}

function handleTeamDragOver(e) {
  if (authState.role !== 'ADMIN') return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}

function handleTeamDragLeave(e) {
  if (authState.role !== 'ADMIN') return;
  e.currentTarget.classList.remove('drag-over');
}

function handleTeamDrop(e, targetMatchId, targetTeamType) {
  if (authState.role !== 'ADMIN') return;
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');

  if (!draggedTeamInfo) return;
  const sourceMatchId = draggedTeamInfo.matchId;
  const sourceTeamType = draggedTeamInfo.teamType;

  // Same slot
  if (sourceMatchId === targetMatchId && sourceTeamType === targetTeamType) return;

  const sourceMatch = matches.find(m => m.id === sourceMatchId);
  const targetMatch = matches.find(m => m.id === targetMatchId);
  if (!sourceMatch || !targetMatch) return;

  // Read Source Team Data
  const sourceId = sourceTeamType === 'home' ? sourceMatch.homeTeamId : sourceMatch.awayTeamId;
  const sourceName = sourceTeamType === 'home' ? sourceMatch.homeTeamName : sourceMatch.awayTeamName;
  const sourceLogo = sourceTeamType === 'home' ? sourceMatch.homeTeamLogo : sourceMatch.awayTeamLogo;

  // Read Target Team Data
  const targetId = targetTeamType === 'home' ? targetMatch.homeTeamId : targetMatch.awayTeamId;
  const targetName = targetTeamType === 'home' ? targetMatch.homeTeamName : targetMatch.awayTeamName;
  const targetLogo = targetTeamType === 'home' ? targetMatch.homeTeamLogo : targetMatch.awayTeamLogo;

  // Swap Source with Target
  if (sourceTeamType === 'home') {
    sourceMatch.homeTeamId = targetId;
    sourceMatch.homeTeamName = targetName;
    sourceMatch.homeTeamLogo = targetLogo;
  } else {
    sourceMatch.awayTeamId = targetId;
    sourceMatch.awayTeamName = targetName;
    sourceMatch.awayTeamLogo = targetLogo;
  }

  // Swap Target with Source
  if (targetTeamType === 'home') {
    targetMatch.homeTeamId = sourceId;
    targetMatch.homeTeamName = sourceName;
    targetMatch.homeTeamLogo = sourceLogo;
  } else {
    targetMatch.awayTeamId = sourceId;
    targetMatch.awayTeamName = sourceName;
    targetMatch.awayTeamLogo = sourceLogo;
  }

  draggedTeamInfo = null;
  saveState();
  renderApp();
}

// ========== AUTH SYSTEM ==========
function handleUnifiedLogin(e) {
  e.preventDefault();
  const u = document.getElementById('unifiedUsername').value.trim();
  const p = document.getElementById('unifiedPassword').value;
  const errEl = document.getElementById('unifiedLoginError');

  // 1. Check Super Admin Credentials
  if (u === ADMIN_CREDENTIALS.username && p === ADMIN_CREDENTIALS.password) {
    authState = {
      isLoggedIn: true,
      role: 'ADMIN',
      teamId: null,
      displayName: 'Super Admin'
    };
    saveState();
    if (errEl) errEl.classList.add('hidden');
    switchRole('ADMIN');
    return;
  }

  // 2. Check Team Manager Credentials
  const cred = MANAGER_CREDENTIALS.find(c => c.username === u && c.password === p);
  if (cred) {
    const teamObj = teams.find(t => t.id === cred.teamId);
    authState = {
      isLoggedIn: true,
      role: 'MANAGER',
      teamId: cred.teamId,
      displayName: cred.displayName || (teamObj ? teamObj.name : 'Manajer Tim')
    };
    saveState();
    if (errEl) errEl.classList.add('hidden');
    switchRole('TEAM_MANAGER');
    return;
  }

  // Failed
  if (errEl) errEl.classList.remove('hidden');
}

function handleLogout() {
  authState = {
    isLoggedIn: false,
    role: 'GUEST',
    teamId: null,
    displayName: null
  };
  saveState();
  switchRole('VISITOR');
}

// ========== NAVIGATION ==========
function switchRole(role) {
  // Security guard for ADMIN roles
  if ((role === 'ADMIN' || role === 'MATCH_CENTER' || role === 'DRAWING') && authState.role !== 'ADMIN') {
    switchRole('LOGIN');
    return;
  }

  currentRole = role;

  // Update Nav selector badges
  document.querySelectorAll('#roleSelectorContainer .role-badge').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-role') === role);
  });

  // Admin-only Top Nav Badges
  const matchNavBtn = document.getElementById('navMatchCenterBtn');
  const drawNavBtn = document.getElementById('navDrawingBtn');
  if (matchNavBtn) matchNavBtn.classList.toggle('hidden', authState.role !== 'ADMIN');
  if (drawNavBtn) drawNavBtn.classList.toggle('hidden', authState.role !== 'ADMIN');

  // Update Login Nav Badge Text
  const loginNavBtn = document.getElementById('navLoginBtn');
  if (loginNavBtn) {
    if (authState.isLoggedIn) {
      loginNavBtn.innerHTML = `👤 ${authState.displayName} (${authState.role === 'ADMIN' ? 'Admin' : 'Manager'}) <button onclick="event.stopPropagation(); handleLogout();" class="text-rose-400 font-bold ml-1 hover:underline">Logout</button>`;
    } else {
      loginNavBtn.innerHTML = `🔑 Login / Akun`;
    }
  }

  // Hide all views, show active
  document.querySelectorAll('.app-view').forEach(el => el.classList.add('hidden'));
  const activeView = document.getElementById(`view-${role}`);
  if (activeView) activeView.classList.remove('hidden');

  renderApp();
}

function switchVisitorTab(tabName) {
  currentVisitorTab = tabName;
  document.querySelectorAll('#view-VISITOR .tab-btn').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('#view-VISITOR .vtab-content').forEach(el => el.classList.add('hidden'));
  
  const activeTabBtn = document.querySelector(`#view-VISITOR .tab-btn[onclick*="${tabName}"]`);
  if (activeTabBtn) activeTabBtn.classList.add('active');
  const activeContent = document.getElementById(`vtab-${tabName}`);
  if (activeContent) activeContent.classList.remove('hidden');

  renderVisitorTabContent();
}

function switchAdminTab(tabName) {
  currentAdminTab = tabName;
  ['matchcenter', 'manage'].forEach(t => {
    const tabBtn = document.getElementById(`adminTab-${t}`);
    const content = document.getElementById(`adminContent-${t}`);
    if (tabBtn) tabBtn.classList.toggle('active', t === tabName);
    if (content) content.classList.toggle('hidden', t !== tabName);
  });
  if (tabName === 'matchcenter') renderRefereePortal();
  if (tabName === 'manage') renderAdminManagePanel();
}

// ========== RENDER APP ==========
function renderApp() {
  players = evaluatePlayerSuspensions(players, matches);
  saveState();

  if (currentRole === 'VISITOR') {
    renderVisitorTabContent();
  } else if (currentRole === 'TEAM_MANAGER') {
    renderTeamManagerPortal();
  } else if (currentRole === 'ADMIN') {
    renderAdminPortal();
  } else if (currentRole === 'MATCH_CENTER') {
    renderRefereePortal();
  } else if (currentRole === 'DRAWING') {
    renderDrawingEnginePortal();
  }
}

// ========== 1. BERANDA (VISITOR) ==========
function renderVisitorTabContent() {
  if (currentVisitorTab === 'bracket') renderKnockoutBracket();
  else if (currentVisitorTab === 'livescore') renderLiveScore();
  else if (currentVisitorTab === 'matches') renderVisitorMatches();
  else if (currentVisitorTab === 'stats') renderVisitorStats();
  else if (currentVisitorTab === 'teams') renderPublicTeamsGrid();
}

// VISUAL KNOCKOUT BRACKET TREE
function renderKnockoutBracket() {
  const container = document.getElementById('knockoutBracketContainer');
  const noticeEl = document.getElementById('adminDragNotice');

  if (noticeEl) {
    noticeEl.classList.toggle('hidden', authState.role !== 'ADMIN');
  }

  if (!container) return;

  const r16Matches = matches.filter(m => m.stage === 'ROUND_OF_16');
  const qfMatches = matches.filter(m => m.stage === 'QUARTER_FINAL');
  const sfMatches = matches.filter(m => m.stage === 'SEMI_FINAL');
  const finalMatch = matches.find(m => m.stage === 'FINAL');
  const thirdMatch = matches.find(m => m.stage === 'THIRD_PLACE');

  container.innerHTML = `
    <!-- Round 1: 16 Besar -->
    <div class="bracket-round">
      <div class="bracket-round-header">16 Besar (Round of 16)</div>
      ${r16Matches.map(m => renderBracketCardHTML(m, null, true)).join('')}
    </div>

    <!-- Round 2: Perempat Final -->
    <div class="bracket-round">
      <div class="bracket-round-header">Perempat Final</div>
      ${qfMatches.map(m => renderBracketCardHTML(m)).join('')}
    </div>

    <!-- Round 3: Semi Final -->
    <div class="bracket-round">
      <div class="bracket-round-header">Semi Final</div>
      ${sfMatches.map(m => renderBracketCardHTML(m)).join('')}
    </div>

    <!-- Round 4: Grand Final & Juara 3 -->
    <div class="bracket-round">
      <div class="bracket-round-header" style="background: rgba(255, 215, 0, 0.2); border-color: var(--ucl-gold); color: var(--ucl-gold);">🏆 Grand Final &amp; Juara 3</div>
      ${finalMatch ? renderBracketCardHTML(finalMatch, '🏆 GRAND FINAL') : ''}
      ${thirdMatch ? renderBracketCardHTML(thirdMatch, '🥉 PEREBUTAN JUARA 3') : ''}
    </div>
  `;
}

function renderBracketCardHTML(m, customLabel = null, allowDrag = false) {
  const isLive = m.status === 'LIVE';
  const isFinished = m.status === 'FINISHED';
  const homeWinner = isFinished && m.homeScore > m.awayScore;
  const awayWinner = isFinished && m.awayScore > m.homeScore;
  const isAdmin = authState.role === 'ADMIN' && allowDrag;

  const homeDragAttrs = isAdmin ? `draggable="true" ondragstart="handleTeamDragStart(event, '${m.id}', 'home')" ondragover="handleTeamDragOver(event)" ondragleave="handleTeamDragLeave(event)" ondrop="handleTeamDrop(event, '${m.id}', 'home')" title="👑 Super Admin: Tarik (drag) untuk menukar posisi tim ini"` : '';
  const awayDragAttrs = isAdmin ? `draggable="true" ondragstart="handleTeamDragStart(event, '${m.id}', 'away')" ondragover="handleTeamDragOver(event)" ondragleave="handleTeamDragLeave(event)" ondrop="handleTeamDrop(event, '${m.id}', 'away')" title="👑 Super Admin: Tarik (drag) untuk menukar posisi tim ini"` : '';

  return `
    <div class="bracket-card ${isLive ? 'is-live' : isFinished ? 'is-finished' : ''}">
      <div class="bracket-card-header">
        <span>${customLabel || `Match #${m.matchNumber}`}</span>
        <span style="font-weight:700; color: ${isLive ? '#22c55e' : isFinished ? '#f59e0b' : '#94a3b8'};">
          ${isLive ? '🔴 LIVE' : isFinished ? 'SELESAI' : 'SCHEDULED'}
        </span>
      </div>
      
      <!-- Home Team Slot -->
      <div class="bracket-team-slot ${homeWinner ? 'is-winner' : ''} ${isAdmin ? 'is-draggable' : ''}" ${homeDragAttrs}>
        <div class="bracket-team-name">
          ${isAdmin ? '<span class="text-xs text-cyan-400">⋮⋮</span>' : ''}
          <img src="${m.homeTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(m.homeTeamName)}" style="width:18px;height:18px;border-radius:50%;background:#111;">
          <span title="${m.homeTeamName}">${m.homeTeamName}</span>
        </div>
        <span class="bracket-score-badge">${m.homeScore}</span>
      </div>

      <!-- Away Team Slot -->
      <div class="bracket-team-slot ${awayWinner ? 'is-winner' : ''} ${isAdmin ? 'is-draggable' : ''}" ${awayDragAttrs}>
        <div class="bracket-team-name">
          ${isAdmin ? '<span class="text-xs text-cyan-400">⋮⋮</span>' : ''}
          <img src="${m.awayTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(m.awayTeamName)}" style="width:18px;height:18px;border-radius:50%;background:#111;">
          <span title="${m.awayTeamName}">${m.awayTeamName}</span>
        </div>
        <span class="bracket-score-badge">${m.awayScore}</span>
      </div>
    </div>
  `;
}

function renderLiveScore() {
  const container = document.getElementById('liveScoreContainer');
  if (!container) return;

  container.innerHTML = matches.map(m => {
    const statusColor = m.status === 'LIVE' ? '#22c55e' : m.status === 'FINISHED' ? '#f59e0b' : '#64748b';
    const statusLabel = m.status === 'LIVE' ? '🔴 LIVE' : m.status === 'FINISHED' ? '✅ Selesai' : '⏳ Belum Mulai';
    const scoreStyle = m.status === 'LIVE' ? 'color:#22c55e; text-shadow: 0 0 12px rgba(34,197,94,0.5);' : 'color:#22d3ee;';

    return `
      <div class="glass-panel p-5" style="${m.status === 'LIVE' ? 'border: 1px solid rgba(34,197,94,0.4); box-shadow: 0 0 20px rgba(34,197,94,0.1);' : ''}">
        <div class="flex justify-between items-center mb-3">
          <span class="text-xs font-bold text-cyan-400">Match #${m.matchNumber} | ${m.stage.replace(/_/g, ' ')}</span>
          <span style="font-size:11px; font-weight:700; color:${statusColor}; background:${statusColor}22; padding:2px 8px; border-radius:999px; border:1px solid ${statusColor}55;">${statusLabel}</span>
        </div>
        <div class="flex justify-between items-center">
          <div class="text-center flex-1">
            <img src="${m.homeTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(m.homeTeamName)}" style="width:40px;height:40px;border-radius:50%;margin:0 auto 6px;background:#111;border:2px solid #334155;">
            <span class="font-bold text-white text-xs block">${m.homeTeamName}</span>
          </div>
          <div class="text-center px-4">
            <span class="font-black text-3xl font-mono" style="${scoreStyle}">${m.homeScore} - ${m.awayScore}</span>
            <span class="block text-xs text-slate-500 mt-1">${m.kickoffTime}</span>
          </div>
          <div class="text-center flex-1">
            <img src="${m.awayTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(m.awayTeamName)}" style="width:40px;height:40px;border-radius:50%;margin:0 auto 6px;background:#111;border:2px solid #334155;">
            <span class="font-bold text-white text-xs block">${m.awayTeamName}</span>
          </div>
        </div>
        ${m.status === 'LIVE' && (m.events || []).length > 0 ? `
          <div class="mt-3 pt-3 border-t border-slate-800">
            ${(m.events || []).slice(-3).map(e => `<div class="text-xs text-slate-300"><span class="text-cyan-400 font-mono font-bold">${e.minute}'</span> ${e.eventType === 'GOAL' ? '⚽' : e.eventType === 'PENALTY_GOAL' ? '⚽P' : e.eventType === 'OWN_GOAL' ? '⚽OG' : '🟨'} ${e.playerFullName || '-'}</div>`).join('')}
          </div>` : ''}
      </div>
    `;
  }).join('');
}

function renderVisitorMatches() {
  const container = document.getElementById('matchesListContainer');
  if (!container) return;
  const filterEl = document.getElementById('matchFilterStatus');
  const filter = filterEl ? filterEl.value : 'ALL';
  const filtered = filter === 'ALL' ? matches : matches.filter(m => m.status === filter);

  container.innerHTML = filtered.map(m => {
    const statusColor = m.status === 'LIVE' ? '#22c55e' : m.status === 'FINISHED' ? '#f59e0b' : '#64748b';
    return `
      <div class="glass-panel p-5">
        <div class="flex justify-between items-center mb-2">
          <span class="badge-cyan text-xs">Match #${m.matchNumber} | ${m.stage.replace(/_/g, ' ')}</span>
          <span style="font-size:11px; font-weight:700; color:${statusColor};">${m.status}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="font-bold text-white text-sm">${m.homeTeamName}</span>
          <span class="font-black text-xl text-cyan-400 font-mono">${m.homeScore} - ${m.awayScore}</span>
          <span class="font-bold text-white text-sm text-right">${m.awayTeamName}</span>
        </div>
        <div class="text-xs text-slate-500 mt-2">📍 ${m.pitchLocation} | 🕐 ${m.kickoffTime}</div>
      </div>
    `;
  }).join('');
}

function renderVisitorStats() {
  // Top Scorers
  const goalCounts = {};
  matches.forEach(m => {
    (m.events || []).forEach(e => {
      if (e.eventType === 'GOAL' || e.eventType === 'PENALTY_GOAL') {
        goalCounts[e.playerFullName] = goalCounts[e.playerFullName] || { name: e.playerFullName, goals: 0, teamId: e.teamId };
        goalCounts[e.playerFullName].goals++;
      }
    });
  });
  const topScorers = Object.values(goalCounts).sort((a, b) => b.goals - a.goals).slice(0, 10);
  const scorerEl = document.getElementById('topScorersList');
  if (scorerEl) {
    scorerEl.innerHTML = topScorers.length === 0 ? '<p class="text-xs text-slate-400">Belum ada gol tercatat.</p>' :
      topScorers.map((a, idx) => {
        const tObj = teams.find(t => t.id === a.teamId);
        return `
          <div class="flex justify-between items-center p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div class="flex items-center gap-3">
              <span class="font-bold text-cyan-400 text-sm">#${idx + 1}</span>
              <div>
                <span class="font-bold text-white text-sm block">${a.name}</span>
                <span class="text-xs text-slate-400">${tObj?.name || ''}</span>
              </div>
            </div>
            <span class="badge-gold">${a.goals} Gol</span>
          </div>
        `;
      }).join('');
  }

  // Top Assists
  const assistCounts = {};
  matches.forEach(m => {
    (m.events || []).forEach(e => {
      if (e.eventType === 'ASSIST') {
        assistCounts[e.playerFullName] = assistCounts[e.playerFullName] || { name: e.playerFullName, assists: 0, teamId: e.teamId };
        assistCounts[e.playerFullName].assists++;
      }
    });
  });
  const topAssists = Object.values(assistCounts).sort((a, b) => b.assists - a.assists).slice(0, 10);
  const assistEl = document.getElementById('topAssistsList');
  if (assistEl) {
    assistEl.innerHTML = topAssists.length === 0 ? '<p class="text-xs text-slate-400">Belum ada assist tercatat.</p>' :
      topAssists.map((a, idx) => {
        const tObj = teams.find(t => t.id === a.teamId);
        return `
          <div class="flex justify-between items-center p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div class="flex items-center gap-3">
              <span class="font-bold text-cyan-400 text-sm">#${idx + 1}</span>
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

  // Discipline
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
        <img src="${t.logoUrl}" style="width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 12px; background: #000; padding: 4px; border: 2px solid var(--ucl-cyan);">
        <h3 class="font-bold text-white text-base mb-1">${t.name}</h3>
        <span class="text-xs text-cyan-400 block mb-3">${t.facultyUnit}</span>
        <div class="text-xs text-slate-400 pt-3 border-t border-slate-800 space-y-1">
          <div>👥 <strong>${tPlayers.length}</strong> Pemain</div>
          <div>👨‍💼 Coach: <strong>${headCoach?.fullName || 'Belum diisi'}</strong></div>
          <div>📄 Surat Tugas: <strong>${t.suratTugasName ? '✅ Diupload' : '❌ Belum'}</strong></div>
        </div>
      </div>
    `;
  }).join('');
}

// ========== 2. MANAJEMEN TIM (PUBLIC READ-ONLY + EDITABLE FOR AUTH USERS) ==========
function renderTeamManagerPortal() {
  const container = document.getElementById('managerTeamsContainer');
  const loggedInAsEl = document.getElementById('managerLoggedInAs');
  const actionsEl = document.getElementById('managerHeaderActions');
  const subtitleEl = document.getElementById('managerSubtitleText');

  if (!container) return;

  // Header state
  if (loggedInAsEl) {
    if (!authState.isLoggedIn) {
      loggedInAsEl.textContent = '🌐 Mode Publik: Membaca Seluruh Skuad Tim (Login untuk mengedit)';
    } else if (authState.role === 'ADMIN') {
      loggedInAsEl.textContent = `👑 Status Login: SUPER ADMIN (Akses Edit Seluruh ${teams.length} Tim)`;
    } else {
      loggedInAsEl.textContent = `👤 Status Login: ${authState.displayName} (Akses Edit Tim Terdaftar)`;
    }
  }

  if (subtitleEl) {
    subtitleEl.textContent = 'Daftar resmi seluruh tim peserta, skuad pemain, official, dan berkas verifikasi Surat Tugas.';
  }

  if (actionsEl) {
    if (authState.isLoggedIn) {
      actionsEl.innerHTML = `
        <button class="btn-ucl-primary" onclick="openRegisterTeamModal()">+ Daftarkan Tim Baru</button>
        <button onclick="handleLogout()" style="padding: 8px 14px; font-size: 13px; font-weight: 700; border-radius: 8px; border: 1px solid rgba(239,68,68,0.4); background: rgba(239,68,68,0.1); color: #f87171; cursor: pointer;">🚪 Logout</button>
      `;
    } else {
      actionsEl.innerHTML = `
        <button class="btn-ucl-primary" onclick="switchRole('LOGIN')">🔑 Login Manajer Tim / Admin</button>
      `;
    }
  }

  container.innerHTML = teams.map(team => {
    const isEditable = authState.isLoggedIn && (authState.role === 'ADMIN' || authState.teamId === team.id);
    const teamPlayers = players.filter(p => p.teamId === team.id);
    const teamOfficials = officials.filter(o => o.teamId === team.id);
    const headCoach = teamOfficials.find(o => o.role === 'HEAD_COACH');
    const teamOfficial = teamOfficials.find(o => o.role === 'OFFICIAL');
    const isPlayerFull = teamPlayers.length >= 14;

    return `
      <div class="glass-panel p-6" style="${isEditable ? 'border: 1px solid rgba(0, 240, 255, 0.4); box-shadow: 0 0 20px rgba(0, 240, 255, 0.1);' : ''}">
        <!-- Team Header -->
        <div class="flex justify-between items-start flex-wrap gap-4 mb-6 pb-4 border-b border-slate-800">
          <div class="flex items-center gap-4">
            <img src="${team.logoUrl}" style="width: 56px; height: 56px; border-radius: 50%; background: #000; border: 2px solid rgba(34,211,238,0.4);">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-xl font-bold text-white">${team.name}</h3>
                <span class="badge-${team.status === 'APPROVED' ? 'gold' : team.status === 'REJECTED' ? 'danger' : 'cyan'}">${team.status}</span>
                ${isEditable ? `<span class="badge-cyan text-xs">✏️ Skuad Anda (Dapat Diedit)</span>` : ''}
              </div>
              <span class="text-xs text-cyan-400 block mt-1">${team.facultyUnit} | Manager: ${team.managerName} (${team.managerPhone || '-'})</span>
            </div>
          </div>
          
          ${isEditable ? `
            <div class="flex gap-2 flex-wrap">
              <button onclick="openEditTeamModal('${team.id}')" style="padding: 7px 14px; font-size: 12px; font-weight: 700; border-radius: 8px; border: 1px solid rgba(34,211,238,0.4); background: rgba(34,211,238,0.08); color: #22d3ee; cursor: pointer;">✏️ Edit Info Tim</button>
              <button onclick="openUploadSuratTugasModal('${team.id}')" style="padding: 7px 14px; font-size: 12px; font-weight: 700; border-radius: 8px; border: 1px solid rgba(255,215,0,0.4); background: rgba(255,215,0,0.08); color: #ffd700; cursor: pointer;">📄 Upload Surat Tugas</button>
            </div>
          ` : ''}
        </div>

        <!-- Surat Tugas Status Banner -->
        <div class="p-3 rounded-lg mb-6 flex justify-between items-center flex-wrap gap-2" style="background: ${team.suratTugasName ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}; border: 1px solid ${team.suratTugasName ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}">
          <div class="flex items-center gap-2 text-xs">
            <span>${team.suratTugasName ? '📄' : '⚠️'}</span>
            <div>
              <strong class="text-white block">Surat Tugas Dekanat / Unit:</strong>
              <span class="${team.suratTugasName ? 'text-emerald-400 font-mono' : 'text-rose-400'}">${team.suratTugasName || 'Belum diunggah oleh manajer tim'}</span>
            </div>
          </div>
          ${isEditable ? `
            <button onclick="openUploadSuratTugasModal('${team.id}')" class="text-xs font-bold ${team.suratTugasName ? 'text-emerald-300 hover:underline' : 'text-amber-400 hover:underline'}">
              ${team.suratTugasName ? 'Ganti File' : '+ Upload Sekarang'}
            </button>
          ` : ''}
        </div>

        <!-- Squad Roster Section -->
        <div class="mb-6">
          <div class="flex justify-between items-center mb-3 flex-wrap gap-2">
            <h4 class="font-bold text-white text-base flex items-center gap-2">
              <span>🏃 Daftar Pemain Skuad</span>
              <span class="text-xs text-slate-400">(${teamPlayers.length} / 14 Pemain)</span>
            </h4>
            ${isEditable ? `
              <button class="btn-ucl-primary" style="padding: 6px 12px; font-size: 12px;" ${isPlayerFull ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''} onclick="openAddPlayerModal('${team.id}')">
                + Tambah Pemain ${isPlayerFull ? '(Maks 14)' : ''}
              </button>
            ` : ''}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            ${teamPlayers.length === 0 ? '<p class="text-xs text-slate-400 py-4 col-span-3 text-center">Belum ada pemain ditambahkan.</p>' :
              teamPlayers.map(p => `
                <div class="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                  <div class="flex items-center gap-3">
                    <img src="${p.photoProfileUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(p.fullName)}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;">
                    <div>
                      <span class="font-bold text-white text-sm block">${p.fullName}</span>
                      <span class="text-xs text-cyan-400 font-semibold block">${p.position} | Usia: ${p.usia || '-'} th</span>
                      <span class="text-xs text-slate-500 block">KTP/NI: ${p.identityNumber}</span>
                      ${p.isSuspended ? `<span class="text-xs text-rose-400 font-bold block">⛔ ${p.suspensionReason}</span>` : ''}
                    </div>
                  </div>
                  ${isEditable ? `<button onclick="deletePlayer('${p.id}')" class="text-xs text-rose-400 hover:text-rose-300 font-bold">Hapus</button>` : ''}
                </div>
              `).join('')}
          </div>
        </div>

        <!-- Officials Section -->
        <div>
          <div class="flex justify-between items-center mb-3">
            <h4 class="font-bold text-white text-base">👨‍💼 Tim Official &amp; Pelatih</h4>
            ${isEditable ? `
              <button class="btn-ucl-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="openAddOfficialModal('${team.id}')">+ Tambah Official / Coach</button>
            ` : ''}
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex justify-between items-center">
              <div>
                <span class="text-xs font-bold text-cyan-400 block">HEAD COACH (Maks 1)</span>
                <span class="font-bold text-white text-sm">${headCoach ? headCoach.fullName : 'Belum diisi'}</span>
                ${headCoach ? `<span class="text-xs text-slate-400 block">NI/KTP: ${headCoach.identityNumber}</span>` : ''}
              </div>
              ${isEditable && headCoach ? `<button onclick="deleteOfficial('${headCoach.id}')" class="text-xs text-rose-400 hover:underline">Hapus</button>` : ''}
            </div>
            <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex justify-between items-center">
              <div>
                <span class="text-xs font-bold text-amber-400 block">OFFICIAL TIM (Maks 1)</span>
                <span class="font-bold text-white text-sm">${teamOfficial ? teamOfficial.fullName : 'Belum diisi'}</span>
                ${teamOfficial ? `<span class="text-xs text-slate-400 block">NI/KTP: ${teamOfficial.identityNumber}</span>` : ''}
              </div>
              ${isEditable && teamOfficial ? `<button onclick="deleteOfficial('${teamOfficial.id}')" class="text-xs text-rose-400 hover:underline">Hapus</button>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ========== 3. INTERACTIVE DRAWING ENGINE PORTAL (SUPER ADMIN ONLY) ==========
function renderDrawingEnginePortal() {
  renderDrawingWheelCanvas();
  renderDrawingPoolAndSlots();
}

function getNextSlotInfo() {
  const drawnCount = drawnSlots.length;
  if (drawnCount >= 16) return null;
  const matchNum = Math.floor(drawnCount / 2) + 1;
  const teamType = drawnCount % 2 === 0 ? 'Home' : 'Away';
  return { matchNum, teamType, label: `Match #${matchNum} (${teamType})` };
}

function renderDrawingPoolAndSlots() {
  const nextSlot = getNextSlotInfo();
  const targetText = document.getElementById('nextTargetSlotText');
  if (targetText) {
    targetText.textContent = nextSlot ? nextSlot.label : '🎉 UNDIAN 16 TIM LENGKAP!';
  }

  // 1. Remaining Teams Pool
  const drawnTeamIds = drawnSlots.map(s => s.teamId);
  const remainingTeams = teams.filter(t => !drawnTeamIds.includes(t.id));

  const poolGrid = document.getElementById('remainingTeamsPoolGrid');
  const countBadge = document.getElementById('remainingTeamsCountBadge');
  if (countBadge) countBadge.textContent = `${remainingTeams.length} Tim Tersisa`;

  if (poolGrid) {
    poolGrid.innerHTML = remainingTeams.length === 0
      ? '<p class="text-xs text-emerald-400 py-2 w-full text-center font-bold">🎉 Semua 16 Tim telah diundi ke dalam slot!</p>'
      : remainingTeams.map(t => `
        <div class="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 flex items-center gap-2 text-xs font-bold text-white">
          <img src="${t.logoUrl}" style="width:18px;height:18px;border-radius:50%;">
          <span>${t.name}</span>
        </div>
      `).join('');
  }

  // 2. Drawn Slots Table (Match 1-8 Home/Away)
  const slotsTable = document.getElementById('drawnSlotsTable');
  if (!slotsTable) return;

  const totalR16Slots = 16;
  let html = '';

  for (let i = 0; i < totalR16Slots; i++) {
    const mNum = Math.floor(i / 2) + 1;
    const tType = i % 2 === 0 ? 'Home' : 'Away';
    const drawnItem = drawnSlots[i];
    const teamObj = drawnItem ? teams.find(t => t.id === drawnItem.teamId) : null;

    html += `
      <div class="p-2.5 rounded-lg flex justify-between items-center text-xs" style="background: rgba(15,23,42,0.8); border: 1px solid ${teamObj ? 'rgba(0,240,255,0.3)' : 'rgba(51,65,85,0.4)'}">
        <div class="flex items-center gap-3">
          <span class="font-mono font-bold text-cyan-400" style="min-width: 100px;">Match #${mNum} (${tType})</span>
          ${teamObj ? `
            <div class="flex items-center gap-2 font-bold text-white">
              <img src="${teamObj.logoUrl}" style="width:20px;height:20px;border-radius:50%;">
              <span>${teamObj.name}</span>
            </div>
          ` : `<span class="text-slate-500 italic">⏳ Belum Diundi</span>`}
        </div>
        ${teamObj ? `
          <button onclick="removeDrawnTeam('${teamObj.id}')" class="text-rose-400 font-bold hover:underline" title="Hapus tim ini dari hasil undian">🗑️ Hapus</button>
        ` : ''}
      </div>
    `;
  }

  slotsTable.innerHTML = html;
}

function renderDrawingWheelCanvas() {
  const canvas = document.getElementById('wheelCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cy = height / 2;
  const radius = cx - 10;

  const drawnTeamIds = drawnSlots.map(s => s.teamId);
  const remainingTeams = teams.filter(t => !drawnTeamIds.includes(t.id));

  ctx.clearRect(0, 0, width, height);

  if (remainingTeams.length === 0) {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#22d3ee'; ctx.font = 'bold 16px Outfit, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('UNDIAN LENGKAP', cx, cy);
    return;
  }

  const numSlices = remainingTeams.length;
  const sliceAngle = (Math.PI * 2) / numSlices;
  const colors = ['#00f0ff', '#ffd700', '#10b981', '#ef4444', '#8b5cf6', '#3b82f6', '#f59e0b', '#ec4899'];

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(currentWheelAngle);

  for (let i = 0; i < numSlices; i++) {
    const startAngle = i * sliceAngle;
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.closePath();

    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.strokeStyle = '#070a12';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text Label
    ctx.save();
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 10px Outfit, sans-serif';
    ctx.textAlign = 'right';
    const textName = remainingTeams[i].name.length > 16 ? remainingTeams[i].name.substring(0, 14) + '..' : remainingTeams[i].name;
    ctx.fillText(textName, radius - 15, 4);
    ctx.restore();
  }

  ctx.restore();
}

function spinDrawingWheel() {
  if (isSpinning) return;
  const drawnTeamIds = drawnSlots.map(s => s.teamId);
  const remainingTeams = teams.filter(t => !drawnTeamIds.includes(t.id));

  if (remainingTeams.length === 0) {
    alert('🎉 Seluruh 16 Tim telah diundi!');
    return;
  }

  isSpinning = true;
  const spinBtn = document.getElementById('spinWheelBtn');
  if (spinBtn) { spinBtn.disabled = true; spinBtn.textContent = '🔄 MEMUTAR RODA...'; }

  // Pick random winner index
  const winnerIndex = Math.floor(Math.random() * remainingTeams.length);
  const winningTeam = remainingTeams[winnerIndex];

  const numSlices = remainingTeams.length;
  const sliceAngle = (Math.PI * 2) / numSlices;

  // Calculate target rotation angle so pointer lands on winning sector at top (270 degrees / -PI/2)
  const targetSectorAngle = (winnerIndex + 0.5) * sliceAngle;
  const extraRounds = (4 + Math.floor(Math.random() * 3)) * Math.PI * 2; // 4 to 6 full spins
  const targetTotalAngle = currentWheelAngle + extraRounds + (Math.PI * 1.5 - targetSectorAngle - (currentWheelAngle % (Math.PI * 2)));

  const startAngle = currentWheelAngle;
  const duration = 3500; // 3.5 seconds spin animation
  const startTime = performance.now();

  function animateSpin(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease-out cubic curve
    const easeOut = 1 - Math.pow(1 - progress, 3);
    currentWheelAngle = startAngle + (targetTotalAngle - startAngle) * easeOut;

    renderDrawingWheelCanvas();

    if (progress < 1) {
      requestAnimationFrame(animateSpin);
    } else {
      isSpinning = false;
      if (spinBtn) { spinBtn.disabled = false; spinBtn.textContent = '🎡 SPIN WHEEL (PUTAR UNDIAN)'; }

      // Record slot
      const nextSlot = getNextSlotInfo();
      if (nextSlot) {
        drawnSlots.push({
          matchNumber: nextSlot.matchNum,
          teamType: nextSlot.teamType.toLowerCase(),
          teamId: winningTeam.id
        });
        saveState();
        renderApp();

        openModal(`
          <div class="text-center p-4">
            <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
            <h3 class="text-xs uppercase tracking-widest text-cyan-400 font-bold mb-1">HASIL UNDIAN ${nextSlot.label}</h3>
            <img src="${winningTeam.logoUrl}" style="width:70px;height:70px;border-radius:50%;margin:12px auto;background:#000;border:3px solid var(--ucl-gold);">
            <h2 class="text-2xl font-bold text-white mb-2">${winningTeam.name}</h2>
            <p class="text-sm text-slate-300 mb-6">${winningTeam.facultyUnit}</p>
            <button onclick="closeModal()" class="btn-ucl-primary" style="justify-content: center; width:100%;">Lanjutkan Undian $\rightarrow$</button>
          </div>
        `);
      }
    }
  }

  requestAnimationFrame(animateSpin);
}

function quickAutoDrawAll() {
  if (confirm('🎲 Acak otomatis seluruh sisa tim ke dalam slot 16 Besar secara instant?')) {
    const drawnTeamIds = drawnSlots.map(s => s.teamId);
    let remaining = teams.filter(t => !drawnTeamIds.includes(t.id));
    
    // Shuffle array
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }

    remaining.forEach(t => {
      const nextSlot = getNextSlotInfo();
      if (nextSlot) {
        drawnSlots.push({
          matchNumber: nextSlot.matchNum,
          teamType: nextSlot.teamType.toLowerCase(),
          teamId: t.id
        });
      }
    });

    saveState();
    renderApp();
    alert('🎉 Seluruh 16 Tim berhasil diacak!');
  }
}

function resetDrawingState() {
  if (confirm('🔄 Kosongkan hasil undian roda & reset seluruh slot 16 Besar?')) {
    drawnSlots = [];
    saveState();
    renderApp();
  }
}

function removeDrawnTeam(teamId) {
  drawnSlots = drawnSlots.filter(s => s.teamId !== teamId);
  saveState();
  renderApp();
}

function applyDrawingToBracket() {
  if (drawnSlots.length < 16) {
    if (!confirm(`Undian belum lengkap (baru ${drawnSlots.length}/16 tim terisi). Yakin ingin menerapkan posisi saat ini ke bagan utama?`)) return;
  }

  drawnSlots.forEach(slot => {
    const match = matches.find(m => m.matchNumber === slot.matchNumber && m.stage === 'ROUND_OF_16');
    const teamObj = teams.find(t => t.id === slot.teamId);

    if (match && teamObj) {
      if (slot.teamType === 'home') {
        match.homeTeamId = teamObj.id;
        match.homeTeamName = teamObj.name;
        match.homeTeamLogo = teamObj.logoUrl;
      } else {
        match.awayTeamId = teamObj.id;
        match.awayTeamName = teamObj.name;
        match.awayTeamLogo = teamObj.logoUrl;
      }
    }
  });

  saveState();
  renderApp();
  alert('✅ Hasil undian berhasil diterapkan ke Bagan Utama Turnamen!');
  switchRole('VISITOR');
}

// ========== 4. SUPER ADMIN DASHBOARD & MATCH CENTER ==========
function renderAdminPortal() {
  if (currentAdminTab === 'matchcenter') renderRefereePortal();
  else renderAdminManagePanel();
}

function renderAdminManagePanel() {
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
          <span class="text-xs text-cyan-400">${t.facultyUnit} | Surat Tugas: ${t.suratTugasName ? '✅' : '❌'}</span>
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

function renderRefereePortal() {
  const selectorEl = document.getElementById('refereeMatchSelector') || document.getElementById('refereeMatchSelectorAdmin');
  if (!selectorEl) return;

  selectorEl.innerHTML = matches.map(m => `
    <div class="p-3 rounded-lg bg-slate-900/80 border ${activeRefereeMatchId === m.id ? 'border-cyan-400 bg-slate-800' : 'border-slate-800'} cursor-pointer hover:border-cyan-500" onclick="selectRefereeMatch('${m.id}')">
      <div class="flex justify-between items-center text-xs mb-1">
        <span class="text-cyan-400 font-bold">Match #${m.matchNumber} (${m.stage.replace(/_/g, ' ')})</span>
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
  const panel = document.getElementById('matchCenterActivePanel') || document.getElementById('matchCenterActivePanelAdmin');
  if (!panel || !activeRefereeMatchId) return;
  const match = matches.find(m => m.id === activeRefereeMatchId);
  if (!match) return;

  const homePlayers = match.homeTeamId ? players.filter(p => p.teamId === match.homeTeamId) : [];
  const awayPlayers = match.awayTeamId ? players.filter(p => p.teamId === match.awayTeamId) : [];
  const allPlayersForMatch = homePlayers.concat(awayPlayers);

  const isScheduled = match.status === 'SCHEDULED';
  const isLive = match.status === 'LIVE';
  const isFinished = match.status === 'FINISHED';
  const statusColor = isLive ? '#22c55e' : isFinished ? '#f59e0b' : '#64748b';
  const statusLabel = isLive ? '🔴 LIVE' : isFinished ? '✅ SELESAI' : '⏳ BELUM MULAI';

  panel.innerHTML = `
    <div class="flex justify-between items-start pb-4 border-b border-slate-800 mb-6 flex-wrap gap-3">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="badge-cyan text-xs">Match #${match.matchNumber} | ${match.stage.replace(/_/g, ' ')}</span>
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

    <div class="flex justify-center items-center gap-6 my-5 py-6 rounded-2xl" style="background: linear-gradient(135deg, rgba(0,0,0,0.7), rgba(15,23,42,0.9)); border: 1px solid rgba(100,116,139,0.3);">
      <div class="text-center" style="min-width: 130px;">
        <img src="${match.homeTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(match.homeTeamName)}" style="width: 52px; height: 52px; border-radius: 50%; margin: 0 auto 8px; background: #111; border: 2px solid #334155;">
        <span class="font-bold text-white block text-sm">${match.homeTeamName}</span>
      </div>
      <div class="text-center px-8 py-4 rounded-2xl" style="background: rgba(0,0,0,0.6); border: 1px solid rgba(34,211,238,0.3);">
        <span class="font-black text-5xl font-mono" style="color: #22d3ee; text-shadow: 0 0 20px rgba(34,211,238,0.4);">${match.homeScore} - ${match.awayScore}</span>
        <div class="mt-2 text-xs font-bold" style="color: ${statusColor};">${statusLabel}</div>
      </div>
      <div class="text-center" style="min-width: 130px;">
        <img src="${match.awayTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(match.awayTeamName)}" style="width: 52px; height: 52px; border-radius: 50%; margin: 0 auto 8px; background: #111; border: 2px solid #334155;">
        <span class="font-bold text-white block text-sm">${match.awayTeamName}</span>
      </div>
    </div>

    ${isScheduled ? `<div class="p-4 rounded-xl text-center" style="background: rgba(100,116,139,0.1); border: 1px solid rgba(100,116,139,0.3); margin-bottom: 16px;"><p class="text-slate-400 text-sm">⏳ Pertandingan belum dimulai. Klik <strong class="text-white">"▶ Mulai Pertandingan"</strong> atau <strong class="text-white">"✏️ Edit Skor Manual"</strong>.</p></div>` : ''}

    ${isLive || isFinished ? `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
      <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <h4 class="font-bold text-cyan-400 text-sm mb-3">⚽ + Input Event Pertandingan</h4>
        <form onsubmit="addMatchEvent(event, '${match.id}')" class="space-y-3">
          <div><label class="form-label">Menit</label><input type="number" id="eventMinute" class="form-input" min="1" max="60" value="1" required></div>
          <div><label class="form-label">Tipe Event</label>
            <select id="eventTypeSelect" class="form-input" required>
              <option value="GOAL">⚽ Gol Biasa</option>
              <option value="PENALTY_GOAL">⚽ Gol Penalti</option>
              <option value="OWN_GOAL">⚽ Gol Bunuh Diri</option>
              <option value="YELLOW_CARD">🟨 Kartu Kuning</option>
              <option value="RED_CARD">🟥 Kartu Merah</option>
              <option value="SECOND_YELLOW_RED">🟨🟥 Kartu Kuning Kedua</option>
            </select>
          </div>
          <div><label class="form-label">Tim</label>
            <select id="eventTeamSelect" class="form-input" required>
              <option value="${match.homeTeamId}">${match.homeTeamName}</option>
              <option value="${match.awayTeamId}">${match.awayTeamName}</option>
            </select>
          </div>
          <div><label class="form-label">Pemain (Opsional)</label>
            <select id="eventPlayerSelect" class="form-input">
              <option value="">-- Tidak Ada / Skip --</option>
              ${allPlayersForMatch.map(p => `<option value="${p.id}">${p.fullName} (${p.position})${p.isSuspended ? ' [SUSPENDED]' : ''}</option>`).join('')}
            </select>
          </div>
          <button type="submit" class="btn-ucl-primary w-full" style="justify-content: center;">💾 Simpan Event</button>
        </form>
      </div>
      <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <h4 class="font-bold text-white text-sm mb-3">📋 Timeline Pertandingan</h4>
        <div class="space-y-2 max-h-72 overflow-y-auto">
          ${(match.events || []).length === 0
            ? '<p class="text-xs text-slate-400 py-6 text-center">Belum ada kejadian.</p>'
            : (match.events || []).slice().sort((a,b) => (a.minute||0)-(b.minute||0)).map(e => `
              <div class="p-2 rounded-lg flex justify-between items-center text-xs" style="background: rgba(15,23,42,0.8); border: 1px solid rgba(51,65,85,0.5);">
                <span class="font-mono font-bold" style="color:#22d3ee; min-width:30px;">${e.minute}'</span>
                <span class="font-bold text-white flex-1 mx-2">${e.eventType === 'GOAL' ? '⚽' : e.eventType === 'PENALTY_GOAL' ? '⚽P' : e.eventType === 'OWN_GOAL' ? '⚽OG' : e.eventType === 'YELLOW_CARD' ? '🟨' : e.eventType === 'RED_CARD' ? '🟥' : '🟨🟥'} ${e.playerFullName || '-'}</span>
                <span class="text-slate-400">${e.teamId === match.homeTeamId ? match.homeTeamName.split(' ')[0] : match.awayTeamName.split(' ')[0]}</span>
              </div>
            `).join('')
          }
        </div>
      </div>
    </div>` : ''}
  `;
}

// ========== MATCH ACTIONS ==========
function startMatch(matchId) {
  const match = matches.find(m => m.id === matchId);
  if (!match) return;
  if (match.status !== 'SCHEDULED') { alert('Match ini sudah dimulai atau selesai.'); return; }
  match.status = 'LIVE';
  saveState();
  renderApp();
}

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

  if (!match.events) match.events = [];
  match.events.push({ id: 'ev-' + Date.now(), minute, eventType, teamId, playerId, playerFullName });

  if (eventType === 'GOAL' || eventType === 'PENALTY_GOAL') {
    if (teamId === match.homeTeamId) match.homeScore += 1;
    else match.awayScore += 1;
  } else if (eventType === 'OWN_GOAL') {
    if (teamId === match.homeTeamId) match.awayScore += 1;
    else match.homeScore += 1;
  } else if (eventType.includes('CARD')) {
    if (!match.cards) match.cards = [];
    match.cards.push({ id: 'c-' + Date.now(), matchId: match.id, teamId, playerId, minute, isRedCard: eventType === 'RED_CARD', isSecondYellow: eventType === 'SECOND_YELLOW_RED' });
  }

  if (match.status === 'SCHEDULED') match.status = 'LIVE';
  saveState();
  renderApp();
}

function finishMatch(matchId) {
  const match = matches.find(m => m.id === matchId);
  if (!match) return;
  match.status = 'FINISHED';
  advanceWinner(match);
  saveState();
  renderApp();
  const winningTeam = match.homeScore > match.awayScore ? teams.find(t => t.id === match.homeTeamId) : teams.find(t => t.id === match.awayTeamId);
  alert(`Match #${match.matchNumber} selesai! ${winningTeam ? winningTeam.name : 'Pemenang'} melaju ke babak berikutnya.`);
}

function advanceWinner(match) {
  const winningTeamId = match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId;
  const losingTeamId = match.homeScore > match.awayScore ? match.awayTeamId : match.homeTeamId;
  const winningTeam = teams.find(t => t.id === winningTeamId);
  const losingTeam = teams.find(t => t.id === losingTeamId);

  if (match.matchNumber >= 1 && match.matchNumber <= 8) {
    const qf = matches.find(m => m.matchNumber === 8 + Math.ceil(match.matchNumber / 2));
    if (qf) {
      if (match.matchNumber % 2 === 1) { qf.homeTeamId = winningTeamId; qf.homeTeamName = winningTeam?.name || 'Pemenang'; qf.homeTeamLogo = winningTeam?.logoUrl || ''; }
      else { qf.awayTeamId = winningTeamId; qf.awayTeamName = winningTeam?.name || 'Pemenang'; qf.awayTeamLogo = winningTeam?.logoUrl || ''; }
    }
  } else if (match.matchNumber >= 9 && match.matchNumber <= 12) {
    const sf = matches.find(m => m.matchNumber === 12 + Math.ceil((match.matchNumber - 8) / 2));
    if (sf) {
      if ((match.matchNumber - 8) % 2 === 1) { sf.homeTeamId = winningTeamId; sf.homeTeamName = winningTeam?.name || 'Pemenang'; sf.homeTeamLogo = winningTeam?.logoUrl || ''; }
      else { sf.awayTeamId = winningTeamId; sf.awayTeamName = winningTeam?.name || 'Pemenang'; sf.awayTeamLogo = winningTeam?.logoUrl || ''; }
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

function openEditScoreModal(matchId) {
  const match = matches.find(m => m.id === matchId);
  if (!match) return;
  openModal(`
    <h3 class="text-xl font-bold text-white mb-1">✏️ Edit Skor Manual</h3>
    <p class="text-sm text-slate-400 mb-5">Match #${match.matchNumber}: <strong class="text-cyan-300">${match.homeTeamName}</strong> vs <strong class="text-cyan-300">${match.awayTeamName}</strong></p>
    <form onsubmit="handleEditScoreSubmit(event, '${matchId}')" class="space-y-5">
      <div class="grid grid-cols-2 gap-4">
        <div><label class="form-label">Skor ${match.homeTeamName}</label><input type="number" id="editHomeScore" class="form-input" min="0" max="99" value="${match.homeScore}" required></div>
        <div><label class="form-label">Skor ${match.awayTeamName}</label><input type="number" id="editAwayScore" class="form-input" min="0" max="99" value="${match.awayScore}" required></div>
      </div>
      <div><label class="form-label">Status</label>
        <select id="editMatchStatus" class="form-input">
          <option value="SCHEDULED" ${match.status === 'SCHEDULED' ? 'selected' : ''}>⏳ BELUM MULAI</option>
          <option value="LIVE" ${match.status === 'LIVE' ? 'selected' : ''}>🔴 LIVE</option>
          <option value="FINISHED" ${match.status === 'FINISHED' ? 'selected' : ''}>✅ SELESAI</option>
        </select>
      </div>
      <div class="p-3 rounded-lg" style="background: rgba(34,211,238,0.05); border: 1px solid rgba(34,211,238,0.2);"><p class="text-xs text-slate-300">💡 Status SELESAI = pemenang otomatis dimajukan ke babak berikutnya.</p></div>
      <div class="flex gap-3">
        <button type="submit" class="btn-ucl-primary flex-1" style="justify-content: center;">💾 Simpan</button>
        <button type="button" onclick="closeModal()" class="btn-ucl-secondary" style="padding: 10px 16px;">Batal</button>
      </div>
    </form>
  `);
}

window.handleEditScoreSubmit = function(e, matchId) {
  e.preventDefault();
  const match = matches.find(m => m.id === matchId);
  if (!match) return;
  match.homeScore = parseInt(document.getElementById('editHomeScore').value) || 0;
  match.awayScore = parseInt(document.getElementById('editAwayScore').value) || 0;
  const wasFinished = match.status === 'FINISHED';
  match.status = document.getElementById('editMatchStatus').value;
  if (match.status === 'FINISHED' && !wasFinished) advanceWinner(match);
  closeModal();
  saveState();
  renderApp();
  alert(`✅ Skor diperbarui: ${match.homeTeamName} ${match.homeScore} - ${match.awayScore} ${match.awayTeamName} [${match.status}]`);
};

// ========== ADMIN ACTIONS ==========
function approveTeam(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (team) { team.status = 'APPROVED'; saveState(); renderApp(); }
}

function rejectTeam(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (team) { team.status = 'REJECTED'; saveState(); renderApp(); }
}

function trigger16TeamDrawingUI() {
  const res = execute16TeamKnockoutDraw(teams);
  if (!res.success) { alert(res.message); return; }
  matches = res.matches;
  saveState();
  renderApp();
  const vis = document.getElementById('adminDrawingVisualizer');
  if (vis) vis.innerHTML = `<div class="p-4 rounded-xl bg-slate-900 border border-cyan-400/40"><span class="text-xs font-bold text-emerald-400 block mb-2">🎉 ${res.message}</span><p class="text-xs text-slate-300">16 Tim telah diundi. Periksa bagan di Beranda.</p></div>`;
}

function resetTournamentData() {
  if (confirm('Reset semua data pertandingan?\nSemua skor kembali 0-0, status SCHEDULED.')) {
    localStorage.clear();
    location.reload(true);
  }
}

function hardResetAndReload() {
  if (confirm('🗑️ Hard Reset Total?\nSemua data dihapus dan halaman di-reload.')) {
    localStorage.clear();
    sessionStorage.clear();
    location.reload(true);
  }
}

// ========== SURAT TUGAS MODAL ==========
function openUploadSuratTugasModal(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (!team) return;

  openModal(`
    <h3 class="text-xl font-bold text-white mb-1">📄 Upload Surat Tugas Dekanat / Unit</h3>
    <p class="text-sm text-slate-400 mb-5">Tim: <strong class="text-cyan-300">${team.name}</strong></p>
    
    <form onsubmit="handleUploadSuratTugasSubmit(event, '${teamId}')" class="space-y-4">
      <div>
        <label class="form-label">Pilih File Surat Tugas (PDF / Gambar)</label>
        <input type="file" id="suratTugasFileInput" accept=".pdf,.png,.jpg,.jpeg" class="form-input" style="padding: 8px;">
      </div>
      <div>
        <label class="form-label">Atau Nama Dokumen / Nomor Surat</label>
        <input type="text" id="suratTugasNameInput" class="form-input" value="${team.suratTugasName || ''}" placeholder="Surat_Tugas_Dekan_FKIP_2026.pdf" required>
      </div>

      <div class="p-3 rounded-lg" style="background: rgba(255,215,0,0.08); border: 1px solid rgba(255,215,0,0.2);">
        <p class="text-xs text-amber-300">💡 Surat Tugas wajib diunggah sebagai verifikasi keikutsertaan tim resmi UMS.</p>
      </div>

      <div class="flex gap-3">
        <button type="submit" class="btn-ucl-primary flex-1" style="justify-content: center;">💾 Simpan Surat Tugas</button>
        <button type="button" onclick="closeModal()" class="btn-ucl-secondary" style="padding: 10px 16px;">Batal</button>
      </div>
    </form>
  `);
}

window.handleUploadSuratTugasSubmit = function(e, teamId) {
  e.preventDefault();
  const team = teams.find(t => t.id === teamId);
  if (!team) return;

  const fileInput = document.getElementById('suratTugasFileInput');
  const nameInput = document.getElementById('suratTugasNameInput').value.trim();

  let fileName = nameInput;
  if (fileInput && fileInput.files.length > 0) {
    fileName = fileInput.files[0].name;
  }

  if (!fileName) {
    alert('Harap masukkan nama berkas Surat Tugas.');
    return;
  }

  team.suratTugasName = fileName;
  saveState();
  closeModal();
  renderApp();
  alert(`✅ Surat Tugas untuk "${team.name}" berhasil disimpan: ${fileName}`);
};

// ========== MODALS ==========
function closeModal() {
  const modal = document.getElementById('modalContainer');
  if (modal) modal.classList.add('hidden');
}

function openModal(htmlContent) {
  const modal = document.getElementById('modalContainer');
  const body = document.getElementById('modalBody');
  if (modal && body) { body.innerHTML = htmlContent; modal.classList.remove('hidden'); }
}

function openRegisterTeamModal() {
  openModal(`
    <h3 class="text-xl font-bold text-white mb-4">Form Pendaftaran Tim Baru</h3>
    <form onsubmit="handleRegisterTeamSubmit(event)" class="space-y-4">
      <div><label class="form-label">Nama Tim</label><input type="text" id="regTeamName" class="form-input" placeholder="Contoh: Farmasi United FC" required></div>
      <div><label class="form-label">Fakultas / Unit UMS</label><input type="text" id="regFacultyUnit" class="form-input" placeholder="Contoh: Fakultas Farmasi UMS" required></div>
      <div><label class="form-label">Nama Manager Tim</label><input type="text" id="regManagerName" class="form-input" placeholder="Nama Lengkap Manager" required></div>
      <div><label class="form-label">No WhatsApp Manager</label><input type="text" id="regManagerPhone" class="form-input" placeholder="0812xxxxxxxx" required></div>
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
  teams.push({
    id: 'team-' + Date.now(),
    name, facultyUnit,
    logoUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
    managerId: 'mgr-' + Date.now(), managerName, managerPhone,
    status: 'APPROVED',
    suratTugasName: null
  });
  saveState();
  closeModal();
  renderApp();
};

function openEditTeamModal(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (!team) return;
  openModal(`
    <h3 class="text-xl font-bold text-white mb-1">✏️ Edit Info Tim</h3>
    <p class="text-sm text-slate-400 mb-5">Perbarui informasi tim <strong class="text-cyan-300">${team.name}</strong></p>
    <form onsubmit="handleEditTeamSubmit(event, '${teamId}')" class="space-y-4">
      <div><label class="form-label">Nama Tim <span class="text-rose-400">*</span></label><input type="text" id="editTeamName" class="form-input" value="${team.name}" required></div>
      <div><label class="form-label">Fakultas / Unit <span class="text-rose-400">*</span></label><input type="text" id="editTeamFaculty" class="form-input" value="${team.facultyUnit}" required></div>
      <div><label class="form-label">Nama Manager <span class="text-rose-400">*</span></label><input type="text" id="editTeamManager" class="form-input" value="${team.managerName}" required></div>
      <div><label class="form-label">No WhatsApp</label><input type="text" id="editTeamPhone" class="form-input" value="${team.managerPhone || ''}"></div>
      <div class="flex gap-3"><button type="submit" class="btn-ucl-primary flex-1" style="justify-content: center;">💾 Simpan</button><button type="button" onclick="closeModal()" class="btn-ucl-secondary" style="padding: 10px 16px;">Batal</button></div>
    </form>
  `);
}

window.handleEditTeamSubmit = function(e, teamId) {
  e.preventDefault();
  const team = teams.find(t => t.id === teamId);
  if (!team) return;
  const oldName = team.name;
  team.name = document.getElementById('editTeamName').value.trim();
  team.facultyUnit = document.getElementById('editTeamFaculty').value.trim();
  team.managerName = document.getElementById('editTeamManager').value.trim();
  team.managerPhone = document.getElementById('editTeamPhone').value.trim() || team.managerPhone;
  matches.forEach(m => {
    if (m.homeTeamId === teamId) { m.homeTeamName = team.name; m.homeTeamLogo = team.logoUrl; }
    if (m.awayTeamId === teamId) { m.awayTeamName = team.name; m.awayTeamLogo = team.logoUrl; }
  });
  closeModal(); saveState(); renderApp();
  alert(`✅ Tim diperbarui: "${oldName}" → "${team.name}"`);
};

function openAddPlayerModal(teamId) {
  const teamPlayers = players.filter(p => p.teamId === teamId);
  if (teamPlayers.length >= 14) { alert('Kuota pemain sudah penuh (maks 14).'); return; }
  openModal(`
    <h3 class="text-xl font-bold text-white mb-4">Tambah Pemain (Maks 14)</h3>
    <form onsubmit="handleAddPlayerSubmit(event, '${teamId}')" class="space-y-3">
      <div><label class="form-label">Nama Lengkap</label><input type="text" id="pFullName" class="form-input" placeholder="Nama lengkap pemain" required></div>
      <div><label class="form-label">No. KTP / NI. Kepegawaian</label><input type="text" id="pIdentityNumber" class="form-input" placeholder="3372xxxxxxxxxxxx" required></div>
      <div><label class="form-label">Usia</label><input type="number" id="pUsia" class="form-input" min="17" max="60" placeholder="22" required></div>
      <div><label class="form-label">Posisi Bermain</label>
        <select id="pPosition" class="form-input" required>
          <option value="GOALKEEPER">Penjaga Gawang (GK)</option>
          <option value="DEFENDER">Bek / Bertahan (DF)</option>
          <option value="MIDFIELDER">Gelandang (MF)</option>
          <option value="FORWARD">Penyerang (FW)</option>
        </select>
      </div>
      <button type="submit" class="btn-ucl-primary w-full" style="justify-content: center;">💾 Simpan Pemain</button>
    </form>
  `);
}

window.handleAddPlayerSubmit = function(e, teamId) {
  e.preventDefault();
  const fullName = document.getElementById('pFullName').value;
  const identityNumber = document.getElementById('pIdentityNumber').value;
  const usia = parseInt(document.getElementById('pUsia').value);
  const position = document.getElementById('pPosition').value;
  players.push({
    id: 'p-' + Date.now(), teamId, fullName, identityNumber, usia, position,
    photoProfileUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(fullName)}`
  });
  saveState(); closeModal(); renderApp();
};

function deletePlayer(playerId) {
  if (confirm('Hapus pemain ini?')) { players = players.filter(p => p.id !== playerId); saveState(); renderApp(); }
}

function openAddOfficialModal(teamId) {
  openModal(`
    <h3 class="text-xl font-bold text-white mb-4">Tambah Official / Pelatih</h3>
    <form onsubmit="handleAddOfficialSubmit(event, '${teamId}')" class="space-y-3">
      <div><label class="form-label">Nama Lengkap</label><input type="text" id="offFullName" class="form-input" required></div>
      <div><label class="form-label">No. KTP / NI. Kepegawaian</label><input type="text" id="offIdentityNumber" class="form-input" required></div>
      <div><label class="form-label">Jabatan</label>
        <select id="offRole" class="form-input" required>
          <option value="HEAD_COACH">Head Coach (Maks 1)</option>
          <option value="OFFICIAL">Official Tim (Maks 1)</option>
        </select>
      </div>
      <button type="submit" class="btn-ucl-primary w-full" style="justify-content: center;">💾 Simpan Official</button>
    </form>
  `);
}

window.handleAddOfficialSubmit = function(e, teamId) {
  e.preventDefault();
  const fullName = document.getElementById('offFullName').value;
  const identityNumber = document.getElementById('offIdentityNumber').value;
  const role = document.getElementById('offRole').value;
  if (officials.find(o => o.teamId === teamId && o.role === role)) {
    alert(`Tim sudah memiliki ${role === 'HEAD_COACH' ? 'Head Coach' : 'Official Tim'}.`);
    return;
  }
  officials.push({ id: 'off-' + Date.now(), teamId, fullName, identityNumber, role });
  saveState(); closeModal(); renderApp();
};

function deleteOfficial(officialId) {
  if (confirm('Hapus official ini?')) { officials = officials.filter(o => o.id !== officialId); saveState(); renderApp(); }
}

function openMatchSheetModal(matchId) {
  const match = matches.find(m => m.id === matchId);
  if (!match) return;
  const homePlayers = match.homeTeamId ? players.filter(p => p.teamId === match.homeTeamId) : [];
  const awayPlayers = match.awayTeamId ? players.filter(p => p.teamId === match.awayTeamId) : [];
  openModal(`
    <div class="p-4" style="background: white; color: black; border-radius: 12px;">
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
        <h2 style="font-size: 18px; font-weight: 800; text-transform: uppercase;">LAPORAN RESMI PERTANDINGAN</h2>
        <h3 style="font-size: 14px; font-weight: 700; color: #003366;">DIES NATALIS UMS 2026 MINISOCCER</h3>
        <p style="font-size: 11px;">Match #${match.matchNumber} (${match.stage}) | ${match.pitchLocation}</p>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; background: #f1f5f9; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
        <div style="font-weight: 700;">${match.homeTeamName}</div>
        <div style="font-size: 24px; font-weight: 900; color: #0077ff;">${match.homeScore} - ${match.awayScore}</div>
        <div style="font-weight: 700;">${match.awayTeamName}</div>
      </div>
      <div style="margin-bottom: 16px;"><h4 style="font-size: 12px; font-weight: 800; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px;">LOG KEJADIAN</h4>
        ${(match.events || []).length === 0 ? '<p style="font-size:11px;color:#666;">Tidak ada catatan.</p>' :
          (match.events || []).map(e => `<div style="font-size:11px;margin-bottom:4px;"><strong>Menit ${e.minute}'</strong>: ${e.eventType} - ${e.playerFullName} (${e.teamId === match.homeTeamId ? match.homeTeamName : match.awayTeamName})</div>`).join('')}
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 11px; margin-bottom: 16px;">
        <div><strong style="display:block;border-bottom:1px solid #000;margin-bottom:4px;">ROSTER ${match.homeTeamName}</strong>${homePlayers.map(p => `<div>${p.fullName} (${p.position})</div>`).join('')}</div>
        <div><strong style="display:block;border-bottom:1px solid #000;margin-bottom:4px;">ROSTER ${match.awayTeamName}</strong>${awayPlayers.map(p => `<div>${p.fullName} (${p.position})</div>`).join('')}</div>
      </div>
      <div style="text-align: right;"><button onclick="window.print()" class="btn-ucl-primary" style="padding: 6px 16px; font-size: 12px;">🖨️ Cetak</button></div>
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
      <p class="text-xs text-slate-400 mt-1">Coach: ${headCoach?.fullName || 'N/A'} | Manager: ${team.managerName}</p>
      <p class="text-xs text-slate-400 mt-1">Surat Tugas: ${team.suratTugasName || 'Belum diupload'}</p>
    </div>
    <h3 class="font-bold text-white text-sm mb-3">Daftar Pemain (${teamPlayers.length})</h3>
    <div class="space-y-2 max-h-80 overflow-y-auto">
      ${teamPlayers.map(p => `
        <div class="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <img src="${p.photoProfileUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(p.fullName)}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
            <div>
              <span class="font-bold text-white text-sm block">${p.fullName}</span>
              <span class="text-xs text-slate-400">${p.position} | Usia: ${p.usia || '-'} th | KTP/NI: ${p.identityNumber}</span>
            </div>
          </div>
          ${p.isSuspended ? `<span class="badge-danger text-xs">⛔ Suspended</span>` : `<span class="badge-cyan text-xs">Active</span>`}
        </div>
      `).join('')}
    </div>
  `);
}
