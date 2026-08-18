/**
 * Main Application Logic
 * Dies Natalis UMS 2026 Minisoccer Tournament System (16-Team Knockout)
 */

import { INITIAL_TEAMS, INITIAL_PLAYERS, INITIAL_OFFICIALS, INITIAL_MATCHES, INITIAL_HOMEPAGE, INITIAL_RULES, INITIAL_NAVBAR, ADMIN_CREDENTIALS, MANAGER_CREDENTIALS } from './src/lib/mockData.js';
import { execute16TeamKnockoutDraw } from './src/lib/drawingEngine.js';
import { evaluatePlayerSuspensions } from './src/lib/cardAccumulation.js';
import { initFirestoreRealtimeSync, saveStateToFirestore, fetchLatestFirestoreData } from './src/lib/firebase.js';

// ========== STATE ==========
let currentRole = 'VISITOR';
let currentVisitorTab = 'bracket';
let currentAdminTab = 'matchcenter';
let activeRefereeMatchId = null;
let draggedTeamInfo = null;
let draggedPoolTeamId = null;
let liveTimerInterval = null;

// Dynamic Homepage, Rules & Navbar State
let homepageContent = JSON.parse(localStorage.getItem('ums_homepage')) || INITIAL_HOMEPAGE;
let tournamentRules = JSON.parse(localStorage.getItem('ums_rules')) || INITIAL_RULES;
let navbarConfig = JSON.parse(localStorage.getItem('ums_navbar')) || INITIAL_NAVBAR;

// Drawing Engine State
let drawnSlots = JSON.parse(localStorage.getItem('ums_drawn_slots')) || []; // [{ matchNumber, teamType: 'home'|'away', teamId }]
let selectedTargetSlot = null; // { matchNumber, teamType }
let isSpinning = false;
let currentWheelAngle = 0;

// Auth State (Persisted in localStorage across page reloads & tabs)
let authState = JSON.parse(localStorage.getItem('ums_auth')) || {
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

function updateCloudSyncBadge(status, message) {
  const badge = document.getElementById('cloudSyncStatusBadge');
  const dot = document.getElementById('cloudSyncDot');
  const text = document.getElementById('cloudSyncStatusText');
  if (!badge || !dot || !text) return;

  if (status === 'online') {
    badge.style.background = 'rgba(16, 185, 129, 0.12)';
    badge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    badge.style.color = '#34d399';
    dot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
    text.textContent = '🟢 Cloud Live';
  } else if (status === 'syncing') {
    badge.style.background = 'rgba(245, 158, 11, 0.12)';
    badge.style.borderColor = 'rgba(245, 158, 11, 0.4)';
    badge.style.color = '#fbbf24';
    dot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-ping';
    text.textContent = '🟡 Cloud Sync...';
  } else if (status === 'connecting') {
    badge.style.background = 'rgba(6, 182, 212, 0.12)';
    badge.style.borderColor = 'rgba(6, 182, 212, 0.4)';
    badge.style.color = '#22d3ee';
    dot.className = 'w-2 h-2 rounded-full bg-cyan-400 animate-pulse';
    text.textContent = '🔵 Connecting...';
  } else {
    badge.style.background = 'rgba(239, 68, 68, 0.12)';
    badge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    badge.style.color = '#f87171';
    dot.className = 'w-2 h-2 rounded-full bg-rose-400';
    text.textContent = '🔴 Offline';
  }
}
window.updateCloudSyncBadge = updateCloudSyncBadge;

async function manualCloudSync() {
  updateCloudSyncBadge('syncing', 'Menarik data cloud...');
  const cloudData = await fetchLatestFirestoreData();
  if (cloudData) {
    if (cloudData.teams && Array.isArray(cloudData.teams)) teams = cloudData.teams;
    if (cloudData.players && Array.isArray(cloudData.players)) players = cloudData.players;
    if (cloudData.officials && Array.isArray(cloudData.officials)) officials = cloudData.officials;
    if (cloudData.matches && Array.isArray(cloudData.matches)) matches = cloudData.matches;
    if (cloudData.drawnSlots && Array.isArray(cloudData.drawnSlots)) drawnSlots = cloudData.drawnSlots;
    if (cloudData.homepageContent && typeof cloudData.homepageContent === 'object') homepageContent = cloudData.homepageContent;
    if (cloudData.tournamentRules && Array.isArray(cloudData.tournamentRules)) tournamentRules = cloudData.tournamentRules;
    if (cloudData.navbarConfig && typeof cloudData.navbarConfig === 'object') navbarConfig = cloudData.navbarConfig;

    saveState(true);
    renderApp();
    updateCloudSyncBadge('online', 'Tersinkronisasi');
    alert('✅ Data turnamen berhasil disinkronkan langsung dari Cloud Firestore!');
  } else {
    saveState(false);
    alert('☁️ Mengirim data lokal Anda ke Cloud Firestore...');
  }
}
window.manualCloudSync = manualCloudSync;

function saveState(skipCloudPush = false) {
  localStorage.setItem('ums_teams', JSON.stringify(teams));
  localStorage.setItem('ums_players', JSON.stringify(players));
  localStorage.setItem('ums_officials', JSON.stringify(officials));
  localStorage.setItem('ums_matches', JSON.stringify(matches));
  localStorage.setItem('ums_drawn_slots', JSON.stringify(drawnSlots));
  localStorage.setItem('ums_auth', JSON.stringify(authState));
  localStorage.setItem('ums_homepage', JSON.stringify(homepageContent));
  localStorage.setItem('ums_rules', JSON.stringify(tournamentRules));
  localStorage.setItem('ums_navbar', JSON.stringify(navbarConfig));

  // Sync to Cloud Firestore across all devices in real-time
  if (!skipCloudPush) {
    saveStateToFirestore({
      teams,
      players,
      officials,
      matches,
      drawnSlots,
      homepageContent,
      tournamentRules,
      navbarConfig,
      updatedBy: authState.displayName || (authState.role === 'ADMIN' ? 'Super Admin' : 'Manager')
    }, updateCloudSyncBadge);
  }
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
window.deleteMatchEvent = deleteMatchEvent;
window.resetSingleMatch = resetSingleMatch;
window.finishMatch = finishMatch;
window.startMatch = startMatch;
window.openEditScoreModal = openEditScoreModal;
window.openEditScheduleModal = openEditScheduleModal;
window.handleEditScheduleSubmit = handleEditScheduleSubmit;
window.openMatchSheetModal = openMatchSheetModal;
window.openTeamDetailModal = openTeamDetailModal;
window.renderVisitorMatches = renderVisitorMatches;
window.closeModal = closeModal;

// Homepage & Rules Window Bindings
window.openEditHomepageModal = openEditHomepageModal;
window.openAddRuleModal = openAddRuleModal;
window.openEditRuleModal = openEditRuleModal;
window.deleteRule = deleteRule;
window.resetRulesToDefault = resetRulesToDefault;
window.openEditNavbarModal = openEditNavbarModal;
window.openPublicMatchDetailModal = openPublicMatchDetailModal;
window.switchMatchDetailModalTab = switchMatchDetailModalTab;

// Team CRUD Bindings
window.openRegisterTeamModal = openRegisterTeamModal;
window.handleRegisterTeamSubmitDirect = handleRegisterTeamSubmitDirect;
window.openEditTeamModal = openEditTeamModal;
window.handleEditTeamSubmitDirect = handleEditTeamSubmitDirect;
window.openUploadSuratTugasModal = openUploadSuratTugasModal;
window.handleUploadSuratTugasSubmitDirect = handleUploadSuratTugasSubmitDirect;

// Player & Official CRUD Bindings
window.openAddPlayerModal = openAddPlayerModal;
window.handleAddPlayerSubmitDirect = handleAddPlayerSubmitDirect;
window.deletePlayer = deletePlayer;
window.openAddOfficialModal = openAddOfficialModal;
window.handleAddOfficialSubmitDirect = handleAddOfficialSubmitDirect;
window.deleteOfficial = deleteOfficial;

// Manager Tactical Formation Setter Bindings
window.openSetFormationModal = openSetFormationModal;
window.updateFormationPreview = updateFormationPreview;
window.handleSaveFormationSubmit = handleSaveFormationSubmit;

// Super Admin Team & File Deletion Bindings
window.deleteTeam = deleteTeam;
window.deleteSuratTugas = deleteSuratTugas;
window.deleteAllPlayers = deleteAllPlayers;

// Drag & Drop Window Bindings (Bracket Tree)
window.handleTeamDragStart = handleTeamDragStart;
window.handleTeamDragOver = handleTeamDragOver;
window.handleTeamDragLeave = handleTeamDragLeave;
window.handleTeamDrop = handleTeamDrop;

// Drag & Drop Window Bindings (Pool to Slot Seeding)
window.handlePoolTeamDragStart = handlePoolTeamDragStart;
window.handleSlotDragOver = handleSlotDragOver;
window.handleSlotDragLeave = handleSlotDragLeave;
window.handleSlotDrop = handleSlotDrop;

// Drawing Wheel Window Bindings
window.spinDrawingWheel = spinDrawingWheel;
window.handleTargetSlotChange = handleTargetSlotChange;
window.resetDrawingState = resetDrawingState;
window.removeDrawnTeam = removeDrawnTeam;
window.applyDrawingToBracket = applyDrawingToBracket;

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  // Restore persisted active role and visitor tab
  let savedRole = localStorage.getItem('ums_active_role') || 'VISITOR';
  let savedVisitorTab = localStorage.getItem('ums_active_visitor_tab') || 'bracket';

  if ((savedRole === 'ADMIN' || savedRole === 'MATCH_CENTER' || savedRole === 'DRAWING') && authState.role !== 'ADMIN') {
    savedRole = 'VISITOR';
  }
  if (savedRole === 'TEAM_MANAGER' && !authState.isLoggedIn) {
    savedRole = 'VISITOR';
  }

  currentRole = savedRole;
  currentVisitorTab = savedVisitorTab;

  switchRole(currentRole);
  startGlobalTimerLoop();

  // Initialize Real-time Firestore Cloud Synchronization
  initFirestoreRealtimeSync(
    (cloudData) => {
      if (!cloudData) return;
      console.log('🔄 Applying remote Firestore update to local state...');
      if (cloudData.teams && Array.isArray(cloudData.teams)) teams = cloudData.teams;
      if (cloudData.players && Array.isArray(cloudData.players)) players = cloudData.players;
      if (cloudData.officials && Array.isArray(cloudData.officials)) officials = cloudData.officials;
      if (cloudData.matches && Array.isArray(cloudData.matches)) matches = cloudData.matches;
      if (cloudData.drawnSlots && Array.isArray(cloudData.drawnSlots)) drawnSlots = cloudData.drawnSlots;
      if (cloudData.homepageContent && typeof cloudData.homepageContent === 'object') homepageContent = cloudData.homepageContent;
      if (cloudData.tournamentRules && Array.isArray(cloudData.tournamentRules)) tournamentRules = cloudData.tournamentRules;
      if (cloudData.navbarConfig && typeof cloudData.navbarConfig === 'object') navbarConfig = cloudData.navbarConfig;

      // Save to local cache without triggering a circular cloud push
      saveState(true);
      renderApp();
    },
    (status, msg) => {
      updateCloudSyncBadge(status, msg);
    },
    {
      teams,
      players,
      officials,
      matches,
      drawnSlots,
      homepageContent,
      tournamentRules,
      navbarConfig
    }
  );
});

// Global Timer Loop to tick active stopwatch timers
function startGlobalTimerLoop() {
  if (liveTimerInterval) clearInterval(liveTimerInterval);
  liveTimerInterval = setInterval(() => {
    const hasLiveMatch = matches.some(m => m.status === 'LIVE');
    if (hasLiveMatch) {
      updateLiveTimersInDOM();
    }
  }, 1000);
}

function updateLiveTimersInDOM() {
  matches.filter(m => m.status === 'LIVE').forEach(m => {
    if (!m.startedAt) return;
    const elapsedSec = Math.floor((Date.now() - m.startedAt) / 1000);
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    const currentMinute = Math.max(1, Math.min(25, mins + 1));

    // Update Live Score Card Stopwatch
    const timerDisplay = document.getElementById(`liveTimerDisplay-${m.id}`);
    if (timerDisplay) {
      timerDisplay.textContent = `⏱️ ${timeFormatted} (Menit ke-${currentMinute}')`;
    }

    // Update Match Center Active Form Minute Input if active
    if (activeRefereeMatchId === m.id) {
      const minuteInput = document.getElementById('eventMinute');
      if (minuteInput && !minuteInput.dataset.userEdited) {
        minuteInput.value = currentMinute;
      }
    }
  });
}

// ========== DRAG & DROP FOR ROUND OF 16 BRACKET TREE ==========
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

// ========== DRAG & DROP FROM POOL TO DRAWING SLOT (MANUAL SEEDING) ==========
function handlePoolTeamDragStart(e, teamId) {
  if (authState.role !== 'ADMIN') return;
  draggedPoolTeamId = teamId;
  e.dataTransfer.setData('text/plain', teamId);
  e.currentTarget.style.opacity = '0.4';
}

function handleSlotDragOver(e) {
  if (authState.role !== 'ADMIN') return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('slot-drag-over');
}

function handleSlotDragLeave(e) {
  if (authState.role !== 'ADMIN') return;
  e.currentTarget.classList.remove('slot-drag-over');
}

