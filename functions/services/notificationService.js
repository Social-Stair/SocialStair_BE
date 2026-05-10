const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

// ──────────────────────────────────────────
// 알림 Firestore 저장
// iOS 웹앱 polling용
// ──────────────────────────────────────────
const saveNotification = async (userId, type, title, body) => {
  const db = getFirestore();
  await db.collection('notifications').add({
    userId,
    type,
    title,
    body,
    sentAt: FieldValue.serverTimestamp(),
    isRead: false,
  });
};

// ──────────────────────────────────────────
// 단일 유저에게 알림 발송 + Firestore 저장
// ──────────────────────────────────────────
const sendToUser = async (fcmToken, title, body, type, userId) => {
  const messaging = getMessaging();

  if (fcmToken) {
    await messaging.send({
      token: fcmToken,
      notification: { title, body },
    });
  }

  if (userId) {
    await saveNotification(userId, type, title, body);
  }
};

// ──────────────────────────────────────────
// 전체 유저에게 알림 발송 + Firestore 저장
// ──────────────────────────────────────────
const sendToAll = async (title, body, type, excludeUserIds = []) => {
  const db = getFirestore();
  const snap = await db.collection('users').get();

  const users = snap.docs
    .map((doc) => doc.data())
    .filter((user) => !excludeUserIds.includes(user.userId));

  const tokens = users
    .map((user) => user.fcmToken)
    .filter((token) => token !== null && token !== undefined);

  // FCM 발송
  if (tokens.length > 0) {
    await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
    });
  }

  // Firestore 저장 (전체 유저)
  await Promise.all(
    users.map((user) => saveNotification(user.userId, type, title, body))
  );

  console.log(`알림 발송 완료: ${users.length}명 / ${title}`);
};

// ──────────────────────────────────────────
// 달성 멘트 조회
// /milestoneMessages에서 type 기준 랜덤 반환
// ──────────────────────────────────────────
const getMilestoneMessage = async (type) => {
  const db = getFirestore();
  const snap = await db
    .collection('milestoneMessages')
    .where('type', '==', type)
    .get();

  if (snap.empty) return null;

  const messages = snap.docs.map((doc) => doc.data());
  const random = messages[Math.floor(Math.random() * messages.length)];
  return { title: random.title, message: random.message };
};

module.exports = {
  sendToAll,
  sendToUser,
  getMilestoneMessage,
};
