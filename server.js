const express = require('express');
const cors = require('cors');
const config = require('./config');

const app = express();
const { PORT, HACKATHON_VERSION, HACKATHON_DATE_START, HACKATHON_DATE_END,
        RAFFLE_START: START, RAFFLE_END: END,
        RAFFLE_TOTAL_PICK: TOTAL_PICK, RAFFLE_BATCH_SIZE: BATCH_SIZE } = config;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory state (in production, use a database)
let remaining = [];
let picked = [];
let selected = []; // Numbers selected in current batch but not yet picked

// Initialize the lottery pool
function initializeLottery() {
  remaining = [];
  for (let i = START; i < END; i++) {
    remaining.push(i);
  }
  picked = [];
  selected = [];
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Initialize on server start
initializeLottery();

// API Routes

// Get current status
app.get('/api/status', (req, res) => {
  res.json({
    remaining: remaining.length,
    picked: picked.length,
    totalPick: TOTAL_PICK,
    batchSize: BATCH_SIZE,
    range: { start: START, end: END }
  });
});

// Pick next batch
app.post('/api/pick-batch', (req, res) => {
  if (picked.length >= TOTAL_PICK) {
    return res.status(400).json({ error: 'Already picked all required numbers' });
  }

  if (remaining.length === 0) {
    return res.status(400).json({ error: 'No numbers remaining' });
  }

  const needed = Math.min(BATCH_SIZE, TOTAL_PICK - picked.length);
  const shuffled = shuffleArray(remaining);
  const batch = shuffled.slice(0, needed);

  remaining = shuffled.slice(needed);
  selected = batch;

  res.json({
    batch,
    remaining: remaining.length,
    picked: picked.length,
    totalPick: TOTAL_PICK
  });
});

// Get all picked numbers
app.get('/api/picked', (req, res) => {
  res.json({
    picked,
    count: picked.length
  });
});

// Add a number to picked list
app.post('/api/pick-number', (req, res) => {
  const { number } = req.body;

  if (!number) {
    return res.status(400).json({ error: 'Number is required' });
  }

  if (!selected.includes(number)) {
    return res.status(400).json({ error: 'Number not in current batch' });
  }

  if (picked.includes(number)) {
    return res.status(400).json({ error: 'Number already picked' });
  }

  picked.push(number);
  selected = selected.filter(n => n !== number);

  res.json({
    success: true,
    picked: picked.length,
    remaining: remaining.length
  });
});

// Reset lottery
app.post('/api/reset', (req, res) => {
  initializeLottery();
  res.json({
    message: 'Lottery reset successfully',
    remaining: remaining.length,
    picked: picked.length
  });
});

// Discard remaining selected numbers (when picking new batch)
app.post('/api/discard-selected', (req, res) => {
  selected = [];
  res.json({ success: true });
});

// Event config (consumed by the frontend)
app.get('/api/config', (req, res) => {
  res.json({
    version:   HACKATHON_VERSION,
    dateStart: HACKATHON_DATE_START,
    dateEnd:   HACKATHON_DATE_END,
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Lottery server running on port ${PORT}`);
  console.log(`📊 Range: ${START} to ${END - 1} (${END - START} numbers)`);
  console.log(`🎯 Will pick ${TOTAL_PICK} numbers in batches of ${BATCH_SIZE}`);
});
