const { onRequest } = require('firebase-functions/v2/https');
const {
  recordStairs,
  getRecords,
  deleteRecords,
} = require('../services/stairsService');
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

// ──────────────────────────────────────────
// 계단 기록 삭제 (여러 개 한번에)
// DELETE /deleteRecords
// body: { recordIds: ["id1", "id2", ...] }
// ──────────────────────────────────────────
const deleteRecordsHandler = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'DELETE')
    return res.status(405).send('Method Not Allowed');
  const decoded = await verifyToken(req, res);
  if (!decoded) return;
  const { recordIds } = req.body;
  if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
    return res.status(400).json({ error: 'recordIds 필수 (배열)' });
  }
  try {
    const result = await deleteRecords(decoded.uid, recordIds);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = {
  recordStairsHandler,
  getRecordsHandler,
  deleteRecordsHandler,
};
