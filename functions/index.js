const { initializeApp } = require('firebase-admin/app');
const {
  createJournalHandler,
  getJournalsHandler,
  updateJournalHandler,
  deleteJournalHandler,
} = require('./routes/journalRoutes');
const {
  registerHandler,
  loginHandler,
  updateFcmTokenHandler,
} = require('./routes/authRoutes');

initializeApp();

// ──────────────────────────────────────────
// 인증 API
// ──────────────────────────────────────────
exports.register = registerHandler;
exports.login = loginHandler;
exports.updateFcmToken = updateFcmTokenHandler;

// ──────────────────────────────────────────
// 성찰일지 API
// ──────────────────────────────────────────
exports.createJournal = createJournalHandler;
exports.getJournals = getJournalsHandler;
exports.updateJournal = updateJournalHandler;
exports.deleteJournal = deleteJournalHandler;
