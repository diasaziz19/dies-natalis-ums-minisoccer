/**
 * Firebase Cloud Firestore Integration
 * Ultra Real-time Multi-Strategy Cloud Sync across all devices and browsers
 * Features: Dynamic Safe Loading + onSnapshot Listener + 2.5s Heartbeat Polling + Cross-tab BroadcastChannel
 */

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

let docFn = null;
let setDocFn = null;
let getDocFn = null;
let onSnapshotFn = null;
let serverTimestampFn = null;

// Cross-tab broadcast channel
const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('ums_minisoccer_sync_channel') : null;

const TOURNAMENT_COLLECTION = 'tournament_data';
const MAIN_DOCUMENT = 'main';

/**
 * Sanitize JS objects to ensure no undefined values are sent to Firestore
 */
function sanitizeForFirestore(obj) {
  return JSON.parse(JSON.stringify(obj, (k, v) => (v === undefined ? null : v)));
}

async function ensureFirebaseLoaded() {
  if (isFirestoreInitialized) return true;
  try {
    const appMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
    const firestoreMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

    app = appMod.initializeApp(firebaseConfig);
    db = firestoreMod.initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      useFetchStreams: false
    });

    docFn = firestoreMod.doc;
    setDocFn = firestoreMod.setDoc;
    getDocFn = firestoreMod.getDoc;
    onSnapshotFn = firestoreMod.onSnapshot;
    serverTimestampFn = firestoreMod.serverTimestamp;

    isFirestoreInitialized = true;
    console.log('🔥 Firebase App & Firestore initialized dynamically.');
    return true;
  } catch (error) {
    console.warn('⚠️ Firebase dynamic import blocked or failed, running in local mode:', error);
    return false;
  }
}

/**
 * Start multi-strategy real-time Firestore synchronization
 */
export async function initFirestoreRealtimeSync(onDataUpdated, onStatusChanged, defaultInitialData) {
  const loaded = await ensureFirebaseLoaded();
  if (!loaded || !db || !docFn) {
    if (onStatusChanged) onStatusChanged('offline', 'Modus Lokal (Cloud Offline)');
    return;
  }

  const docRef = docFn(db, TOURNAMENT_COLLECTION, MAIN_DOCUMENT);

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
  try {
    onSnapshotFn(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        applyCloudData(docSnap.data());
      } else if (defaultInitialData) {
        console.log('🆕 Firestore document does not exist yet. Initializing default data...');
        if (onStatusChanged) onStatusChanged('syncing', 'Menginisialisasi data awal cloud...');
        try {
          const cleanInitialData = sanitizeForFirestore(defaultInitialData);
          await setDocFn(docRef, {
            ...cleanInitialData,
            updatedAt: serverTimestampFn(),
            version: 1
          });
          if (onStatusChanged) onStatusChanged('online', 'Data Awal Berhasil Diterbitkan');
        } catch (err) {
          console.error('⚠️ Error initializing default Firestore document:', err);
        }
      }
    }, (error) => {
      console.warn('⚠️ Firestore snapshot listener error:', error);
      if (onStatusChanged) onStatusChanged('offline', 'Status: Lokal');
    });
  } catch (e) {}

  // 2. Secondary Strategy: Background 2.5s Heartbeat Polling
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(async () => {
    try {
      if (getDocFn && db) {
        const snap = await getDocFn(docRef);
        if (snap.exists()) {
          applyCloudData(snap.data());
        }
      }
    } catch (e) {}
  }, 2500);

  // 3. Tertiary Strategy: Instant Refresh on Window Focus / Visibility
  window.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && getDocFn && db) {
      try {
        const snap = await getDocFn(docRef);
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
  const loaded = await ensureFirebaseLoaded();
  if (!loaded || !db || !getDocFn) return null;
  try {
    const docRef = docFn(db, TOURNAMENT_COLLECTION, MAIN_DOCUMENT);
    const snap = await getDocFn(docRef);
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
export async function saveStateToFirestore(stateData, onStatusChanged) {
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

  const loaded = await ensureFirebaseLoaded();
  if (!loaded || !db || !setDocFn || !docFn) return;

  if (saveTimeout) clearTimeout(saveTimeout);

  if (onStatusChanged) onStatusChanged('syncing', 'Menyimpan ke Cloud...');

  saveTimeout = setTimeout(async () => {
    try {
      const docRef = docFn(db, TOURNAMENT_COLLECTION, MAIN_DOCUMENT);
      await setDocFn(docRef, {
        ...cleanPayload,
        updatedAt: serverTimestampFn ? serverTimestampFn() : new Date()
      }, { merge: true });

      console.log('☁️ State successfully synced to Cloud Firestore!');
      if (onStatusChanged) onStatusChanged('online', 'Tersinkronisasi ke Cloud');
    } catch (err) {
      console.warn('⚠️ Failed to save state to Firestore:', err);
      if (onStatusChanged) onStatusChanged('offline', 'Modus Lokal');
    }
  }, 50);
}
