const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getWeekKey, getNextWeekKey, getDayKST } = require('../utils/dateUtils');

// ──────────────────────────────────────────
// 주간 목표 설정
// 일요일이면 다음 주차 weekKey 사용
// 기존 목표 있으면 goalFloors만 업데이트 (currentFloors 유지)
// 새로운 주차면 새로 생성
// ──────────────────────────────────────────
const setGoal = async (userId, goalFloors) => {
  const db = getFirestore();

  // 일요일이면 다음 주차 키로 저장
  const weekKey = getDayKST() === 0 ? getNextWeekKey() : getWeekKey();
  const docId = `${userId}_${weekKey}`;

  const existing = await db.collection('weeklyGoals').doc(docId).get();

  if (existing.exists) {
    await db.collection('weeklyGoals').doc(docId).update({ goalFloors });
  } else {
    await db.collection('weeklyGoals').doc(docId).set({
      userId,
      weekKey,
      goalFloors,
      currentFloors: 0,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

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
