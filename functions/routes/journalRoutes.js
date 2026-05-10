const { onRequest } = require('firebase-functions/v2/https');
const {
  createJournal,
  getJournals,
  updateJournal,
  deleteJournal,
} = require('../services/journalService');
const { verifyToken } = require('../middlewares/authMiddleware');

const createJournalHandler = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const decoded = await verifyToken(req, res);
  if (!decoded) return;
  const { satisfaction, content } = req.body;
  if (!content) return res.status(400).json({ error: 'content 필수' });
  if (satisfaction !== undefined && (satisfaction < 1 || satisfaction > 10)) {
    return res
      .status(400)
      .json({ error: 'satisfaction은 1~10 사이의 값이어야 합니다' });
  }
  try {
    const entryId = await createJournal(decoded.uid, satisfaction, content);
    res.status(201).json({ entryId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const getJournalsHandler = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');
  const decoded = await verifyToken(req, res);
  if (!decoded) return;
  try {
    const entries = await getJournals(decoded.uid);
    res.status(200).json({ entries });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const updateJournalHandler = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'PUT') return res.status(405).send('Method Not Allowed');
  const decoded = await verifyToken(req, res);
  if (!decoded) return;
  const { entryId, satisfaction, content } = req.body;
  if (!entryId || !content)
    return res.status(400).json({ error: 'entryId, content 필수' });
  if (satisfaction !== undefined && (satisfaction < 1 || satisfaction > 10)) {
    return res
      .status(400)
      .json({ error: 'satisfaction은 1~10 사이의 값이어야 합니다' });
  }
  try {
    await updateJournal(decoded.uid, entryId, satisfaction, content);
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const deleteJournalHandler = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'DELETE')
    return res.status(405).send('Method Not Allowed');
  const decoded = await verifyToken(req, res);
  if (!decoded) return;
  const { entryId } = req.body;
  if (!entryId) return res.status(400).json({ error: 'entryId 필수' });
  try {
    await deleteJournal(decoded.uid, entryId);
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = {
  createJournalHandler,
  getJournalsHandler,
  updateJournalHandler,
  deleteJournalHandler,
};
