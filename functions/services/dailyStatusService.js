const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// ──────────────────────────────────────────
// 오늘 출근 안 함 설정
// /userDailyStatus/{userId}_{date}
// ──────────────────────────────────────────
const skipToday = async (userId) => {
  const db = getFirestore();
  const today = new Date().toISOString().split('T')[0];
  const docId = `${userId}_${today}`;

  await db.collection('userDailyStatus').doc(docId).set({
    userId,
    date: today,
    skipToday: true,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { userId, date: today, skipToday: true };
};

// ──────────────────────────────────────────
// 오늘 출근 안 하는 유저 목록 조회
// 알림 발송 시 제외하기 위함
// ──────────────────────────────────────────
const getSkippedUsers = async () => {
  const db = getFirestore();
  const today = new Date().toISOString().split('T')[0];
  const snap = await db
    .collection('userDailyStatus')
    .where('date', '==', today)
    .where('skipToday', '==', true)
    .get();

  return snap.docs.map((doc) => doc.data().userId);
};

module.exports = { skipToday, getSkippedUsers };
