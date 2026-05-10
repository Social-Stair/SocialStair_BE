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
  refreshTokenHandler,
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
  getNotificationsHandler,
  markNotificationReadHandler,
} = require('./routes/notificationRoutes');
const {
  weeklyGoalReminder,
  morningReminder,
  afternoonReminder,
  eveningReminder,
  wednesdayCheck,
  weeklyReset,
} = require('./schedulers/notificationScheduler');
const { withCors } = require('./middlewares/corsMiddleware');

initializeApp();

// ──────────────────────────────────────────
// 인증 API
// ──────────────────────────────────────────
exports.register = withCors(registerHandler);
exports.login = withCors(loginHandler);
exports.refreshToken = withCors(refreshTokenHandler);
exports.updateFcmToken = withCors(updateFcmTokenHandler);

// ──────────────────────────────────────────
// 목표 설정 API
// ──────────────────────────────────────────
exports.setGoal = withCors(setGoalHandler);
exports.getGoal = withCors(getGoalHandler);

// ──────────────────────────────────────────
// 계단 기록 API
// ──────────────────────────────────────────
exports.recordStairs = withCors(recordStairsHandler);
exports.getRecords = withCors(getRecordsHandler);

// ──────────────────────────────────────────
// 홈화면 통계 API
// ──────────────────────────────────────────
exports.getHomeStats = withCors(getHomeStatsHandler);

// ──────────────────────────────────────────
// 출근 여부 API
// ──────────────────────────────────────────
exports.skipToday = withCors(skipTodayHandler);

// ──────────────────────────────────────────
// 알림 히스토리 API
// ──────────────────────────────────────────
exports.getNotifications = withCors(getNotificationsHandler);
exports.markNotificationRead = withCors(markNotificationReadHandler);

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
exports.createJournal = withCors(createJournalHandler);
exports.getJournals = withCors(getJournalsHandler);
exports.updateJournal = withCors(updateJournalHandler);
exports.deleteJournal = withCors(deleteJournalHandler);
