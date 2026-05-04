const { onRequest } = require('firebase-functions/v2/https');
const { setGoal, getGoal } = require('../services/goalService');
const { verifyToken } = require('../middlewares/authMiddleware');
const { getWeekKey } = require('../utils/dateUtils');

// ──────────────────────────────────────────
// 주간 목표 설정
// POST /setGoal
// body: { goalFloors }
// ──────────────────────────────────────────
const setGoalHandler = onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const decoded = await verifyToken(req, res);
  if (!decoded) return;

  const { goalFloors } = req.body;
  if (!goalFloors) return res.status(400).json({ error: 'goalFloors 필수' });

  try {
    const result = await setGoal(decoded.uid, goalFloors);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ──────────────────────────────────────────
// 주간 목표 조회
// GET /getGoal?weekKey=2025-W15
// weekKey 없으면 이번 주로 조회
// ──────────────────────────────────────────
const getGoalHandler = onRequest(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

  const decoded = await verifyToken(req, res);
  if (!decoded) return;

  const weekKey = req.query.weekKey || getWeekKey();

  try {
    const result = await getGoal(decoded.uid, weekKey);
    if (!result) return res.status(404).json({ error: '목표가 없습니다' });
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = { setGoalHandler, getGoalHandler };
