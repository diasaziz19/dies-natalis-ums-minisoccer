/**
 * Main Application Logic
 * Dies Natalis UMS 2026 Minisoccer Tournament System (16-Team Knockout Format)
 */

import { INITIAL_TEAMS, INITIAL_PLAYERS, INITIAL_OFFICIALS, INITIAL_MATCHES, INITIAL_HOMEPAGE, INITIAL_RULES, INITIAL_NAVBAR, ADMIN_CREDENTIALS, MANAGER_CREDENTIALS } from './src/lib/mockData.js';
import { evaluatePlayerSuspensions } from './src/lib/cardAccumulation.js';
import { initFirestoreRealtimeSync, saveStateToFirestore, fetchLatestFirestoreData } from './src/lib/firebase.js';

// ========== STATE ==========
let currentRole = localStorage.getItem('ums_active_role') || 'VISITOR';
let currentVisitorTab = localStorage.getItem('ums_active_visitor_tab') || 'bracket';
let currentAdminTab = 'matches';

// Dynamic Content State
let homepageContent = JSON.parse(localStorage.getItem('ums_homepage')) || INITIAL_HOMEPAGE;
let tournamentRules = INITIAL_RULES; // Always use latest official INITIAL_RULES
localStorage.setItem('ums_rules', JSON.stringify(tournamentRules));
let navbarConfig = JSON.parse(localStorage.getItem('ums_navbar')) || INITIAL_NAVBAR;

// Auth State
let authState = JSON.parse(localStorage.getItem('ums_auth')) || {
  isLoggedIn: false,
  role: 'GUEST', // 'GUEST', 'MANAGER', 'ADMIN'
  teamId: null,
  displayName: null
};

// Tournament Data
let teams = JSON.parse(localStorage.getItem('ums_teams')) || INITIAL_TEAMS;
let players = JSON.parse(localStorage.getItem('ums_players')) || INITIAL_PLAYERS;
let officials = JSON.parse(localStorage.getItem('ums_officials')) || INITIAL_OFFICIALS;
let matches = JSON.parse(localStorage.getItem('ums_matches')) || INITIAL_MATCHES;

// Ensure initial teams are loaded if storage is empty
if (!teams || !Array.isArray(teams) || teams.length === 0) {
  teams = INITIAL_TEAMS;
  players = INITIAL_PLAYERS;
  officials = INITIAL_OFFICIALS;
  matches = INITIAL_MATCHES;
  saveState();
}

// Recalculate bracket progression on load
matches = updateKnockoutProgression(matches);

// ========== CLOUD SYNC HELPERS ==========
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
    text.textContent = '🟡 Syncing...';
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
    if (cloudData.matches && Array.isArray(cloudData.matches)) {
      matches = updateKnockoutProgression(cloudData.matches);
    }
    if (cloudData.homepageContent && typeof cloudData.homepageContent === 'object') homepageContent = cloudData.homepageContent;
    if (cloudData.tournamentRules && Array.isArray(cloudData.tournamentRules) && JSON.stringify(cloudData.tournamentRules).includes('35 tahun')) {
        tournamentRules = cloudData.tournamentRules;
      } else {
        tournamentRules = INITIAL_RULES;
      }
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
  localStorage.setItem('ums_auth', JSON.stringify(authState));
  localStorage.setItem('ums_homepage', JSON.stringify(homepageContent));
  localStorage.setItem('ums_rules', JSON.stringify(tournamentRules));
  localStorage.setItem('ums_navbar', JSON.stringify(navbarConfig));

  if (!skipCloudPush) {
    saveStateToFirestore({
      teams,
      players,
      officials,
      matches,
      homepageContent,
      tournamentRules,
      navbarConfig,
      updatedBy: authState.displayName || (authState.role === 'ADMIN' ? 'Super Admin' : 'Manager')
    }, updateCloudSyncBadge);
  }
}

// ========== KNOCKOUT TOURNAMENT PROGRESSION CALCULATION ==========
function updateKnockoutProgression(matchesList) {
  const getOutcome = (m) => {
    if (!m || m.status !== 'FINISHED') return { winner: null, loser: null };
    const hScore = Number(m.homeScore) || 0;
    const aScore = Number(m.awayScore) || 0;
    if (hScore > aScore) {
      return {
        winner: { id: m.homeTeamId, name: m.homeTeamName, logo: m.homeTeamLogo },
        loser: { id: m.awayTeamId, name: m.awayTeamName, logo: m.awayTeamLogo }
      };
    } else if (aScore > hScore) {
      return {
        winner: { id: m.awayTeamId, name: m.awayTeamName, logo: m.awayTeamLogo },
        loser: { id: m.homeTeamId, name: m.homeTeamName, logo: m.homeTeamLogo }
      };
    }
    return { winner: null, loser: null };
  };

  const m1 = matchesList.find(m => m.matchNumber === 1);
  const m2 = matchesList.find(m => m.matchNumber === 2);
  const m3 = matchesList.find(m => m.matchNumber === 3);
  const m4 = matchesList.find(m => m.matchNumber === 4);
  const m5 = matchesList.find(m => m.matchNumber === 5);
  const m6 = matchesList.find(m => m.matchNumber === 6);
  const m7 = matchesList.find(m => m.matchNumber === 7);
  const m8 = matchesList.find(m => m.matchNumber === 8);

  const m9 = matchesList.find(m => m.matchNumber === 9);
  const m10 = matchesList.find(m => m.matchNumber === 10);
  const m11 = matchesList.find(m => m.matchNumber === 11);
  const m12 = matchesList.find(m => m.matchNumber === 12);

  const m13 = matchesList.find(m => m.matchNumber === 13);
  const m14 = matchesList.find(m => m.matchNumber === 14);
  const m15 = matchesList.find(m => m.matchNumber === 15);
  const m16 = matchesList.find(m => m.matchNumber === 16);

  // QF 1 (Match 9)
  if (m9) {
    const o1 = getOutcome(m1);
    const o2 = getOutcome(m2);
    if (o1.winner) { m9.homeTeamId = o1.winner.id; m9.homeTeamName = o1.winner.name; m9.homeTeamLogo = o1.winner.logo; }
    else if (!m9.homeTeamId) { m9.homeTeamName = 'Pemenang Match #1'; m9.homeTeamLogo = ''; }
    if (o2.winner) { m9.awayTeamId = o2.winner.id; m9.awayTeamName = o2.winner.name; m9.awayTeamLogo = o2.winner.logo; }
    else if (!m9.awayTeamId) { m9.awayTeamName = 'Pemenang Match #2'; m9.awayTeamLogo = ''; }
  }

  // QF 2 (Match 10)
  if (m10) {
    const o3 = getOutcome(m3);
    const o4 = getOutcome(m4);
    if (o3.winner) { m10.homeTeamId = o3.winner.id; m10.homeTeamName = o3.winner.name; m10.homeTeamLogo = o3.winner.logo; }
    else if (!m10.homeTeamId) { m10.homeTeamName = 'Pemenang Match #3'; m10.homeTeamLogo = ''; }
    if (o4.winner) { m10.awayTeamId = o4.winner.id; m10.awayTeamName = o4.winner.name; m10.awayTeamLogo = o4.winner.logo; }
    else if (!m10.awayTeamId) { m10.awayTeamName = 'Pemenang Match #4'; m10.awayTeamLogo = ''; }
  }

  // QF 3 (Match 11)
  if (m11) {
    const o5 = getOutcome(m5);
    const o6 = getOutcome(m6);
    if (o5.winner) { m11.homeTeamId = o5.winner.id; m11.homeTeamName = o5.winner.name; m11.homeTeamLogo = o5.winner.logo; }
    else if (!m11.homeTeamId) { m11.homeTeamName = 'Pemenang Match #5'; m11.homeTeamLogo = ''; }
    if (o6.winner) { m11.awayTeamId = o6.winner.id; m11.awayTeamName = o6.winner.name; m11.awayTeamLogo = o6.winner.logo; }
    else if (!m11.awayTeamId) { m11.awayTeamName = 'Pemenang Match #6'; m11.awayTeamLogo = ''; }
  }

  // QF 4 (Match 12)
  if (m12) {
    const o7 = getOutcome(m7);
    const o8 = getOutcome(m8);
    if (o7.winner) { m12.homeTeamId = o7.winner.id; m12.homeTeamName = o7.winner.name; m12.homeTeamLogo = o7.winner.logo; }
    else if (!m12.homeTeamId) { m12.homeTeamName = 'Pemenang Match #7'; m12.homeTeamLogo = ''; }
    if (o8.winner) { m12.awayTeamId = o8.winner.id; m12.awayTeamName = o8.winner.name; m12.awayTeamLogo = o8.winner.logo; }
    else if (!m12.awayTeamId) { m12.awayTeamName = 'Pemenang Match #8'; m12.awayTeamLogo = ''; }
  }

  // SF 1 (Match 13)
  if (m13) {
    const o9 = getOutcome(m9);
    const o10 = getOutcome(m10);
    if (o9.winner) { m13.homeTeamId = o9.winner.id; m13.homeTeamName = o9.winner.name; m13.homeTeamLogo = o9.winner.logo; }
    else if (!m13.homeTeamId) { m13.homeTeamName = 'Pemenang Match #9'; m13.homeTeamLogo = ''; }
    if (o10.winner) { m13.awayTeamId = o10.winner.id; m13.awayTeamName = o10.winner.name; m13.awayTeamLogo = o10.winner.logo; }
    else if (!m13.awayTeamId) { m13.awayTeamName = 'Pemenang Match #10'; m13.awayTeamLogo = ''; }
  }

  // SF 2 (Match 14)
  if (m14) {
    const o11 = getOutcome(m11);
    const o12 = getOutcome(m12);
    if (o11.winner) { m14.homeTeamId = o11.winner.id; m14.homeTeamName = o11.winner.name; m14.homeTeamLogo = o11.winner.logo; }
    else if (!m14.homeTeamId) { m14.homeTeamName = 'Pemenang Match #11'; m14.homeTeamLogo = ''; }
    if (o12.winner) { m14.awayTeamId = o12.winner.id; m14.awayTeamName = o12.winner.name; m14.awayTeamLogo = o12.winner.logo; }
    else if (!m14.awayTeamId) { m14.awayTeamName = 'Pemenang Match #12'; m14.awayTeamLogo = ''; }
  }

  // Bronze Match (Match 15) & Grand Final (Match 16)
  if (m15 || m16) {
    const o13 = getOutcome(m13);
    const o14 = getOutcome(m14);

    if (m15) {
      if (o13.loser) { m15.homeTeamId = o13.loser.id; m15.homeTeamName = o13.loser.name; m15.homeTeamLogo = o13.loser.logo; }
      else if (!m15.homeTeamId) { m15.homeTeamName = 'Kalah Semi Final 1'; m15.homeTeamLogo = ''; }
      if (o14.loser) { m15.awayTeamId = o14.loser.id; m15.awayTeamName = o14.loser.name; m15.awayTeamLogo = o14.loser.logo; }
      else if (!m15.awayTeamId) { m15.awayTeamName = 'Kalah Semi Final 2'; m15.awayTeamLogo = ''; }
    }

    if (m16) {
      if (o13.winner) { m16.homeTeamId = o13.winner.id; m16.homeTeamName = o13.winner.name; m16.homeTeamLogo = o13.winner.logo; }
      else if (!m16.homeTeamId) { m16.homeTeamName = 'Pemenang Semi Final 1'; m16.homeTeamLogo = ''; }
      if (o14.winner) { m16.awayTeamId = o14.winner.id; m16.awayTeamName = o14.winner.name; m16.awayTeamLogo = o14.winner.logo; }
      else if (!m16.awayTeamId) { m16.awayTeamName = 'Pemenang Semi Final 2'; m16.awayTeamLogo = ''; }
    }
  }

  return matchesList;
}

// ========== WINDOW BINDINGS ==========
window.switchRole = switchRole;
window.switchVisitorTab = switchVisitorTab;
window.switchAdminTab = switchAdminTab;
window.handleUnifiedLogin = handleUnifiedLogin;
window.handleLogout = handleLogout;
window.quickLogin = quickLogin;
window.toggleManagerDropdown = toggleManagerDropdown;
window.selectQuickManager = selectQuickManager;
window.togglePasswordVisibility = togglePasswordVisibility;

// Match Score & Results
window.openInputScoreModal = openInputScoreModal;
window.saveMatchScore = saveMatchScore;
window.openPublicMatchDetailModal = openPublicMatchDetailModal;

