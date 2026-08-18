/**
 * Firebase Cloud Firestore Integration
 * Real-time cloud sync across all devices and browsers for Dies Natalis UMS 2026 Minisoccer
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

try {
  app = initializeApp(firebaseConfig);
  // Configure Firestore with long polling to ensure 100% compatibility across Safari, Chrome, and Mobile
  db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    useFetchStreams: false
  });
  isFirestoreInitialized = true;
  console.log('🔥 Firebase App & Firestore initialized with long-polling compatibility.');
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
 * Start real-time Firestore listener
 */
export function initFirestoreRealtimeSync(onDataUpdated, onStatusChanged, defaultInitialData) {
  if (!isFirestoreInitialized || !db) {
    if (onStatusChanged) onStatusChanged('offline', 'Firebase tidak terinisialisasi');
    return;
  }

  const docRef = doc(db, TOURNAMENT_COLLECTION, MAIN_DOCUMENT);

  if (onStatusChanged) onStatusChanged('connecting', 'Menghubungkan ke Cloud Firestore...');

  // Setup real-time listener
  onSnapshot(docRef, async (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('📥 Realtime update received from Firestore:', data);
      if (onStatusChanged) onStatusChanged('online', 'Tersinkronisasi Realtime');
      if (onDataUpdated) onDataUpdated(data);
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

  if (saveTimeout) clearTimeout(saveTimeout);

  if (onStatusChanged) onStatusChanged('syncing', 'Menyimpan ke Cloud...');

  saveTimeout = setTimeout(async () => {
    try {
      const docRef = doc(db, TOURNAMENT_COLLECTION, MAIN_DOCUMENT);
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
  }, 200); // 200ms debounce
}
