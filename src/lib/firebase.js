/**
 * Firebase Cloud Firestore Integration
 * Ultra Real-time Multi-Strategy Cloud Sync across all devices and browsers
 * Features: onSnapshot Listener + 2.5s Heartbeat Polling + Cross-tab BroadcastChannel + Window Focus Refresh
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { 
  initializeFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot,
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export const firebaseConfig = {
  apiKey: "AIzaSyB5ggfDs3r3hdzQGGrteiZtW4vFgWVtVCI",
  authDomain: "dies-natalis-ums-2026.firebaseapp.com",
  projectId: "dies-natalis-ums-2026",
  storageBucket: "dies-natalis-ums-2026.firebasestorage.app",
  messagingSenderId: "912617266657",
  appId: "1:912617266657:web:c6d163bd67cd5b83e506a0"
};

let app = null;
let db = null;
let isFirestoreInitialized = false;
let saveTimeout = null;
let heartbeatInterval = null;
let lastSyncedJSONString = '';

// Cross-tab broadcast channel
const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('ums_minisoccer_sync_channel') : null;

try {
  app = initializeApp(firebaseConfig);
  // Configure Firestore with long polling to ensure 100% compatibility across Safari, Chrome, and Mobile
  db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    useFetchStreams: false
  });
  isFirestoreInitialized = true;
  console.log('🔥 Firebase App & Firestore initialized with multi-strategy real-time sync.');
} catch (error) {
  console.error('⚠️ Failed to initialize Firebase:', error);
}

const TOURNAMENT_COLLECTION = 'tournament_data';
const MAIN_DOCUMENT = 'main';

/**
 * Sanitize JS objects to ensure no undefined values are sent to Firestore
 */
function sanitizeForFirestore(obj) {
  return JSON.parse(JSON.stringify(obj, (k, v) => (v === undefined ? null : v)));
}

/**
 * Start multi-strategy real-time Firestore synchronization
 */
export function initFirestoreRealtimeSync(onDataUpdated, onStatusChanged, defaultInitialData) {
  if (!isFirestoreInitialized || !db) {
    if (onStatusChanged) onStatusChanged('offline', 'Firebase tidak terinisialisasi');
    return;
  }

  const docRef = doc(db, TOURNAMENT_COLLECTION, MAIN_DOCUMENT);

  if (onStatusChanged) onStatusChanged('connecting', 'Menghubungkan ke Cloud Firestore...');

  const applyCloudData = (data) => {
    if (!data) return;
    const jsonStr = JSON.stringify({
      t: data.teams,
      p: data.players,
      o: data.officials,
      m: data.matches,
      d: data.drawnSlots,
      h: data.homepageContent,
      r: data.tournamentRules,
      n: data.navbarConfig
    });

    if (jsonStr !== lastSyncedJSONString) {
      lastSyncedJSONString = jsonStr;
      console.log('⚡ Automatic real-time sync applied from cloud at', new Date().toLocaleTimeString());
      if (onStatusChanged) onStatusChanged('online', 'Tersinkronisasi Realtime');
      if (onDataUpdated) onDataUpdated(data);
    }
  };

  // 1. Primary Strategy: Firestore onSnapshot Realtime Stream
  onSnapshot(docRef, async (docSnap) => {
    if (docSnap.exists()) {
      applyCloudData(docSnap.data());
    } else {
      console.log('🆕 Firestore document does not exist yet. Initializing with default tournament data...');
      if (onStatusChanged) onStatusChanged('syncing', 'Menginisialisasi data awal cloud...');
      try {
        const cleanInitialData = sanitizeForFirestore(defaultInitialData);
        await setDoc(docRef, {
          ...cleanInitialData,
          updatedAt: serverTimestamp(),
          version: 1
        });
        console.log('✅ Initial cloud tournament data successfully published to Firestore!');
        if (onStatusChanged) onStatusChanged('online', 'Data Awal Berhasil Diterbitkan');
      } catch (err) {
        console.error('⚠️ Error initializing default Firestore document:', err);
        if (onStatusChanged) onStatusChanged('error', 'Gagal inisialisasi cloud: ' + err.message);
      }
    }
  }, (error) => {
    console.error('⚠️ Firestore snapshot listener error:', error);
    if (onStatusChanged) onStatusChanged('error', 'Koneksi Firestore terganggu: ' + error.message);
  });

  // 2. Secondary Strategy: Background 2.5s Heartbeat Polling
  // Ensures updates propagate even if WebSocket/WebChannel stalls in Safari
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(async () => {
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        applyCloudData(snap.data());
      }
    } catch (e) {
      // Background poll silently continues
    }
  }, 2500);

  // 3. Tertiary Strategy: Instant Refresh on Window Focus / Visibility
  window.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
      try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          applyCloudData(snap.data());
        }
      } catch (e) {}
    }
  });

  // 4. Quaternary Strategy: Cross-Tab Broadcast Channel (<10ms across tabs)
  if (syncChannel) {
    syncChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'LOCAL_STATE_CHANGED' && event.data.payload) {
        console.log('⚡ Instant cross-tab broadcast received!');
        applyCloudData(event.data.payload);
      }
    };
  }
}

/**
 * Fetch latest data from Firestore immediately (One-time pull)
 */
export async function fetchLatestFirestoreData() {
  if (!isFirestoreInitialized || !db) return null;
  try {
    const docRef = doc(db, TOURNAMENT_COLLECTION, MAIN_DOCUMENT);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (e) {
    console.error('⚠️ Error fetching document:', e);
  }
  return null;
}

/**
 * Save current tournament state to Cloud Firestore (Real-time broadcast)
 */
export function saveStateToFirestore(stateData, onStatusChanged) {
  if (!isFirestoreInitialized || !db) return;

  const cleanPayload = sanitizeForFirestore({
    teams: stateData.teams || [],
    players: stateData.players || [],
    officials: stateData.officials || [],
    matches: stateData.matches || [],
    drawnSlots: stateData.drawnSlots || [],
    homepageContent: stateData.homepageContent || {},
    tournamentRules: stateData.tournamentRules || [],
    navbarConfig: stateData.navbarConfig || {},
    lastUpdatedBy: stateData.updatedBy || 'Super Admin'
  });

  // Immediately notify other local tabs via BroadcastChannel
  if (syncChannel) {
    try {
      syncChannel.postMessage({
        type: 'LOCAL_STATE_CHANGED',
        payload: cleanPayload
      });
    } catch (e) {}
  }

  if (saveTimeout) clearTimeout(saveTimeout);

  if (onStatusChanged) onStatusChanged('syncing', 'Menyimpan ke Cloud...');

  saveTimeout = setTimeout(async () => {
    try {
      const docRef = doc(db, TOURNAMENT_COLLECTION, MAIN_DOCUMENT);
      await setDoc(docRef, {
        ...cleanPayload,
        updatedAt: serverTimestamp()
      }, { merge: true });

      console.log('☁️ State successfully synced to Cloud Firestore!');
      if (onStatusChanged) onStatusChanged('online', 'Tersinkronisasi ke Cloud');
    } catch (err) {
      console.error('⚠️ Failed to save state to Firestore:', err);
      if (onStatusChanged) onStatusChanged('error', 'Gagal simpan ke cloud: ' + err.message);
    }
  }, 50); // 50ms fast response
}
