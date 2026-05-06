const { onRequest } = require('firebase-functions/v2/https');
const {
  createJournal,
  getJournals,
  updateJournal,
  deleteJournal,
} = require('../services/journalService');
const { verifyToken } = require('../middlewares/authMiddleware');

// ──────────────────────────────────────────
// 성찰일지 작성
// POST /createJournal
// body: { mood, content }
// ──────────────────────────────────────────
const createJournalHandler = onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const decoded = await verifyToken(req, res);
  if (!decoded) return;

  const { mood, content } = req.body;
  if (!content) return res.status(400).json({ error: 'content 필수' });

  try {
    const entryId = await createJournal(decoded.uid, mood, content);
    res.status(201).json({ entryId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ──────────────────────────────────────────
// 성찰일지 목록 조회
// GET /getJournals
// ──────────────────────────────────────────
const getJournalsHandler = onRequest(async (req, res) => {
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

// ──────────────────────────────────────────
// 성찰일지 수정
// PUT /updateJournal
// body: { entryId, mood, content }
// ──────────────────────────────────────────
const updateJournalHandler = onRequest(async (req, res) => {
  if (req.method !== 'PUT') return res.status(405).send('Method Not Allowed');

  const decoded = await verifyToken(req, res);
  if (!decoded) return;

  const { entryId, mood, content } = req.body;
  if (!entryId || !content)
    return res.status(400).json({ error: 'entryId, content 필수' });

  try {
    await updateJournal(decoded.uid, entryId, mood, content);
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ──────────────────────────────────────────
// 성찰일지 삭제
// DELETE /deleteJournal
// body: { entryId }
// ──────────────────────────────────────────
const deleteJournalHandler = onRequest(async (req, res) => {
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
