const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

// ──────────────────────────────────────────
// 전체 유저 FCM 토큰 조회
// ──────────────────────────────────────────
const getAllFcmTokens = async () => {
  const db = getFirestore();
  const snap = await db.collection('users').get();
  return snap.docs
    .map((doc) => doc.data().fcmToken)
    .filter((token) => token !== null && token !== undefined);
};

// ──────────────────────────────────────────
// 단일 유저에게 알림 발송
// ──────────────────────────────────────────
const sendToUser = async (fcmToken, title, body) => {
  const messaging = getMessaging();
  await messaging.send({
    token: fcmToken,
    notification: { title, body },
  });
};

// ──────────────────────────────────────────
// 전체 유저에게 알림 발송
// ──────────────────────────────────────────
const sendToAll = async (title, body) => {
  const tokens = await getAllFcmTokens();
  if (tokens.length === 0) return;

  const messaging = getMessaging();
  await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
  });

  console.log(`알림 발송 완료: ${tokens.length}명 / ${title}`);
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

// ──────────────────────────────────────────
// 달성 알림 발송 (30%, 60%)
// ──────────────────────────────────────────
const sendMilestoneNotification = async (fcmToken, type) => {
  const milestone = await getMilestoneMessage(type);
  if (!milestone || !fcmToken) return;
  await sendToUser(fcmToken, milestone.title, milestone.message);
};

module.exports = {
  sendToAll,
  sendToUser,
  sendMilestoneNotification,
  getMilestoneMessage,
};
