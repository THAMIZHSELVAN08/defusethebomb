# Google Sheets Setup Guide

Your bomb defusal game is now configured to use Google Sheets for storing broadcasts! Follow these steps to get it working.

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **"+ New"** → **"Spreadsheet"**
3. Name it: `Bomb Defusal Broadcasts`
4. You'll be redirected to the new sheet

## Step 2: Set Up the Sheet Structure

The sheet has two tabs: **Broadcasts** and **Scores** (create the second one)

### Tab 1: "Broadcasts" (default tab)
In the first row, add headers:
- **A1**: `roomCode`
- **B1**: `config`
- **C1**: `createdAt`
- **D1**: `accessCount`
- **E1**: (leave empty)
- **F1**: (leave empty)

Your sheet should look like this after row 1:
```
roomCode | config | createdAt | accessCount | | 
---------|--------|-----------|-------------|---|--
(data will appear here as you create broadcasts)
```

### Tab 2: "Scores" (create new tab)
1. Right-click on the sheet tab at the bottom
2. Click **"Insert 1 sheet"**
3. Name it "Scores"
4. Add headers in the first row:
   - **A1**: `roomCode`
   - **B1**: `playerName`
   - **C1**: `timeSpent`
   - **D1**: `timestamp`

## Step 3: Get Your Spreadsheet ID

1. Look at your sheet URL in the browser:
   ```
   https://docs.google.com/spreadsheets/d/[THIS_IS_YOUR_ID]/edit
   ```
2. Copy the long ID between `/d/` and `/edit`
3. Save it somewhere (you'll need it soon)

## Step 4: Create a Google Cloud Project & API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown at the top
3. Click **"NEW PROJECT"**
4. Name it: `Bomb Defusal Game`
5. Click **"CREATE"**

### Enable Google Sheets API:
1. In the search bar, search for **"Google Sheets API"**
2. Click on it, then click **"ENABLE"**

### Create an API Key:
1. Go to **"Credentials"** (left sidebar)
2. Click **"+ CREATE CREDENTIALS"** → **"API Key"**
3. Copy your new API key
4. Click on the key to edit it:
   - Under **"API Restrictions"**, select **"Google Sheets API"**
   - Click **"SAVE"**

## Step 5: Share Your Sheet (Important!)

1. Go back to your Google Sheet
2. Click **"Share"** (top right)
3. Change from **"Restricted"** to **"Anyone with the link"**
4. Set to **"Viewer"** (so others can see but can't edit)
5. Click **"Share"**

⚠️ **Why?** The API key only works with publicly accessible sheets!

## Step 6: Add Credentials to Your Game

1. Open `src/sheets.js` in your code editor
2. Find these lines at the top:
   ```javascript
   const SHEETS_CONFIG = {
     spreadsheetId: 'YOUR_SPREADSHEET_ID',
     apiKey: 'YOUR_GOOGLE_API_KEY',
   };
   ```
3. Replace with your actual values:
   ```javascript
   const SHEETS_CONFIG = {
     spreadsheetId: '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q',  // Your spreadsheet ID
     apiKey: 'AIzaSyDk6j7f8h9o0p1q2r3s4t5u6v7w8x9y0z',     // Your API key
   };
   ```

## Step 7: Test It! 🎮

1. Run your game:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:5173`
3. Click **Admin Panel** → **Create Broadcast**
4. Create a test broadcast
5. Check your Google Sheet — you should see the data appear! ✨

## Step 8: Deploy 🚀

When you're ready to deploy:

1. **For Vercel** (Recommended):
   ```bash
   npm run build
   npx vercel
   ```
   - Connect your GitHub repo
   - Set environment variables (optional, but recommended for security)

2. **For Netlify**:
   - Push code to GitHub
   - Go to [Netlify](https://netlify.com)
   - Click **"New site from Git"**
   - Connect your repo
   - Build command: `npm run build`
   - Publish directory: `dist`

## Troubleshooting

### "Google Sheets not configured"
- Check that your `spreadsheetId` and `apiKey` are correct in `src/sheets.js`
- Make sure the sheet is shared with "Anyone with the link"

### Data not appearing in the sheet
- Go to your sheet and refresh it (F5)
- Check browser console (F12) for error messages
- Make sure you shared the sheet publicly

### Still having issues?
- The app will automatically fall back to **localStorage** if Sheets isn't configured
- This means your broadcasts will still work, just stored locally on each device
- You can still import/export broadcasts as JSON files

---

**That's it!** Your game now has a global database. Users can create broadcasts on one device and access them from anywhere in the world! 🌍
