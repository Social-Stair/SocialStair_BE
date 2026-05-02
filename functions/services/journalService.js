const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getTodayKey } = require('../utils/dateUtils');

// ──────────────────────────────────────────
// 성찰일지 작성
// /journals/{cardUid}/entries/{docId}
// ──────────────────────────────────────────
const createJournal = async (cardUid, mood, content) => {
  const db = getFirestore();
  const entry = {
    cardUid,
    date: getTodayKey(),
    mood,
    content,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const ref = await db
    .collection('journals')
    .doc(cardUid)
    .collection('entries')
    .add(entry);

  return ref.id;
};

// ──────────────────────────────────────────
// 성찰일지 목록 조회
// cardUid 기준, 최신순 정렬
// ──────────────────────────────────────────
const getJournals = async (cardUid) => {
  const db = getFirestore();
  const snap = await db
    .collection('journals')
    .doc(cardUid)
    .collection('entries')
    .orderBy('createdAt', 'desc')
    .get();

  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// ──────────────────────────────────────────
// 성찰일지 수정
// ──────────────────────────────────────────
const updateJournal = async (cardUid, entryId, mood, content) => {
  const db = getFirestore();
  await db
    .collection('journals')
    .doc(cardUid)
    .collection('entries')
    .doc(entryId)
    .update({
      mood,
      content,
      updatedAt: FieldValue.serverTimestamp(),
    });
};

// ──────────────────────────────────────────
// 성찰일지 삭제
// ──────────────────────────────────────────
const deleteJournal = async (cardUid, entryId) => {
  const db = getFirestore();
  await db
    .collection('journals')
    .doc(cardUid)
    .collection('entries')
    .doc(entryId)
    .delete();
};

module.exports = { createJournal, getJournals, updateJournal, deleteJournal };
