const { onRequest } = require('firebase-functions/v2/https');
const { getHomeStats } = require('../services/statsService');
const { verifyToken } = require('../middlewares/authMiddleware');
const { getWeekKey } = require('../utils/dateUtils');

const getHomeStatsHandler = onRequest({ cors: true }, async (req, res) => {
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
