import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, update } from 'firebase/database';

// TODO: Replace with your Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  databaseURL: "YOUR_DATABASE_URL"
};

let app, database;
let isFirebaseReady = false;

try {
  // Only initialize if config is valid
  if (firebaseConfig.projectId !== "YOUR_PROJECT_ID") {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    isFirebaseReady = true;
    console.log('✓ Firebase initialized');
  } else {
    console.warn('⚠ Firebase not configured. Using local storage fallback.');
  }
} catch (error) {
  console.warn('⚠ Firebase initialization failed. Using local storage fallback.', error);
}

export { database, isFirebaseReady };

// Save broadcast to database (with fallback to localStorage)
export const saveBroadcast = async (roomCode, config) => {
  try {
    if (isFirebaseReady && database) {
      const broadcastRef = ref(database, `broadcasts/${roomCode}`);
      await set(broadcastRef, {
        config: config,
        createdAt: new Date().toISOString(),
        accessCount: 0
      });
      console.log('✓ Broadcast saved to Firebase');
      return true;
    } else {
      // Fallback to localStorage
      const rooms = JSON.parse(localStorage.getItem('bombDefusalRooms') || '{}');
      rooms[roomCode] = config;
      localStorage.setItem('bombDefusalRooms', JSON.stringify(rooms));
      console.log('✓ Broadcast saved to localStorage (Firebase not available)');
      return true;
    }
  } catch (error) {
    console.error('Error saving broadcast:', error);
    // Try localStorage as fallback
    try {
      const rooms = JSON.parse(localStorage.getItem('bombDefusalRooms') || '{}');
      rooms[roomCode] = config;
      localStorage.setItem('bombDefusalRooms', JSON.stringify(rooms));
      return true;
    } catch (e) {
      return false;
    }
  }
};

// Get broadcast by room code (with fallback)
export const getBroadcast = async (roomCode) => {
  try {
    if (isFirebaseReady && database) {
      const broadcastRef = ref(database, `broadcasts/${roomCode}`);
      const snapshot = await get(broadcastRef);
      if (snapshot.exists()) {
        return snapshot.val().config;
      }
    }
    // Fallback to localStorage
    const rooms = JSON.parse(localStorage.getItem('bombDefusalRooms') || '{}');
    return rooms[roomCode] || null;
  } catch (error) {
    console.error('Error fetching broadcast:', error);
    const rooms = JSON.parse(localStorage.getItem('bombDefusalRooms') || '{}');
    return rooms[roomCode] || null;
  }
};

// Get all broadcasts (with fallback)
export const getAllBroadcasts = async () => {
  try {
    if (isFirebaseReady && database) {
      const broadcastsRef = ref(database, 'broadcasts');
      const snapshot = await get(broadcastsRef);
      if (snapshot.exists()) {
        return snapshot.val();
      }
    }
    // Fallback to localStorage
    return JSON.parse(localStorage.getItem('bombDefusalRooms') || '{}');
  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    return JSON.parse(localStorage.getItem('bombDefusalRooms') || '{}');
  }
};

// Update access count
export const incrementAccessCount = async (roomCode) => {
  try {
    if (isFirebaseReady && database) {
      const updateRef = ref(database, `broadcasts/${roomCode}/accessCount`);
      const snapshot = await get(updateRef);
      const currentCount = snapshot.val() || 0;
      await set(updateRef, currentCount + 1);
    }
  } catch (error) {
    console.error('Error updating access count:', error);
  }
};

// Delete broadcast
export const deleteBroadcast = async (roomCode) => {
  try {
    if (isFirebaseReady && database) {
      const broadcastRef = ref(database, `broadcasts/${roomCode}`);
      await set(broadcastRef, null);
    }
    // Also remove from localStorage
    const rooms = JSON.parse(localStorage.getItem('bombDefusalRooms') || '{}');
    delete rooms[roomCode];
    localStorage.setItem('bombDefusalRooms', JSON.stringify(rooms));
    return true;
  } catch (error) {
    console.error('Error deleting broadcast:', error);
    return false;
  }
};

// Save game score
export const saveGameScore = async (roomCode, playerName, score) => {
  try {
    const timestamp = new Date().toISOString();
    if (isFirebaseReady && database) {
      const scoreRef = ref(database, `scores/${roomCode}/${timestamp}`);
      await set(scoreRef, {
        playerName: playerName || "Anonymous",
        score: score,
        completedAt: timestamp
      });
    }
    return true;
  } catch (error) {
    console.error('Error saving score:', error);
    return false;
  }
};

// Get scores for a room
export const getRoomScores = async (roomCode) => {
  try {
    if (isFirebaseReady && database) {
      const scoresRef = ref(database, `scores/${roomCode}`);
      const snapshot = await get(scoresRef);
      if (snapshot.exists()) {
        return snapshot.val();
      }
    }
    return {};
  } catch (error) {
    console.error('Error fetching scores:', error);
    return {};
  }
};

