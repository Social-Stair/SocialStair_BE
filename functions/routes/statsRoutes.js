const { onRequest } = require('firebase-functions/v2/https');
const { getHomeStats } = require('../services/statsService');
const { verifyToken } = require('../middlewares/authMiddleware');
const { getWeekKey } = require('../utils/dateUtils');

// ──────────────────────────────────────────
// 홈화면 통계 조회
// GET /getHomeStats?weekKey=2025-W15
// weekKey 없으면 이번 주로 조회
// ──────────────────────────────────────────
const getHomeStatsHandler = onRequest(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

  const decoded = await verifyToken(req, res);
  if (!decoded) return;

  const weekKey = req.query.weekKey || getWeekKey();

  try {
    const result = await getHomeStats(weekKey);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = { getHomeStatsHandler };