// Team Management
window.openRegisterTeamModal = openRegisterTeamModal;
window.openEditTeamModal = openEditTeamModal;
window.saveTeam = saveTeam;
window.deleteTeam = deleteTeam;
window.openTeamSquadModal = openTeamSquadModal;

// Player Management
window.openAddPlayerModal = openAddPlayerModal;
window.openEditPlayerModal = openEditPlayerModal;
window.savePlayer = savePlayer;
window.deletePlayer = deletePlayer;

// Official & Manager Details
window.openEditOfficialModal = openEditOfficialModal;
window.saveOfficial = saveOfficial;

// Surat Tugas
window.openUploadSuratTugasModal = openUploadSuratTugasModal;
window.saveSuratTugas = saveSuratTugas;
window.approveTeam = approveTeam;
window.rejectTeam = rejectTeam;
window.resetAllSuratTugas = resetAllSuratTugas;

// Bracket & Admin Control
window.applyInitialOfficialTeams = applyInitialOfficialTeams;
window.saveAllRoundOf16BracketMatches = saveAllRoundOf16BracketMatches;
window.saveAllBracketStagesMatches = saveAllBracketStagesMatches;
window.autoSetRoundOf16Teams = autoSetRoundOf16Teams;
window.updateRoundOf16MatchTeams = updateRoundOf16MatchTeams;
window.resetTournamentData = resetTournamentData;
window.resetBracketToDefault = resetBracketToDefault;

// Modals & Navigation
window.closeModal = closeModal;
window.openEditNavbarModal = openEditNavbarModal;
window.saveNavbarConfig = saveNavbarConfig;
window.openEditHeroModal = openEditHeroModal;
window.saveHeroContent = saveHeroContent;
window.openEditRulesModal = openEditRulesModal;
window.saveTournamentRules = saveTournamentRules;
window.resetRulesToDefault = resetRulesToDefault;
window.renderVisitorMatches = renderVisitorMatches;
window.renderPublicTeams = renderPublicTeams;

// ========== MODAL UTILITIES ==========
function openModal(htmlContent) {
  const modalContainer = document.getElementById('modalContainer');
  const modalBody = document.getElementById('modalBody');
  if (modalContainer && modalBody) {
    modalBody.innerHTML = htmlContent;
    modalContainer.classList.remove('hidden');
  }
}

function closeModal() {
  const modalContainer = document.getElementById('modalContainer');
  if (modalContainer) {
    modalContainer.classList.add('hidden');
  }
}

// ========== NAVIGATION & ROLE SWITCHING ==========
function switchRole(role) {
  currentRole = role;
  localStorage.setItem('ums_active_role', role);

  // Hide all views
  document.querySelectorAll('.app-view').forEach(el => el.classList.add('hidden'));

  // Show active view
  const targetView = document.getElementById(`view-${role}`);
  if (targetView) targetView.classList.remove('hidden');

  // Update active state in role-bar
  document.querySelectorAll('.role-badge').forEach(el => el.classList.remove('active'));
  const activeBadge = document.querySelector(`.role-badge[data-role="${role}"]`);
  if (activeBadge) activeBadge.classList.add('active');

  if (role === 'LOGIN') {
    populateManagerDropdown();
  }

  renderApp();
}

function switchVisitorTab(tab) {
  currentVisitorTab = tab;
  localStorage.setItem('ums_active_visitor_tab', tab);

  document.querySelectorAll('.vtab-content').forEach(el => el.classList.add('hidden'));
  const targetContent = document.getElementById(`vtab-${tab}`);
  if (targetContent) targetContent.classList.remove('hidden');

  document.querySelectorAll('#view-VISITOR .tab-btn').forEach(el => el.classList.remove('active'));
  const activeBtn = document.getElementById(`tabBtn-${tab}`);
  if (activeBtn) activeBtn.classList.add('active');

  if (tab === 'bracket') renderKnockoutBracket();
  else if (tab === 'matches') renderVisitorMatches();
  else if (tab === 'stats') renderVisitorStats();
}

function switchAdminTab(tab) {
  currentAdminTab = tab;

  ['matches', 'bracket', 'manage'].forEach(t => {
    const el = document.getElementById(`adminContent-${t}`);
    const btn = document.getElementById(`adminTab-${t}`);
    if (el) el.classList.add('hidden');
    if (btn) btn.classList.remove('active');
  });

  const targetEl = document.getElementById(`adminContent-${tab}`);
  const targetBtn = document.getElementById(`adminTab-${tab}`);
  if (targetEl) targetEl.classList.remove('hidden');
  if (targetBtn) targetBtn.classList.add('active');

  if (tab === 'matches') renderAdminMatchesList();
  else if (tab === 'bracket') renderAdminBracketConfig();
  else if (tab === 'manage') renderAdminManagePanel();
}

// ========== APP RENDER DISPATCHER ==========
function renderApp() {
  players = evaluatePlayerSuspensions(players, matches);
  matches = updateKnockoutProgression(matches);
  renderNavbarDOM();

  if (currentRole === 'VISITOR') {
    renderHeroBanner();
    switchVisitorTab(currentVisitorTab);
  } else if (currentRole === 'PUBLIC_TEAMS') {
    renderPublicTeams();
  } else if (currentRole === 'RULES') {
    renderRulesSection();
  } else if (currentRole === 'TEAM_MANAGER') {
    renderTeamManagerPortal();
  } else if (currentRole === 'ADMIN') {
    renderAdminPortal();
  }
}

// ========== NAVBAR & HEADER RENDERING ==========
function renderNavbarDOM() {
  const logoImg = document.getElementById('navLogoImg');
  const titleText = document.getElementById('navTitleText');
  const subtitleText = document.getElementById('navSubtitleText');
  const editHeaderBtn = document.getElementById('navEditHeaderBtn');

  if (logoImg) logoImg.src = navbarConfig.logoUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=UMSLogo';
  if (titleText) titleText.textContent = navbarConfig.title || 'DIES NATALIS UMS 2026';
  if (subtitleText) subtitleText.textContent = navbarConfig.subtitle || 'Minisoccer Tournament System';

  const managerTab = document.getElementById('navManagerTab');
  const adminTab = document.getElementById('navAdminTab');
  const loginBtn = document.getElementById('navLoginBtn');

  if (editHeaderBtn) {
    if (authState.role === 'ADMIN') editHeaderBtn.classList.remove('hidden');
    else editHeaderBtn.classList.add('hidden');
  }

  if (authState.isLoggedIn) {
    if (authState.role === 'ADMIN') {
      if (adminTab) adminTab.classList.remove('hidden');
      if (managerTab) managerTab.classList.add('hidden');
      if (loginBtn) {
        loginBtn.textContent = '👑 Super Admin (Keluar)';
        loginBtn.onclick = handleLogout;
      }
    } else if (authState.role === 'MANAGER') {
      if (managerTab) managerTab.classList.remove('hidden');
      if (adminTab) adminTab.classList.add('hidden');
      if (loginBtn) {
        loginBtn.textContent = `⚽ ${authState.displayName || 'Manajer'} (Keluar)`;
        loginBtn.onclick = handleLogout;
      }
    }
  } else {
    if (managerTab) managerTab.classList.add('hidden');
    if (adminTab) adminTab.classList.add('hidden');
    if (loginBtn) {
      loginBtn.textContent = '🔑 Masuk Akun';
      loginBtn.onclick = () => switchRole('LOGIN');
    }
  }
}

