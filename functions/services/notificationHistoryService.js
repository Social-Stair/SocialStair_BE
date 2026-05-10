const { getFirestore } = require('firebase-admin/firestore');

// ──────────────────────────────────────────
// 유저 알림 목록 조회
// userId 기준, 최신순 정렬
// ──────────────────────────────────────────
const getNotifications = async (userId, limit = 20) => {
  const db = getFirestore();
  const snap = await db
    .collection('notifications')
    .where('userId', '==', userId)
    .orderBy('sentAt', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map((doc) => ({
    notificationId: doc.id,
    ...doc.data(),
  }));
};

// ──────────────────────────────────────────
// 알림 읽음 처리
// ──────────────────────────────────────────
const markAsRead = async (notificationId) => {
  const db = getFirestore();
  await db.collection('notifications').doc(notificationId).update({
    isRead: true,
  });
};

module.exports = { getNotifications, markAsRead };
