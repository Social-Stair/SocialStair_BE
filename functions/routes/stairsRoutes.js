const { onRequest } = require('firebase-functions/v2/https');
const { recordStairs, getRecords } = require('../services/stairsService');
const { verifyToken } = require('../middlewares/authMiddleware');
const { getWeekKey } = require('../utils/dateUtils');

const recordStairsHandler = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const decoded = await verifyToken(req, res);
  if (!decoded) return;
  const { records } = req.body;
  if (!records || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'records 필수 (배열)' });
  }
  try {
    const result = await recordStairs(decoded.uid, records);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const getRecordsHandler = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');
  const decoded = await verifyToken(req, res);
  if (!decoded) return;
  const weekKey = req.query.weekKey || getWeekKey();
  try {
    const records = await getRecords(decoded.uid, weekKey);
    res.status(200).json({ records });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = { recordStairsHandler, getRecordsHandler };
