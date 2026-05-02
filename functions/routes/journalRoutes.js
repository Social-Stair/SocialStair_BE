const { onRequest } = require('firebase-functions/v2/https');
const {
  createJournal,
  getJournals,
  updateJournal,
  deleteJournal,
} = require('../services/journalService');

// ──────────────────────────────────────────
// 성찰일지 작성
// POST /createJournal
// body: { cardUid, mood, content }
// ──────────────────────────────────────────
const createJournalHandler = onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { cardUid, mood, content } = req.body;
  if (!cardUid || !content)
    return res.status(400).send('cardUid, content 필수');

  const entryId = await createJournal(cardUid, mood, content);
  res.status(201).json({ entryId });
});

// ──────────────────────────────────────────
// 성찰일지 목록 조회
// GET /getJournals?cardUid=xxx
// ──────────────────────────────────────────
const getJournalsHandler = onRequest(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');
  const { cardUid } = req.query;
  if (!cardUid) return res.status(400).send('cardUid 필수');

  const entries = await getJournals(cardUid);
  res.status(200).json({ entries });
});

// ──────────────────────────────────────────
// 성찰일지 수정
// PUT /updateJournal
// body: { cardUid, entryId, mood, content }
// ──────────────────────────────────────────
const updateJournalHandler = onRequest(async (req, res) => {
  if (req.method !== 'PUT') return res.status(405).send('Method Not Allowed');
  const { cardUid, entryId, mood, content } = req.body;
  if (!cardUid || !entryId || !content)
    return res.status(400).send('cardUid, entryId, content 필수');

  await updateJournal(cardUid, entryId, mood, content);
  res.status(200).json({ success: true });
});

// ──────────────────────────────────────────
// 성찰일지 삭제
// DELETE /deleteJournal
// body: { cardUid, entryId }
// ──────────────────────────────────────────
const deleteJournalHandler = onRequest(async (req, res) => {
  if (req.method !== 'DELETE')
    return res.status(405).send('Method Not Allowed');
  const { cardUid, entryId } = req.body;
  if (!cardUid || !entryId)
    return res.status(400).send('cardUid, entryId 필수');

  await deleteJournal(cardUid, entryId);
  res.status(200).json({ success: true });
});

module.exports = {
  createJournalHandler,
  getJournalsHandler,
  updateJournalHandler,
  deleteJournalHandler,
};
