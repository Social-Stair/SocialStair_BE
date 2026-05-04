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
const { setGoalHandler, getGoalHandler } = require('./routes/goalRoutes');

initializeApp();

// ──────────────────────────────────────────
// 인증 API
// ──────────────────────────────────────────
exports.register = registerHandler;
exports.login = loginHandler;
exports.updateFcmToken = updateFcmTokenHandler;

// ──────────────────────────────────────────
// 목표 설정 API
// ──────────────────────────────────────────
exports.setGoal = setGoalHandler;
exports.getGoal = getGoalHandler;

// ──────────────────────────────────────────
// 성찰일지 API
// ──────────────────────────────────────────
exports.createJournal = createJournalHandler;
exports.getJournals = getJournalsHandler;
exports.updateJournal = updateJournalHandler;
exports.deleteJournal = deleteJournalHandler;
