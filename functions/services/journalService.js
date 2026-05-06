const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getTodayKey } = require('../utils/dateUtils');

// ──────────────────────────────────────────
// 성찰일지 작성
// /journals/{userId}/entries/{entryId}
// ──────────────────────────────────────────
const createJournal = async (userId, satisfaction, content) => {
  const db = getFirestore();
  const entry = {
    userId,
    date: getTodayKey(),
    satisfaction,
    content,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const ref = await db
    .collection('journals')
    .doc(userId)
    .collection('entries')
    .add(entry);

  return ref.id;
};

// ──────────────────────────────────────────
// 성찰일지 목록 조회
// userId 기준, 최신순 정렬
// ──────────────────────────────────────────
const getJournals = async (userId) => {
  const db = getFirestore();
  const snap = await db
    .collection('journals')
    .doc(userId)
    .collection('entries')
    .orderBy('createdAt', 'desc')
    .get();

  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// ──────────────────────────────────────────
// 성찰일지 수정
// ──────────────────────────────────────────
const updateJournal = async (userId, entryId, satisfaction, content) => {
  const db = getFirestore();
  await db
    .collection('journals')
    .doc(userId)
    .collection('entries')
    .doc(entryId)
    .update({
      satisfaction,
      content,
      updatedAt: FieldValue.serverTimestamp(),
    });
};

// ──────────────────────────────────────────
// 성찰일지 삭제
// ──────────────────────────────────────────
const deleteJournal = async (userId, entryId) => {
  const db = getFirestore();
  await db
    .collection('journals')
    .doc(userId)
    .collection('entries')
    .doc(entryId)
    .delete();
};

module.exports = { createJournal, getJournals, updateJournal, deleteJournal };
