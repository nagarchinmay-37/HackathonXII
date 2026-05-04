// ─────────────────────────────────────────────
//  Raffle configuration — edit this file to
//  adapt the app for a new hackathon event.
// ─────────────────────────────────────────────

module.exports = {
  // Server
  PORT: 5000,

  // Event identity (shown in the app header)
  HACKATHON_VERSION:    'XII',
  HACKATHON_DATE_START: 'Jan 27, 2025',
  HACKATHON_DATE_END:   'Jan 30, 2025',

  // Raffle pool: all integers from START up to (but not including) END
  RAFFLE_START: 417001,
  RAFFLE_END:   418001,   // pool size = END - START

  // Draw settings
  RAFFLE_TOTAL_PICK: 100, // total winners across all draws
  RAFFLE_BATCH_SIZE: 10,  // numbers revealed per draw click
};
