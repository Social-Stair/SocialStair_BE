const { onRequest } = require('firebase-functions/v2/https');
const { getHomeStats } = require('../services/statsService');
const { verifyToken } = require('../middlewares/authMiddleware');
const { getWeekKey, getNextWeekKey, getDayKST } = require('../utils/dateUtils');

const getHomeStatsHandler = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');
  const decoded = await verifyToken(req, res);
  if (!decoded) return;

  // weekKey 없으면 일요일 여부 고려해서 자동 계산
  const weekKey =
    req.query.weekKey || (getDayKST() === 0 ? getNextWeekKey() : getWeekKey());

  try {
    const result = await getHomeStats(weekKey);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = { getHomeStatsHandler };
