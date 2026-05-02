const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getTodayKey, getWeekKey } = require('../utils/dateUtils');

// ──────────────────────────────────────────
// 주간 설정 조회
// /weeklyConfig/current 에서 goalFloors 반환
// ──────────────────────────────────────────
const getWeeklyConfig = async () => {
  const db = getFirestore();
  const config = await db.collection('weeklyConfig').doc('current').get();
  if (!config.exists) return { goalFloors: 100 }; // 기본값
  return config.data();
};

// ──────────────────────────────────────────
// NFC 태깅 통계 업데이트
// - 일별 stats 업데이트
// - 주간 weeklyStats 업데이트 (팀별 기여, 보스 HP)
// - 주간 weeklyUserStats 업데이트 (개인 기록 + 닉네임)
// ──────────────────────────────────────────
const updateStats = async (
  floorsClimbed,
  sectionKey,
  cardUid,
  currentFloor,
  team,
  nickname
) => {
  const db = getFirestore();
  const today = getTodayKey();
  const weekKey = getWeekKey();

  // 주간 설정 조회
  const { goalFloors } = await getWeeklyConfig();
  const bossMaxHp = goalFloors * 6;

  // 팀 현재 층수 조회
  const weeklyStatsRef = db.collection('weeklyStats').doc(weekKey);
  const weeklyStatsSnap = await weeklyStatsRef.get();
  const weeklyStats = weeklyStatsSnap.exists ? weeklyStatsSnap.data() : {};
  const teamStats = weeklyStats.teamStats || {};
  const currentTeamFloors = (teamStats[team]?.floors || 0) + floorsClimbed;

  // 팀 기여분 계산 (goalFloors 초과분 무시)
  const prevContribution = teamStats[team]?.contribution || 0;
  const newContribution = Math.min(currentTeamFloors, goalFloors);
  const contributionDiff = newContribution - prevContribution;

  // 팀 달성 여부
  const justAchieved =
    currentTeamFloors >= goalFloors && !teamStats[team]?.achieved;

  // 일별 stats 업데이트
  const statsRef = db.collection('stats').doc(today);

  // 주간 유저 stats 업데이트
  const weeklyUserStatsRef = db
    .collection('weeklyUserStats')
    .doc(weekKey)
    .collection('users')
    .doc(cardUid);

  // 주간 stats 업데이트 데이터
  const weeklyStatsUpdate = {
    goalFloors,
    bossMaxHp,
    bossCurrentHp: FieldValue.increment(-contributionDiff),
    [`teamStats.${team}.floors`]: FieldValue.increment(floorsClimbed),
    [`teamStats.${team}.contribution`]: newContribution,
    [`teamStats.${team}.achieved`]: currentTeamFloors >= goalFloors,
    updatedAt: FieldValue.serverTimestamp(),
  };

  // 달성 시각 기록 (처음 달성할 때만)
  if (justAchieved) {
    weeklyStatsUpdate[`teamStats.${team}.achievedAt`] =
      FieldValue.serverTimestamp();
  }

  await Promise.all([
    // 일별 stats
    statsRef.set(
      {
        totalFloors: FieldValue.increment(floorsClimbed),
        [`sectionStats.${sectionKey}`]: FieldValue.increment(1),
        taggedCards: FieldValue.arrayUnion(cardUid),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    ),
    // 주간 stats
    weeklyStatsRef.set(weeklyStatsUpdate, { merge: true }),
    // 주간 유저 stats
    weeklyUserStatsRef.set(
      {
        floors: FieldValue.increment(floorsClimbed),
        count: FieldValue.increment(1),
        team,
        nickname, // 닉네임 추가
        lastFloor: currentFloor,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    ),
  ]);
};

// ──────────────────────────────────────────
// 수기 입력 통계 업데이트
// - 일별 stats만 업데이트
// - 개인 식별 불가로 주간 stats 미반영
// ──────────────────────────────────────────
const updateManualStats = async (fromFloor, toFloor) => {
  const db = getFirestore();
  const statsRef = db.collection('stats').doc(getTodayKey());
  const floorsClimbed = Math.abs(toFloor - fromFloor);
  const sectionKey = `${Math.min(fromFloor, toFloor)}-${Math.max(
    fromFloor,
    toFloor
  )}`;

  await statsRef.set(
    {
      totalFloors: FieldValue.increment(floorsClimbed),
      [`sectionStats.${sectionKey}`]: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
};

module.exports = { updateStats, updateManualStats };
