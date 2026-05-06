const { onRequest } = require('firebase-functions/v2/https');
const { skipToday } = require('../services/dailyStatusService');
const { verifyToken } = require('../middlewares/authMiddleware');

// ──────────────────────────────────────────
// 오늘 출근 안 함 설정
// POST /skipToday
// ──────────────────────────────────────────
const skipTodayHandler = onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const decoded = await verifyToken(req, res);
  if (!decoded) return;

  try {
    const result = await skipToday(decoded.uid);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = { skipTodayHandler };