function handleSlotDrop(e, matchNumber, teamType) {
  if (authState.role !== 'ADMIN') return;
  e.preventDefault();
  e.currentTarget.classList.remove('slot-drag-over');

  if (!draggedPoolTeamId) return;

  const teamObj = teams.find(t => t.id === draggedPoolTeamId);
  if (!teamObj) return;

  // 1. Remove any existing assignment for this dragged team
  drawnSlots = drawnSlots.filter(s => s.teamId !== draggedPoolTeamId);

  // 2. Remove any existing assignment for this target slot
  drawnSlots = drawnSlots.filter(s => !(s.matchNumber === matchNumber && s.teamType === teamType));

  // 3. Add new assignment
  drawnSlots.push({
    matchNumber,
    teamType,
    teamId: draggedPoolTeamId
  });

  draggedPoolTeamId = null;
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
  // If already logged in and trying to go to LOGIN, redirect to dashboard
  if (role === 'LOGIN' && authState.isLoggedIn) {
    if (authState.role === 'ADMIN') switchRole('ADMIN');
    else switchRole('TEAM_MANAGER');
    return;
  }

  // Security guard for ADMIN roles
  if ((role === 'ADMIN' || role === 'MATCH_CENTER' || role === 'DRAWING') && authState.role !== 'ADMIN') {
    switchRole('LOGIN');
    return;
  }

  currentRole = role;
  localStorage.setItem('ums_active_role', role);

  // Update Nav selector badges
  document.querySelectorAll('#roleSelectorContainer .role-badge').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-role') === role);
  });

  // Admin-only Top Nav Badges
  const matchNavBtn = document.getElementById('navMatchCenterBtn');
  const drawNavBtn = document.getElementById('navDrawingBtn');
  if (matchNavBtn) matchNavBtn.classList.toggle('hidden', authState.role !== 'ADMIN');
  if (drawNavBtn) drawNavBtn.classList.toggle('hidden', authState.role !== 'ADMIN');

  // Update Login Nav Badge Text & Click Handler
  const loginNavBtn = document.getElementById('navLoginBtn');
  if (loginNavBtn) {
    if (authState.isLoggedIn) {
      loginNavBtn.setAttribute('onclick', authState.role === 'ADMIN' ? "switchRole('ADMIN')" : "switchRole('TEAM_MANAGER')");
      loginNavBtn.innerHTML = `👤 ${authState.displayName} (${authState.role === 'ADMIN' ? 'Admin' : 'Manager'}) <button onclick="event.stopPropagation(); handleLogout();" class="text-rose-400 font-bold ml-2.5 hover:underline">🚪 Logout</button>`;
    } else {
      loginNavBtn.setAttribute('onclick', "switchRole('LOGIN')");
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
  localStorage.setItem('ums_active_visitor_tab', tabName);
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
  renderNavbarDOM();

  if (currentRole === 'VISITOR') {
    renderVisitorTabContent();
  } else if (currentRole === 'RULES') {
    renderRulesSection();
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

// ========== DYNAMIC NAVBAR HEADER & SUPER ADMIN EDITOR ==========
function renderNavbarDOM() {
  const titleEl = document.getElementById('navTitleText');
  const subtitleEl = document.getElementById('navSubtitleText');
  const logoEl = document.getElementById('navLogoImg');
  const editBtn = document.getElementById('navEditHeaderBtn');

  const homeTab = document.getElementById('navHomeTab');
  const rulesTab = document.getElementById('navRulesTab');
  const managerTab = document.getElementById('navManagerTab');
  const matchCenterBtn = document.getElementById('navMatchCenterBtn');
  const drawingBtn = document.getElementById('navDrawingBtn');

  if (titleEl) titleEl.textContent = navbarConfig.title || 'DIES NATALIS UMS 2026';
  if (subtitleEl) subtitleEl.textContent = navbarConfig.subtitle || 'Minisoccer Champions League';
  if (logoEl && navbarConfig.logoUrl) logoEl.src = navbarConfig.logoUrl;

  if (editBtn) editBtn.classList.toggle('hidden', authState.role !== 'ADMIN');

  if (homeTab) homeTab.textContent = navbarConfig.homeLabel || '🏠 Beranda';
  if (rulesTab) rulesTab.textContent = navbarConfig.rulesLabel || '📜 Peraturan';
  if (managerTab) managerTab.textContent = navbarConfig.managerLabel || '⚽ Manajemen Tim';
  if (matchCenterBtn) matchCenterBtn.textContent = navbarConfig.matchCenterLabel || '⏱️ Match Center';
  if (drawingBtn) drawingBtn.textContent = navbarConfig.drawingLabel || '🎲 Undian 16 Tim';
}

function openEditNavbarModal() {
  openModal(`
    <h3 class="text-xl font-bold text-white mb-1">⚙️ Edit Navigation Bar &amp; Header Top</h3>
    <p class="text-sm text-slate-400 mb-5">Perbarui teks judul header, subtitle, logo icon, dan label tombol menu di atas.</p>

    <form onsubmit="handleNavbarEditSubmit(event)" class="space-y-4">
      <div>
        <label class="form-label">Judul Utama Header Navbar <span class="text-rose-400">*</span></label>
        <input type="text" id="navEditTitle" class="form-input" value="${navbarConfig.title || ''}" required>
      </div>

      <div>
        <label class="form-label">Subtitle Header Navbar <span class="text-rose-400">*</span></label>
        <input type="text" id="navEditSubtitle" class="form-input" value="${navbarConfig.subtitle || ''}" required>
      </div>

      <div>
        <label class="form-label">URL Icon Logo (Gambar / Identicon)</label>
        <input type="text" id="navEditLogo" class="form-input" value="${navbarConfig.logoUrl || ''}" placeholder="https://..." required>
      </div>

      <div class="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
        <span class="text-xs font-bold text-cyan-400 uppercase tracking-wider block">Kustomisasi Label Tombol Menu Navigasi:</span>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Label Menu Beranda</label>
            <input type="text" id="navLabelHome" class="form-input" value="${navbarConfig.homeLabel || '🏠 Beranda'}" required>
          </div>
          <div>
            <label class="form-label">Label Menu Peraturan</label>
            <input type="text" id="navLabelRules" class="form-input" value="${navbarConfig.rulesLabel || '📜 Peraturan'}" required>
          </div>
          <div>
            <label class="form-label">Label Menu Manajemen Tim</label>
            <input type="text" id="navLabelManager" class="form-input" value="${navbarConfig.managerLabel || '⚽ Manajemen Tim'}" required>
          </div>
          <div>
            <label class="form-label">Label Menu Match Center</label>
            <input type="text" id="navLabelMatchCenter" class="form-input" value="${navbarConfig.matchCenterLabel || '⏱️ Match Center'}" required>
          </div>
          <div class="col-span-2">
            <label class="form-label">Label Menu Undian 16 Tim</label>
            <input type="text" id="navLabelDrawing" class="form-input" value="${navbarConfig.drawingLabel || '🎲 Undian 16 Tim'}" required>
          </div>
        </div>
      </div>

      <div class="flex gap-3 pt-2">
        <button type="submit" class="btn-ucl-primary flex-1" style="justify-content: center;">💾 Simpan Navbar Header</button>
        <button type="button" onclick="closeModal()" class="btn-ucl-secondary" style="padding: 10px 16px;">Batal</button>
      </div>
    </form>
  `);
}

window.handleNavbarEditSubmit = function(e) {
  e.preventDefault();
  navbarConfig = {
    title: document.getElementById('navEditTitle').value.trim(),
    subtitle: document.getElementById('navEditSubtitle').value.trim(),
    logoUrl: document.getElementById('navEditLogo').value.trim(),
    homeLabel: document.getElementById('navLabelHome').value.trim(),
    rulesLabel: document.getElementById('navLabelRules').value.trim(),
    managerLabel: document.getElementById('navLabelManager').value.trim(),
    matchCenterLabel: document.getElementById('navLabelMatchCenter').value.trim(),
    drawingLabel: document.getElementById('navLabelDrawing').value.trim()
  };
  saveState();
  closeModal();
  renderApp();
  alert('✅ Top Navbar & Header berhasil diperbarui!');
};

// ========== DYNAMIC HOMEPAGE HERO BANNER ==========
function renderHomepageHero() {
  const container = document.getElementById('homepageHeroContainer');
  if (!container) return;

  const isAdmin = authState.role === 'ADMIN';

  container.innerHTML = `
    <div class="hero-ucl p-8 mb-8 relative overflow-hidden">
      <div class="hero-starball"></div>
      
      ${isAdmin ? `
        <div class="flex justify-end mb-3 relative z-20">
          <button onclick="openEditHomepageModal()" style="padding: 6px 14px; font-size: 12px; font-weight: 700; border-radius: 8px; border: 1px solid rgba(255,215,0,0.5); background: rgba(255,215,0,0.15); color: #ffd700; cursor: pointer;" title="👑 Super Admin: Edit Teks Beranda">
            ✏️ Edit Banner Beranda
          </button>
        </div>
      ` : ''}

      <div class="flex justify-between items-start flex-wrap gap-4 relative z-10">
        <div>
          <span class="badge-gold mb-3 inline-block">${homepageContent.heroBadge}</span>
          <h1 style="font-size: 2.2rem; line-height: 1.2; margin-bottom: 8px; text-transform: uppercase;">${homepageContent.heroTitle}</h1>
          <p style="color: var(--text-secondary); max-width: 680px; font-size: 0.95rem; line-height: 1.5;">
            ${homepageContent.heroSubtitle}
          </p>
        </div>
        <div class="glass-panel p-4 text-center" style="min-width: 200px;">
          <span class="text-xs uppercase text-cyan-400 font-bold tracking-widest block mb-1">TOTAL HADIAH</span>
          <span style="font-size: 1.5rem; font-weight: 800; color: var(--ucl-gold)">${homepageContent.totalPrize}</span>
          <span class="text-xs text-slate-400 block mt-1">${homepageContent.prizeSub}</span>
        </div>
      </div>

      ${homepageContent.announcementText ? `
        <div class="mt-4 p-3 rounded-lg flex items-center gap-2 text-xs font-semibold text-cyan-300 relative z-10" style="background: rgba(0,240,255,0.08); border: 1px solid rgba(0,240,255,0.25);">
          <span>${homepageContent.announcementText}</span>
        </div>
      ` : ''}

      <div class="flex gap-6 mt-6 pt-6 border-t border-slate-700/50 flex-wrap relative z-10">
        <div><span class="text-xs text-slate-400 block">Format Turnamen</span><span class="badge-live">${homepageContent.tournamentFormat}</span></div>
        <div><span class="text-xs text-slate-400 block">Total Peserta</span><span class="font-bold text-white text-sm">${teams.filter(t => t.status === 'APPROVED').length} Tim Approved</span></div>
        <div><span class="text-xs text-slate-400 block">Lokasi Lapangan</span><span class="font-bold text-cyan-400 text-sm">${homepageContent.pitchLocation}</span></div>
      </div>
    </div>
  `;
}

function openEditHomepageModal() {
  openModal(`
    <div class="p-1">
      <h3 class="text-xl font-bold text-white mb-1">✏️ Edit Teks &amp; Banner Beranda</h3>
      <p class="text-sm text-slate-400 mb-5">Ubah informasi judul, subtitle, total hadiah, dan pengumuman di Beranda.</p>
      
      <div class="space-y-4">
        <div>
          <label class="form-label">Badge Atas <span class="text-rose-400">*</span></label>
          <input type="text" id="hpBadge" class="form-input" value="${homepageContent.heroBadge}">
        </div>
        <div>
          <label class="form-label">Judul Utama Turnamen <span class="text-rose-400">*</span></label>
          <input type="text" id="hpTitle" class="form-input" value="${homepageContent.heroTitle}">
        </div>
        <div>
          <label class="form-label">Deskripsi / Subtitle Beranda <span class="text-rose-400">*</span></label>
          <textarea id="hpSubtitle" class="form-input" rows="3">${homepageContent.heroSubtitle}</textarea>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Total Hadiah</label>
            <input type="text" id="hpPrize" class="form-input" value="${homepageContent.totalPrize}">
          </div>
          <div>
            <label class="form-label">Keterangan Hadiah</label>
            <input type="text" id="hpPrizeSub" class="form-input" value="${homepageContent.prizeSub}">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Format Turnamen</label>
            <input type="text" id="hpFormat" class="form-input" value="${homepageContent.tournamentFormat}">
          </div>
          <div>
            <label class="form-label">Lokasi Lapangan</label>
            <input type="text" id="hpPitch" class="form-input" value="${homepageContent.pitchLocation}">
          </div>
        </div>
        <div>
          <label class="form-label">Teks Pengumuman Terbaru (Opsional)</label>
          <input type="text" id="hpAnnouncement" class="form-input" value="${homepageContent.announcementText || ''}" placeholder="misal: 📢 Pendaftaran dibuka sampai 12 Maret!">
        </div>

        <div class="flex gap-3 pt-2">
          <button id="submitEditHomepageBtn" type="button" class="btn-ucl-primary flex-1 justify-center" style="padding: 10px 16px;">
            💾 Simpan Beranda
          </button>
          <button type="button" onclick="closeModal()" class="btn-ucl-secondary" style="padding: 10px 16px;">Batal</button>
        </div>
      </div>
    </div>
  `);

  setTimeout(() => {
    const btn = document.getElementById('submitEditHomepageBtn');
    if (btn) btn.onclick = () => handleHomepageEditSubmitDirect();
  }, 10);
}

function handleHomepageEditSubmitDirect() {
  const badgeEl = document.getElementById('hpBadge');
  const titleEl = document.getElementById('hpTitle');
  const subEl = document.getElementById('hpSubtitle');
  const prizeEl = document.getElementById('hpPrize');
  const prizeSubEl = document.getElementById('hpPrizeSub');
  const formatEl = document.getElementById('hpFormat');
  const pitchEl = document.getElementById('hpPitch');
  const annEl = document.getElementById('hpAnnouncement');

  homepageContent = {
    heroBadge: badgeEl ? badgeEl.value.trim() : homepageContent.heroBadge,
    heroTitle: titleEl ? titleEl.value.trim() : homepageContent.heroTitle,
    heroSubtitle: subEl ? subEl.value.trim() : homepageContent.heroSubtitle,
    totalPrize: prizeEl ? prizeEl.value.trim() : homepageContent.totalPrize,
    prizeSub: prizeSubEl ? prizeSubEl.value.trim() : homepageContent.prizeSub,
    tournamentFormat: formatEl ? formatEl.value.trim() : homepageContent.tournamentFormat,
    pitchLocation: pitchEl ? pitchEl.value.trim() : homepageContent.pitchLocation,
    announcementText: annEl ? annEl.value.trim() : homepageContent.announcementText
  };

  saveState();
  closeModal();
  renderApp();
  alert('✅ Teks dan Banner Beranda berhasil diperbarui!');
}
window.handleHomepageEditSubmitDirect = handleHomepageEditSubmitDirect;

// ========== DYNAMIC RULES SECTION & SUPER ADMIN CRUD ==========
function renderRulesSection() {
  const container = document.getElementById('rulesViewContainer');
  if (!container) return;

  const isAdmin = authState.role === 'ADMIN';

  let html = `
    <div class="glass-panel p-8 mb-8">
      <div class="flex justify-between items-start flex-wrap gap-4 mb-4">
        <div class="flex items-center gap-3">
          <span style="font-size: 36px;">📜</span>
          <div>
            <h1 class="text-2xl font-bold text-white">PERATURAN RESMI TURNAMEN MINISOCCER DIES NATALIS UMS 2026</h1>
            <p class="text-sm text-cyan-400 font-semibold">Regulasi Resmi Pertandingan Minisoccer UMS 7v7 (Sistem Gugur / Knockout)</p>
          </div>
        </div>

        ${isAdmin ? `
          <div class="flex gap-2 flex-wrap">
            <button onclick="openAddRuleModal()" class="btn-ucl-primary" style="padding: 8px 14px; font-size: 12px;">+ Tambah Kategori Peraturan Baru</button>
            <button onclick="resetRulesToDefault()" style="padding: 8px 14px; font-size: 12px; font-weight: 700; border-radius: 8px; border: 1px solid rgba(239,68,68,0.4); background: rgba(239,68,68,0.1); color: #f87171; cursor: pointer;">🔄 Reset Standard</button>
          </div>
        ` : ''}
      </div>

      ${isAdmin ? `
        <div class="p-3 rounded-lg mb-6 flex justify-between items-center flex-wrap gap-2 text-xs" style="background: rgba(255,215,0,0.08); border: 1px solid rgba(255,215,0,0.25);">
          <span class="text-amber-300">👑 <strong>Mode Super Admin Aktif:</strong> Anda dapat menambah, mengedit, atau menghapus item peraturan di bawah ini secara langsung.</span>
        </div>
      ` : ''}

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
  `;

  if (tournamentRules.length === 0) {
    html += `<p class="text-slate-400 text-sm py-8 text-center col-span-2">Belum ada peraturan ditambahkan.</p>`;
  } else {
    tournamentRules.forEach((rule) => {
      html += `
        <div class="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between" style="${isAdmin ? 'border-color: rgba(34,211,238,0.3);' : ''}">
          <div>
            <div class="flex justify-between items-start mb-3">
              <h3 class="text-lg font-bold ${rule.colorClass || 'text-cyan-400'} flex items-center gap-2">
                <span>${rule.icon || '📜'}</span> ${rule.title}
              </h3>
              ${isAdmin ? `
                <div class="flex gap-2">
                  <button onclick="openEditRuleModal('${rule.id}')" class="text-xs text-cyan-400 font-bold hover:underline">✏️ Edit</button>
                  <button onclick="deleteRule('${rule.id}')" class="text-xs text-rose-400 font-bold hover:underline">🗑️ Hapus</button>
                </div>
              ` : ''}
            </div>
            
            <ul class="space-y-2 text-sm text-slate-300">
              ${(rule.items || []).map(item => `<li class="flex items-start gap-2"><span>•</span> <span>${item}</span></li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    });
  }

  html += `
        </div>
      </div>
  `;

  container.innerHTML = html;
}

function openAddRuleModal() {
  openModal(`
    <div class="p-1">
      <h3 class="text-xl font-bold text-white mb-1">+ Tambah Kategori Peraturan Baru</h3>
      <p class="text-sm text-slate-400 mb-5">Tambahkan kelompok peraturan baru beserta poin-poin ketentuannya.</p>

      <div class="space-y-4">
        <div>
          <label class="form-label">Judul Kategori Peraturan <span class="text-rose-400">*</span></label>
          <input type="text" id="ruleTitle" class="form-input" placeholder="misal: 5. Ketentuan Jersey &amp; Aksesoris">
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Icon / Emoji</label>
            <input type="text" id="ruleIcon" class="form-input" value="📜" placeholder="misal: 👕">
          </div>
          <div>
            <label class="form-label">Warna Judul</label>
            <select id="ruleColor" class="form-input">
              <option value="text-amber-400">🟡 Amber (Kuning)</option>
              <option value="text-cyan-400" selected>🔷 Cyan (Biru Muda)</option>
              <option value="text-emerald-400">🟢 Emerald (Hijau)</option>
              <option value="text-rose-400">🔴 Rose (Merah)</option>
              <option value="text-purple-400">🟣 Purple (Ungu)</option>
            </select>
          </div>
        </div>

        <div>
          <label class="form-label">Poin-Poin Peraturan (1 Poin Per Baris) <span class="text-rose-400">*</span></label>
          <textarea id="ruleItemsText" class="form-input" rows="5" placeholder="Poin 1: Wajib memakai jersey bernomor dada&#10;Poin 2: Dilarang memakai perhiasan saat bertanding"></textarea>
        </div>

        <div class="flex gap-3 pt-2">
          <button id="submitAddRuleBtn" type="button" class="btn-ucl-primary flex-1 justify-center" style="padding: 10px 16px;">
            💾 Simpan Peraturan
          </button>
          <button type="button" onclick="closeModal()" class="btn-ucl-secondary" style="padding: 10px 16px;">Batal</button>
        </div>
      </div>
    </div>
  `);

  setTimeout(() => {
    const btn = document.getElementById('submitAddRuleBtn');
    if (btn) btn.onclick = () => handleRuleSubmitDirect();
  }, 10);
}

function openEditRuleModal(ruleId) {
  const rule = tournamentRules.find(r => r.id === ruleId);
  if (!rule) return;

  const itemsText = (rule.items || []).join('\n');

  openModal(`
    <div class="p-1">
      <h3 class="text-xl font-bold text-white mb-1">✏️ Edit Kategori Peraturan</h3>
      <p class="text-sm text-slate-400 mb-5">Perbarui judul, icon, dan poin-poin peraturan.</p>

      <div class="space-y-4">
        <div>
          <label class="form-label">Judul Kategori Peraturan <span class="text-rose-400">*</span></label>
          <input type="text" id="ruleTitle" class="form-input" value="${rule.title}">
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Icon / Emoji</label>
            <input type="text" id="ruleIcon" class="form-input" value="${rule.icon || '📜'}">
          </div>
          <div>
            <label class="form-label">Warna Judul</label>
            <select id="ruleColor" class="form-input">
              <option value="text-amber-400" ${rule.colorClass === 'text-amber-400' ? 'selected' : ''}>🟡 Amber (Kuning)</option>
              <option value="text-cyan-400" ${rule.colorClass === 'text-cyan-400' ? 'selected' : ''}>🔷 Cyan (Biru Muda)</option>
              <option value="text-emerald-400" ${rule.colorClass === 'text-emerald-400' ? 'selected' : ''}>🟢 Emerald (Hijau)</option>
              <option value="text-rose-400" ${rule.colorClass === 'text-rose-400' ? 'selected' : ''}>🔴 Rose (Merah)</option>
              <option value="text-purple-400" ${rule.colorClass === 'text-purple-400' ? 'selected' : ''}>🟣 Purple (Ungu)</option>
            </select>
          </div>
        </div>

        <div>
          <label class="form-label">Poin-Poin Peraturan (1 Poin Per Baris) <span class="text-rose-400">*</span></label>
          <textarea id="ruleItemsText" class="form-input" rows="5">${itemsText}</textarea>
        </div>

        <div class="flex gap-3 pt-2">
          <button id="submitEditRuleBtn" type="button" class="btn-ucl-primary flex-1 justify-center" style="padding: 10px 16px;">
            💾 Simpan Peraturan
          </button>
          <button type="button" onclick="closeModal()" class="btn-ucl-secondary" style="padding: 10px 16px;">Batal</button>
        </div>
      </div>
    </div>
  `);

  setTimeout(() => {
    const btn = document.getElementById('submitEditRuleBtn');
    if (btn) btn.onclick = () => handleRuleSubmitDirect(ruleId);
  }, 10);
}

function handleRuleSubmitDirect(ruleId = null) {
  const titleEl = document.getElementById('ruleTitle');
  const iconEl = document.getElementById('ruleIcon');
  const colorEl = document.getElementById('ruleColor');
  const itemsTextEl = document.getElementById('ruleItemsText');

  const title = titleEl ? titleEl.value.trim() : '';
  const icon = iconEl ? iconEl.value.trim() : '📜';
  const colorClass = colorEl ? colorEl.value : 'text-cyan-400';
  const itemsText = itemsTextEl ? itemsTextEl.value.trim() : '';
  const items = itemsText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  if (!title) {
    alert('⚠️ Mohon isi Judul Kategori Peraturan.');
    if (titleEl) titleEl.focus();
    return;
  }

  if (items.length === 0) {
    alert('⚠️ Mohon isi minimal 1 poin peraturan.');
    if (itemsTextEl) itemsTextEl.focus();
    return;
  }

  if (ruleId) {
    const rule = tournamentRules.find(r => r.id === ruleId);
    if (rule) {
      rule.title = title;
      rule.icon = icon;
      rule.colorClass = colorClass;
      rule.items = items;
    }
  } else {
    tournamentRules.push({
      id: 'rule-' + Date.now(),
      title,
      icon,
      colorClass,
      items
    });
  }

  saveState();
  closeModal();
  renderApp();
  alert(`✅ Kategori Peraturan "${title}" berhasil disimpan!`);
}
window.handleRuleSubmitDirect = handleRuleSubmitDirect;

function deleteRule(ruleId) {
  const rule = tournamentRules.find(r => r.id === ruleId);
  if (!rule) return;

  if (confirm(`Hapus kategori peraturan: "${rule.title}"?`)) {
    tournamentRules = tournamentRules.filter(r => r.id !== ruleId);
    saveState();
    renderApp();
  }
}

function resetRulesToDefault() {
  if (confirm('🔄 Reset seluruh daftar peraturan ke standard awal turnamen?')) {
    tournamentRules = [...INITIAL_RULES];
    saveState();
    renderApp();
  }
}

// ========== HELPER: GOAL SCORERS & ASSISTS SUMMARY FOR SCOREBOARD ==========
function getMatchGoalEventsSummary(match, teamId) {
  if (!match.events || match.events.length === 0) return '';

  const goals = match.events.filter(e => e.teamId === teamId && (e.eventType === 'GOAL' || e.eventType === 'PENALTY_GOAL' || e.eventType === 'OWN_GOAL'));
  if (goals.length === 0) return '';

  return goals.map(g => {
    const typeIcon = g.eventType === 'PENALTY_GOAL' ? ' (P)' : g.eventType === 'OWN_GOAL' ? ' (OG)' : '';
    const assistEv = match.events.find(e => e.goalId === g.id && e.eventType === 'ASSIST');
    const assistText = assistEv ? ` (ast: ${assistEv.playerFullName.split(' ')[0]})` : '';
    return `<div>⚽ ${g.playerFullName} ${g.minute}'${typeIcon}${assistText}</div>`;
  }).join('');
}

// ========== 1. BERANDA (VISITOR) ==========
function renderVisitorTabContent() {
  renderHomepageHero();
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
    <div class="bracket-card ${isLive ? 'is-live' : isFinished ? 'is-finished' : ''} cursor-pointer" onclick="openPublicMatchDetailModal('${m.id}')" title="Klik untuk melihat Detail Pertandingan &amp; Line-Up Skuad">
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
    const isLive = m.status === 'LIVE';
    const isFinished = m.status === 'FINISHED';
    const statusColor = isLive ? '#22c55e' : isFinished ? '#f59e0b' : '#64748b';
    const statusLabel = isLive ? '🔴 LIVE' : isFinished ? '✅ Selesai' : '⏳ Belum Mulai';
    const scoreStyle = isLive ? 'color:#22c55e; text-shadow: 0 0 12px rgba(34,197,94,0.5);' : 'color:#22d3ee;';

    const homeGoalsSummary = getMatchGoalEventsSummary(m, m.homeTeamId);
    const awayGoalsSummary = getMatchGoalEventsSummary(m, m.awayTeamId);

    const homeCount = players.filter(p => p.teamId === m.homeTeamId).length;
    const awayCount = players.filter(p => p.teamId === m.awayTeamId).length;

    // Calculate real-time timer
    let timerText = m.kickoffTime;
    if (isLive && m.startedAt) {
      const elapsedSec = Math.floor((Date.now() - m.startedAt) / 1000);
      const mins = Math.floor(elapsedSec / 60);
      const secs = elapsedSec % 60;
      const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      const currentMinute = Math.max(1, Math.min(25, mins + 1));
      timerText = `⏱️ ${timeFormatted} (Menit ${currentMinute}')`;
    }

    return `
      <div class="glass-panel p-5 cursor-pointer glass-panel-hover" onclick="openPublicMatchDetailModal('${m.id}')" style="${isLive ? 'border: 1px solid rgba(34,197,94,0.4); box-shadow: 0 0 20px rgba(34,197,94,0.1);' : ''}">
        <div class="flex justify-between items-center mb-2 flex-wrap gap-1">
          <span class="text-xs font-bold text-cyan-400">Match #${m.matchNumber} | ${m.stage.replace(/_/g, ' ')}</span>
          <span style="font-size:11px; font-weight:700; color:${statusColor}; background:${statusColor}22; padding:2px 8px; border-radius:999px; border:1px solid ${statusColor}55;">${statusLabel}</span>
        </div>

        <!-- Full Synchronized Date & Pitch Schedule Banner -->
        <div class="text-[11px] text-slate-300 font-semibold mb-4 pb-2 border-b border-slate-800/80 flex justify-between items-center flex-wrap gap-1">
          <span>📅 ${m.matchDate || 'Sabtu, 14 Maret 2026'} (${m.kickoffTime})</span>
          <span class="text-cyan-300">📍 ${m.pitchLocation}</span>
        </div>

        <div class="flex justify-between items-start">
          <div class="text-center flex-1">
            <img src="${m.homeTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(m.homeTeamName)}" style="width:44px;height:44px;border-radius:50%;margin:0 auto 6px;background:#111;border:2px solid #334155;">
            <span class="font-bold text-white text-xs block mb-1">${m.homeTeamName}</span>
            <div class="text-[11px] text-cyan-300 space-y-0.5">${homeGoalsSummary}</div>
          </div>

          <div class="text-center px-4 pt-1">
            <span class="font-black text-3xl font-mono block" style="${scoreStyle}">${m.homeScore} - ${m.awayScore}</span>
            <span class="block text-xs font-bold mt-1 text-emerald-400 font-mono" id="liveTimerDisplay-${m.id}">${timerText}</span>
          </div>

          <div class="text-center flex-1">
            <img src="${m.awayTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(m.awayTeamName)}" style="width:44px;height:44px;border-radius:50%;margin:0 auto 6px;background:#111;border:2px solid #334155;">
            <span class="font-bold text-white text-xs block mb-1">${m.awayTeamName}</span>
            <div class="text-[11px] text-cyan-300 space-y-0.5">${awayGoalsSummary}</div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs flex-wrap gap-2">
          <span class="text-slate-400">👕 Line-Up: <strong class="text-white">${homeCount} vs ${awayCount} Pemain</strong></span>
          <button onclick="event.stopPropagation(); openPublicMatchDetailModal('${m.id}')" class="btn-ucl-secondary" style="padding: 4px 12px; font-size: 11px; color: #22d3ee; border-color: rgba(34,211,238,0.4);">
            🔍 Lihat Detail &amp; Line-Up Skuad
          </button>
        </div>
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
  const isAdmin = authState.role === 'ADMIN';

  container.innerHTML = filtered.map(m => {
    const statusColor = m.status === 'LIVE' ? '#22c55e' : m.status === 'FINISHED' ? '#f59e0b' : '#64748b';
    const homeGoalsSummary = getMatchGoalEventsSummary(m, m.homeTeamId);
    const awayGoalsSummary = getMatchGoalEventsSummary(m, m.awayTeamId);

    return `
      <div class="glass-panel p-5 cursor-pointer glass-panel-hover" onclick="openPublicMatchDetailModal('${m.id}')">
        <div class="flex justify-between items-center mb-2 flex-wrap gap-2">
          <span class="badge-cyan text-xs">Match #${m.matchNumber} | ${m.stage.replace(/_/g, ' ')}</span>
          <div class="flex items-center gap-2">
            <span style="font-size:11px; font-weight:700; color:${statusColor};">${m.status}</span>
            <button onclick="event.stopPropagation(); openPublicMatchDetailModal('${m.id}')" style="padding: 4px 10px; font-size: 11px; font-weight:700; border-radius: 6px; border: 1px solid rgba(34,211,238,0.4); background: rgba(34,211,238,0.1); color: #22d3ee; cursor: pointer;">🔍 Detail &amp; Line-Up</button>
            ${isAdmin ? `
              <button onclick="event.stopPropagation(); openEditScheduleModal('${m.id}')" style="padding: 4px 10px; font-size: 11px; font-weight:700; border-radius: 6px; border: 1px solid rgba(255,215,0,0.4); background: rgba(255,215,0,0.1); color: #ffd700; cursor: pointer;">📅 Edit Jadwal</button>
            ` : ''}
          </div>
        </div>
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <span class="font-bold text-white text-sm block">${m.homeTeamName}</span>
            <div class="text-[11px] text-cyan-300 mt-1">${homeGoalsSummary}</div>
          </div>
          <span class="font-black text-xl text-cyan-400 font-mono px-4">${m.homeScore} - ${m.awayScore}</span>
          <div class="flex-1 text-right">
            <span class="font-bold text-white text-sm block">${m.awayTeamName}</span>
            <div class="text-[11px] text-cyan-300 mt-1">${awayGoalsSummary}</div>
          </div>
        </div>
        <div class="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-800 flex justify-between items-center flex-wrap gap-2">
          <span>📅 ${m.matchDate || 'Hari 1 (14 Maret 2026)'} | 🕐 ${m.kickoffTime}</span>
          <span>📍 ${m.pitchLocation}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ========== PUBLIC MATCH DETAIL & LINE-UP MODAL ==========
function buildTacticalPitchHTML(homeTeam, awayTeam, homePlayers, awayPlayers) {
  const getStartingSquad = (teamObj, squadList) => {
    if (teamObj?.formationApproved && teamObj?.startingSeven && teamObj.startingSeven.length >= 7) {
      const startingP = teamObj.startingSeven.map(id => squadList.find(p => p.id === id)).filter(Boolean);
      if (startingP.length >= 7) {
        return {
          isCustom: true,
          scheme: teamObj.formationScheme || '2-3-1',
          gk: [startingP[0]],
          df: startingP.slice(1, 3),
          mf: startingP.slice(3, 6),
          fw: startingP.slice(6, 7)
        };
      }
    }
    return {
      isCustom: false,
      scheme: 'Auto 7v7',
      gk: squadList.filter(p => p.position === 'GOALKEEPER'),
      df: squadList.filter(p => p.position === 'DEFENDER'),
      mf: squadList.filter(p => p.position === 'MIDFIELDER'),
      fw: squadList.filter(p => p.position === 'FORWARD')
    };
  };

  const homeCat = getStartingSquad(homeTeam, homePlayers);
  const awayCat = getStartingSquad(awayTeam, awayPlayers);

  const renderPitchNode = (p, teamType) => {
    if (!p) return '';
    const isHome = teamType === 'home';
    const borderCol = isHome ? '#00f0ff' : '#ffd700';
    const bgBadge = isHome ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40' : 'bg-amber-500/20 text-amber-300 border-amber-400/40';
    const posShort = p.position === 'GOALKEEPER' ? 'GK' : p.position === 'DEFENDER' ? 'DF' : p.position === 'MIDFIELDER' ? 'MF' : 'FW';
    
    return `
      <div class="flex flex-col items-center text-center group cursor-pointer my-1" style="min-width: 60px;">
        <div class="relative">
          <img src="${p.photoProfileUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(p.fullName)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;background:#000;border:2px solid ${borderCol};box-shadow:0 0 10px ${borderCol}aa;">
          <span class="absolute -bottom-1 -right-1 text-[9px] font-extrabold px-1 rounded border ${bgBadge}">${posShort}</span>
        </div>
        <span class="text-[10px] font-bold text-white mt-1 px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-700/60 max-w-[90px] truncate" title="${p.fullName}">${String(p.fullName || 'Pemain').split(' ')[0]}</span>
      </div>
    `;
  };

  return `
    <div class="tactical-pitch p-4 rounded-2xl relative overflow-hidden mb-4" style="background: linear-gradient(180deg, #094721 0%, #063518 50%, #094721 100%); border: 3px solid #10b981; box-shadow: inset 0 0 40px rgba(0,0,0,0.6);">
      <!-- Field Lines Overlay -->
      <div class="absolute inset-0 pointer-events-none" style="border: 2px solid rgba(255,255,255,0.3); margin: 8px;"></div>
      <!-- Center Line & Circle -->
      <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-white/30 flex items-center justify-center pointer-events-none">
        <div class="w-24 h-24 rounded-full border-2 border-white/30 -mt-12 flex items-center justify-center">
          <span class="text-[10px] font-bold text-emerald-200/50 uppercase tracking-widest">7v7 PITCH</span>
        </div>
      </div>
      <!-- Top Goal Box (Home) -->
      <div class="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-12 border-b-2 border-x-2 border-white/30 pointer-events-none"></div>
      <!-- Bottom Goal Box (Away) -->
      <div class="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-12 border-t-2 border-x-2 border-white/30 pointer-events-none"></div>

      <div class="relative z-10 space-y-4 py-2">
        <!-- HOME TEAM HALF (Top Side) -->
        <div>
          <div class="flex items-center gap-2 mb-3 justify-center flex-wrap">
            <img src="${homeTeam?.logoUrl || ''}" style="width:18px;height:18px;border-radius:50%;background:#000;">
            <span class="text-xs font-bold text-cyan-300">${homeTeam?.name || 'Tim Home'} [Formasi: ${homeCat.scheme}] ${homeCat.isCustom ? '✅ Approved' : ''}</span>
          </div>

          <!-- GK Zone -->
          <div class="flex justify-center mb-2">
            ${homeCat.gk.length > 0 ? homeCat.gk.map(p => renderPitchNode(p, 'home')).join('') : '<span class="text-[10px] text-emerald-300/60 font-semibold italic">Kiper (GK)</span>'}
          </div>
          <!-- DF Zone -->
          <div class="flex justify-around mb-2 px-4 flex-wrap gap-1">
            ${homeCat.df.length > 0 ? homeCat.df.map(p => renderPitchNode(p, 'home')).join('') : '<span class="text-[10px] text-emerald-300/60 font-semibold italic">Bertahan (DF)</span>'}
          </div>
          <!-- MF Zone -->
          <div class="flex justify-around mb-2 px-6 flex-wrap gap-1">
            ${homeCat.mf.length > 0 ? homeCat.mf.map(p => renderPitchNode(p, 'home')).join('') : '<span class="text-[10px] text-emerald-300/60 font-semibold italic">Gelandang (MF)</span>'}
          </div>
          <!-- FW Zone -->
          <div class="flex justify-center mb-4 flex-wrap gap-1">
            ${homeCat.fw.length > 0 ? homeCat.fw.map(p => renderPitchNode(p, 'home')).join('') : '<span class="text-[10px] text-emerald-300/60 font-semibold italic">Penyerang (FW)</span>'}
          </div>
        </div>

        <!-- AWAY TEAM HALF (Bottom Side) -->
        <div class="pt-4 border-t border-dashed border-white/20">
          <!-- FW Zone -->
          <div class="flex justify-center mb-2 flex-wrap gap-1">
            ${awayCat.fw.length > 0 ? awayCat.fw.map(p => renderPitchNode(p, 'away')).join('') : '<span class="text-[10px] text-amber-300/60 font-semibold italic">Penyerang (FW)</span>'}
          </div>
          <!-- MF Zone -->
          <div class="flex justify-around mb-2 px-6 flex-wrap gap-1">
            ${awayCat.mf.length > 0 ? awayCat.mf.map(p => renderPitchNode(p, 'away')).join('') : '<span class="text-[10px] text-amber-300/60 font-semibold italic">Gelandang (MF)</span>'}
          </div>
          <!-- DF Zone -->
          <div class="flex justify-around mb-2 px-4 flex-wrap gap-1">
            ${awayCat.df.length > 0 ? awayCat.df.map(p => renderPitchNode(p, 'away')).join('') : '<span class="text-[10px] text-amber-300/60 font-semibold italic">Bertahan (DF)</span>'}
          </div>
          <!-- GK Zone -->
          <div class="flex justify-center mb-3">
            ${awayCat.gk.length > 0 ? awayCat.gk.map(p => renderPitchNode(p, 'away')).join('') : '<span class="text-[10px] text-amber-300/60 font-semibold italic">Kiper (GK)</span>'}
          </div>

          <div class="flex items-center gap-2 justify-center flex-wrap">
            <img src="${awayTeam?.logoUrl || ''}" style="width:18px;height:18px;border-radius:50%;background:#000;">
            <span class="text-xs font-bold text-amber-300">${awayTeam?.name || 'Tim Away'} [Formasi: ${awayCat.scheme}] ${awayCat.isCustom ? '✅ Approved' : ''}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function openPublicMatchDetailModal(matchId) {
  const match = matches.find(m => m.id === matchId);
  if (!match) return;

  const homeTeam = teams.find(t => t.id === match.homeTeamId);
  const awayTeam = teams.find(t => t.id === match.awayTeamId);

  const homePlayers = match.homeTeamId ? players.filter(p => p.teamId === match.homeTeamId) : [];
  const awayPlayers = match.awayTeamId ? players.filter(p => p.teamId === match.awayTeamId) : [];

  const homeOfficials = match.homeTeamId ? officials.filter(o => o.teamId === match.homeTeamId) : [];
  const awayOfficials = match.awayTeamId ? officials.filter(o => o.teamId === match.awayTeamId) : [];

  const homeCoach = homeOfficials.find(o => o.role === 'HEAD_COACH');
  const homeOfficial = homeOfficials.find(o => o.role === 'OFFICIAL');

  const awayCoach = awayOfficials.find(o => o.role === 'HEAD_COACH');
  const awayOfficial = awayOfficials.find(o => o.role === 'OFFICIAL');

  const isLive = match.status === 'LIVE';
  const isFinished = match.status === 'FINISHED';
  const statusColor = isLive ? '#22c55e' : isFinished ? '#f59e0b' : '#64748b';
  const statusLabel = isLive ? '🔴 LIVE MATCH' : isFinished ? '✅ SELESAI' : '⏳ SCHEDULED';

  const homeGoalsSummary = getMatchGoalEventsSummary(match, match.homeTeamId);
  const awayGoalsSummary = getMatchGoalEventsSummary(match, match.awayTeamId);

  let timerText = match.kickoffTime;
  if (isLive && match.startedAt) {
    const elapsedSec = Math.floor((Date.now() - match.startedAt) / 1000);
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    const currentMinute = Math.max(1, Math.min(25, mins + 1));
    timerText = `⏱️ ${timeFormatted} (Menit ke-${currentMinute}')`;
  }

  const renderPlayerRowHTML = (p) => {
    const posBg = p.position === 'GOALKEEPER' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  p.position === 'DEFENDER' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                  p.position === 'MIDFIELDER' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    return `
      <div class="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex justify-between items-center text-xs">
        <div class="flex items-center gap-2.5">
          <img src="${p.photoProfileUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(p.fullName)}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;background:#000;">
          <div>
            <span class="font-bold text-white block">${p.fullName}</span>
            <span class="text-[10px] text-slate-400">Usia: ${p.usia || '-'} th</span>
          </div>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${posBg}">${p.position}</span>
          ${p.isSuspended ? `<span class="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold" title="${p.suspensionReason}">⛔ Suspend</span>` : ''}
        </div>
      </div>
    `;
  };

  const pitchHTML = buildTacticalPitchHTML(homeTeam, awayTeam, homePlayers, awayPlayers);

  openModal(`
    <div class="p-1">
      <!-- Header Info -->
      <div class="flex justify-between items-center mb-3 pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div>
          <span class="badge-cyan text-xs">Match #${match.matchNumber} | ${match.stage.replace(/_/g, ' ')}</span>
          <h2 class="text-lg font-bold text-white mt-1">Detail Pertandingan &amp; Visual Formasi</h2>
        </div>
        <span style="font-size:11px; font-weight:700; color:${statusColor}; background:${statusColor}22; padding:3px 10px; border-radius:999px; border:1px solid ${statusColor}55;">${statusLabel}</span>
      </div>

      <!-- Schedule Banner -->
      <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex justify-between items-center flex-wrap gap-2 mb-4">
        <span>📅 ${match.matchDate || 'Sabtu, 14 Maret 2026'} | 🕐 ${match.kickoffTime}</span>
        <span class="text-cyan-400 font-bold">📍 ${match.pitchLocation}</span>
      </div>

      <!-- Scoreboard Center -->
      <div class="flex justify-between items-center gap-4 my-4 p-4 rounded-2xl" style="background: linear-gradient(135deg, rgba(0,0,0,0.8), rgba(15,23,42,0.95)); border: 1px solid rgba(0,240,255,0.2);">
        <div class="text-center flex-1">
          <img src="${match.homeTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(match.homeTeamName)}" style="width:48px;height:48px;border-radius:50%;margin:0 auto 6px;background:#111;border:2px solid #334155;">
          <span class="font-bold text-white text-xs block mb-1">${match.homeTeamName}</span>
          <div class="text-[11px] text-cyan-300 space-y-0.5">${homeGoalsSummary}</div>
        </div>

        <div class="text-center px-4">
          <span class="font-black text-3xl font-mono text-cyan-400">${match.homeScore} - ${match.awayScore}</span>
          <span class="block text-xs font-bold mt-1 text-emerald-400 font-mono">${timerText}</span>
        </div>

        <div class="text-center flex-1">
          <img src="${match.awayTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(match.awayTeamName)}" style="width:48px;height:48px;border-radius:50%;margin:0 auto 6px;background:#111;border:2px solid #334155;">
          <span class="font-bold text-white text-xs block mb-1">${match.awayTeamName}</span>
          <div class="text-[11px] text-cyan-300 space-y-0.5">${awayGoalsSummary}</div>
        </div>
      </div>

      <!-- Detail Tab Controls -->
      <div class="flex border-b border-slate-800 mb-4 gap-2 flex-wrap">
        <button id="modalTabBtn-pitch" class="tab-btn active text-xs py-1.5" onclick="switchMatchDetailModalTab('pitch')">🏟️ Formasi Lapangan 7v7</button>
        <button id="modalTabBtn-lineup" class="tab-btn text-xs py-1.5" onclick="switchMatchDetailModalTab('lineup')">👕 Daftar Roster Skuad (${homePlayers.length} vs ${awayPlayers.length})</button>
        <button id="modalTabBtn-events" class="tab-btn text-xs py-1.5" onclick="switchMatchDetailModalTab('events')">📋 Event &amp; Timeline (${(match.events || []).length})</button>
      </div>

      <!-- Tab 1: Tactical Pitch 7v7 -->
      <div id="modalTabContent-pitch">
        ${pitchHTML}
      </div>

      <!-- Tab 2: Line-Up Skuad Roster -->
      <div id="modalTabContent-lineup" class="hidden space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Home Team Roster -->
          <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div class="flex items-center gap-2 pb-2 mb-3 border-b border-slate-800">
              <img src="${match.homeTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(match.homeTeamName)}" style="width:20px;height:20px;border-radius:50%;">
              <h4 class="font-bold text-white text-xs">${match.homeTeamName}</h4>
              <span class="text-[10px] text-slate-400 ml-auto">(${homePlayers.length} Pemain)</span>
            </div>

            <div class="text-[11px] text-slate-400 mb-3 pb-2 border-b border-slate-800/60 space-y-0.5">
              <div>👨‍💼 Head Coach: <strong class="text-white">${homeCoach?.fullName || 'Belum terdaftar'}</strong></div>
              <div>📋 Official: <strong class="text-white">${homeOfficial?.fullName || 'Belum terdaftar'}</strong></div>
            </div>

            <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
              ${homePlayers.length === 0 ? '<p class="text-xs text-slate-500 py-4 text-center">Belum ada pemain diinput manajer tim.</p>' : homePlayers.map(renderPlayerRowHTML).join('')}
            </div>
          </div>

          <!-- Away Team Roster -->
          <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div class="flex items-center gap-2 pb-2 mb-3 border-b border-slate-800">
              <img src="${match.awayTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(match.awayTeamName)}" style="width:20px;height:20px;border-radius:50%;">
              <h4 class="font-bold text-white text-xs">${match.awayTeamName}</h4>
              <span class="text-[10px] text-slate-400 ml-auto">(${awayPlayers.length} Pemain)</span>
            </div>

            <div class="text-[11px] text-slate-400 mb-3 pb-2 border-b border-slate-800/60 space-y-0.5">
              <div>👨‍💼 Head Coach: <strong class="text-white">${awayCoach?.fullName || 'Belum terdaftar'}</strong></div>
              <div>📋 Official: <strong class="text-white">${awayOfficial?.fullName || 'Belum terdaftar'}</strong></div>
            </div>

            <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
              ${awayPlayers.length === 0 ? '<p class="text-xs text-slate-500 py-4 text-center">Belum ada pemain diinput manajer tim.</p>' : awayPlayers.map(renderPlayerRowHTML).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 3: Event Timeline -->
      <div id="modalTabContent-events" class="hidden">
        <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <h4 class="font-bold text-white text-xs mb-3">Timeline Kejadian Pertandingan</h4>
          <div class="space-y-2 max-h-72 overflow-y-auto">
            ${(match.events || []).length === 0
              ? '<p class="text-xs text-slate-400 py-6 text-center">Belum ada kejadian tercatat.</p>'
              : (match.events || []).slice().sort((a,b) => (a.minute||0)-(b.minute||0)).map(e => `
                <div class="p-2.5 rounded-lg flex justify-between items-center text-xs" style="background: rgba(15,23,42,0.8); border: 1px solid rgba(51,65,85,0.5);">
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-bold text-cyan-400" style="min-width:30px;">${e.minute}'</span>
                    <span class="font-bold text-white">${e.eventType === 'GOAL' ? '⚽ GOL' : e.eventType === 'PENALTY_GOAL' ? '⚽ GOL PENALTI' : e.eventType === 'OWN_GOAL' ? '⚽ GOL BUNUH DIRI' : e.eventType === 'ASSIST' ? '🎯 ASSIST' : e.eventType === 'YELLOW_CARD' ? '🟨 KUNING' : e.eventType === 'RED_CARD' ? '🟥 MERAH' : '🟨🟥 MERAH'} ${e.playerFullName || '-'}</span>
                  </div>
                  <span class="text-slate-400 text-[11px]">${e.teamId === match.homeTeamId ? match.homeTeamName : match.awayTeamName}</span>
                </div>
              `).join('')
            }
          </div>
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-800 flex justify-end">
        <button onclick="closeModal()" class="btn-ucl-secondary" style="padding: 8px 18px; font-size: 12px;">Tutup</button>
      </div>
    </div>
  `);
}

window.switchMatchDetailModalTab = function(tab) {
  ['pitch', 'lineup', 'events'].forEach(t => {
    const btn = document.getElementById(`modalTabBtn-${t}`);
    const content = document.getElementById(`modalTabContent-${t}`);
    if (btn) btn.classList.toggle('active', t === tab);
    if (content) content.classList.toggle('hidden', t !== tab);
  });
};

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

// ========== TEAM MANAGER TACTICAL FORMATION SETTER (DRAG & DROP) ==========
let activeTacticalFormation = {
  teamId: null,
  scheme: '2-3-1',
  startingSeven: []
};

function openSetFormationModal(teamId) {
  const team = teams.find(t => String(t.id) === String(teamId));
  if (!team) {
    alert('⚠️ Data tim tidak ditemukan.');
    return;
  }

  if (!authState.isLoggedIn) {
    alert('⚠️ Anda perlu Login terlebih dahulu sebagai Manajer Tim atau Super Admin untuk mengatur formasi 7v7.');
    switchRole('LOGIN');
    return;
  }

  const teamPlayers = players.filter(p => String(p.teamId) === String(teamId));
  activeTacticalFormation.teamId = team.id;
  activeTacticalFormation.scheme = team.formationScheme || '2-3-1';

  let savedStarting = (team.startingSeven || []).filter(Boolean);
  if (savedStarting.length < 7) {
    const gk = teamPlayers.find(p => p.position === 'GOALKEEPER') || teamPlayers[0];
    const rest = teamPlayers.filter(p => p.id !== gk?.id);
    const initialList = [gk?.id, ...rest.map(p => p.id)].filter(Boolean);
    savedStarting = initialList.slice(0, 7);
    while (savedStarting.length < 7) {
      savedStarting.push(null);
    }
  }
  activeTacticalFormation.startingSeven = [...savedStarting.slice(0, 7)];

  openModal(`
    <div class="p-1">
      <div class="flex justify-between items-center mb-3 pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div>
          <h3 class="text-xl font-bold text-white flex items-center gap-2">
            <span>📋 Interactive Drag &amp; Drop Formasi 7v7</span>
          </h3>
          <p class="text-xs text-cyan-400 mt-0.5">Tarik (drag) pemain dari skuad di kiri &amp; lepaskan (drop) ke posisi di lapangan hijau!</p>
        </div>
        <div class="flex items-center gap-2">
          <img src="${team.logoUrl}" style="width:36px;height:36px;border-radius:50%;background:#000;border:2px solid var(--ucl-cyan);">
          <span class="font-bold text-white text-sm">${team.name}</span>
        </div>
      </div>

      <!-- Tactical Scheme Selector -->
      <div class="mb-4">
        <label class="form-label text-xs">Skema Taktikal Formasi 7v7:</label>
        <select id="formationSchemeSelect" class="form-input font-bold text-cyan-300" onchange="handleSchemeChangeInModal(this.value, '${team.id}')">
          <option value="2-3-1" ${activeTacticalFormation.scheme === '2-3-1' ? 'selected' : ''}>⚽ 2 - 3 - 1 (Standar Minisoccer: 2 DF, 3 MF, 1 FW)</option>
          <option value="3-2-1" ${activeTacticalFormation.scheme === '3-2-1' ? 'selected' : ''}>🛡️ 3 - 2 - 1 (Bertahan / Counter: 3 DF, 2 MF, 1 FW)</option>
          <option value="2-2-2" ${activeTacticalFormation.scheme === '2-2-2' ? 'selected' : ''}>⚖️ 2 - 2 - 2 (Seimbang Grid: 2 DF, 2 MF, 2 FW)</option>
          <option value="1-4-1" ${activeTacticalFormation.scheme === '1-4-1' ? 'selected' : ''}>🎯 1 - 4 - 1 (Penguasaan Bola: 1 DF, 4 MF, 1 FW)</option>
          <option value="3-1-2" ${activeTacticalFormation.scheme === '3-1-2' ? 'selected' : ''}>⚡ 3 - 1 - 2 (Sayap Serang: 3 DF, 1 MF, 2 FW)</option>
        </select>
      </div>

      <!-- Main Drag & Drop Container Grid (2 Cols: Squad Pool & Pitch) -->
      <div id="tacticalBoardModalContent">
        <!-- Rendered dynamically -->
      </div>

      <div class="flex gap-3 pt-4 border-t border-slate-800 mt-4">
        <button id="submitSaveFormationBtn" type="button" class="btn-ucl-primary flex-1 justify-center" style="padding: 10px 16px;">
          ✅ Approve &amp; Publikasikan Formasi ke Live Score
        </button>
        <button type="button" onclick="closeModal()" class="btn-ucl-secondary" style="padding: 10px 16px;">Batal</button>
      </div>
    </div>
  `);

  renderInteractiveFormationBoard(team.id);

  setTimeout(() => {
    const btn = document.getElementById('submitSaveFormationBtn');
    if (btn) btn.onclick = () => handleSaveFormationSubmitDirect(team.id);
  }, 20);
}

function handleSchemeChangeInModal(scheme, teamId) {
  activeTacticalFormation.scheme = scheme;
  renderInteractiveFormationBoard(teamId);
}
window.handleSchemeChangeInModal = handleSchemeChangeInModal;

function renderInteractiveFormationBoard(teamId) {
  const container = document.getElementById('tacticalBoardModalContent');
  if (!container) return;

  const team = teams.find(t => String(t.id) === String(teamId));
  const teamPlayers = players.filter(p => String(p.teamId) === String(teamId));
  const startingIds = activeTacticalFormation.startingSeven;
  const scheme = activeTacticalFormation.scheme;

  const getP = (id) => teamPlayers.find(p => p.id === id);

  const slotLabels = ['1. Penjaga Gawang (GK)', '2. Bek (DF 1)', '3. Bek (DF 2)', '4. Gelandang (MF 1)', '5. Gelandang (MF 2)', '6. Gelandang (MF 3)', '7. Penyerang (FW 1)'];

  // Left Column: Squad Players Pool
  const squadPoolHTML = `
    <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between h-full">
      <div>
        <div class="flex justify-between items-center mb-2">
          <span class="text-xs font-bold text-cyan-400 uppercase tracking-wider">🛡️ Skuad Pemain (${teamPlayers.length})</span>
          <span class="text-[10px] text-slate-400">💡 Drag / Klik Pemain</span>
        </div>
        <div class="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          ${teamPlayers.map(p => {
            const isStarting = startingIds.includes(p.id);
            const posBadgeClass = p.position === 'GOALKEEPER' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : p.position === 'DEFENDER' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : p.position === 'MIDFIELDER' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40';
            return `
              <div 
                draggable="true" 
                ondragstart="handleSquadPlayerDragStart(event, '${p.id}')"
                onclick="handleSquadPlayerClickTap('${p.id}', '${teamId}')"
                class="p-2.5 rounded-lg bg-slate-800 border ${isStarting ? 'border-emerald-500/60 bg-emerald-950/20' : 'border-slate-700/60'} flex items-center justify-between cursor-grab active:cursor-grabbing hover:border-cyan-400 transition-all shadow-sm select-none"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <img src="${p.photoProfileUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(p.fullName)}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;background:#000;">
                  <div class="min-w-0">
                    <span class="font-bold text-white text-xs block truncate">${p.fullName}</span>
                    <span class="text-[10px] text-slate-400 block">KTP/NI: ${p.identityNumber}</span>
                  </div>
                </div>
                <div class="flex flex-col items-end gap-1 flex-shrink-0">
                  <span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${posBadgeClass}">${p.position === 'GOALKEEPER' ? 'GK' : p.position === 'DEFENDER' ? 'DF' : p.position === 'MIDFIELDER' ? 'MF' : 'FW'}</span>
                  ${isStarting ? `<span class="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1 rounded">✓ Starting 7</span>` : `<span class="text-[9px] text-slate-400">Cadangan</span>`}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  // Right Column: Green Tactical Pitch Drop Targets
  const gkP = getP(startingIds[0]);
  const def1P = getP(startingIds[1]);
  const def2P = getP(startingIds[2]);
  const mf1P = getP(startingIds[3]);
  const mf2P = getP(startingIds[4]);
  const mf3P = getP(startingIds[5]);
  const fw1P = getP(startingIds[6]);

  const renderPitchSlotNode = (slotIndex, p, label) => {
    const posShort = slotIndex === 0 ? 'GK' : slotIndex <= 2 ? 'DF' : slotIndex <= 5 ? 'MF' : 'FW';
    return `
      <div 
        ondragover="handlePitchSlotDragOver(event)"
        ondragleave="handlePitchSlotDragLeave(event)"
        ondrop="handlePitchSlotDrop(event, ${slotIndex}, '${teamId}')"
        class="tactical-slot-node flex flex-col items-center text-center my-1 p-1 rounded-xl transition-all cursor-pointer border border-transparent hover:border-cyan-400 hover:bg-white/10"
        title="Drop pemain ke slot ${label}"
      >
        ${p ? `
          <div class="relative">
            <img src="${p.photoProfileUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(p.fullName)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;background:#000;border:2px solid #00f0ff;box-shadow:0 0 10px rgba(0,240,255,0.7);">
            <span class="absolute -bottom-1 -right-1 text-[8px] font-extrabold px-1 rounded bg-cyan-500/80 text-black border border-cyan-300">${posShort}</span>
          </div>
          <span class="text-[10px] font-bold text-white mt-1 px-2 py-0.5 rounded bg-slate-950/90 border border-slate-700 max-w-[90px] truncate block shadow">${String(p.fullName || 'Pemain').split(' ')[0]}</span>
        ` : `
          <div class="w-9 h-9 rounded-full border-2 border-dashed border-cyan-400/60 bg-black/40 flex items-center justify-center text-cyan-300 text-xs font-bold shadow-inner">+</div>
          <span class="text-[9px] text-cyan-300/80 font-semibold mt-1 px-1 rounded bg-slate-950/60 block truncate">${String(label || '').split(' ')[0]}</span>
        `}
      </div>
    `;
  };

  const pitchHTML = `
    <div class="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30">
      <div class="flex justify-between items-center mb-2">
        <span class="text-xs font-bold text-emerald-400">🏟️ Papan Taktik Formasi Lapangan Hijau (${scheme})</span>
        <span class="text-[11px] text-cyan-300">Drop Pemain ke Node Lapangan</span>
      </div>

      <div class="tactical-pitch p-4 rounded-xl relative overflow-hidden shadow-2xl" style="background: linear-gradient(180deg, #094721 0%, #063518 100%); border: 2px solid #10b981;">
        <div class="text-center mb-2">
          <span class="text-[11px] font-bold text-cyan-300 uppercase tracking-widest">${team.name} [Starting VII]</span>
        </div>
        <div class="space-y-3">
          <!-- GK -->
          <div class="flex justify-center">${renderPitchSlotNode(0, gkP, 'GK')}</div>
          <!-- DF -->
          <div class="flex justify-around px-4">${renderPitchSlotNode(1, def1P, 'DF 1')}${renderPitchSlotNode(2, def2P, 'DF 2')}</div>
          <!-- MF -->
          <div class="flex justify-around px-6">${renderPitchSlotNode(3, mf1P, 'MF 1')}${renderPitchSlotNode(4, mf2P, 'MF 2')}${renderPitchSlotNode(5, mf3P, 'MF 3')}</div>
          <!-- FW -->
          <div class="flex justify-center">${renderPitchSlotNode(6, fw1P, 'FW 1')}</div>
        </div>
      </div>

      <!-- Quick Selector Dropdowns for Mobile -->
      <div class="mt-3 pt-3 border-t border-slate-800">
        <span class="text-[11px] font-bold text-slate-400 block mb-2">Alternatif Selector Posisi:</span>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
          ${slotLabels.map((label, idx) => `
            <div>
              <label class="form-label text-[10px] text-cyan-400 mb-0.5 truncate block">${label}</label>
              <select class="form-input text-[11px] py-1 px-1.5" onchange="handleSelectSlotPlayerChange(${idx}, this.value, '${teamId}')">
                ${teamPlayers.map(p => `<option value="${p.id}" ${startingIds[idx] === p.id ? 'selected' : ''}>${String(p.fullName || 'Pemain').split(' ')[0]} (${p.position})</option>`).join('')}
              </select>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
      <div class="md:col-span-5">${squadPoolHTML}</div>
      <div class="md:col-span-7">${pitchHTML}</div>
    </div>
  `;
}

// Drag & Drop Event Handlers for Formation Pitch
function handleSquadPlayerDragStart(e, playerId) {
  e.dataTransfer.setData('text/plain', playerId);
  e.dataTransfer.effectAllowed = 'copyMove';
}
window.handleSquadPlayerDragStart = handleSquadPlayerDragStart;

function handlePitchSlotDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const node = e.currentTarget;
  if (node) {
    node.style.borderColor = '#00f0ff';
    node.style.backgroundColor = 'rgba(0, 240, 255, 0.2)';
    node.style.transform = 'scale(1.08)';
  }
}
window.handlePitchSlotDragOver = handlePitchSlotDragOver;

function handlePitchSlotDragLeave(e) {
  const node = e.currentTarget;
  if (node) {
    node.style.borderColor = 'transparent';
    node.style.backgroundColor = 'transparent';
    node.style.transform = 'scale(1)';
  }
}
window.handlePitchSlotDragLeave = handlePitchSlotDragLeave;

function handlePitchSlotDrop(e, slotIndex, teamId) {
  e.preventDefault();
  const node = e.currentTarget;
  if (node) {
    node.style.borderColor = 'transparent';
    node.style.backgroundColor = 'transparent';
    node.style.transform = 'scale(1)';
  }

  const playerId = e.dataTransfer.getData('text/plain');
  if (!playerId) return;

  assignPlayerToSlot(slotIndex, playerId, teamId);
}
window.handlePitchSlotDrop = handlePitchSlotDrop;

function handleSquadPlayerClickTap(playerId, teamId) {
  const existingSlotIdx = activeTacticalFormation.startingSeven.indexOf(playerId);
  if (existingSlotIdx !== -1) return;

  // find first slot with duplicate
  const currentSet = new Set(activeTacticalFormation.startingSeven);
  if (currentSet.size < 7) {
    for (let i = 0; i < 7; i++) {
      if (activeTacticalFormation.startingSeven.indexOf(activeTacticalFormation.startingSeven[i]) !== i) {
        assignPlayerToSlot(i, playerId, teamId);
        return;
      }
    }
  }
  assignPlayerToSlot(0, playerId, teamId);
}
window.handleSquadPlayerClickTap = handleSquadPlayerClickTap;

function handleSelectSlotPlayerChange(slotIndex, playerId, teamId) {
  assignPlayerToSlot(slotIndex, playerId, teamId);
}
window.handleSelectSlotPlayerChange = handleSelectSlotPlayerChange;

function assignPlayerToSlot(slotIndex, playerId, teamId) {
  const existingSlotIdx = activeTacticalFormation.startingSeven.indexOf(playerId);
  if (existingSlotIdx !== -1 && existingSlotIdx !== slotIndex) {
    const oldPlayerAtTarget = activeTacticalFormation.startingSeven[slotIndex];
    activeTacticalFormation.startingSeven[existingSlotIdx] = oldPlayerAtTarget;
  }
  activeTacticalFormation.startingSeven[slotIndex] = playerId;
  renderInteractiveFormationBoard(teamId);
}

function buildSingleTeamPitchHTML(team, squadList, scheme = '2-3-1') {
  const renderNode = (p) => {
    if (!p) return '<div class="w-8 h-8 rounded-full border border-dashed border-white/30"></div>';
    const posShort = p.position === 'GOALKEEPER' ? 'GK' : p.position === 'DEFENDER' ? 'DF' : p.position === 'MIDFIELDER' ? 'MF' : 'FW';
    return `
      <div class="flex flex-col items-center text-center my-1">
        <div class="relative">
          <img src="${p.photoProfileUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(p.fullName)}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;background:#000;border:2px solid #00f0ff;box-shadow:0 0 8px rgba(0,240,255,0.6);">
          <span class="absolute -bottom-1 -right-1 text-[8px] font-extrabold px-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">${posShort}</span>
        </div>
        <span class="text-[9px] font-bold text-white mt-1 px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-700/60 max-w-[80px] truncate">${String(p.fullName || 'Pemain').split(' ')[0]}</span>
      </div>
    `;
  };

  const gk = squadList[0];
  const defs = squadList.slice(1, 3);
  const mfs = squadList.slice(3, 6);
  const fws = squadList.slice(6, 7);

  return `
    <div class="tactical-pitch p-4 rounded-xl relative overflow-hidden" style="background: linear-gradient(180deg, #094721 0%, #063518 100%); border: 2px solid #10b981;">
      <div class="text-center mb-3">
        <span class="text-xs font-bold text-cyan-300">${team?.name || 'Tim'} [Formasi: ${scheme}]</span>
      </div>
      <div class="space-y-3">
        <!-- GK -->
        <div class="flex justify-center">${renderNode(gk)}</div>
        <!-- DF -->
        <div class="flex justify-around px-4">${defs.map(renderNode).join('')}</div>
        <!-- MF -->
        <div class="flex justify-around px-6">${mfs.map(renderNode).join('')}</div>
        <!-- FW -->
        <div class="flex justify-center">${renderNode(fws[0])}</div>
      </div>
    </div>
  `;
}

function handleSaveFormationSubmitDirect(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (!team) return;

  const teamPlayers = players.filter(p => p.teamId === teamId);
  const startingIds = activeTacticalFormation.startingSeven.filter(Boolean);
  const uniqueCount = new Set(startingIds).size;

  if (teamPlayers.length >= 7 && uniqueCount < 7) {
    alert('⚠️ Mohon pastikan 7 posisi formasi terisi oleh 7 pemain yang berbeda (tidak ada pemain ganda).');
    return;
  }

  team.formationScheme = activeTacticalFormation.scheme;
  team.startingSeven = [...startingIds];
  team.formationApproved = true;

  saveState();
  closeModal();
  renderApp();
  alert(`✅ Formasi 7v7 (${team.formationScheme}) untuk tim "${team.name}" berhasil diapprove & dipublikasikan ke Live Score!`);
}
window.handleSaveFormationSubmitDirect = handleSaveFormationSubmitDirect;

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
        <button onclick="resetAllSuratTugas()" style="padding: 8px 14px; font-size: 13px; font-weight: 700; border-radius: 8px; border: 1px solid rgba(245,158,11,0.5); background: rgba(245,158,11,0.15); color: #fbbf24; cursor: pointer;" title="Kosongkan Berkas Surat Tugas Seluruh Tim">🔄 Reset Surat Tugas (0)</button>
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
              <button onclick="openSetFormationModal('${team.id}')" style="padding: 7px 14px; font-size: 12px; font-weight: 700; border-radius: 8px; border: 1px solid rgba(16,185,129,0.5); background: rgba(16,185,129,0.15); color: #34d399; cursor: pointer;">
                📋 Set Formasi 7v7 ${team.formationApproved ? '✅' : ''}
              </button>
              <button onclick="openEditTeamModal('${team.id}')" style="padding: 7px 14px; font-size: 12px; font-weight: 700; border-radius: 8px; border: 1px solid rgba(34,211,238,0.4); background: rgba(34,211,238,0.08); color: #22d3ee; cursor: pointer;">✏️ Edit Info Tim</button>
              <button onclick="openUploadSuratTugasModal('${team.id}')" style="padding: 7px 14px; font-size: 12px; font-weight: 700; border-radius: 8px; border: 1px solid rgba(255,215,0,0.4); background: rgba(255,215,0,0.08); color: #ffd700; cursor: pointer;">📄 Upload Surat Tugas</button>
              ${authState.role === 'ADMIN' ? `
                <button onclick="deleteTeam('${team.id}')" style="padding: 7px 14px; font-size: 12px; font-weight: 700; border-radius: 8px; border: 1px solid rgba(239,68,68,0.4); background: rgba(239,68,68,0.15); color: #f87171; cursor: pointer;" title="👑 Super Admin: Hapus Tim & Skuad Permanen">🗑️ Hapus Tim</button>
              ` : ''}
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
            <div class="flex items-center gap-2">
              <button onclick="openUploadSuratTugasModal('${team.id}')" class="text-xs font-bold ${team.suratTugasName ? 'text-emerald-300 hover:underline' : 'text-amber-400 hover:underline'}">
                ${team.suratTugasName ? 'Ganti File' : '+ Upload Sekarang'}
              </button>
              ${team.suratTugasName ? `
                <button onclick="deleteSuratTugas('${team.id}')" class="text-xs font-bold text-rose-400 hover:underline ml-2" title="Hapus berkas Surat Tugas">
                  🗑️ Hapus File
                </button>
              ` : ''}
            </div>
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
              <div class="flex items-center gap-2 flex-wrap">
                ${authState.role === 'ADMIN' && teamPlayers.length > 0 ? `
                  <button onclick="deleteAllPlayers('${team.id}')" class="text-xs text-rose-400 font-bold hover:underline mr-2" title="👑 Super Admin: Hapus Seluruh Skuad Pemain">
                    🗑️ Hapus Seluruh Skuad (${teamPlayers.length})
                  </button>
                ` : ''}
                <button class="btn-ucl-primary" style="padding: 6px 12px; font-size: 12px;" ${isPlayerFull ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''} onclick="openAddPlayerModal('${team.id}')">
                  + Tambah Pemain ${isPlayerFull ? '(Maks 14)' : ''}
                </button>
              </div>
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
function getAvailableSlotsList() {
  const available = [];
  for (let i = 0; i < 16; i++) {
    const matchNum = Math.floor(i / 2) + 1;
    const teamType = i % 2 === 0 ? 'home' : 'away';
    const isFilled = drawnSlots.some(s => s.matchNumber === matchNum && s.teamType === teamType);
    if (!isFilled) {
      available.push({ matchNum, teamType, label: `Match #${matchNum} (${teamType === 'home' ? 'Home' : 'Away'})` });
    }
  }
  return available;
}

function renderDrawingEnginePortal() {
  renderDrawingWheelCanvas();
  renderDrawingPoolAndSlots();
}

function handleTargetSlotChange() {
  const selectEl = document.getElementById('targetSlotSelect');
  if (!selectEl) return;
  const val = selectEl.value; // e.g. "1-home" or "3-away"
  if (val) {
    const parts = val.split('-');
    selectedTargetSlot = { matchNumber: parseInt(parts[0]), teamType: parts[1] };
  } else {
    selectedTargetSlot = null;
  }
}

function renderDrawingPoolAndSlots() {
  const availableSlots = getAvailableSlotsList();
  const selectEl = document.getElementById('targetSlotSelect');

  if (selectEl) {
    if (availableSlots.length === 0) {
      selectEl.innerHTML = '<option value="">🎉 ALL 16 SLOTS FILLED!</option>';
      selectedTargetSlot = null;
    } else {
      selectEl.innerHTML = availableSlots.map(s => {
        const val = `${s.matchNum}-${s.teamType}`;
        const isSel = selectedTargetSlot && selectedTargetSlot.matchNumber === s.matchNum && selectedTargetSlot.teamType === s.teamType;
        return `<option value="${val}" ${isSel ? 'selected' : ''}>🎯 ${s.label}</option>`;
      }).join('');

      if (!selectedTargetSlot || !availableSlots.some(s => s.matchNum === selectedTargetSlot.matchNumber && s.teamType === selectedTargetSlot.teamType)) {
        selectedTargetSlot = { matchNumber: availableSlots[0].matchNum, teamType: availableSlots[0].teamType };
      }
    }
  }

  // 1. Remaining Teams Pool (Filter out already drawn teams!)
  const drawnTeamIds = drawnSlots.map(s => s.teamId);
  const remainingTeams = teams.filter(t => !drawnTeamIds.includes(t.id));

  const poolGrid = document.getElementById('remainingTeamsPoolGrid');
  const countBadge = document.getElementById('remainingTeamsCountBadge');
  if (countBadge) countBadge.textContent = `${remainingTeams.length} Tim Tersisa`;

  if (poolGrid) {
    const isAdmin = authState.role === 'ADMIN';
    poolGrid.innerHTML = remainingTeams.length === 0
      ? '<p class="text-xs text-emerald-400 py-2 w-full text-center font-bold">🎉 Semua 16 Tim telah diundi ke dalam slot!</p>'
      : remainingTeams.map(t => `
        <div class="pool-team-badge px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 flex items-center gap-2 text-xs font-bold text-white cursor-grab" ${isAdmin ? `draggable="true" ondragstart="handlePoolTeamDragStart(event, '${t.id}')" title="👑 Super Admin: Tarik (drag) tim ini langsung ke slot Match di bawah untuk Seeding"` : ''}>
          ${isAdmin ? '<span class="text-xs text-cyan-400">⋮⋮</span>' : ''}
          <img src="${t.logoUrl}" style="width:18px;height:18px;border-radius:50%;">
          <span>${t.name}</span>
        </div>
      `).join('');
  }

  // 2. Drawn Slots Table (Match 1-8 Home/Away as Drop Zones)
  const slotsTable = document.getElementById('drawnSlotsTable');
  if (!slotsTable) return;

  const totalR16Slots = 16;
  const isAdmin = authState.role === 'ADMIN';
  let html = '';

  for (let i = 0; i < totalR16Slots; i++) {
    const mNum = Math.floor(i / 2) + 1;
    const tType = i % 2 === 0 ? 'home' : 'away';
    const tTypeLabel = i % 2 === 0 ? 'Home' : 'Away';

    const drawnItem = drawnSlots.find(s => s.matchNumber === mNum && s.teamType === tType);
    const teamObj = drawnItem ? teams.find(t => t.id === drawnItem.teamId) : null;

    const dropAttrs = isAdmin ? `ondragover="handleSlotDragOver(event)" ondragleave="handleSlotDragLeave(event)" ondrop="handleSlotDrop(event, ${mNum}, '${tType}')" title="👑 Super Admin: Lepaskan (drop) tim di sini"` : '';

    html += `
      <div class="drawing-slot-dropzone p-2.5 rounded-lg flex justify-between items-center text-xs" style="background: rgba(15,23,42,0.8); border: 1px solid ${teamObj ? 'rgba(0,240,255,0.4)' : 'rgba(51,65,85,0.4)'}" ${dropAttrs}>
        <div class="flex items-center gap-3">
          <span class="font-mono font-bold text-cyan-400" style="min-width: 100px;">Match #${mNum} (${tTypeLabel})</span>
          ${teamObj ? `
            <div class="flex items-center gap-2 font-bold text-white">
              <img src="${teamObj.logoUrl}" style="width:20px;height:20px;border-radius:50%;">
              <span>${teamObj.name}</span>
            </div>
          ` : `<span class="text-slate-500 italic">⏳ Drop Tim / Spin Wheel</span>`}
        </div>
        ${teamObj ? `
          <button onclick="removeDrawnTeam('${teamObj.id}')" class="text-rose-400 font-bold hover:underline" title="Hapus tim dari slot (kembali ke Spin Wheel)">🗑️ Hapus</button>
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

  const availableSlots = getAvailableSlotsList();
  if (availableSlots.length === 0) {
    alert('🎉 Seluruh slot 16 Besar sudah terisi!');
    return;
  }

  // Determine target slot to fill
  let targetSlot = selectedTargetSlot;
  if (!targetSlot || !availableSlots.some(s => s.matchNum === targetSlot.matchNumber && s.teamType === targetSlot.teamType)) {
    targetSlot = { matchNumber: availableSlots[0].matchNum, teamType: availableSlots[0].teamType };
  }

  isSpinning = true;
  const spinBtn = document.getElementById('spinWheelBtn');
  if (spinBtn) { spinBtn.disabled = true; spinBtn.textContent = '🔄 MEMUTAR RODA...'; }

  // Pick random winner index from REMAINING teams only
  const winnerIndex = Math.floor(Math.random() * remainingTeams.length);
  const winningTeam = remainingTeams[winnerIndex];

  const numSlices = remainingTeams.length;
  const sliceAngle = (Math.PI * 2) / numSlices;

  const targetSectorAngle = (winnerIndex + 0.5) * sliceAngle;
  const extraRounds = (4 + Math.floor(Math.random() * 3)) * Math.PI * 2;
  const targetTotalAngle = currentWheelAngle + extraRounds + (Math.PI * 1.5 - targetSectorAngle - (currentWheelAngle % (Math.PI * 2)));

  const startAngle = currentWheelAngle;
  const duration = 3500;
  const startTime = performance.now();

  function animateSpin(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const easeOut = 1 - Math.pow(1 - progress, 3);
    currentWheelAngle = startAngle + (targetTotalAngle - startAngle) * easeOut;

    renderDrawingWheelCanvas();

    if (progress < 1) {
      requestAnimationFrame(animateSpin);
    } else {
      isSpinning = false;
      if (spinBtn) { spinBtn.disabled = false; spinBtn.textContent = '🎡 SPIN WHEEL (PUTAR UNDIAN)'; }

      drawnSlots.push({
        matchNumber: targetSlot.matchNumber,
        teamType: targetSlot.teamType,
        teamId: winningTeam.id
      });

      selectedTargetSlot = null;
      saveState();
      renderApp();

      const slotLabel = `Match #${targetSlot.matchNumber} (${targetSlot.teamType.toUpperCase()})`;

      openModal(`
        <div class="text-center p-4">
          <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
          <h3 class="text-xs uppercase tracking-widest text-cyan-400 font-bold mb-1">HASIL UNDIAN ${slotLabel}</h3>
          <img src="${winningTeam.logoUrl}" style="width:70px;height:70px;border-radius:50%;margin:12px auto;background:#000;border:3px solid var(--ucl-gold);">
          <h2 class="text-2xl font-bold text-white mb-2">${winningTeam.name}</h2>
          <p class="text-sm text-slate-300 mb-6">${winningTeam.facultyUnit}</p>
          <button onclick="closeModal()" class="btn-ucl-primary" style="justify-content: center; width:100%;">Lanjutkan Undian ➡️</button>
        </div>
      `);
    }
  }

  requestAnimationFrame(animateSpin);
}

function resetDrawingState() {
  if (confirm('🔄 Kosongkan hasil undian roda & reset seluruh slot 16 Besar ke "Tim 1", "Tim 2" ... "Tim 16"?')) {
    drawnSlots = [];
    selectedTargetSlot = null;

    // Reset Round of 16 match team names to default placeholders Tim 1..Tim 16
    for (let i = 1; i <= 8; i++) {
      const m = matches.find(match => match.matchNumber === i && match.stage === 'ROUND_OF_16');
      if (m) {
        const homeNum = (i * 2) - 1;
        const awayNum = i * 2;
        m.homeTeamId = `t${homeNum}`;
        m.homeTeamName = `Tim ${homeNum}`;
        m.homeTeamLogo = `https://api.dicebear.com/7.x/identicon/svg?seed=Tim${homeNum}`;
        m.awayTeamId = `t${awayNum}`;
        m.awayTeamName = `Tim ${awayNum}`;
        m.awayTeamLogo = `https://api.dicebear.com/7.x/identicon/svg?seed=Tim${awayNum}`;
        m.homeScore = 0;
        m.awayScore = 0;
        m.status = 'SCHEDULED';
        m.startedAt = null;
        m.events = [];
        m.cards = [];
      }
    }

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
        <img src="${t.logoUrl}" style="width: 44px; height: 44px; border-radius: 50%; background: #000; border: 2px solid var(--ucl-cyan);">
        <div>
          <span class="font-bold text-white text-base block">${t.name}</span>
          <div class="text-xs text-cyan-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>${t.facultyUnit}</span>
            <span>•</span>
            <span>Surat Tugas:</span>
            ${t.suratTugasName ? `
              <span class="text-emerald-400 font-bold">📄 ${t.suratTugasName}</span>
              <button onclick="deleteSuratTugas('${t.id}')" class="text-rose-400 font-bold hover:underline ml-1" title="Hapus Berkas Surat Tugas">🗑️ Hapus</button>
            ` : `
              <span class="text-amber-400 italic">❌ Belum upload</span>
              <button onclick="openUploadSuratTugasModal('${t.id}')" class="text-cyan-400 font-bold hover:underline ml-1">📤 Upload</button>
            `}
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <span class="badge-${t.status === 'APPROVED' ? 'gold' : t.status === 'REJECTED' ? 'danger' : 'cyan'}">${t.status}</span>
        <button onclick="openSetFormationModal('${t.id}')" style="padding: 5px 12px; font-size: 11px; font-weight:700; border-radius:6px; border:1px solid rgba(16,185,129,0.5); background:rgba(16,185,129,0.15); color:#34d399; cursor:pointer;" title="Atur Formasi 7v7 Taktikal">📋 Formasi 7v7 ${t.formationApproved ? '✅' : ''}</button>
        <button onclick="openEditTeamModal('${t.id}')" style="padding: 5px 10px; font-size: 11px; font-weight:700; border-radius:6px; border:1px solid rgba(34,211,238,0.4); background:rgba(34,211,238,0.08); color:#22d3ee; cursor:pointer;">✏️ Edit</button>
        ${t.status === 'PENDING' ? `
          <button onclick="approveTeam('${t.id}')" class="btn-ucl-primary" style="padding: 5px 12px; font-size: 11px;">Approve</button>
          <button onclick="rejectTeam('${t.id}')" class="btn-danger" style="padding: 5px 12px; font-size: 11px;">Reject</button>
        ` : ''}
        <button onclick="deleteTeam('${t.id}')" style="padding: 5px 10px; font-size: 11px; font-weight:700; border-radius:6px; border:1px solid rgba(239,68,68,0.4); background:rgba(239,68,68,0.15); color:#f87171; cursor:pointer;" title="👑 Super Admin: Hapus Tim & Skuad Permanen">🗑️ Hapus Tim</button>
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
      <div class="text-[11px] text-slate-400 mt-1">📅 ${m.matchDate || 'Hari 1'} | 🕐 ${m.kickoffTime}</div>
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

  // Real-time minute calculation for form default
  let currentMinuteDefault = 1;
  let timerText = match.kickoffTime;
  if (isLive && match.startedAt) {
    const elapsedSec = Math.floor((Date.now() - match.startedAt) / 1000);
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    currentMinuteDefault = Math.max(1, Math.min(25, mins + 1));
    timerText = `⏱️ ${timeFormatted} (Menit ke-${currentMinuteDefault}')`;
  }

  panel.innerHTML = `
    <div class="flex justify-between items-start pb-4 border-b border-slate-800 mb-6 flex-wrap gap-3">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="badge-cyan text-xs">Match #${match.matchNumber} | ${match.stage.replace(/_/g, ' ')}</span>
          <span style="font-size:11px; font-weight:700; color:${statusColor}; background: ${statusColor}22; padding: 2px 8px; border-radius:999px; border: 1px solid ${statusColor}55;">${statusLabel}</span>
        </div>
        <h3 class="text-xl font-bold text-white">${match.homeTeamName} vs ${match.awayTeamName}</h3>
        <p class="text-xs text-slate-400 mt-1">📅 ${match.matchDate || 'Hari 1 (14 Maret 2026)'} | 🕐 ${match.kickoffTime} | 📍 ${match.pitchLocation}</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        ${isScheduled ? `<button class="btn-ucl-primary" style="padding: 7px 14px; font-size: 13px; background: linear-gradient(135deg,#16a34a,#15803d);" onclick="startMatch('${match.id}')">▶ Mulai Pertandingan (Start Timer)</button>` : ''}
        ${isLive ? `<button class="btn-ucl-primary" style="padding: 7px 14px; font-size: 13px;" onclick="finishMatch('${match.id}')">🏁 Peluit Akhir & Majukan Pemenang</button>` : ''}
        <button class="btn-ucl-secondary" style="padding: 7px 14px; font-size: 13px;" onclick="openEditScheduleModal('${match.id}')">📅 Edit Jadwal</button>
        <button class="btn-ucl-secondary" style="padding: 7px 14px; font-size: 13px;" onclick="openEditScoreModal('${match.id}')">✏️ Edit Skor Manual</button>
        <button onclick="resetSingleMatch('${match.id}')" style="padding: 7px 14px; font-size: 13px; font-weight:700; border-radius:8px; border:1px solid rgba(239,68,68,0.4); background:rgba(239,68,68,0.1); color:#f87171; cursor:pointer;" title="Reset skor dan event match ini ke 0-0 Scheduled">🔄 Reset Match</button>
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
        <div class="mt-2 text-xs font-bold text-emerald-400 font-mono" id="liveTimerDisplay-${match.id}">${timerText}</div>
      </div>
      <div class="text-center" style="min-width: 130px;">
        <img src="${match.awayTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(match.awayTeamName)}" style="width: 52px; height: 52px; border-radius: 50%; margin: 0 auto 8px; background: #111; border: 2px solid #334155;">
        <span class="font-bold text-white block text-sm">${match.awayTeamName}</span>
      </div>
    </div>

    ${isScheduled ? `<div class="p-4 rounded-xl text-center" style="background: rgba(100,116,139,0.1); border: 1px solid rgba(100,116,139,0.3); margin-bottom: 16px;"><p class="text-slate-400 text-sm">⏳ Pertandingan belum dimulai. Klik <strong class="text-white">"▶ Mulai Pertandingan"</strong> untuk memulai Stopwatch &amp; Timer Otomatis.</p></div>` : ''}

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
      <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div class="flex justify-between items-center mb-3">
          <h4 class="font-bold text-cyan-400 text-sm">⚽ + Input Event &amp; Assist Pertandingan</h4>
          <span class="text-xs text-amber-300">⏱️ Menit Real-Time Otomatis</span>
        </div>

        <form onsubmit="addMatchEvent(event, '${match.id}')" class="space-y-3">
          <div>
            <label class="form-label flex justify-between">
              <span>Menit Kejadian</span>
              <span class="text-xs text-cyan-400 font-normal">Otomatis / Edit Manual</span>
            </label>
            <input type="number" id="eventMinute" class="form-input" min="1" max="60" value="${currentMinuteDefault}" oninput="this.dataset.userEdited = 'true'" required>
          </div>

          <div><label class="form-label">Tipe Event</label>
            <select id="eventTypeSelect" class="form-input" required>
              <option value="GOAL">⚽ Gol Biasa</option>
              <option value="PENALTY_GOAL">⚽ Gol Penalti</option>
              <option value="OWN_GOAL">⚽ Gol Bunuh Diri</option>
              <option value="ASSIST">🎯 Assist (Umpan Gol)</option>
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

          <div><label class="form-label">Pencetak Gol / Pemain Utama</label>
            <select id="eventPlayerSelect" class="form-input">
              <option value="">-- Pilih Pemain --</option>
              ${allPlayersForMatch.map(p => `<option value="${p.id}">${p.fullName} (${p.position})${p.isSuspended ? ' [SUSPENDED]' : ''}</option>`).join('')}
            </select>
          </div>

          <div><label class="form-label">Pemberi Assist (Opsional)</label>
            <select id="eventAssistPlayerSelect" class="form-input">
              <option value="">-- Tidak Ada / Tanpa Assist --</option>
              ${allPlayersForMatch.map(p => `<option value="${p.id}">${p.fullName} (${p.position})</option>`).join('')}
            </select>
          </div>

          <button type="submit" class="btn-ucl-primary w-full" style="justify-content: center;">💾 Simpan Event</button>
        </form>
      </div>

      <!-- Timeline with Delete / Koreksi button -->
      <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <h4 class="font-bold text-white text-sm mb-3">📋 Timeline Pertandingan</h4>
        <div class="space-y-2 max-h-80 overflow-y-auto">
          ${(match.events || []).length === 0
            ? '<p class="text-xs text-slate-400 py-6 text-center">Belum ada kejadian.</p>'
            : (match.events || []).slice().sort((a,b) => (a.minute||0)-(b.minute||0)).map(e => `
              <div class="p-2.5 rounded-lg flex justify-between items-center text-xs" style="background: rgba(15,23,42,0.8); border: 1px solid rgba(51,65,85,0.5);">
                <div class="flex items-center gap-2 flex-1">
                  <span class="font-mono font-bold text-cyan-400" style="min-width:30px;">${e.minute}'</span>
                  <span class="font-bold text-white">${e.eventType === 'GOAL' ? '⚽ GOL' : e.eventType === 'PENALTY_GOAL' ? '⚽ GOL PENALTI' : e.eventType === 'OWN_GOAL' ? '⚽ GOL BUNUH DIRI' : e.eventType === 'ASSIST' ? '🎯 ASSIST' : e.eventType === 'YELLOW_CARD' ? '🟨 KUNING' : e.eventType === 'RED_CARD' ? '🟥 MERAH' : '🟨🟥 MERAH'} ${e.playerFullName || '-'}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-slate-400">${e.teamId === match.homeTeamId ? match.homeTeamName.split(' ')[0] : match.awayTeamName.split(' ')[0]}</span>
                  <button onclick="deleteMatchEvent('${match.id}', '${e.id}')" class="text-rose-400 font-bold hover:underline ml-1" title="Hapus / Koreksi Event ini">🗑️ Hapus</button>
                </div>
              </div>
            `).join('')
          }
        </div>
      </div>
    </div>
  `;
}

// ========== MATCH ACTIONS ==========
function startMatch(matchId) {
  const match = matches.find(m => m.id === matchId);
  if (!match) return;
  if (match.status !== 'SCHEDULED') { alert('Match ini sudah dimulai atau selesai.'); return; }
  match.status = 'LIVE';
  match.startedAt = Date.now(); // Record start timestamp for automatic real-time timer
  saveState();
  renderApp();
}

function resetSingleMatch(matchId) {
  const match = matches.find(m => m.id === matchId);
  if (!match) return;

  if (confirm(`🔄 Reset pertandingan Match #${match.matchNumber} (${match.homeTeamName} vs ${match.awayTeamName})?\nSeluruh skor dan event akan dikembalikan ke 0-0.`)) {
    match.homeScore = 0;
    match.awayScore = 0;
    match.status = 'SCHEDULED';
    match.startedAt = null;
    match.events = [];
    match.cards = [];
    saveState();
    renderApp();
    alert(`Match #${match.matchNumber} berhasil di-reset.`);
  }
}

function openEditScheduleModal(matchId) {
  const match = matches.find(m => m.id === matchId);
  if (!match) return;

  openModal(`
    <h3 class="text-xl font-bold text-white mb-1">📅 Edit Jadwal &amp; Lokasi Pertandingan</h3>
    <p class="text-sm text-slate-400 mb-5">Match #${match.matchNumber}: <strong class="text-cyan-300">${match.homeTeamName}</strong> vs <strong class="text-cyan-300">${match.awayTeamName}</strong></p>
    
    <form onsubmit="handleEditScheduleSubmit(event, '${matchId}')" class="space-y-4">
      <div>
        <label class="form-label">Hari &amp; Tanggal Pertandingan <span class="text-rose-400">*</span></label>
        <input type="text" id="editMatchDate" class="form-input" value="${match.matchDate || 'Sabtu, 14 Maret 2026'}" placeholder="misal: Sabtu, 14 Maret 2026" required>
      </div>
      <div>
        <label class="form-label">Waktu / Jam Kickoff <span class="text-rose-400">*</span></label>
        <input type="text" id="editMatchTime" class="form-input" value="${match.kickoffTime || '08:00 WIB'}" placeholder="misal: 08:30 WIB" required>
      </div>
      <div>
        <label class="form-label">Lokasi Lapangan / Venue <span class="text-rose-400">*</span></label>
        <input type="text" id="editMatchPitch" class="form-input" value="${match.pitchLocation || 'UMS Stadium Field A'}" placeholder="misal: Lapangan A UMS Stadium" required>
      </div>

      <div class="flex gap-3 pt-2">
        <button type="submit" class="btn-ucl-primary flex-1" style="justify-content: center;">💾 Simpan Jadwal</button>
        <button type="button" onclick="closeModal()" class="btn-ucl-secondary" style="padding: 10px 16px;">Batal</button>
      </div>
    </form>
  `);
}

function handleEditScheduleSubmit(e, matchId) {
  e.preventDefault();
  const match = matches.find(m => m.id === matchId);
  if (!match) return;

  match.matchDate = document.getElementById('editMatchDate').value.trim();
  match.kickoffTime = document.getElementById('editMatchTime').value.trim();
  match.pitchLocation = document.getElementById('editMatchPitch').value.trim();

  closeModal();
  saveState();
  renderApp();
  alert(`✅ Jadwal Match #${match.matchNumber} berhasil diperbarui!\n${match.matchDate} | ${match.kickoffTime} | ${match.pitchLocation}`);
}

function addMatchEvent(e, matchId) {
  e.preventDefault();
  const match = matches.find(m => m.id === matchId);
  if (!match) return;

  const minute = parseInt(document.getElementById('eventMinute').value);
  const eventType = document.getElementById('eventTypeSelect').value;
  const teamId = document.getElementById('eventTeamSelect').value;
  
  const playerSelect = document.getElementById('eventPlayerSelect');
  const playerId = playerSelect ? playerSelect.value : null;
  const playerObj = playerId ? players.find(p => p.id === playerId) : null;
  const playerFullName = playerObj ? playerObj.fullName : 'Pemain tidak terdaftar';

  const assistSelect = document.getElementById('eventAssistPlayerSelect');
  const assistPlayerId = assistSelect ? assistSelect.value : null;
  const assistPlayerObj = assistPlayerId ? players.find(p => p.id === assistPlayerId) : null;

  if (!match.events) match.events = [];

  const goalEvId = 'ev-' + Date.now();
  match.events.push({ id: goalEvId, minute, eventType, teamId, playerId, playerFullName });

  if (assistPlayerObj && (eventType === 'GOAL' || eventType === 'PENALTY_GOAL')) {
    match.events.push({
      id: 'ev-ast-' + Date.now(),
      goalId: goalEvId,
      minute,
      eventType: 'ASSIST',
      teamId,
      playerId: assistPlayerId,
      playerFullName: assistPlayerObj.fullName
    });
  }

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

function deleteMatchEvent(matchId, eventId) {
  const match = matches.find(m => m.id === matchId);
  if (!match || !match.events) return;

  const ev = match.events.find(e => e.id === eventId);
  if (!ev) return;

  if (confirm(`Hapus/koreksi event: "${ev.eventType} - ${ev.playerFullName}"?`)) {
    if (ev.eventType === 'GOAL' || ev.eventType === 'PENALTY_GOAL') {
      if (ev.teamId === match.homeTeamId && match.homeScore > 0) match.homeScore -= 1;
      else if (ev.teamId === match.awayTeamId && match.awayScore > 0) match.awayScore -= 1;
      match.events = match.events.filter(e => e.goalId !== eventId);
    } else if (ev.eventType === 'OWN_GOAL') {
      if (ev.teamId === match.homeTeamId && match.awayScore > 0) match.awayScore -= 1;
      else if (ev.teamId === match.awayTeamId && match.homeScore > 0) match.homeScore -= 1;
    }

    match.events = match.events.filter(e => e.id !== eventId);

    if (match.cards) {
      match.cards = match.cards.filter(c => c.minute !== ev.minute || c.playerId !== ev.playerId);
    }

    saveState();
    renderApp();
  }
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
    <div class="p-1">
      <h3 class="text-xl font-bold text-white mb-1">✏️ Edit Skor Manual</h3>
      <p class="text-sm text-slate-400 mb-5">Match #${match.matchNumber}: <strong class="text-cyan-300">${match.homeTeamName}</strong> vs <strong class="text-cyan-300">${match.awayTeamName}</strong></p>
      
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="form-label">Skor ${match.homeTeamName}</label><input type="number" id="editHomeScore" class="form-input" min="0" max="99" value="${match.homeScore}"></div>
          <div><label class="form-label">Skor ${match.awayTeamName}</label><input type="number" id="editAwayScore" class="form-input" min="0" max="99" value="${match.awayScore}"></div>
        </div>
        <div><label class="form-label">Status Pertandingan</label>
          <select id="editMatchStatus" class="form-input">
            <option value="SCHEDULED" ${match.status === 'SCHEDULED' ? 'selected' : ''}>⏳ BELUM MULAI</option>
            <option value="LIVE" ${match.status === 'LIVE' ? 'selected' : ''}>🔴 LIVE</option>
            <option value="FINISHED" ${match.status === 'FINISHED' ? 'selected' : ''}>✅ SELESAI</option>
          </select>
        </div>
        <div class="p-3 rounded-lg" style="background: rgba(34,211,238,0.05); border: 1px solid rgba(34,211,238,0.2);"><p class="text-xs text-slate-300">💡 Status SELESAI = pemenang otomatis dimajukan ke babak berikutnya.</p></div>
        
        <div class="flex gap-3 pt-2">
          <button id="submitEditScoreBtn" type="button" class="btn-ucl-primary flex-1 justify-center" style="padding: 10px 16px;">
            💾 Simpan Skor
          </button>
          <button type="button" onclick="closeModal()" class="btn-ucl-secondary" style="padding: 10px 16px;">Batal</button>
        </div>
      </div>
    </div>
  `);

  setTimeout(() => {
    const btn = document.getElementById('submitEditScoreBtn');
    if (btn) btn.onclick = () => handleEditScoreSubmitDirect(matchId);
  }, 10);
}

function handleEditScoreSubmitDirect(matchId) {
  const match = matches.find(m => m.id === matchId);
  if (!match) return;

  const homeScoreEl = document.getElementById('editHomeScore');
  const awayScoreEl = document.getElementById('editAwayScore');
  const statusEl = document.getElementById('editMatchStatus');

  match.homeScore = parseInt(homeScoreEl ? homeScoreEl.value : 0) || 0;
  match.awayScore = parseInt(awayScoreEl ? awayScoreEl.value : 0) || 0;

  const wasFinished = match.status === 'FINISHED';
  match.status = statusEl ? statusEl.value : match.status;

  if (match.status === 'FINISHED' && !wasFinished) advanceWinner(match);

  closeModal();
  saveState();
  renderApp();
  alert(`✅ Skor diperbarui: ${match.homeTeamName} ${match.homeScore} - ${match.awayScore} ${match.awayTeamName} [${match.status}]`);
}
window.handleEditScoreSubmitDirect = handleEditScoreSubmitDirect;

// ========== ADMIN ACTIONS ==========
function approveTeam(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (team) { team.status = 'APPROVED'; saveState(); renderApp(); }
}

function rejectTeam(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (team) { team.status = 'REJECTED'; saveState(); renderApp(); }
}

function deleteTeam(teamId) {
  if (authState.role !== 'ADMIN') return;
  const team = teams.find(t => t.id === teamId);
  if (!team) return;

  if (confirm(`⚠️ HAPUS TIM PERMANEN?\n\nYakin ingin menghapus tim "${team.name}"?\nSeluruh data pemain, official, berkas Surat Tugas, dan histori tim ini akan dihapus secara permanen.`)) {
    teams = teams.filter(t => t.id !== teamId);
    players = players.filter(p => p.teamId !== teamId);
    officials = officials.filter(o => o.teamId !== teamId);
    drawnSlots = drawnSlots.filter(s => s.teamId !== teamId);

    matches.forEach(m => {
      if (m.homeTeamId === teamId) {
        m.homeTeamId = 't-empty';
        m.homeTeamName = 'Tim Kosong';
        m.homeTeamLogo = '';
      }
      if (m.awayTeamId === teamId) {
        m.awayTeamId = 't-empty';
        m.awayTeamName = 'Tim Kosong';
        m.awayTeamLogo = '';
      }
    });

    saveState();
    renderApp();
    alert(`✅ Tim "${team.name}" dan seluruh berkas/pemainnya berhasil dihapus.`);
  }
}

function deleteSuratTugas(teamId) {
  const team = teams.find(t => String(t.id) === String(teamId));
  if (!team) return;

  const isEditable = authState.isLoggedIn && (authState.role === 'ADMIN' || authState.role === 'MANAGER' || authState.teamId === teamId);
  if (!isEditable) {
    alert('⚠️ Mohon login terlebih dahulu sebagai Super Admin atau Manajer tim ini untuk menghapus Surat Tugas.');
    return;
  }

  team.suratTugasName = null;
  saveState();
  renderApp();
  alert(`✅ Berkas Surat Tugas tim "${team.name}" berhasil dihapus.`);
}
window.deleteSuratTugas = deleteSuratTugas;

function resetAllSuratTugas() {
  teams.forEach(t => {
    t.suratTugasName = null;
  });
  saveState();
  renderApp();
  alert('✅ Berkas Surat Tugas seluruh tim (16 tim) berhasil dikosongkan (status: Belum diunggah).');
}
window.resetAllSuratTugas = resetAllSuratTugas;

function deleteAllPlayers(teamId) {
  if (authState.role !== 'ADMIN') return;
  const team = teams.find(t => t.id === teamId);
  if (!team) return;

  if (confirm(`Hapus SELURUH Skuad Pemain dari tim "${team.name}"?`)) {
    players = players.filter(p => p.teamId !== teamId);
    saveState();
    renderApp();
    alert(`✅ Seluruh pemain tim "${team.name}" berhasil dihapus.`);
  }
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
  if (confirm('Reset semua data pertandingan?\nSemua skor kembali 0-0, status SCHEDULED, dan bagan kembali ke Tim 1 s.d Tim 16.')) {
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
  const team = teams.find(t => String(t.id) === String(teamId));
  if (!team) return;

  openModal(`
    <div class="p-1">
      <h3 class="text-xl font-bold text-white mb-1">📄 Upload File Surat Tugas Dekanat / Unit</h3>
      <p class="text-sm text-slate-400 mb-5">Tim: <strong class="text-cyan-300">${team.name}</strong></p>
      
      <div class="space-y-4">
        <div>
          <label class="form-label">Pilih Berkas Surat Tugas (PDF / Gambar) <span class="text-rose-400">*</span></label>
          <input type="file" id="suratTugasFileInput" accept=".pdf,.png,.jpg,.jpeg" class="form-input" style="padding: 8px;">
        </div>

        <div class="p-3 rounded-lg" style="background: rgba(255,215,0,0.08); border: 1px solid rgba(255,215,0,0.2);">
          <p class="text-xs text-amber-300">💡 Surat Tugas resmi wajib diunggah sebagai bukti verifikasi keikutsertaan turnamen.</p>
        </div>

        <div class="flex gap-3 pt-2">
          <button id="submitSuratTugasBtn" type="button" class="btn-ucl-primary flex-1 justify-center" style="padding: 10px 16px;">
            📤 Unggah Berkas Surat Tugas
          </button>
          <button type="button" onclick="closeModal()" class="btn-ucl-secondary" style="padding: 10px 16px;">Batal</button>
        </div>
      </div>
    </div>
  `);

  setTimeout(() => {
    const btn = document.getElementById('submitSuratTugasBtn');
    if (btn) btn.onclick = () => handleUploadSuratTugasSubmitDirect(team.id);
  }, 10);
}

function handleUploadSuratTugasSubmitDirect(teamId) {
  const team = teams.find(t => String(t.id) === String(teamId));
  if (!team) return;

  const fileInput = document.getElementById('suratTugasFileInput');
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    alert('⚠️ Harap pilih file Surat Tugas terlebih dahulu (format .PDF, .JPG, atau .PNG)!');
    return;
  }

  const fileName = fileInput.files[0].name;
  team.suratTugasName = fileName;
  saveState();
  closeModal();
  renderApp();
  alert(`✅ Berkas Surat Tugas "${fileName}" untuk tim "${team.name}" berhasil diunggah!`);
}
window.handleUploadSuratTugasSubmitDirect = handleUploadSuratTugasSubmitDirect;

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
    <div class="p-1">
      <h3 class="text-xl font-bold text-white mb-3">Form Pendaftaran Tim Baru</h3>
      
      <div class="space-y-4">
        <div>
          <label class="form-label">Nama Tim <span class="text-rose-400">*</span></label>
          <input type="text" id="regTeamName" class="form-input" placeholder="Contoh: Farmasi United FC">
        </div>
        <div>
          <label class="form-label">Fakultas / Unit UMS <span class="text-rose-400">*</span></label>
          <input type="text" id="regFacultyUnit" class="form-input" placeholder="Contoh: Fakultas Farmasi UMS">
        </div>
        <div>
          <label class="form-label">Nama Manager Tim <span class="text-rose-400">*</span></label>
          <input type="text" id="regManagerName" class="form-input" placeholder="Nama Lengkap Manager">
        </div>
        <div>
          <label class="form-label">No WhatsApp Manager</label>
          <input type="text" id="regManagerPhone" class="form-input" placeholder="0812xxxxxxxx">
        </div>

        <div class="flex gap-3 pt-2">
          <button id="submitRegisterTeamBtn" type="button" class="btn-ucl-primary flex-1 justify-center" style="padding: 10px 16px;">
            🚀 Kirim Pendaftaran Tim
          </button>
          <button type="button" onclick="closeModal()" class="btn-ucl-secondary" style="padding: 10px 16px;">Batal</button>
        </div>
      </div>
    </div>
  `);

  setTimeout(() => {
    const btn = document.getElementById('submitRegisterTeamBtn');
    if (btn) btn.onclick = () => handleRegisterTeamSubmitDirect();
  }, 10);
}

function handleRegisterTeamSubmitDirect() {
  const nameEl = document.getElementById('regTeamName');
  const facultyEl = document.getElementById('regFacultyUnit');
  const managerEl = document.getElementById('regManagerName');
  const phoneEl = document.getElementById('regManagerPhone');

  const name = nameEl ? nameEl.value.trim() : '';
  const facultyUnit = facultyEl ? facultyEl.value.trim() : '';
  const managerName = managerEl ? managerEl.value.trim() : '';
  const managerPhone = phoneEl ? phoneEl.value.trim() : '';

  if (!name || !facultyUnit || !managerName) {
    alert('⚠️ Mohon lengkapi Nama Tim, Fakultas/Unit, dan Nama Manager.');
    return;
  }

  const newTeam = {
    id: 'team-' + Date.now(),
    name,
    facultyUnit,
    logoUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
    managerId: 'mgr-' + Date.now(),
    managerName,
    managerPhone,
    status: 'APPROVED',
    suratTugasName: null
  };

  teams.push(newTeam);
  saveState();
  closeModal();
  renderApp();
  alert(`✅ Tim "${name}" berhasil didaftarkan!`);
}
window.handleRegisterTeamSubmitDirect = handleRegisterTeamSubmitDirect;

function openEditTeamModal(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (!team) return;

  openModal(`
    <div class="p-1">
      <h3 class="text-xl font-bold text-white mb-1">✏️ Edit Info Tim</h3>
      <p class="text-sm text-slate-400 mb-5">Perbarui informasi tim <strong class="text-cyan-300">${team.name}</strong></p>
      
      <div class="space-y-4">
        <div>
          <label class="form-label">Nama Tim <span class="text-rose-400">*</span></label>
          <input type="text" id="editTeamName" class="form-input" value="${team.name}">
        </div>
        <div>
          <label class="form-label">Fakultas / Unit <span class="text-rose-400">*</span></label>
          <input type="text" id="editTeamFaculty" class="form-input" value="${team.facultyUnit}">
        </div>
        <div>
          <label class="form-label">Nama Manager <span class="text-rose-400">*</span></label>
          <input type="text" id="editTeamManager" class="form-input" value="${team.managerName}">
        </div>
        <div>
          <label class="form-label">No WhatsApp</label>
          <input type="text" id="editTeamPhone" class="form-input" value="${team.managerPhone || ''}">
        </div>
        
        <div class="flex gap-3 pt-2">
          <button id="submitEditTeamBtn" type="button" class="btn-ucl-primary flex-1 justify-center" style="padding: 10px 16px;">
            💾 Simpan Info Tim
          </button>
          <button type="button" onclick="closeModal()" class="btn-ucl-secondary" style="padding: 10px 16px;">Batal</button>
        </div>
      </div>
    </div>
  `);

  setTimeout(() => {
    const btn = document.getElementById('submitEditTeamBtn');
    if (btn) btn.onclick = () => handleEditTeamSubmitDirect(teamId);
  }, 10);
}

function handleEditTeamSubmitDirect(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (!team) return;

  const nameEl = document.getElementById('editTeamName');
  const facultyEl = document.getElementById('editTeamFaculty');
  const managerEl = document.getElementById('editTeamManager');
  const phoneEl = document.getElementById('editTeamPhone');

  const newName = nameEl ? nameEl.value.trim() : '';
  const newFaculty = facultyEl ? facultyEl.value.trim() : '';
  const newManager = managerEl ? managerEl.value.trim() : '';
  const newPhone = phoneEl ? phoneEl.value.trim() : '';

  if (!newName) {
    alert('⚠️ Mohon isi Nama Tim.');
    if (nameEl) nameEl.focus();
    return;
  }

  if (!newFaculty) {
    alert('⚠️ Mohon isi Fakultas / Unit.');
    if (facultyEl) facultyEl.focus();
    return;
  }

  if (!newManager) {
    alert('⚠️ Mohon isi Nama Manager.');
    if (managerEl) managerEl.focus();
    return;
  }

  const oldName = team.name;
  team.name = newName;
  team.facultyUnit = newFaculty;
  team.managerName = newManager;
  team.managerPhone = newPhone || team.managerPhone;

  matches.forEach(m => {
    if (m.homeTeamId === teamId) { m.homeTeamName = team.name; m.homeTeamLogo = team.logoUrl; }
    if (m.awayTeamId === teamId) { m.awayTeamName = team.name; m.awayTeamLogo = team.logoUrl; }
  });

  saveState();
  closeModal();
  renderApp();
  alert(`✅ Info Tim "${oldName}" berhasil diperbarui menjadi "${team.name}"!`);
}
window.handleEditTeamSubmitDirect = handleEditTeamSubmitDirect;

function openAddPlayerModal(teamId) {
  const team = teams.find(t => t.id === teamId);
  const teamPlayers = players.filter(p => p.teamId === teamId);
  if (teamPlayers.length >= 14) { alert('Kuota pemain sudah penuh (maks 14).'); return; }

  openModal(`
    <div class="p-1">
      <h3 class="text-xl font-bold text-white mb-1">🏃 Tambah Pemain Skuad (Maks 14)</h3>
      <p class="text-xs text-cyan-400 mb-4">Tim: <strong class="text-white">${team?.name || ''}</strong></p>

      <div class="space-y-3">
        <div>
          <label class="form-label">Nama Lengkap Pemain <span class="text-rose-400">*</span></label>
          <input type="text" id="pFullName" class="form-input" placeholder="Nama lengkap pemain">
        </div>
        <div>
          <label class="form-label">No. KTP / NI. Kepegawaian <span class="text-rose-400">*</span></label>
          <input type="text" id="pIdentityNumber" class="form-input" placeholder="3372xxxxxxxxxxxx">
        </div>
        <div>
          <label class="form-label">Usia <span class="text-rose-400">*</span></label>
          <input type="number" id="pUsia" class="form-input" min="17" max="60" value="22">
        </div>
        <div>
          <label class="form-label">Posisi Bermain <span class="text-rose-400">*</span></label>
          <select id="pPosition" class="form-input">
            <option value="GOALKEEPER">Penjaga Gawang (GK)</option>
            <option value="DEFENDER">Bek / Bertahan (DF)</option>
            <option value="MIDFIELDER" selected>Gelandang (MF)</option>
            <option value="FORWARD">Penyerang (FW)</option>
          </select>
        </div>

        <div class="flex gap-3 pt-3">
          <button id="submitAddPlayerBtn" type="button" class="btn-ucl-primary flex-1 justify-center" style="padding: 10px 16px;">
            💾 Simpan Pemain
          </button>
          <button type="button" onclick="closeModal()" class="btn-ucl-secondary" style="padding: 10px 16px;">Batal</button>
        </div>
      </div>
    </div>
  `);

  setTimeout(() => {
    const btn = document.getElementById('submitAddPlayerBtn');
    if (btn) btn.onclick = () => handleAddPlayerSubmitDirect(teamId);
  }, 10);
}

function handleAddPlayerSubmitDirect(teamId) {
  const nameEl = document.getElementById('pFullName');
  const idEl = document.getElementById('pIdentityNumber');
  const usiaEl = document.getElementById('pUsia');
  const posEl = document.getElementById('pPosition');

  const fullName = nameEl ? nameEl.value.trim() : '';
  const identityNumber = idEl ? idEl.value.trim() : '';
  const usia = parseInt(usiaEl ? usiaEl.value : 20) || 20;
  const position = posEl ? posEl.value : 'MIDFIELDER';

  if (!fullName) {
    alert('⚠️ Mohon isi Nama Lengkap Pemain.');
    if (nameEl) nameEl.focus();
    return;
  }

  if (!identityNumber) {
    alert('⚠️ Mohon isi No. KTP / NI. Kepegawaian.');
    if (idEl) idEl.focus();
    return;
  }

  const team = teams.find(t => t.id === teamId);
  const newPlayer = {
    id: 'p-' + Date.now(),
    teamId,
    fullName,
    identityNumber,
    usia,
    position,
    photoProfileUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(fullName)}`
  };

  players.push(newPlayer);
  saveState();
  closeModal();
  renderApp();
  alert(`✅ Pemain "${fullName}" (${position}) berhasil ditambahkan ke tim ${team ? '"' + team.name + '"' : ''}!`);
}
window.handleAddPlayerSubmitDirect = handleAddPlayerSubmitDirect;

function deletePlayer(playerId) {
  const p = players.find(player => player.id === playerId);
  players = players.filter(player => player.id !== playerId);
  saveState();
  renderApp();
  alert(`✅ Pemain "${p ? p.fullName : 'ini'}" berhasil dihapus dari skuad.`);
}
window.deletePlayer = deletePlayer;

function openAddOfficialModal(teamId) {
  const team = teams.find(t => t.id === teamId);
  openModal(`
    <div class="p-1">
      <h3 class="text-xl font-bold text-white mb-1">👨‍💼 Tambah Official / Pelatih</h3>
      <p class="text-xs text-cyan-400 mb-4">Tim: <strong class="text-white">${team?.name || ''}</strong></p>

      <div class="space-y-3">
        <div>
          <label class="form-label">Nama Lengkap <span class="text-rose-400">*</span></label>
          <input type="text" id="offFullName" class="form-input" placeholder="Nama lengkap official / coach">
        </div>
        <div>
          <label class="form-label">No. KTP / NI. Kepegawaian <span class="text-rose-400">*</span></label>
          <input type="text" id="offIdentityNumber" class="form-input" placeholder="3372xxxxxxxxxxxx">
        </div>
        <div>
          <label class="form-label">Jabatan <span class="text-rose-400">*</span></label>
          <select id="offRole" class="form-input">
            <option value="HEAD_COACH">Head Coach (Maks 1)</option>
            <option value="OFFICIAL">Official Tim (Maks 1)</option>
          </select>
        </div>

        <div class="flex gap-3 pt-3">
          <button id="submitAddOfficialBtn" type="button" class="btn-ucl-primary flex-1 justify-center" style="padding: 10px 16px;">
            💾 Simpan Official
          </button>
          <button type="button" onclick="closeModal()" class="btn-ucl-secondary" style="padding: 10px 16px;">Batal</button>
        </div>
      </div>
    </div>
  `);

  setTimeout(() => {
    const btn = document.getElementById('submitAddOfficialBtn');
    if (btn) btn.onclick = () => handleAddOfficialSubmitDirect(teamId);
  }, 10);
}

function handleAddOfficialSubmitDirect(teamId) {
  const nameEl = document.getElementById('offFullName');
  const idEl = document.getElementById('offIdentityNumber');
  const roleEl = document.getElementById('offRole');

  const fullName = nameEl ? nameEl.value.trim() : '';
  const identityNumber = idEl ? idEl.value.trim() : '';
  const role = roleEl ? roleEl.value : 'HEAD_COACH';

  if (!fullName) {
    alert('⚠️ Mohon isi Nama Lengkap Official / Pelatih.');
    if (nameEl) nameEl.focus();
    return;
  }

  if (!identityNumber) {
    alert('⚠️ Mohon isi No. KTP / NI. Kepegawaian.');
    if (idEl) idEl.focus();
    return;
  }

  if (officials.find(o => o.teamId === teamId && o.role === role)) {
    alert(`⚠️ Tim ini sudah memiliki ${role === 'HEAD_COACH' ? 'Head Coach' : 'Official Tim'}.`);
    return;
  }

  const team = teams.find(t => t.id === teamId);
  officials.push({ id: 'off-' + Date.now(), teamId, fullName, identityNumber, role });
  saveState();
  closeModal();
  renderApp();
  alert(`✅ ${role === 'HEAD_COACH' ? 'Head Coach' : 'Official Tim'} "${fullName}" berhasil ditambahkan ke tim ${team ? '"' + team.name + '"' : ''}!`);
}
window.handleAddOfficialSubmitDirect = handleAddOfficialSubmitDirect;

function deleteOfficial(officialId) {
  const o = officials.find(off => off.id === officialId);
  officials = officials.filter(off => off.id !== officialId);
  saveState();
  renderApp();
  alert(`✅ Official "${o ? o.fullName : 'ini'}" berhasil dihapus.`);
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
        <p style="font-size: 11px;">Match #${match.matchNumber} (${match.stage}) | ${match.matchDate || ''} | ${match.kickoffTime} | ${match.pitchLocation}</p>
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
