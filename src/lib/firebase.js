/**
 * Firebase Cloud Firestore Integration
 * Real-time cloud sync across all devices and browsers for Dies Natalis UMS 2026 Minisoccer
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { 
  getFirestore, 
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
  db = getFirestore(app);
  isFirestoreInitialized = true;
  console.log('🔥 Firebase App & Firestore initialized successfully.');
} catch (error) {
  console.error('⚠️ Failed to initialize Firebase:', error);
}

const TOURNAMENT_COLLECTION = 'tournament_data';
const MAIN_DOCUMENT = 'main';

/**
 * Start real-time Firestore listener
 * @param {Function} onDataUpdated Callback when remote Firestore data changes
 * @param {Function} onStatusChanged Callback for cloud sync status (online/offline/syncing)
 * @param {Object} defaultInitialData Initial mock data if cloud document is empty
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
      console.log('📥 Realtime update received from Firestore at', new Date().toLocaleTimeString());
      if (onStatusChanged) onStatusChanged('online', 'Tersinkronisasi Realtime');
      if (onDataUpdated) onDataUpdated(data);
    } else {
      console.log('🆕 Firestore document does not exist yet. Initializing with default tournament data...');
      if (onStatusChanged) onStatusChanged('syncing', 'Menginisialisasi data awal cloud...');
      try {
        await setDoc(docRef, {
          ...defaultInitialData,
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
 * Save current tournament state to Cloud Firestore (Real-time broadcast)
 * @param {Object} stateData Tournament data payload
 * @param {Function} onStatusChanged Callback for status
 */
export function saveStateToFirestore(stateData, onStatusChanged) {
  if (!isFirestoreInitialized || !db) return;

  if (saveTimeout) clearTimeout(saveTimeout);

  if (onStatusChanged) onStatusChanged('syncing', 'Menyimpan ke Cloud...');

  saveTimeout = setTimeout(async () => {
    try {
      const docRef = doc(db, TOURNAMENT_COLLECTION, MAIN_DOCUMENT);
      await setDoc(docRef, {
        teams: stateData.teams || [],
        players: stateData.players || [],
        officials: stateData.officials || [],
        matches: stateData.matches || [],
        drawnSlots: stateData.drawnSlots || [],
        homepageContent: stateData.homepageContent || {},
        tournamentRules: stateData.tournamentRules || [],
        navbarConfig: stateData.navbarConfig || {},
        updatedAt: serverTimestamp(),
        lastUpdatedBy: stateData.updatedBy || 'Super Admin'
      }, { merge: true });

      console.log('☁️ State successfully synced to Cloud Firestore!');
      if (onStatusChanged) onStatusChanged('online', 'Tersinkronisasi ke Cloud');
    } catch (err) {
      console.error('⚠️ Failed to save state to Firestore:', err);
      if (onStatusChanged) onStatusChanged('error', 'Gagal simpan ke cloud: ' + err.message);
    }
  }, 250); // 250ms debounce
}
