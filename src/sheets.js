// Google Sheets Integration for Bomb Defusal Game
// Replace these with your own values (see setup instructions in README)
const SHEETS_CONFIG = {
  spreadsheetId: 'YOUR_SPREADSHEET_ID',
  apiKey: 'YOUR_GOOGLE_API_KEY',
};

// localStorage fallback for when Sheets isn't configured
let sheetsReady = false;

// Initialize Sheets (check if config is valid)
export const initializeSheets = () => {
  if (
    SHEETS_CONFIG.spreadsheetId !== 'YOUR_SPREADSHEET_ID' &&
    SHEETS_CONFIG.apiKey !== 'YOUR_GOOGLE_API_KEY'
  ) {
    sheetsReady = true;
    console.log('✅ Google Sheets initialized');
  } else {
    console.log('⚠️  Using localStorage fallback (Google Sheets not configured)');
  }
};

// Helper: Get all data from Sheets
const getSheetData = async (range = 'Broadcasts!A:F') => {
  if (!sheetsReady) return null;

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_CONFIG.spreadsheetId}/values/${range}?key=${SHEETS_CONFIG.apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error('❌ Error reading from Sheets:', error);
    return null;
  }
};

// Helper: Append data to Sheets
const appendToSheet = async (range = 'Broadcasts!A:F', values) => {
  if (!sheetsReady) return false;

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_CONFIG.spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&key=${SHEETS_CONFIG.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [values] }),
    });
    return response.ok;
  } catch (error) {
    console.error('❌ Error writing to Sheets:', error);
    return false;
  }
};

// Helper: Update a row in Sheets
const updateSheetRow = async (range, values) => {
  if (!sheetsReady) return false;

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_CONFIG.spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED&key=${SHEETS_CONFIG.apiKey}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [values] }),
    });
    return response.ok;
  } catch (error) {
    console.error('❌ Error updating Sheets:', error);
    return false;
  }
};

// Save a broadcast to Sheets
export const saveBroadcast = async (roomCode, config) => {
  // Try Sheets first
  if (sheetsReady) {
    const success = await appendToSheet('Broadcasts!A:F', [
      roomCode,
      JSON.stringify(config),
      new Date().toISOString(),
      1,
      '', // reserved
      '',
    ]);
    if (success) return true;
  }

  // Fallback to localStorage
  const broadcasts = JSON.parse(localStorage.getItem('broadcasts') || '{}');
  broadcasts[roomCode] = {
    config,
    createdAt: new Date().toISOString(),
    accessCount: 1,
  };
  localStorage.setItem('broadcasts', JSON.stringify(broadcasts));
  return true;
};

// Get a specific broadcast
export const getBroadcast = async (roomCode) => {
  // Try Sheets first
  if (sheetsReady) {
    const rows = await getSheetData('Broadcasts!A:F');
    if (rows && rows.length > 1) {
      // Skip header row
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === roomCode) {
          try {
            // Increment access count
            await updateSheetRow(`Broadcasts!D${i + 1}`, [Number(rows[i][3]) + 1]);
            return JSON.parse(rows[i][1]);
          } catch (error) {
            console.error('Error parsing config:', error);
          }
        }
      }
    }
  }

  // Fallback to localStorage
  const broadcasts = JSON.parse(localStorage.getItem('broadcasts') || '{}');
  if (broadcasts[roomCode]) {
    broadcasts[roomCode].accessCount = (broadcasts[roomCode].accessCount || 0) + 1;
    localStorage.setItem('broadcasts', JSON.stringify(broadcasts));
    return broadcasts[roomCode].config;
  }

  return null;
};

// Get all broadcasts
export const getAllBroadcasts = async () => {
  // Try Sheets first
  if (sheetsReady) {
    const rows = await getSheetData('Broadcasts!A:F');
    if (rows && rows.length > 1) {
      const broadcasts = {};
      for (let i = 1; i < rows.length; i++) {
        try {
          broadcasts[rows[i][0]] = {
            config: JSON.parse(rows[i][1]),
            createdAt: rows[i][2],
            accessCount: Number(rows[i][3]) || 0,
          };
        } catch (error) {
          console.error('Error parsing broadcast:', error);
        }
      }
      return broadcasts;
    }
  }

  // Fallback to localStorage
  return JSON.parse(localStorage.getItem('broadcasts') || '{}');
};

// Save game score
export const saveGameScore = async (roomCode, score) => {
  // Try Sheets first
  if (sheetsReady) {
    const success = await appendToSheet('Scores!A:D', [
      roomCode,
      score.playerName || 'Anonymous',
      score.timeSpent || 0,
      new Date().toISOString(),
    ]);
    if (success) return true;
  }

  // Fallback to localStorage
  const scores = JSON.parse(localStorage.getItem('scores') || '{}');
  if (!scores[roomCode]) scores[roomCode] = [];
  scores[roomCode].push({
    ...score,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem('scores', JSON.stringify(scores));
  return true;
};

// Get scores for a room
export const getRoomScores = async (roomCode) => {
  // Try Sheets first
  if (sheetsReady) {
    const rows = await getSheetData('Scores!A:D');
    if (rows && rows.length > 1) {
      return rows.filter((row) => row[0] === roomCode).slice(1);
    }
  }

  // Fallback to localStorage
  const scores = JSON.parse(localStorage.getItem('scores') || '{}');
  return scores[roomCode] || [];
};

// Delete a broadcast
export const deleteBroadcast = async (roomCode) => {
  // Try Sheets first (note: Sheets API requires DELETE via batchUpdate, so we'll just clear the row)
  if (sheetsReady) {
    const rows = await getSheetData('Broadcasts!A:F');
    if (rows && rows.length > 1) {
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === roomCode) {
          // Clear the row (set empty values)
          await updateSheetRow(`Broadcasts!A${i + 1}:F${i + 1}`, ['', '', '', '', '', '']);
          break;
        }
      }
    }
  }

  // Fallback to localStorage
  const broadcasts = JSON.parse(localStorage.getItem('broadcasts') || '{}');
  delete broadcasts[roomCode];
  localStorage.setItem('broadcasts', JSON.stringify(broadcasts));
  return true;
};

// Increment access count
export const incrementAccessCount = async (roomCode) => {
  // Try Sheets first
  if (sheetsReady) {
    const rows = await getSheetData('Broadcasts!A:F');
    if (rows && rows.length > 1) {
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === roomCode) {
          const newCount = Number(rows[i][3]) + 1 || 1;
          await updateSheetRow(`Broadcasts!D${i + 1}`, [newCount]);
          break;
        }
      }
    }
  }

  // Fallback to localStorage
  const broadcasts = JSON.parse(localStorage.getItem('broadcasts') || '{}');
  if (broadcasts[roomCode]) {
    broadcasts[roomCode].accessCount = (broadcasts[roomCode].accessCount || 0) + 1;
    localStorage.setItem('broadcasts', JSON.stringify(broadcasts));
  }
};