function renderHeroBanner() {
  const container = document.getElementById('homepageHeroContainer');
  if (!container) return;

  const isAdmin = authState.role === 'ADMIN';

  container.innerHTML = `
    <div class="glass-panel p-6 sm:p-8 mb-6 relative overflow-hidden" style="background: linear-gradient(135deg, rgba(15,23,42,0.95), rgba(11,25,60,0.9)); border: 1px solid rgba(0, 240, 255, 0.2);">
      ${isAdmin ? `
        <button onclick="openEditHeroModal()" class="absolute top-4 right-4 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg hover:bg-amber-500/20">
          ✏️ Edit Banner
        </button>
      ` : ''}
      <div class="max-w-3xl">
        <span class="badge-gold text-xs mb-3 inline-block font-bold">🏆 TURNAMEN RESMI MINISOCCER UMS 2026</span>
        <h1 class="text-2xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">${homepageContent.heroTitle}</h1>
        <p class="text-sm sm:text-base text-cyan-300 font-semibold mb-3">${homepageContent.heroSubtitle}</p>
        <p class="text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed">${homepageContent.welcomeMessage}</p>
        
        <div class="flex flex-wrap gap-4 text-xs text-slate-300">
          <div class="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span>📅</span>
            <span>${homepageContent.dates || '14 - 15 Maret 2026'}</span>
          </div>
          <div class="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span>📍</span>
            <span>${homepageContent.location || 'Stadion Mini Soccer Kampus 4 UMS'}</span>
          </div>
          <div class="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span>⚽</span>
            <span>16 Tim Peserta (7 vs 7 Knockout)</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ========== 1. KNOCKOUT BRACKET TREE RENDERING ==========
function renderKnockoutBracket() {
  const container = document.getElementById('knockoutBracketContainer');
  if (!container) return;

  const r16Matches = matches.filter(m => m.stage === 'ROUND_OF_16');
  const qfMatches = matches.filter(m => m.stage === 'QUARTER_FINAL');
  const sfMatches = matches.filter(m => m.stage === 'SEMI_FINAL');
  const finalMatch = matches.find(m => m.stage === 'FINAL');
  const thirdMatch = matches.find(m => m.stage === 'THIRD_PLACE');

  container.innerHTML = `
    <!-- Round of 16 (8 Matches) -->
    <div class="bracket-round">
      <div class="bracket-round-header">Babak 16 Besar</div>
      ${r16Matches.map(m => renderBracketCardHTML(m)).join('')}
    </div>

    <!-- Quarter Finals (4 Matches) -->
    <div class="bracket-round">
      <div class="bracket-round-header">Perempat Final</div>
      ${qfMatches.map(m => renderBracketCardHTML(m)).join('')}
    </div>

    <!-- Semi Finals (2 Matches) -->
    <div class="bracket-round">
      <div class="bracket-round-header">Semi Final</div>
      ${sfMatches.map(m => renderBracketCardHTML(m)).join('')}
    </div>

    <!-- Grand Final & 3rd Place (2 Matches) -->
    <div class="bracket-round">
      <div class="bracket-round-header" style="background: rgba(255, 215, 0, 0.15); border-color: #ffd700; color: #ffd700;">🏆 Final &amp; Juara 3</div>
      ${finalMatch ? renderBracketCardHTML(finalMatch, '🏆 GRAND FINAL') : ''}
      ${thirdMatch ? renderBracketCardHTML(thirdMatch, '🥉 PEREBUTAN JUARA 3') : ''}
    </div>
  `;
}

function renderBracketCardHTML(m, customLabel = null) {
  const isFinished = m.status === 'FINISHED';
  const hasScore = isFinished || (m.homeScore !== undefined && m.homeScore !== null && (m.homeScore > 0 || m.awayScore > 0));
  const hScore = Number(m.homeScore) || 0;
  const aScore = Number(m.awayScore) || 0;
  const homeWinner = isFinished && hScore > aScore;
  const awayWinner = isFinished && aScore > hScore;
  const canUpdate = authState.role === 'ADMIN' || (authState.role === 'MANAGER' && (authState.teamId === m.homeTeamId || authState.teamId === m.awayTeamId));

  const homeScoreDisplay = isFinished ? m.homeScore : (m.homeScore !== undefined && m.homeScore !== null && m.homeScore !== '' ? m.homeScore : '-');
  const awayScoreDisplay = isFinished ? m.awayScore : (m.awayScore !== undefined && m.awayScore !== null && m.awayScore !== '' ? m.awayScore : '-');

  return `
    <div class="bracket-card ${isFinished ? 'is-finished' : ''}">
      <div class="bracket-card-header flex justify-between items-center mb-2">
        <span class="font-bold text-[11px] text-slate-300">${customLabel || `Match #${m.matchNumber}`}</span>
        <div class="flex items-center gap-1.5">
          <span style="font-weight:700; color: ${isFinished ? '#10b981' : '#94a3b8'}; font-size: 10px;">
            ${isFinished ? '✅ SELESAI' : '⏳ SCHEDULED'}
          </span>
          ${canUpdate ? `
            <button onclick="openInputScoreModal('${m.id}')" class="text-[10px] text-cyan-300 font-bold hover:underline bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-400/30" title="Input / Update Skor">✏️ Skor</button>
          ` : ''}
          <button onclick="openPublicMatchDetailModal('${m.id}')" class="text-[10px] text-slate-400 font-bold hover:text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700" title="Lihat Detail Pertandingan">🔍</button>
        </div>
      </div>
      
      <!-- Home Team Slot -->
      <div class="bracket-team-slot ${homeWinner ? 'is-winner' : ''}">
        <div class="bracket-team-name">
          <img src="${m.homeTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(m.homeTeamName)}" style="width:18px;height:18px;border-radius:50%;background:#111;flex-shrink:0;">
          <span class="truncate font-semibold ${homeWinner ? 'text-amber-300' : 'text-slate-200'}" title="${m.homeTeamName}">${m.homeTeamName}</span>
        </div>
        <span class="bracket-score-badge ${isFinished ? 'font-bold text-amber-300' : ''}">${homeScoreDisplay}</span>
      </div>

      <!-- Away Team Slot -->
      <div class="bracket-team-slot ${awayWinner ? 'is-winner' : ''}">
        <div class="bracket-team-name">
          <img src="${m.awayTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(m.awayTeamName)}" style="width:18px;height:18px;border-radius:50%;background:#111;flex-shrink:0;">
          <span class="truncate font-semibold ${awayWinner ? 'text-amber-300' : 'text-slate-200'}" title="${m.awayTeamName}">${m.awayTeamName}</span>
        </div>
        <span class="bracket-score-badge ${isFinished ? 'font-bold text-amber-300' : ''}">${awayScoreDisplay}</span>
      </div>
    </div>
  `;
}

// ========== 2. JADWAL & HASIL PERTANDINGAN (PUBLIC) ==========
function renderVisitorMatches() {
  const container = document.getElementById('matchesListContainer');
  if (!container) return;

  const filterSelect = document.getElementById('matchFilterStatus');
  const filter = filterSelect ? filterSelect.value : 'ALL';

  let filtered = matches;
  if (filter === 'SCHEDULED') filtered = matches.filter(m => m.status === 'SCHEDULED');
  else if (filter === 'FINISHED') filtered = matches.filter(m => m.status === 'FINISHED');

  if (filtered.length === 0) {
    container.innerHTML = '<p class="text-slate-400 text-center py-8 col-span-full">Tidak ada pertandingan dengan status yang dipilih.</p>';
    return;
  }

  container.innerHTML = filtered.map(m => {
    const isFinished = m.status === 'FINISHED';
    const canUpdate = authState.role === 'ADMIN' || (authState.role === 'MANAGER' && (authState.teamId === m.homeTeamId || authState.teamId === m.awayTeamId));

    return `
      <div class="glass-panel p-5 rounded-xl border border-slate-800 hover:border-cyan-400/40 transition-all">
        <div class="flex justify-between items-center mb-3 pb-2 border-b border-slate-800/80 text-xs">
          <div class="flex items-center gap-2">
            <span class="badge-cyan font-bold">Match #${m.matchNumber}</span>
            <span class="text-slate-400 font-semibold">${m.stage.replace(/_/g, ' ')}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-bold ${isFinished ? 'text-amber-400' : 'text-slate-400'}">
              ${isFinished ? '✅ SELESAI' : '⏳ SCHEDULED'}
            </span>
            ${canUpdate ? `
              <button onclick="openInputScoreModal('${m.id}')" class="text-xs text-cyan-300 font-bold bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-400/30 hover:bg-cyan-500/30">✏️ Input Skor</button>
            ` : ''}
          </div>
        </div>

        <div class="grid grid-cols-5 items-center gap-2 my-4">
          <!-- Home Team -->
          <div class="col-span-2 text-right">
            <div class="flex items-center justify-end gap-2">
              <span class="font-bold text-sm text-white truncate" title="${m.homeTeamName}">${m.homeTeamName}</span>
              <img src="${m.homeTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(m.homeTeamName)}" style="width:28px;height:28px;border-radius:50%;flex-shrink:0;">
            </div>
          </div>

          <!-- Score Box -->
          <div class="col-span-1 text-center">
            ${isFinished ? `
              <div class="text-lg font-extrabold font-mono text-cyan-300 bg-slate-900/90 py-1.5 px-3 rounded-lg border border-cyan-500/30 inline-block shadow-inner">
                ${m.homeScore} : ${m.awayScore}
              </div>
            ` : `
              <div class="text-xs font-bold text-slate-500 bg-slate-900/60 py-1.5 px-2 rounded border border-slate-800 inline-block">
                VS
              </div>
            `}
          </div>

          <!-- Away Team -->
          <div class="col-span-2 text-left">
            <div class="flex items-center justify-start gap-2">
              <img src="${m.awayTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(m.awayTeamName)}" style="width:28px;height:28px;border-radius:50%;flex-shrink:0;">
              <span class="font-bold text-sm text-white truncate" title="${m.awayTeamName}">${m.awayTeamName}</span>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex-wrap gap-2">
          <div class="flex items-center gap-3">
            <span>📅 ${m.matchDate || '14 Maret 2026'}</span>
            <span>⏰ ${m.kickoffTime || '08:00 WIB'}</span>
            <span>📍 ${m.pitchLocation || 'Edupark UMS'}</span>
          </div>
          <button onclick="openPublicMatchDetailModal('${m.id}')" class="text-cyan-400 font-bold hover:underline">Detail Skuad ➡️</button>
        </div>
      </div>
    `;
  }).join('');
}

// ========== 3. TOP SCORER & STATS ==========
function renderVisitorStats() {
  const scorersList = document.getElementById('topScorersList');
  const assistsList = document.getElementById('topAssistsList');
  if (!scorersList || !assistsList) return;

  scorersList.innerHTML = `
    <div class="space-y-2">
      <div class="flex justify-between items-center p-2.5 rounded-lg bg-slate-900 border border-slate-800">
        <div class="flex items-center gap-2.5">
          <span class="font-mono font-bold text-amber-400 text-sm">#1</span>
          <span class="font-bold text-white text-xs">Bagus Setyawan (Parkir)</span>
        </div>
        <span class="badge-gold text-xs font-bold font-mono">4 Gol</span>
      </div>
      <div class="flex justify-between items-center p-2.5 rounded-lg bg-slate-900 border border-slate-800">
        <div class="flex items-center gap-2.5">
          <span class="font-mono font-bold text-slate-400 text-sm">#2</span>
          <span class="font-bold text-white text-xs">Ahmad Syukri (Satpam)</span>
        </div>
        <span class="badge-cyan text-xs font-bold font-mono">3 Gol</span>
      </div>
      <div class="flex justify-between items-center p-2.5 rounded-lg bg-slate-900 border border-slate-800">
        <div class="flex items-center gap-2.5">
          <span class="font-mono font-bold text-slate-400 text-sm">#3</span>
          <span class="font-bold text-white text-xs">Guruh Soekarno (FKIP)</span>
        </div>
        <span class="badge-cyan text-xs font-bold font-mono">2 Gol</span>
      </div>
    </div>
  `;

  assistsList.innerHTML = `
    <div class="space-y-2">
      <div class="flex justify-between items-center p-2.5 rounded-lg bg-slate-900 border border-slate-800">
        <div class="flex items-center gap-2.5">
          <span class="font-mono font-bold text-cyan-400 text-sm">#1</span>
          <span class="font-bold text-white text-xs">Rian Hidayat (Parkir)</span>
        </div>
        <span class="badge-cyan text-xs font-bold font-mono">3 Assist</span>
      </div>
      <div class="flex justify-between items-center p-2.5 rounded-lg bg-slate-900 border border-slate-800">
        <div class="flex items-center gap-2.5">
          <span class="font-mono font-bold text-slate-400 text-sm">#2</span>
          <span class="font-bold text-white text-xs">Febri Hariyadi (FKIP)</span>
        </div>
        <span class="badge-cyan text-xs font-bold font-mono">2 Assist</span>
      </div>
    </div>
  `;
}

// ========== 4. PUBLIC TEAMS & SQUAD VIEW (GUEST VIEW ONLY) ==========
function renderPublicTeams() {
  const container = document.getElementById('publicTeamsGrid');
  if (!container) return;

  const searchInput = document.getElementById('publicTeamSearchInput');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  let filtered = teams;
  if (query) {
    filtered = teams.filter(t => t.name.toLowerCase().includes(query) || (t.facultyUnit && t.facultyUnit.toLowerCase().includes(query)));
  }

  if (filtered.length === 0) {
    container.innerHTML = '<p class="text-slate-400 text-center py-8 col-span-full">Tidak ada tim yang cocok dengan pencarian.</p>';
    return;
  }

  const isAdmin = authState.role === 'ADMIN';

  container.innerHTML = filtered.map(t => {
    const squad = players.filter(p => p.teamId === t.id);
    const official = officials.find(o => o.teamId === t.id);
    const hasSuratTugas = Boolean(t.suratTugasName);

    return `
      <div class="glass-panel p-5 rounded-xl border border-slate-800 hover:border-cyan-400/40 transition-all flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between gap-3 mb-3">
            <div class="flex items-center gap-3">
              <img src="${t.logoUrl}" alt="${t.name}" style="width:44px;height:44px;border-radius:50%;background:#000;border:2px solid rgba(0,240,255,0.4);" class="flex-shrink-0">
              <div>
                <h3 class="font-bold text-base text-white leading-tight">${t.name}</h3>
                <p class="text-xs text-slate-400">${t.facultyUnit}</p>
              </div>
            </div>
            ${isAdmin ? `
              <div class="flex gap-1.5">
                <button onclick="openEditTeamModal('${t.id}')" class="text-xs text-cyan-300 font-bold bg-cyan-500/20 px-2 py-1 rounded border border-cyan-400/30 hover:bg-cyan-500/30" title="Edit Tim">✏️</button>
                <button onclick="deleteTeam('${t.id}')" class="text-xs text-rose-300 font-bold bg-rose-500/20 px-2 py-1 rounded border border-rose-400/30 hover:bg-rose-500/30" title="Hapus Tim">🗑️</button>
              </div>
            ` : ''}
          </div>

          <div class="space-y-1.5 text-xs text-slate-300 my-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div class="flex justify-between items-center">
              <span class="text-slate-400">Manajer:</span>
              <span class="font-semibold text-white">${t.managerName || 'Belum diisi'}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">Official:</span>
              <span class="font-semibold text-white">${official ? official.fullName : 'Belum diisi'}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">Jumlah Pemain:</span>
              <span class="badge-cyan font-bold font-mono">${squad.length} / 14 Pemain</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">Surat Tugas:</span>
              <span class="${hasSuratTugas ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}">
                ${hasSuratTugas ? '✅ Terverifikasi' : '⏳ Belum Upload'}
              </span>
            </div>
          </div>
        </div>

        <button onclick="openTeamSquadModal('${t.id}')" class="btn-ucl-secondary w-full text-xs mt-2" style="justify-content: center; padding: 8px;">
          👥 Lihat Skuad Pemain
        </button>
      </div>
    `;
  }).join('');
}

function openTeamSquadModal(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (!team) return;

  const squad = players.filter(p => p.teamId === teamId);
  const official = officials.find(o => o.teamId === teamId);

  const canEdit = authState.role === 'ADMIN' || (authState.role === 'MANAGER' && authState.teamId === teamId);

  openModal(`
    <div>
      <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <img src="${team.logoUrl}" style="width:48px;height:48px;border-radius:50%;background:#000;border:2px solid var(--ucl-cyan);">
          <div>
            <h2 class="text-xl font-bold text-white">${team.name}</h2>
            <p class="text-xs text-slate-400">${team.facultyUnit}</p>
          </div>
        </div>
        ${canEdit ? `
          <div class="flex gap-2">
            <button onclick="openEditTeamModal('${team.id}')" class="btn-ucl-secondary text-xs" style="padding: 6px 12px;">✏️ Edit Tim</button>
            <button onclick="openAddPlayerModal('${team.id}')" class="btn-ucl-primary text-xs" style="padding: 6px 12px;">➕ Tambah Pemain</button>
          </div>
        ` : ''}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-xs">
        <div class="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-start">
          <div>
            <span class="text-slate-400 block mb-0.5">Manajer Tim (Maks 1):</span>
            <strong class="text-white text-sm">${team.managerName || 'Belum diisi'}</strong>
            <span class="text-slate-400 block">${team.managerPhone || '-'}</span>
          </div>
          ${canEdit ? `
            <button onclick="openEditTeamModal('${team.id}')" class="text-cyan-400 text-xs font-bold hover:underline">Edit</button>
          ` : ''}
        </div>
        <div class="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-start">
          <div>
            <span class="text-slate-400 block mb-0.5">Official Tim (Maks 1):</span>
            <strong class="text-white text-sm">${official ? official.fullName : 'Belum diisi'}</strong>
            <span class="text-slate-400 block">${official ? official.identityNumber || '-' : '-'}</span>
          </div>
          ${canEdit ? `
            <button onclick="openEditOfficialModal('${team.id}')" class="text-cyan-400 text-xs font-bold hover:underline">${official ? 'Edit' : 'Set'}</button>
          ` : ''}
        </div>
      </div>

      <div class="flex justify-between items-center mb-3">
        <h3 class="font-bold text-cyan-400 text-sm">Daftar Skuad Pemain (${squad.length} / 14 Pemain)</h3>
        ${canEdit && squad.length < 14 ? `
          <button onclick="openAddPlayerModal('${team.id}')" class="text-xs text-emerald-400 font-bold hover:underline">➕ Tambah</button>
        ` : ''}
      </div>
      
      <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
        ${squad.length === 0 ? '<p class="text-slate-400 text-xs py-4 text-center">Belum ada pemain yang didaftarkan.</p>' : squad.map((p, idx) => `
          <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
            <div class="flex items-center gap-3">
              <span class="font-mono font-bold text-cyan-400 w-5 text-center">${idx + 1}</span>
              <img src="${p.photoProfileUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(p.fullName)}" style="width:24px;height:24px;border-radius:50%;background:#000;">
              <div>
                <strong class="text-white block">${p.fullName}</strong>
                <span class="text-[10px] text-slate-400">Unit: ${p.unit || (team ? team.facultyUnit : '') || 'UMS'} • Usia: ${p.umur || p.usia || '-'} thn ${Number(p.umur || p.usia) < 35 ? '<span class="text-cyan-400 font-bold">(<35)</span>' : '<span class="text-emerald-400 font-bold">(≥35)</span>'}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge-gold text-[10px] uppercase font-bold">${p.position}</span>
              ${canEdit ? `
                <button onclick="openEditPlayerModal('${p.id}')" class="text-cyan-400 font-bold hover:underline text-[11px]">Edit</button>
                <button onclick="deletePlayer('${p.id}')" class="text-rose-400 font-bold hover:underline text-[11px]">Hapus</button>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>

      <div class="mt-5 pt-3 border-t border-slate-800 text-right">
        <button onclick="closeModal()" class="btn-ucl-primary text-xs" style="padding: 8px 16px;">Tutup</button>
      </div>
    </div>
  `);
}

function openPublicMatchDetailModal(matchId) {
  const match = matches.find(m => m.id === matchId);
  if (!match) return;

  const homeSquad = players.filter(p => p.teamId === match.homeTeamId);
  const awaySquad = players.filter(p => p.teamId === match.awayTeamId);

  openModal(`
    <div>
      <div class="text-center pb-3 border-b border-slate-800 mb-4">
        <span class="badge-cyan text-xs font-bold">Match #${match.matchNumber} • ${match.stage.replace(/_/g, ' ')}</span>
        <h2 class="text-lg font-bold text-white mt-2">${match.homeTeamName} vs ${match.awayTeamName}</h2>
        <p class="text-xs text-slate-400 mt-1">${match.matchDate || '14 Maret 2026'} • ${match.kickoffTime || '08:00 WIB'} • ${match.pitchLocation || 'Edupark UMS'}</p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <!-- Home Squad -->
        <div class="p-3 rounded-lg bg-slate-900 border border-slate-800">
          <div class="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
            <img src="${match.homeTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(match.homeTeamName)}" style="width:22px;height:22px;border-radius:50%;">
            <strong class="text-xs text-white truncate">${match.homeTeamName}</strong>
          </div>
          <div class="space-y-1.5 max-h-48 overflow-y-auto text-xs">
            ${homeSquad.length === 0 ? '<p class="text-slate-500 text-[11px]">Skuad belum tersedia</p>' : homeSquad.map((p, i) => `
              <div class="flex justify-between items-center text-[11px] py-1 border-b border-slate-800/40">
                <span class="text-slate-300 truncate">${i + 1}. ${p.fullName}</span>
                <span class="text-slate-500 text-[10px]">${p.position}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Away Squad -->
        <div class="p-3 rounded-lg bg-slate-900 border border-slate-800">
          <div class="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
            <img src="${match.awayTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(match.awayTeamName)}" style="width:22px;height:22px;border-radius:50%;">
            <strong class="text-xs text-white truncate">${match.awayTeamName}</strong>
          </div>
          <div class="space-y-1.5 max-h-48 overflow-y-auto text-xs">
            ${awaySquad.length === 0 ? '<p class="text-slate-500 text-[11px]">Skuad belum tersedia</p>' : awaySquad.map((p, i) => `
              <div class="flex justify-between items-center text-[11px] py-1 border-b border-slate-800/40">
                <span class="text-slate-300 truncate">${i + 1}. ${p.fullName}</span>
                <span class="text-slate-500 text-[10px]">${p.position}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-800 text-right">
        <button onclick="closeModal()" class="btn-ucl-primary text-xs" style="padding: 6px 14px;">Tutup</button>
      </div>
    </div>
  `);
}

// ========== 5. INPUT & UPDATE SKOR MODAL (SUPER ADMIN & MANAJER TIM) ==========
function openInputScoreModal(matchId) {
  const match = matches.find(m => m.id === matchId);
  if (!match) return;

  const isAdmin = authState.role === 'ADMIN';
  const isManager = authState.role === 'MANAGER';
  const isMatchManager = isManager && (authState.teamId === match.homeTeamId || authState.teamId === match.awayTeamId);

  if (!isAdmin && !isMatchManager) {
    alert('Anda hanya dapat memperbarui skor jika login sebagai Super Admin atau Manajer dari salah satu tim yang bertanding.');
    return;
  }

  const isR16 = match.stage === 'ROUND_OF_16';

  openModal(`
    <form onsubmit="saveMatchScore('${match.id}', event)" class="space-y-4 text-left">
      <div class="pb-2 border-b border-slate-800">
        <span class="badge-${isAdmin ? 'gold' : 'cyan'} text-[10px] font-bold">
          ${isAdmin ? '👑 SUPER ADMIN' : '⚽ MANAJER TIM: ' + authState.displayName}
        </span>
        <h2 class="text-lg font-bold text-white mt-1">Update Skor &amp; Jadwal: Match #${match.matchNumber} (${match.stage.replace(/_/g, ' ')})</h2>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <!-- Home Team Select (for R16 by Admin) or Display -->
        <div>
          <label class="form-label text-xs font-semibold text-slate-300">Tim Home</label>
          ${isR16 && isAdmin ? `
            <select id="editHomeTeamId" class="form-input text-xs font-bold" required>
              ${teams.map(t => `<option value="${t.id}" ${t.id === match.homeTeamId ? 'selected' : ''}>${t.name}</option>`).join('')}
            </select>
          ` : `
            <input type="text" class="form-input text-xs bg-slate-900 font-bold text-white" value="${match.homeTeamName}" disabled>
          `}
        </div>

        <!-- Away Team Select (for R16 by Admin) or Display -->
        <div>
          <label class="form-label text-xs font-semibold text-slate-300">Tim Away</label>
          ${isR16 && isAdmin ? `
            <select id="editAwayTeamId" class="form-input text-xs font-bold" required>
              ${teams.map(t => `<option value="${t.id}" ${t.id === match.awayTeamId ? 'selected' : ''}>${t.name}</option>`).join('')}
            </select>
          ` : `
            <input type="text" class="form-input text-xs bg-slate-900 font-bold text-white" value="${match.awayTeamName}" disabled>
          `}
        </div>
      </div>

      <!-- Skor Akhir -->
      <div class="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-center">
        <label class="form-label text-xs text-cyan-300 font-bold mb-2 block">⚽ SKOR PERTANDINGAN</label>
        <div class="flex items-center justify-center gap-4">
          <div class="text-center">
            <span class="text-xs text-slate-400 block mb-1">Skor ${match.homeTeamName}</span>
            <input type="number" id="editHomeScore" class="form-input text-center text-xl font-bold font-mono" style="width: 80px;" value="${match.homeScore}" min="0" required>
          </div>
          <span class="text-2xl font-bold text-slate-500 mt-4">:</span>
          <div class="text-center">
            <span class="text-xs text-slate-400 block mb-1">Skor ${match.awayTeamName}</span>
            <input type="number" id="editAwayScore" class="form-input text-center text-xl font-bold font-mono" style="width: 80px;" value="${match.awayScore}" min="0" required>
          </div>
        </div>
      </div>

      <!-- Status & Jadwal -->
      <div class="grid grid-cols-2 gap-3 text-xs">
        <div>
          <label class="form-label">Status Pertandingan</label>
          <select id="editMatchStatus" class="form-input text-xs font-bold" required>
            <option value="SCHEDULED" ${match.status === 'SCHEDULED' ? 'selected' : ''}>⏳ SCHEDULED (Akan Datang)</option>
            <option value="FINISHED" ${match.status === 'FINISHED' ? 'selected' : ''}>✅ FINISHED (Selesai)</option>
          </select>
        </div>
        <div>
          <label class="form-label">Lokasi Lapangan</label>
          <input type="text" id="editPitchLocation" class="form-input text-xs" value="${match.pitchLocation || 'Edupark UMS'}" required ${isAdmin ? '' : 'readonly'}>
        </div>
        <div>
          <label class="form-label">Tanggal Pertandingan</label>
          <input type="text" id="editMatchDate" class="form-input text-xs" value="${match.matchDate || 'Sabtu, 14 Maret 2026'}" required ${isAdmin ? '' : 'readonly'}>
        </div>
        <div>
          <label class="form-label">Waktu Kick-Off</label>
          <input type="text" id="editKickoffTime" class="form-input text-xs" value="${match.kickoffTime || '08:00 WIB'}" required ${isAdmin ? '' : 'readonly'}>
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
        <button type="button" onclick="closeModal()" class="btn-ucl-secondary text-xs">Batal</button>
        <button type="submit" class="btn-ucl-primary text-xs font-bold">💾 Simpan Skor &amp; Hasil</button>
      </div>
    </form>
  `);
}

function saveMatchScore(matchId, event) {
  if (event) event.preventDefault();

  const match = matches.find(m => m.id === matchId);
  if (!match) return;

  const homeScoreEl = document.getElementById('editHomeScore');
  const awayScoreEl = document.getElementById('editAwayScore');
  const statusEl = document.getElementById('editMatchStatus');
  const pitchEl = document.getElementById('editPitchLocation');
  const dateEl = document.getElementById('editMatchDate');
  const timeEl = document.getElementById('editKickoffTime');

  const homeScoreVal = homeScoreEl ? parseInt(homeScoreEl.value, 10) : 0;
  const awayScoreVal = awayScoreEl ? parseInt(awayScoreEl.value, 10) : 0;
  const statusVal = statusEl ? statusEl.value : 'FINISHED';
  const pitchVal = pitchEl ? pitchEl.value : (match.pitchLocation || 'Edupark UMS');
  const dateVal = dateEl ? dateEl.value : (match.matchDate || 'Sabtu, 14 Maret 2026');
  const timeVal = timeEl ? timeEl.value : (match.kickoffTime || '08:00 WIB');

  if (match.stage === 'ROUND_OF_16' && authState.role === 'ADMIN') {
    const homeSelect = document.getElementById('editHomeTeamId');
    const awaySelect = document.getElementById('editAwayTeamId');
    if (homeSelect && awaySelect) {
      const homeTeamId = homeSelect.value;
      const awayTeamId = awaySelect.value;

      const homeTeam = teams.find(t => t.id === homeTeamId);
      const awayTeam = teams.find(t => t.id === awayTeamId);

      if (homeTeam) {
        match.homeTeamId = homeTeam.id;
        match.homeTeamName = homeTeam.name;
        match.homeTeamLogo = homeTeam.logoUrl;
      }
      if (awayTeam) {
        match.awayTeamId = awayTeam.id;
        match.awayTeamName = awayTeam.name;
        match.awayTeamLogo = awayTeam.logoUrl;
      }
    }
  }

  match.homeScore = isNaN(homeScoreVal) ? 0 : homeScoreVal;
  match.awayScore = isNaN(awayScoreVal) ? 0 : awayScoreVal;
  match.status = statusVal;
  match.pitchLocation = pitchVal;
  match.matchDate = dateVal;
  match.kickoffTime = timeVal;

  // Auto advance winners through the bracket
  matches = updateKnockoutProgression(matches);

  saveState();
  renderApp();
  closeModal();
  alert(`✅ Skor Match #${match.matchNumber} (${match.homeTeamName} ${match.homeScore} : ${match.awayScore} ${match.awayTeamName}) berhasil disimpan & bagan diperbarui!`);
}

// ========== 6. PORTAL MANAJER TIM ==========
function renderTeamManagerPortal() {
  const container = document.getElementById('managerTeamsContainer');
  const loggedInAsEl = document.getElementById('managerLoggedInAs');
  if (!container) return;

  const isAdmin = authState.role === 'ADMIN';
  const targetTeams = isAdmin ? teams : teams.filter(t => t.id === authState.teamId);

  if (loggedInAsEl) {
    loggedInAsEl.textContent = authState.isLoggedIn
      ? `👤 Masuk sebagai: ${authState.displayName || (isAdmin ? 'Super Admin' : 'Manajer Tim')}`
      : '';
  }

  if (targetTeams.length === 0) {
    container.innerHTML = `
      <div class="glass-panel p-8 text-center">
        <p class="text-slate-400 mb-4">Anda belum terhubung ke tim manapun. Silakan login menggunakan akun manajer tim.</p>
        <button onclick="switchRole('LOGIN')" class="btn-ucl-primary">🔑 Buka Halaman Login</button>
      </div>
    `;
    return;
  }

  container.innerHTML = targetTeams.map(team => {
    const squad = players.filter(p => p.teamId === team.id);
    const official = officials.find(o => o.teamId === team.id);
    const hasSurat = Boolean(team.suratTugasName);

    return `
      <div class="glass-panel p-6 rounded-xl border border-slate-800">
        <!-- Team Header -->
        <div class="flex justify-between items-center pb-4 border-b border-slate-800 flex-wrap gap-4 mb-5">
          <div class="flex items-center gap-3">
            <img src="${team.logoUrl}" alt="${team.name}" style="width:50px;height:50px;border-radius:50%;background:#000;border:2px solid var(--ucl-cyan);">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-xl font-bold text-white">${team.name}</h3>
                <button onclick="openEditTeamModal('${team.id}')" class="text-xs text-cyan-400 font-bold hover:underline" title="Edit Nama Tim / Unit">✏️ Edit</button>
              </div>
              <p class="text-xs text-slate-400">${team.facultyUnit}</p>
              <p class="text-xs text-cyan-400 mt-0.5">Manajer: ${team.managerName || '-'} (${team.managerPhone || '-'})</p>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <button onclick="openEditTeamModal('${team.id}')" class="btn-ucl-secondary text-xs" style="padding: 7px 12px;">
              ✏️ Edit Tim &amp; Manajer
            </button>
            <button onclick="openUploadSuratTugasModal('${team.id}')" class="btn-ucl-secondary text-xs" style="padding: 7px 12px;">
              📄 ${hasSurat ? 'Ganti Surat Tugas' : 'Unggah Surat Tugas'}
            </button>
            <button onclick="openAddPlayerModal('${team.id}')" class="btn-ucl-primary text-xs" style="padding: 7px 14px;">
              ➕ Tambah Pemain
            </button>
          </div>
        </div>

        <!-- Verification & Quota Alert -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-xs">
          <div class="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div>
              <span class="text-slate-400 block">Status Surat Tugas:</span>
              <strong class="${hasSurat ? 'text-emerald-400' : 'text-amber-400'} text-sm font-bold">
                ${hasSurat ? '✅ ' + team.suratTugasName : '⏳ Belum Diunggah'}
              </strong>
            </div>
          </div>
          <div class="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div>
              <span class="text-slate-400 block">Kuota Pemain (Maks 14):</span>
              <strong class="text-cyan-300 text-sm font-bold font-mono">${squad.length} / 14 Pemain</strong>
            </div>
            <span class="badge-${squad.length >= 7 ? 'cyan' : 'gold'} text-[10px] font-bold">
              ${squad.length >= 7 ? 'Memenuhi Syarat' : 'Min 7 (Kurang ' + (7 - squad.length) + ')'}
            </span>
          </div>
          <div class="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div>
              <span class="text-slate-400 block">Official Tim (Maks 1):</span>
              <strong class="text-white text-sm font-bold">${official ? official.fullName : 'Belum Diisi'}</strong>
            </div>
            <button onclick="openEditOfficialModal('${team.id}')" class="text-xs text-cyan-400 font-bold hover:underline">
              ${official ? 'Edit' : '➕ Tambah'}
            </button>
          </div>
        </div>

        <!-- Squad Table -->
        <div class="flex justify-between items-center mb-3">
          <h4 class="font-bold text-white text-sm">Susunan Pemain Terdaftar (${squad.length} / 14)</h4>
          ${squad.length < 14 ? `
            <button onclick="openAddPlayerModal('${team.id}')" class="text-xs text-emerald-400 font-bold hover:underline">➕ Tambah Pemain</button>
          ` : `
            <span class="text-xs text-amber-400 font-bold">⚠️ Kuota Maksimal 14 Pemain Tercapai</span>
          `}
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead class="text-slate-400 bg-slate-900/80 border-b border-slate-800">
              <tr>
                <th class="p-2.5">No</th>
                <th class="p-2.5">Nama Pemain</th>
                <th class="p-2.5">Unit / Fakultas</th>
                <th class="p-2.5">Umur</th>
                <th class="p-2.5">Posisi</th>
                <th class="p-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              ${squad.length === 0 ? '<tr><td colspan="6" class="p-4 text-center text-slate-500">Belum ada pemain. Klik tombol "Tambah Pemain" di atas.</td></tr>' : squad.map((p, idx) => `
                <tr class="hover:bg-slate-900/40">
                  <td class="p-2.5 font-mono text-cyan-400 font-bold">${idx + 1}</td>
                  <td class="p-2.5 flex items-center gap-2.5">
                    <img src="${p.photoProfileUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(p.fullName)}" style="width:24px;height:24px;border-radius:50%;background:#000;">
                    <strong class="text-white">${p.fullName}</strong>
                  </td>
                  <td class="p-2.5 text-slate-300">${p.unit || (team ? team.facultyUnit : '') || 'UMS'}</td>
                  <td class="p-2.5 text-slate-300 font-mono">${p.umur || p.usia || '-'} thn ${Number(p.umur || p.usia) < 35 ? '<span class="text-cyan-400 font-bold text-[10px]">(<35)</span>' : '<span class="text-emerald-400 font-bold text-[10px]">(≥35)</span>'}</td>
                  <td class="p-2.5"><span class="badge-gold text-[10px] uppercase font-bold">${p.position}</span></td>
                  <td class="p-2.5 text-right space-x-2">
                    <button onclick="openEditPlayerModal('${p.id}')" class="text-cyan-400 font-bold hover:underline">Edit</button>
                    <button onclick="deletePlayer('${p.id}')" class="text-rose-400 font-bold hover:underline">Hapus</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');
}

// ========== 7. SUPER ADMIN DASHBOARD ==========
function renderAdminPortal() {
  if (authState.role !== 'ADMIN') {
    switchRole('LOGIN');
    return;
  }
  switchAdminTab(currentAdminTab);
}

function renderAdminMatchesList() {
  const container = document.getElementById('adminMatchesList');
  if (!container) return;

  container.innerHTML = matches.map(m => {
    const isFinished = m.status === 'FINISHED';
    return `
      <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center text-xs">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="badge-cyan font-mono font-bold">Match #${m.matchNumber}</span>
            <span class="text-slate-400 font-semibold">${m.stage.replace(/_/g, ' ')}</span>
            <span class="font-bold ${isFinished ? 'text-amber-400' : 'text-slate-500'}">
              ${isFinished ? '✅ SELESAI' : '⏳ SCHEDULED'}
            </span>
          </div>
          <div class="font-bold text-white text-sm my-1">
            ${m.homeTeamName} <span class="text-cyan-400 font-mono">(${isFinished ? m.homeScore : '-'})</span> vs <span class="text-cyan-400 font-mono">(${isFinished ? m.awayScore : '-'})</span> ${m.awayTeamName}
          </div>
          <span class="text-[11px] text-slate-400">${m.matchDate || '14 Maret 2026'} • ${m.kickoffTime || '08:00 WIB'}</span>
        </div>
        <button onclick="openInputScoreModal('${m.id}')" class="btn-ucl-primary text-xs" style="padding: 7px 12px;">
          ✏️ Input Skor
        </button>
      </div>
    `;
  }).join('');
}

function renderAdminBracketConfig() {
  const container = document.getElementById('adminBracketConfigContainer');
  if (!container) return;

  const r16Matches = matches.filter(m => m.stage === 'ROUND_OF_16');
  const qfMatches = matches.filter(m => m.stage === 'QUARTER_FINAL');
  const sfMatches = matches.filter(m => m.stage === 'SEMI_FINAL');
  const bronzeMatch = matches.find(m => m.stage === 'THIRD_PLACE');
  const finalMatch = matches.find(m => m.stage === 'FINAL');

  const renderStageSection = (title, badgeColor, matchList) => `
    <div class="col-span-full mt-4 first:mt-0">
      <div class="flex items-center gap-2 pb-2 mb-3 border-b border-slate-800">
        <span class="badge-${badgeColor} font-bold text-xs">${title}</span>
        <span class="text-xs text-slate-400">Pilih tim peserta secara manual atau biarkan otomatis dari hasil babak sebelumnya.</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${matchList.map(m => `
          <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs hover:border-cyan-500/40 transition-all">
            <div class="flex justify-between items-center pb-2 border-b border-slate-800">
              <div class="flex items-center gap-2">
                <span class="badge-cyan font-bold font-mono">Match #${m.matchNumber}</span>
                <span class="text-slate-300 font-semibold">${m.stage.replace(/_/g, ' ')}</span>
              </div>
              <span class="text-slate-400 text-[11px]">${m.kickoffTime || '08:00 WIB'} • 📍 ${m.pitchLocation || 'Edupark UMS'}</span>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label text-[11px] text-cyan-300 font-bold mb-1 block">🏠 Tim Home</label>
                <select id="bracketSelect_home_${m.matchNumber}" class="form-input text-xs font-bold text-white bg-slate-950 border-cyan-500/40">
                  <option value="">-- ${m.homeTeamName && !m.homeTeamId ? m.homeTeamName : 'Pilih Tim Home'} --</option>
                  ${teams.map(t => `<option value="${t.id}" ${t.id === m.homeTeamId ? 'selected' : ''}>${t.name}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="form-label text-[11px] text-cyan-300 font-bold mb-1 block">✈️ Tim Away</label>
                <select id="bracketSelect_away_${m.matchNumber}" class="form-input text-xs font-bold text-white bg-slate-950 border-cyan-500/40">
                  <option value="">-- ${m.awayTeamName && !m.awayTeamId ? m.awayTeamName : 'Pilih Tim Away'} --</option>
                  ${teams.map(t => `<option value="${t.id}" ${t.id === m.awayTeamId ? 'selected' : ''}>${t.name}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  container.innerHTML = `
    <form onsubmit="saveAllBracketStagesMatches(event)" class="col-span-full space-y-4">
      <!-- 1. Babak 16 Besar -->
      ${renderStageSection('1. Babak 16 Besar (Match #1 s.d #8)', 'cyan', r16Matches)}

      <!-- 2. Perempat Final -->
      ${renderStageSection('2. Perempat Final / QF (Match #9 s.d #12)', 'gold', qfMatches)}

      <!-- 3. Semi Final -->
      ${renderStageSection('3. Semi Final (Match #13 & #14)', 'gold', sfMatches)}

      <!-- 4. Final & Perebutan Juara 3 -->
      ${renderStageSection('4. Grand Final & Perebutan Juara 3 (Match #15 & #16)', 'cyan', [finalMatch, bronzeMatch].filter(Boolean))}

      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center flex-wrap gap-3 mt-6">
        <div>
          <strong class="text-white text-sm block">Konfirmasi Perubahan Seluruh Bagan</strong>
          <span class="text-xs text-slate-400">Perubahan tim pada babak 16 besar hingga final akan langsung diterapkan ke bagan turnamen utama dan tersinkronkan ke Cloud Firestore.</span>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button type="button" onclick="resetBracketToDefault()" class="btn-ucl-secondary text-xs font-bold" style="padding: 11px 18px; border-color: rgba(245,158,11,0.5); color: #fbbf24;">
            🔄 Reset Bagan ke Awal
          </button>
          <button type="submit" class="btn-ucl-primary text-xs font-bold shadow-lg shadow-cyan-500/20" style="padding: 11px 26px; font-size: 13px;">
            💾 Simpan Seluruh Perubahan Bagan
          </button>
        </div>
      </div>
    </form>
  `;
}

function resetBracketToDefault() {
  if (confirm('🔄 Reset Bagan Turnamen ke Susunan Awal Resmi?\n\nSemua pasangan tim babak 16 besar akan dikembalikan ke susunan 16 tim resmi awal (Match #1: SATPAM vs PARKIR, dst.) dan skor/babak lanjutan akan dikosongkan.')) {
    matches = JSON.parse(JSON.stringify(INITIAL_MATCHES));
    matches = updateKnockoutProgression(matches);
    saveState(false);
    renderApp();
    alert('✅ Bagan Turnamen berhasil direset ke susunan awal resmi 16 tim!');
  }
}

function saveAllBracketStagesMatches(event) {
  if (event) event.preventDefault();

  for (let i = 1; i <= 16; i++) {
    const homeSelect = document.getElementById(`bracketSelect_home_${i}`);
    const awaySelect = document.getElementById(`bracketSelect_away_${i}`);
    const match = matches.find(m => m.matchNumber === i);

    if (match && homeSelect && awaySelect) {
      const homeTeamVal = homeSelect.value;
      const awayTeamVal = awaySelect.value;

      if (homeTeamVal) {
        const homeTeam = teams.find(t => t.id === homeTeamVal);
        if (homeTeam) {
          match.homeTeamId = homeTeam.id;
          match.homeTeamName = homeTeam.name;
          match.homeTeamLogo = homeTeam.logoUrl;
        }
      }

      if (awayTeamVal) {
        const awayTeam = teams.find(t => t.id === awayTeamVal);
        if (awayTeam) {
          match.awayTeamId = awayTeam.id;
          match.awayTeamName = awayTeam.name;
          match.awayTeamLogo = awayTeam.logoUrl;
        }
      }
    }
  }

  // Recalculate progression and persist
  matches = updateKnockoutProgression(matches);
  saveState(false);
  renderApp();
  alert('✅ Seluruh susunan tim pada bagan (16 Besar, Perempat Final, Semi Final, & Final) berhasil disimpan dan diperbarui ke bagan utama!');
}

function saveAllRoundOf16BracketMatches(event) {
  saveAllBracketStagesMatches(event);
}

function autoSetRoundOf16Teams() {
  if (confirm('⚡ Set Otomatis 16 Tim ke dalam Bagan 16 Besar?\n\nSistem akan menempatkan 16 tim resmi ke Match #1 s.d #8 secara berurutan.')) {
    for (let i = 1; i <= 8; i++) {
      const match = matches.find(m => m.matchNumber === i && m.stage === 'ROUND_OF_16');
      if (!match) continue;

      const hTeam = teams[(i - 1) * 2];
      const aTeam = teams[(i - 1) * 2 + 1];

      if (hTeam) {
        match.homeTeamId = hTeam.id;
        match.homeTeamName = hTeam.name;
        match.homeTeamLogo = hTeam.logoUrl;
      }
      if (aTeam) {
        match.awayTeamId = aTeam.id;
        match.awayTeamName = aTeam.name;
        match.awayTeamLogo = aTeam.logoUrl;
      }
    }

    matches = updateKnockoutProgression(matches);
    saveState();
    renderApp();
    alert('✅ 16 Tim resmi berhasil di-set ke Bagan Turnamen!');
  }
}

function renderAdminManagePanel() {
  const container = document.getElementById('adminTeamsApprovalList');
  const badgeEl = document.getElementById('adminPendingBadge');
  if (!container) return;

  const pendingCount = teams.filter(t => !t.suratTugasName).length;
  if (badgeEl) badgeEl.textContent = `${pendingCount} Belum Upload`;

  container.innerHTML = `
    <div class="col-span-full flex justify-between items-center mb-2">
      <h4 class="font-bold text-white text-sm">Daftar Seluruh Tim Peserta (${teams.length} Tim)</h4>
      <button onclick="openRegisterTeamModal()" class="btn-ucl-primary text-xs" style="padding: 6px 14px;">➕ Tambah Tim Baru</button>
    </div>
    ${teams.map(t => {
      const squad = players.filter(p => p.teamId === t.id);
      const hasSurat = Boolean(t.suratTugasName);

      return `
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs flex-wrap gap-3">
          <div class="flex items-center gap-3">
            <img src="${t.logoUrl}" style="width:36px;height:36px;border-radius:50%;">
            <div>
              <strong class="text-white text-sm block">${t.name}</strong>
              <span class="text-slate-400">${t.facultyUnit}</span>
              <div class="flex items-center gap-2 mt-1">
                <span class="badge-cyan text-[10px]">${squad.length} / 14 Pemain</span>
                <span class="${hasSurat ? 'text-emerald-400' : 'text-amber-400'} font-bold text-[10px]">
                  ${hasSurat ? '✅ ' + t.suratTugasName : '⏳ Belum Upload'}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="openEditTeamModal('${t.id}')" class="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 hover:bg-cyan-500/30">✏️ Edit</button>
            <button onclick="openTeamSquadModal('${t.id}')" class="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-bold hover:bg-slate-700">👥 Skuad</button>
            ${hasSurat ? `
              <button onclick="approveTeam('${t.id}')" class="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 hover:bg-emerald-500/30">✅</button>
            ` : `
              <button onclick="openUploadSuratTugasModal('${t.id}')" class="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 hover:bg-cyan-500/30">📄</button>
            `}
            <button onclick="deleteTeam('${t.id}')" class="px-2 py-1 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 hover:bg-rose-500/30" title="Hapus Tim">🗑️</button>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

function approveTeam(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (team) {
    team.status = 'APPROVED';
    saveState();
    renderApp();
    alert(`✅ Tim ${team.name} berhasil diverifikasi!`);
  }
}

function rejectTeam(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (team) {
    team.status = 'PENDING';
    saveState();
    renderApp();
    alert(`Tim ${team.name} dikembalikan ke status Pending.`);
  }
}

function resetAllSuratTugas() {
  if (confirm('🔄 Kosongkan seluruh berkas Surat Tugas (0/16)?')) {
    teams.forEach(t => { t.suratTugasName = null; });
    saveState();
    renderApp();
    alert('✅ Berkas Surat Tugas seluruh tim berhasil direset menjadi 0.');
  }
}

function applyInitialOfficialTeams() {
  if (confirm('⚡ Terapkan ulang 16 Tim Resmi Terbaru & Bagan Turnamen Dies Natalis UMS 2026?')) {
    teams = INITIAL_TEAMS;
    players = INITIAL_PLAYERS;
    officials = INITIAL_OFFICIALS;
    matches = updateKnockoutProgression(INITIAL_MATCHES);
    saveState();
    renderApp();
    alert('✅ 16 Tim Resmi Terbaru berhasil diterapkan ke seluruh sistem & bagan!');
  }
}

function resetTournamentData() {
  if (confirm('🔄 Reset seluruh hasil pertandingan dan kembalikan bagan ke awal?')) {
    matches = updateKnockoutProgression(INITIAL_MATCHES);
    saveState();
    renderApp();
    alert('✅ Data pertandingan berhasil direset!');
  }
}

// ========== 8. TEAM CRUD MODALS ==========
function openRegisterTeamModal() {
  if (authState.role !== 'ADMIN') {
    alert('Hanya Super Admin yang dapat menambahkan tim baru.');
    return;
  }

  openModal(`
    <form onsubmit="saveTeam(null, event)" class="space-y-4 text-left text-xs">
      <div class="pb-2 border-b border-slate-800">
        <h2 class="text-lg font-bold text-white">➕ Tambah Tim Turnamen Baru</h2>
      </div>

      <div>
        <label class="form-label">Nama Tim</label>
        <input type="text" id="teamNameInput" class="form-input" placeholder="contoh: Teknik Elektro" required>
      </div>

      <div>
        <label class="form-label">Unit / Fakultas / Lembaga</label>
        <input type="text" id="teamFacultyInput" class="form-input" placeholder="contoh: Fakultas Teknik UMS" required>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="form-label">Nama Manajer Tim (Maks 1)</label>
          <input type="text" id="teamManagerNameInput" class="form-input" placeholder="Nama Manajer">
        </div>
        <div>
          <label class="form-label">No. Telp / WhatsApp Manajer</label>
          <input type="text" id="teamManagerPhoneInput" class="form-input" placeholder="08...">
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
        <button type="button" onclick="closeModal()" class="btn-ucl-secondary">Batal</button>
        <button type="submit" class="btn-ucl-primary">Simpan Tim Baru</button>
      </div>
    </form>
  `);
}

function openEditTeamModal(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (!team) return;

  const canEdit = authState.role === 'ADMIN' || (authState.role === 'MANAGER' && authState.teamId === teamId);
  if (!canEdit) {
    alert('Anda tidak memiliki izin untuk mengedit tim ini.');
    return;
  }

  openModal(`
    <form onsubmit="saveTeam('${team.id}', event)" class="space-y-4 text-left text-xs">
      <div class="pb-2 border-b border-slate-800">
        <h2 class="text-lg font-bold text-white">✏️ Edit Informasi Tim: ${team.name}</h2>
      </div>

      <div>
        <label class="form-label">Nama Tim</label>
        <input type="text" id="teamNameInput" class="form-input" value="${team.name}" required>
      </div>

      <div>
        <label class="form-label">Unit / Fakultas / Lembaga</label>
        <input type="text" id="teamFacultyInput" class="form-input" value="${team.facultyUnit || ''}" required>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="form-label">Nama Manajer Tim (Maks 1)</label>
          <input type="text" id="teamManagerNameInput" class="form-input" value="${team.managerName || ''}">
        </div>
        <div>
          <label class="form-label">No. Telp / WhatsApp Manajer</label>
          <input type="text" id="teamManagerPhoneInput" class="form-input" value="${team.managerPhone || ''}">
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
        <button type="button" onclick="closeModal()" class="btn-ucl-secondary">Batal</button>
        <button type="submit" class="btn-ucl-primary">Simpan Perubahan</button>
      </div>
    </form>
  `);
}

function saveTeam(teamId, event) {
  if (event) event.preventDefault();

  const name = document.getElementById('teamNameInput').value.trim();
  const faculty = document.getElementById('teamFacultyInput').value.trim();
  const managerName = document.getElementById('teamManagerNameInput').value.trim();
  const managerPhone = document.getElementById('teamManagerPhoneInput').value.trim();

  if (teamId) {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      team.name = name;
      team.facultyUnit = faculty;
      team.managerName = managerName;
      team.managerPhone = managerPhone;
      team.logoUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`;

      // Update match records if team name changed
      matches.forEach(m => {
        if (m.homeTeamId === teamId) {
          m.homeTeamName = name;
          m.homeTeamLogo = team.logoUrl;
        }
        if (m.awayTeamId === teamId) {
          m.awayTeamName = name;
          m.awayTeamLogo = team.logoUrl;
        }
      });
    }
  } else {
    const newTeamId = `team-${Date.now()}`;
    teams.push({
      id: newTeamId,
      name,
      facultyUnit: faculty,
      logoUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
      managerId: `mgr-${newTeamId}`,
      managerName,
      managerPhone,
      status: 'APPROVED',
      suratTugasName: null
    });
  }

  saveState();
  renderApp();
  closeModal();
  alert('✅ Data tim berhasil disimpan!');
}

function deleteTeam(teamId) {
  if (authState.role !== 'ADMIN') {
    alert('Hanya Super Admin yang dapat menghapus tim.');
    return;
  }

  const team = teams.find(t => t.id === teamId);
  if (!team) return;

  if (confirm(`🚨 Yakin ingin menghapus tim "${team.name}" beserta seluruh pemain dan officialnya?`)) {
    teams = teams.filter(t => t.id !== teamId);
    players = players.filter(p => p.teamId !== teamId);
    officials = officials.filter(o => o.teamId !== teamId);

    // Clean up matches
    matches.forEach(m => {
      if (m.homeTeamId === teamId) {
        m.homeTeamId = null;
        m.homeTeamName = 'TBD';
        m.homeTeamLogo = '';
      }
      if (m.awayTeamId === teamId) {
        m.awayTeamId = null;
        m.awayTeamName = 'TBD';
        m.awayTeamLogo = '';
      }
    });

    matches = updateKnockoutProgression(matches);
    saveState();
    renderApp();
    alert(`✅ Tim "${team.name}" berhasil dihapus.`);
  }
}

// ========== 9. OFFICIAL CRUD MODAL ==========
function openEditOfficialModal(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (!team) return;

  const canEdit = authState.role === 'ADMIN' || (authState.role === 'MANAGER' && authState.teamId === teamId);
  if (!canEdit) {
    alert('Anda tidak memiliki izin untuk mengedit official tim ini.');
    return;
  }

  const official = officials.find(o => o.teamId === teamId);

  openModal(`
    <form onsubmit="saveOfficial('${team.id}', event)" class="space-y-4 text-left text-xs">
      <div class="pb-2 border-b border-slate-800">
        <h2 class="text-lg font-bold text-white">👔 Official Tim (Maks 1 Orang): ${team.name}</h2>
      </div>

      <div>
        <label class="form-label">Nama Lengkap Official</label>
        <input type="text" id="officialFullName" class="form-input" value="${official ? official.fullName : ''}" placeholder="Nama Official / Pelatih" required>
      </div>

      <div>
        <label class="form-label">Nomor Identitas (NIDN / NIP / KTP)</label>
        <input type="text" id="officialIdentityNumber" class="form-input" value="${official ? official.identityNumber || '' : ''}" placeholder="contoh: 19800101...">
      </div>

      <div class="flex justify-between items-center pt-3 border-t border-slate-800">
        ${official ? `
          <button type="button" onclick="deleteOfficial('${official.id}')" class="text-rose-400 font-bold hover:underline">Hapus Official</button>
        ` : '<div></div>'}
        <div class="flex gap-2">
          <button type="button" onclick="closeModal()" class="btn-ucl-secondary">Batal</button>
          <button type="submit" class="btn-ucl-primary">Simpan Official</button>
        </div>
      </div>
    </form>
  `);
}

function saveOfficial(teamId, event) {
  if (event) event.preventDefault();

  const fullName = document.getElementById('officialFullName').value.trim();
  const identityNumber = document.getElementById('officialIdentityNumber').value.trim();

  let official = officials.find(o => o.teamId === teamId);
  if (official) {
    official.fullName = fullName;
    official.identityNumber = identityNumber;
  } else {
    officials.push({
      id: `off-${Date.now()}`,
      teamId,
      fullName,
      identityNumber,
      role: 'OFFICIAL'
    });
  }

  saveState();
  renderApp();
  closeModal();
  alert('✅ Data Official tim berhasil disimpan!');
}

function deleteOfficial(officialId) {
  if (confirm('Hapus official ini?')) {
    officials = officials.filter(o => o.id !== officialId);
    saveState();
    renderApp();
    closeModal();
    alert('✅ Official berhasil dihapus.');
  }
}

// ========== 10. PLAYER CRUD MODALS (FORM: NAMA, UNIT, UMUR, POSISI - MAKS 14) ==========
function openAddPlayerModal(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (!team) return;

  const canEdit = authState.role === 'ADMIN' || (authState.role === 'MANAGER' && authState.teamId === teamId);
  if (!canEdit) {
    alert('Anda tidak memiliki izin untuk menambah pemain pada tim ini.');
    return;
  }

  const squad = players.filter(p => p.teamId === teamId);
  if (squad.length >= 14) {
    alert('⚠️ Kuota maksimal 14 pemain untuk tim ini sudah terpenuhi!');
    return;
  }

  openModal(`
    <form onsubmit="savePlayer('${teamId}', null, event)" class="space-y-4 text-left text-xs">
      <div class="pb-2 border-b border-slate-800">
        <h2 class="text-lg font-bold text-white">➕ Tambah Pemain: ${team.name}</h2>
        <p class="text-slate-400">Kuota saat ini: ${squad.length} / 14 pemain</p>
      </div>

      <div>
        <label class="form-label">Nama Lengkap Pemain</label>
        <input type="text" id="playerFullName" class="form-input" placeholder="contoh: Bagus Setyawan" required>
      </div>

      <div>
        <label class="form-label">Unit / Fakultas</label>
        <input type="text" id="playerUnit" class="form-input" value="${team.facultyUnit || ''}" placeholder="contoh: Unit Sarpras UMS" required>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="form-label">Umur (Tahun)</label>
          <input type="number" id="playerUmur" class="form-input font-bold font-mono" placeholder="contoh: 28" min="17" max="70" required>
        </div>
        <div>
          <label class="form-label">Posisi Bermain</label>
          <select id="playerPosition" class="form-input font-bold" required>
            <option value="FORWARD">PENYERANG (FORWARD)</option>
            <option value="MIDFIELDER">GELANDANG (MIDFIELDER)</option>
            <option value="DEFENDER">BEK (DEFENDER)</option>
            <option value="GOALKEEPER">PENJAGA GAWANG (KIPER)</option>
          </select>
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
        <button type="button" onclick="closeModal()" class="btn-ucl-secondary">Batal</button>
        <button type="submit" class="btn-ucl-primary font-bold">Simpan Pemain</button>
      </div>
    </form>
  `);
}

function openEditPlayerModal(playerId) {
  const player = players.find(p => p.id === playerId);
  if (!player) return;

  const canEdit = authState.role === 'ADMIN' || (authState.role === 'MANAGER' && authState.teamId === player.teamId);
  if (!canEdit) {
    alert('Anda tidak memiliki izin untuk mengedit data pemain ini.');
    return;
  }

  const team = teams.find(t => t.id === player.teamId);

  openModal(`
    <form onsubmit="savePlayer('${player.teamId}', '${player.id}', event)" class="space-y-4 text-left text-xs">
      <div class="pb-2 border-b border-slate-800">
        <h2 class="text-lg font-bold text-white">✏️ Edit Data Pemain</h2>
        <p class="text-slate-400">${team ? team.name : ''}</p>
      </div>

      <div>
        <label class="form-label">Nama Lengkap Pemain</label>
        <input type="text" id="playerFullName" class="form-input" value="${player.fullName}" required>
      </div>

      <div>
        <label class="form-label">Unit / Fakultas</label>
        <input type="text" id="playerUnit" class="form-input" value="${player.unit || (team ? team.facultyUnit : '') || ''}" required>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="form-label">Umur (Tahun)</label>
          <input type="number" id="playerUmur" class="form-input font-bold font-mono" value="${player.umur || player.usia || ''}" min="17" max="70" required>
        </div>
        <div>
          <label class="form-label">Posisi Bermain</label>
          <select id="playerPosition" class="form-input font-bold" required>
            <option value="FORWARD" ${player.position === 'FORWARD' ? 'selected' : ''}>PENYERANG (FORWARD)</option>
            <option value="MIDFIELDER" ${player.position === 'MIDFIELDER' ? 'selected' : ''}>GELANDANG (MIDFIELDER)</option>
            <option value="DEFENDER" ${player.position === 'DEFENDER' ? 'selected' : ''}>BEK (DEFENDER)</option>
            <option value="GOALKEEPER" ${player.position === 'GOALKEEPER' ? 'selected' : ''}>PENJAGA GAWANG (KIPER)</option>
          </select>
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
        <button type="button" onclick="closeModal()" class="btn-ucl-secondary">Batal</button>
        <button type="submit" class="btn-ucl-primary font-bold">Simpan Perubahan</button>
      </div>
    </form>
  `);
}

function savePlayer(teamId, playerId, event) {
  if (event) event.preventDefault();

  const fullName = document.getElementById('playerFullName').value.trim();
  const unit = document.getElementById('playerUnit').value.trim();
  const umur = parseInt(document.getElementById('playerUmur').value, 10) || null;
  const position = document.getElementById('playerPosition').value;

  if (playerId) {
    const player = players.find(p => p.id === playerId);
    if (player) {
      player.fullName = fullName;
      player.unit = unit;
      player.umur = umur;
      player.usia = umur;
      player.position = position;
    }
  } else {
    const currentSquad = players.filter(p => p.teamId === teamId);
    if (currentSquad.length >= 14) {
      alert('⚠️ Gagal menambah: Maksimal 14 pemain per tim sudah tercapai!');
      return;
    }

    const newId = `p-${Date.now()}`;
    players.push({
      id: newId,
      teamId,
      fullName,
      unit,
      umur,
      usia: umur,
      identityNumber: '',
      position,
      photoProfileUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(fullName)}`
    });
  }

  saveState();
  renderApp();
  closeModal();
  alert('✅ Data pemain berhasil disimpan!');
}

function deletePlayer(playerId) {
  const player = players.find(p => p.id === playerId);
  if (!player) {
    alert('Pemain tidak ditemukan.');
    return;
  }

  const canEdit = authState.role === 'ADMIN' || (authState.role === 'MANAGER' && authState.teamId === player.teamId);
  if (!canEdit) {
    alert('Anda tidak memiliki izin untuk menghapus pemain ini.');
    return;
  }

  if (confirm(`Hapus pemain "${player.fullName}" dari susunan skuad?`)) {
    const teamId = player.teamId;
    players = players.filter(p => p.id !== playerId);
    saveState();
    renderApp();

    // If modal is currently showing this team's squad, refresh the modal
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer && !modalContainer.classList.contains('hidden')) {
      openTeamSquadModal(teamId);
    }
    alert(`✅ Pemain "${player.fullName}" berhasil dihapus.`);
  }
}

// ========== 11. SURAT TUGAS MODAL ==========
function openUploadSuratTugasModal(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (!team) return;

  const canEdit = authState.role === 'ADMIN' || (authState.role === 'MANAGER' && authState.teamId === teamId);
  if (!canEdit) {
    alert('Anda tidak memiliki izin untuk mengunggah berkas untuk tim ini.');
    return;
  }

  openModal(`
    <form onsubmit="saveSuratTugas('${team.id}', event)" class="space-y-4 text-left text-xs">
      <div class="pb-2 border-b border-slate-800">
        <h2 class="text-lg font-bold text-white">Unggah Surat Tugas: ${team.name}</h2>
        <p class="text-slate-400">Surat Tugas Resmi Dekanat / Pimpinan Lembaga UMS format PDF atau Gambar.</p>
      </div>

      <div>
        <label class="form-label">Pilih Berkas Surat Tugas (PDF / Gambar)</label>
        <input type="file" id="suratTugasFileInput" class="form-input" accept=".pdf,image/*" required>
      </div>

      <div>
        <label class="form-label">Nomor / Judul Dokumen</label>
        <input type="text" id="suratTugasDocName" class="form-input" placeholder="contoh: ST_${team.name.replace(/\s+/g, '_')}_UMS2026.pdf" value="Surat_Tugas_${team.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf">
      </div>

      <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
        <button type="button" onclick="closeModal()" class="btn-ucl-secondary">Batal</button>
        <button type="submit" class="btn-ucl-primary">Simpan Berkas</button>
      </div>
    </form>
  `);
}

function saveSuratTugas(teamId, event) {
  if (event) event.preventDefault();

  const fileInput = document.getElementById('suratTugasFileInput');
  const docNameInput = document.getElementById('suratTugasDocName');

  const team = teams.find(t => t.id === teamId);
  if (!team) return;

  const fileName = fileInput.files[0] ? fileInput.files[0].name : (docNameInput.value || 'Surat_Tugas.pdf');
  team.suratTugasName = fileName;
  team.status = 'APPROVED';

  saveState();
  renderApp();
  closeModal();
  alert(`✅ Berkas Surat Tugas untuk ${team.name} berhasil disimpan!`);
}

// ========== 12. RULES VIEW ==========
function renderRulesSection() {
  const container = document.getElementById('rulesViewContainer');
  if (!container) return;

  const isAdmin = authState.role === 'ADMIN';

  container.innerHTML = `
    <div class="glass-panel p-6 sm:p-8 mb-6 relative">
      <div class="flex justify-between items-center mb-6 pb-4 border-b border-slate-800 flex-wrap gap-4">
        <div class="flex items-center gap-3">
          <span class="text-3xl">📜</span>
          <div>
            <h2 class="text-2xl font-bold text-white">Peraturan &amp; Petunjuk Teknis Turnamen</h2>
            <p class="text-sm text-cyan-300">Minisoccer Champions League Dies Natalis UMS 2026</p>
          </div>
        </div>

        ${isAdmin ? `
          <div class="flex gap-2">
            <button onclick="openEditRulesModal()" class="btn-ucl-primary text-xs font-bold" style="padding: 8px 16px;">
              ✏️ Edit Peraturan &amp; Petunjuk Teknis
            </button>
            <button onclick="resetRulesToDefault()" class="btn-ucl-secondary text-xs" style="padding: 8px 12px;">
              🔄 Reset Default
            </button>
          </div>
        ` : ''}
      </div>

      <div class="space-y-6">
        ${tournamentRules.map((r, idx) => `
          <div class="p-5 rounded-xl bg-slate-900/80 border border-slate-800 relative group">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-base font-bold text-amber-400 flex items-center gap-2">
                <span>📌</span> ${r.category}
              </h3>
              ${isAdmin ? `
                <button onclick="openEditRulesModal(${idx})" class="text-xs text-cyan-400 font-bold hover:underline">
                  ✏️ Edit Kategori Ini
                </button>
              ` : ''}
            </div>
            <ul class="space-y-2 text-xs sm:text-sm text-slate-300 list-disc list-inside">
              ${r.items.map(item => `<li class="leading-relaxed">${item}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function openEditRulesModal(targetIndex = null) {
  if (authState.role !== 'ADMIN') {
    alert('Hanya Super Admin yang dapat mengedit peraturan turnamen.');
    return;
  }

  openModal(`
    <form onsubmit="saveTournamentRules(event)" class="space-y-5 text-left text-xs">
      <div class="pb-3 border-b border-slate-800 flex justify-between items-center">
        <div>
          <span class="badge-gold text-[10px] font-bold">👑 SUPER ADMIN</span>
          <h2 class="text-lg font-bold text-white mt-1">Edit Peraturan &amp; Petunjuk Teknis Turnamen</h2>
        </div>
      </div>

      <div id="rulesEditListContainer" class="space-y-4 max-h-96 overflow-y-auto pr-1">
        ${tournamentRules.map((rule, catIdx) => `
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div>
              <label class="form-label font-bold text-amber-300 text-xs">Judul Kategori #${catIdx + 1}</label>
              <input type="text" class="form-input text-xs font-bold rule-category-input" value="${rule.category}" required>
            </div>

            <div>
              <label class="form-label text-slate-400 text-[11px]">Poin-Poin Peraturan (Pisahkan tiap poin dengan baris baru / Enter):</label>
              <textarea class="form-input text-xs leading-relaxed rule-items-input" rows="5" required>${rule.items.join('\n')}</textarea>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="flex justify-between items-center pt-3 border-t border-slate-800 flex-wrap gap-2">
        <button type="button" onclick="resetRulesToDefault()" class="text-xs text-amber-400 hover:underline font-bold">
          🔄 Kembalikan ke Standar Resmi
        </button>
        <div class="flex gap-2">
          <button type="button" onclick="closeModal()" class="btn-ucl-secondary text-xs">Batal</button>
          <button type="submit" class="btn-ucl-primary text-xs font-bold">💾 Simpan Peraturan</button>
        </div>
      </div>
    </form>
  `);
}

function saveTournamentRules(event) {
  if (event) event.preventDefault();

  const categoryInputs = document.querySelectorAll('.rule-category-input');
  const itemsInputs = document.querySelectorAll('.rule-items-input');

  const updatedRules = [];
  for (let i = 0; i < categoryInputs.length; i++) {
    const cat = categoryInputs[i].value.trim();
    const itemsRaw = itemsInputs[i].value.trim();
    const itemsArr = itemsRaw.split('\n').map(s => s.trim()).filter(s => s.length > 0);

    if (cat && itemsArr.length > 0) {
      updatedRules.push({
        category: cat,
        items: itemsArr
      });
    }
  }

  if (updatedRules.length > 0) {
    tournamentRules = updatedRules;
    saveState();
    renderApp();
    closeModal();
    alert('✅ Peraturan & Petunjuk Teknis turnamen berhasil diperbarui dan disinkronkan ke Cloud!');
  }
}

function resetRulesToDefault() {
  if (confirm('🔄 Kembalikan peraturan ke susunan draf standar resmi Dies Natalis UMS 2026?')) {
    tournamentRules = INITIAL_RULES;
    saveState();
    renderApp();
    closeModal();
    alert('✅ Peraturan turnamen berhasil dikembalikan ke standar resmi!');
  }
}

// ========== 13. AUTHENTICATION & MODERN SOCIAL-STYLE LOGIN ==========
function handleUnifiedLogin(event) {
  if (event) event.preventDefault();

  const username = document.getElementById('unifiedUsername').value.trim();
  const password = document.getElementById('unifiedPassword').value.trim();
  const errorEl = document.getElementById('unifiedLoginError');

  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    authState = {
      isLoggedIn: true,
      role: 'ADMIN',
      teamId: null,
      displayName: 'Super Admin'
    };
    saveState();
    if (errorEl) errorEl.classList.add('hidden');
    switchRole('ADMIN');
    return;
  }

  const manager = MANAGER_CREDENTIALS.find(m => m.username === username && m.password === password);
  if (manager) {
    const team = teams.find(t => t.id === manager.teamId);
    authState = {
      isLoggedIn: true,
      role: 'MANAGER',
      teamId: manager.teamId,
      displayName: team ? team.name : manager.displayName
    };
    saveState();
    if (errorEl) errorEl.classList.add('hidden');
    switchRole('TEAM_MANAGER');
    return;
  }

  if (errorEl) errorEl.classList.remove('hidden');
}

function quickLogin(role, teamId = null) {
  if (role === 'ADMIN') {
    authState = {
      isLoggedIn: true,
      role: 'ADMIN',
      teamId: null,
      displayName: 'Super Admin'
    };
    saveState();
    switchRole('ADMIN');
  } else if (role === 'MANAGER' && teamId) {
    const team = teams.find(t => t.id === teamId);
    const cred = MANAGER_CREDENTIALS.find(c => c.teamId === teamId);
    authState = {
      isLoggedIn: true,
      role: 'MANAGER',
      teamId: teamId,
      displayName: team ? team.name : (cred ? cred.displayName : 'Manajer Tim')
    };
    saveState();
    switchRole('TEAM_MANAGER');
  }
}

function populateManagerDropdown() {
  const container = document.getElementById('managerDropdownList');
  if (!container) return;

  container.innerHTML = teams.map(t => `
    <div onclick="selectQuickManager('${t.id}')" class="p-2.5 rounded-lg hover:bg-slate-800 cursor-pointer flex items-center gap-2.5 transition-all text-xs">
      <img src="${t.logoUrl}" style="width:20px;height:20px;border-radius:50%;">
      <div class="truncate">
        <strong class="text-white block truncate">${t.name}</strong>
        <span class="text-[10px] text-slate-400">Manajer: ${t.managerName || '-'}</span>
      </div>
    </div>
  `).join('');
}

function toggleManagerDropdown() {
  const container = document.getElementById('managerDropdownList');
  if (!container) return;
  populateManagerDropdown();
  container.classList.toggle('hidden');
}

function selectQuickManager(teamId) {
  const container = document.getElementById('managerDropdownList');
  if (container) container.classList.add('hidden');
  quickLogin('MANAGER', teamId);
}

function togglePasswordVisibility() {
  const input = document.getElementById('unifiedPassword');
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
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

// ========== 14. NAVBAR & BANNER EDIT MODALS (ADMIN ONLY) ==========
function openEditNavbarModal() {
  openModal(`
    <form onsubmit="saveNavbarConfig(event)" class="space-y-4 text-left text-xs">
      <div class="pb-2 border-b border-slate-800">
        <h2 class="text-lg font-bold text-white">Edit Header &amp; Top Navbar</h2>
      </div>

      <div>
        <label class="form-label">Judul Utama</label>
        <input type="text" id="editNavTitle" class="form-input" value="${navbarConfig.title || 'DIES NATALIS UMS 2026'}" required>
      </div>

      <div>
        <label class="form-label">Subjudul</label>
        <input type="text" id="editNavSubtitle" class="form-input" value="${navbarConfig.subtitle || 'Minisoccer Tournament System'}" required>
      </div>

      <div>
        <label class="form-label">URL Logo</label>
        <input type="text" id="editNavLogo" class="form-input" value="${navbarConfig.logoUrl || ''}" required>
      </div>

      <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
        <button type="button" onclick="closeModal()" class="btn-ucl-secondary">Batal</button>
        <button type="submit" class="btn-ucl-primary">Simpan Header</button>
      </div>
    </form>
  `);
}

function saveNavbarConfig(event) {
  if (event) event.preventDefault();
  navbarConfig = {
    title: document.getElementById('editNavTitle').value.trim(),
    subtitle: document.getElementById('editNavSubtitle').value.trim(),
    logoUrl: document.getElementById('editNavLogo').value.trim()
  };
  saveState();
  renderApp();
  closeModal();
}

function openEditHeroModal() {
  openModal(`
    <form onsubmit="saveHeroContent(event)" class="space-y-4 text-left text-xs">
      <div class="pb-2 border-b border-slate-800">
        <h2 class="text-lg font-bold text-white">Edit Banner Beranda</h2>
      </div>

      <div>
        <label class="form-label">Judul Banner</label>
        <input type="text" id="editHeroTitle" class="form-input" value="${homepageContent.heroTitle || ''}" required>
      </div>

      <div>
        <label class="form-label">Subjudul Banner</label>
        <input type="text" id="editHeroSubtitle" class="form-input" value="${homepageContent.heroSubtitle || ''}" required>
      </div>

      <div>
        <label class="form-label">Pesan Sambutan</label>
        <textarea id="editHeroWelcome" class="form-input" rows="3" required>${homepageContent.welcomeMessage || ''}</textarea>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="form-label">Tanggal Pelaksanaan</label>
          <input type="text" id="editHeroDates" class="form-input" value="${homepageContent.dates || ''}" required>
        </div>
        <div>
          <label class="form-label">Lokasi</label>
          <input type="text" id="editHeroLocation" class="form-input" value="${homepageContent.location || ''}" required>
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
        <button type="button" onclick="closeModal()" class="btn-ucl-secondary">Batal</button>
        <button type="submit" class="btn-ucl-primary">Simpan Banner</button>
      </div>
    </form>
  `);
}

function saveHeroContent(event) {
  if (event) event.preventDefault();
  homepageContent = {
    heroTitle: document.getElementById('editHeroTitle').value.trim(),
    heroSubtitle: document.getElementById('editHeroSubtitle').value.trim(),
    welcomeMessage: document.getElementById('editHeroWelcome').value.trim(),
    dates: document.getElementById('editHeroDates').value.trim(),
    location: document.getElementById('editHeroLocation').value.trim()
  };
  saveState();
  renderApp();
  closeModal();
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
  renderApp();

  // Initialize real-time sync with Cloud Firestore
  initFirestoreRealtimeSync((cloudData) => {
    if (cloudData) {
      if (cloudData.teams && Array.isArray(cloudData.teams)) teams = cloudData.teams;
      if (cloudData.players && Array.isArray(cloudData.players)) players = cloudData.players;
      if (cloudData.officials && Array.isArray(cloudData.officials)) officials = cloudData.officials;
      if (cloudData.matches && Array.isArray(cloudData.matches)) {
        matches = updateKnockoutProgression(cloudData.matches);
      }
      if (cloudData.homepageContent && typeof cloudData.homepageContent === 'object') homepageContent = cloudData.homepageContent;
      if (cloudData.tournamentRules && Array.isArray(cloudData.tournamentRules) && JSON.stringify(cloudData.tournamentRules).includes('35 tahun')) {
        tournamentRules = cloudData.tournamentRules;
      } else {
        tournamentRules = INITIAL_RULES;
      }
      if (cloudData.navbarConfig && typeof cloudData.navbarConfig === 'object') navbarConfig = cloudData.navbarConfig;

      saveState(true);
      renderApp();
      updateCloudSyncBadge('online', 'Tersinkronisasi');
    }
  }, updateCloudSyncBadge);
});
