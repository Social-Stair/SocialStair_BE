const { onRequest } = require('firebase-functions/v2/https');
const { setGoal, getGoal } = require('../services/goalService');
const { verifyToken } = require('../middlewares/authMiddleware');
const { getWeekKey } = require('../utils/dateUtils');

const setGoalHandler = onRequest({ cors: true }, async (req, res) => {
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

const getGoalHandler = onRequest({ cors: true }, async (req, res) => {
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
