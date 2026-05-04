const { initializeApp } = require('firebase-admin/app');
const {
  createJournalHandler,
  getJournalsHandler,
  updateJournalHandler,
  deleteJournalHandler,
} = require('./routes/journalRoutes');

initializeApp();

// ──────────────────────────────────────────
// 성찰일지 API
// ──────────────────────────────────────────
exports.createJournal = createJournalHandler;
exports.getJournals = getJournalsHandler;
exports.updateJournal = updateJournalHandler;
exports.deleteJournal = deleteJournalHandler;
