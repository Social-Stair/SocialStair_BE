const { getFirestore } = require('firebase-admin/firestore');
const { getWeekKey } = require('../utils/dateUtils');

// ──────────────────────────────────────────
// 홈화면 통계 조회
// 개인별 목표 + 전체 합산 공동 목표
// ──────────────────────────────────────────
const getHomeStats = async (weekKey) => {
  const db = getFirestore();

  // 전체 유저 조회
  const usersSnap = await db.collection('users').get();
  const users = usersSnap.docs.map((doc) => doc.data());

  // 이번 주 목표 전체 조회
  const goalsSnap = await db
    .collection('weeklyGoals')
    .where('weekKey', '==', weekKey)
    .get();

  const goalsMap = {};
  goalsSnap.docs.forEach((doc) => {
    const data = doc.data();
    goalsMap[data.userId] = data;
  });

  // 개인별 집계
  let totalGoalFloors = 0;
  let totalCurrentFloors = 0;

  const members = users.map((user) => {
    const goal = goalsMap[user.userId] || { goalFloors: 0, currentFloors: 0 };
    const achievementRate =
      goal.goalFloors > 0
        ? Math.round((goal.currentFloors / goal.goalFloors) * 100)
        : 0;

    totalGoalFloors += goal.goalFloors;
    totalCurrentFloors += goal.currentFloors;

    return {
      userId: user.userId,
      nickname: user.nickname,
      floor: user.floor,
      goalFloors: goal.goalFloors,
      currentFloors: goal.currentFloors,
      achievementRate,
    };
  });

  // 공동 목표 달성률
  const totalAchievementRate =
    totalGoalFloors > 0
      ? Math.round((totalCurrentFloors / totalGoalFloors) * 100)
      : 0;

  return {
    weekKey,
    totalParticipants: users.length,
    // 공동 목표
    sharedGoal: {
      goalFloors: totalGoalFloors,
      currentFloors: totalCurrentFloors,
      achievementRate: totalAchievementRate,
    },
    // 개인별 기록
    members,
  };
};

module.exports = { getHomeStats };
