const { getFirestore } = require('firebase-admin/firestore');
const { getWeekKey } = require('../utils/dateUtils');

// ──────────────────────────────────────────
// 홈화면 통계 조회
// A팀, B팀 각각 목표 합산, 현재 층수, 달성률
// 팀원별 개인 기록 포함
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

  // 팀별 집계
  const teams = {
    A: { goalFloors: 0, currentFloors: 0, members: [] },
    B: { goalFloors: 0, currentFloors: 0, members: [] },
  };

  users.forEach((user) => {
    const goal = goalsMap[user.userId] || { goalFloors: 0, currentFloors: 0 };
    const achievementRate =
      goal.goalFloors > 0
        ? Math.round((goal.currentFloors / goal.goalFloors) * 100)
        : 0;

    const member = {
      userId: user.userId,
      nickname: user.nickname,
      floor: user.floor,
      goalFloors: goal.goalFloors,
      currentFloors: goal.currentFloors,
      achievementRate,
    };

    if (user.team === 'A') {
      teams.A.goalFloors += goal.goalFloors;
      teams.A.currentFloors += goal.currentFloors;
      teams.A.members.push(member);
    } else if (user.team === 'B') {
      teams.B.goalFloors += goal.goalFloors;
      teams.B.currentFloors += goal.currentFloors;
      teams.B.members.push(member);
    }
  });

  // 팀 달성률 계산
  teams.A.achievementRate =
    teams.A.goalFloors > 0
      ? Math.round((teams.A.currentFloors / teams.A.goalFloors) * 100)
      : 0;
  teams.B.achievementRate =
    teams.B.goalFloors > 0
      ? Math.round((teams.B.currentFloors / teams.B.goalFloors) * 100)
      : 0;

  return {
    weekKey,
    totalParticipants: users.length,
    teams,
  };
};

module.exports = { getHomeStats };
