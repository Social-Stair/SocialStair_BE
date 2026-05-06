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
const {
  recordStairsHandler,
  getRecordsHandler,
} = require('./routes/stairsRoutes');
const { getHomeStatsHandler } = require('./routes/statsRoutes');
const { skipTodayHandler } = require('./routes/dailyStatusRoutes');
const {
  weeklyGoalReminder,
  morningReminder,
  afternoonReminder,
  eveningReminder,
  wednesdayCheck,
  weeklyReset,
} = require('./schedulers/notificationScheduler');

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
// 계단 기록 API
// ──────────────────────────────────────────
exports.recordStairs = recordStairsHandler;
exports.getRecords = getRecordsHandler;

// ──────────────────────────────────────────
// 홈화면 통계 API
// ──────────────────────────────────────────
exports.getHomeStats = getHomeStatsHandler;

// ──────────────────────────────────────────
// 출근 여부 API
// ──────────────────────────────────────────
exports.skipToday = skipTodayHandler;

// ──────────────────────────────────────────
// 알림 스케줄러
// ──────────────────────────────────────────
exports.weeklyGoalReminder = weeklyGoalReminder;
exports.morningReminder = morningReminder;
exports.afternoonReminder = afternoonReminder;
exports.eveningReminder = eveningReminder;
exports.wednesdayCheck = wednesdayCheck;
exports.weeklyReset = weeklyReset;

// ──────────────────────────────────────────
// 성찰일지 API
// ──────────────────────────────────────────
exports.createJournal = createJournalHandler;
exports.getJournals = getJournalsHandler;
exports.updateJournal = updateJournalHandler;
exports.deleteJournal = deleteJournalHandler;
