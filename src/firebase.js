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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

// Save broadcast to database
export const saveBroadcast = async (roomCode, config) => {
  try {
    const broadcastRef = ref(database, `broadcasts/${roomCode}`);
    await set(broadcastRef, {
      config: config,
      createdAt: new Date().toISOString(),
      accessCount: 0
    });
    return true;
  } catch (error) {
    console.error('Error saving broadcast:', error);
    return false;
  }
};

// Get broadcast by room code
export const getBroadcast = async (roomCode) => {
  try {
    const broadcastRef = ref(database, `broadcasts/${roomCode}`);
    const snapshot = await get(broadcastRef);
    if (snapshot.exists()) {
      return snapshot.val().config;
    }
    return null;
  } catch (error) {
    console.error('Error fetching broadcast:', error);
    return null;
  }
};

// Get all broadcasts
export const getAllBroadcasts = async () => {
  try {
    const broadcastsRef = ref(database, 'broadcasts');
    const snapshot = await get(broadcastsRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return {};
  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    return {};
  }
};

// Update access count
export const incrementAccessCount = async (roomCode) => {
  try {
    const updateRef = ref(database, `broadcasts/${roomCode}/accessCount`);
    const snapshot = await get(updateRef);
    const currentCount = snapshot.val() || 0;
    await set(updateRef, currentCount + 1);
  } catch (error) {
    console.error('Error updating access count:', error);
  }
};

// Delete broadcast
export const deleteBroadcast = async (roomCode) => {
  try {
    const broadcastRef = ref(database, `broadcasts/${roomCode}`);
    await set(broadcastRef, null);
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
    const scoreRef = ref(database, `scores/${roomCode}/${timestamp}`);
    await set(scoreRef, {
      playerName: playerName || "Anonymous",
      score: score,
      completedAt: timestamp
    });
    return true;
  } catch (error) {
    console.error('Error saving score:', error);
    return false;
  }
};

// Get scores for a room
export const getRoomScores = async (roomCode) => {
  try {
    const scoresRef = ref(database, `scores/${roomCode}`);
    const snapshot = await get(scoresRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return {};
  } catch (error) {
    console.error('Error fetching scores:', error);
    return {};
  }
};
