const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getWeekKey } = require('../utils/dateUtils');

// ──────────────────────────────────────────
// 주간 목표 설정
// /weeklyGoals/{userId}_{weekKey}에 저장
// ──────────────────────────────────────────
const setGoal = async (userId, goalFloors) => {
  const db = getFirestore();
  const weekKey = getWeekKey();
  const docId = `${userId}_${weekKey}`;

  await db.collection('weeklyGoals').doc(docId).set(
    {
      userId,
      weekKey,
      goalFloors,
      currentFloors: 0,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { userId, weekKey, goalFloors };
};

// ──────────────────────────────────────────
// 주간 목표 조회
// 현재 달성률 포함
// ──────────────────────────────────────────
const getGoal = async (userId, weekKey) => {
  const db = getFirestore();
  const docId = `${userId}_${weekKey}`;
  const doc = await db.collection('weeklyGoals').doc(docId).get();

  if (!doc.exists) return null;

  const data = doc.data();
  const achievementRate =
    data.goalFloors > 0
      ? Math.round((data.currentFloors / data.goalFloors) * 100)
      : 0;

  return {
    userId: data.userId,
    weekKey: data.weekKey,
    goalFloors: data.goalFloors,
    currentFloors: data.currentFloors,
    achievementRate,
  };
};

module.exports = { setGoal, getGoal };
