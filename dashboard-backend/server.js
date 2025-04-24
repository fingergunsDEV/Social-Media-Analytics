// server.js
const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(cors()); // Allow frontend requests
app.use(express.json());

// Google Sheets API setup
const sheets = google.sheets({
  version: 'v4',
  auth: process.env.GOOGLE_API_KEY,
});

// Endpoint to fetch Google Sheets data
app.get('/api/sheet-data', async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Sheet1!A2:H', // Adjust range as needed
    });
    res.json(response.data.values || []);
  } catch (error) {
    console.error('Error fetching sheet data:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Endpoint to create posts and send to Make.com
app.post('/api/create-post', async (req, res) => {
  const { content, platforms } = req.body;
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;

  if (!content || !platforms || !Array.isArray(platforms)) {
    return res.status(400).json({ error: 'Content and platforms are required' });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, platforms, timestamp: new Date().toISOString() })
    });

    const responseBody = await response.text();
    if (response.ok) {
      res.json({ message: 'Post sent to Make.com successfully' });
    } else {
      console.error('Make.com response:', response.status, responseBody);
      throw new Error(`Make.com responded with status ${response.status}`);
    }
  } catch (error) {
    console.error('Error sending post:', error.message, error.stack);
    res.status(500).json({ error: `Failed to send post: ${error.message}` });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
