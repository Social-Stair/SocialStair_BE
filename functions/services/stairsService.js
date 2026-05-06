const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getWeekKey } = require('../utils/dateUtils');
const { sendToUser, getMilestoneMessage } = require('./notificationService');

// ──────────────────────────────────────────
// 계단 기록 입력
// - records 리스트로 받아서 저장
// - withColleague true면 층수 2배 반영
// - 1/3, 2/3, 100% 달성 시 milestone 반환
// ──────────────────────────────────────────
const recordStairs = async (userId, records) => {
  const db = getFirestore();
  const weekKey = getWeekKey();
  const goalDocId = `${userId}_${weekKey}`;

  // 기록 계산
  const processedRecords = records.map((record) => {
    const floorsClimbed = Math.abs(record.toFloor - record.fromFloor);
    const appliedFloors = record.withColleague
      ? floorsClimbed * 2
      : floorsClimbed;

    return {
      fromFloor: record.fromFloor,
      toFloor: record.toFloor,
      time: record.time,
      withColleague: record.withColleague ?? false,
      floorsClimbed,
      appliedFloors,
    };
  });

  const addedFloors = processedRecords.reduce(
    (sum, r) => sum + r.appliedFloors,
    0
  );

  // 목표 + 유저 조회
  const [goalDoc, userDoc] = await Promise.all([
    db.collection('weeklyGoals').doc(goalDocId).get(),
    db.collection('users').doc(userId).get(),
  ]);

  if (!goalDoc.exists) throw new Error('목표를 먼저 설정해주세요');

  const { goalFloors, currentFloors } = goalDoc.data();
  const { fcmToken } = userDoc.data();
  const prevFloors = currentFloors || 0;
  const newFloors = prevFloors + addedFloors;
  const achievementRate = Math.round((newFloors / goalFloors) * 100);

  // milestone 체크 (1/3, 2/3, 100%)
  let milestone = null;
  const prevRate = prevFloors / goalFloors;
  const currentRate = newFloors / goalFloors;

  if (prevRate < 1 / 3 && currentRate >= 1 / 3) {
    milestone = {
      title: '🎉 목표의 1/3 달성!',
      body: `목표층수 ${goalFloors}층 중 ${Math.floor(
        goalFloors / 3
      )}층을 달성하셨네요! 계단 오르기를 통해 몸을 움직이면 머리를 맑게하여 기분 전환에 도움이 됩니다. 좋은 흐름을 타서, 3층을 추가로 도전해 보는 것은 어떨까요?`,
    };
    if (fcmToken) await sendToUser(fcmToken, milestone.title, milestone.body);
  } else if (prevRate < 2 / 3 && currentRate >= 2 / 3) {
    milestone = {
      title: '🎉 목표의 2/3 달성!',
      body: `목표층수 ${goalFloors}층 중 ${Math.floor(
        (goalFloors * 2) / 3
      )}층에 도달했습니다! 일상에서 계단을 오르는 것만으로도 전체 사망 위험이 낮아지는 경향이 보고됩니다. 남은 층은 호흡을 조금 가다듬고 자신의 페이스에 맞추면서 목표를 이뤄보세요!`,
    };
    if (fcmToken) await sendToUser(fcmToken, milestone.title, milestone.body);
  } else if (prevRate < 1 && currentRate >= 1) {
    milestone = {
      title: '🏆 목표 달성!',
      body: `축하합니다. 이번주 목표했던 ${goalFloors}층을 모두 올랐습니다. 다음주에도 이 모습을 유지해 주세요!`,
    };
    if (fcmToken) await sendToUser(fcmToken, milestone.title, milestone.body);
  }

  // 기록 저장
  const recordRef = db.collection('stairRecords').doc();
  await Promise.all([
    recordRef.set({
      userId,
      weekKey,
      records: processedRecords,
      totalFloors: addedFloors,
      createdAt: FieldValue.serverTimestamp(),
    }),
    db
      .collection('weeklyGoals')
      .doc(goalDocId)
      .update({
        currentFloors: FieldValue.increment(addedFloors),
      }),
  ]);

  return {
    userId,
    addedFloors,
    totalFloors: newFloors,
    goalFloors,
    achievementRate,
    milestone,
  };
};

// ──────────────────────────────────────────
// 계단 기록 조회
// userId + weekKey 기준, 최신순 정렬
// ──────────────────────────────────────────
const getRecords = async (userId, weekKey) => {
  const db = getFirestore();
  const snap = await db
    .collection('stairRecords')
    .where('userId', '==', userId)
    .where('weekKey', '==', weekKey)
    .orderBy('createdAt', 'desc')
    .get();

  return snap.docs.map((doc) => ({ recordId: doc.id, ...doc.data() }));
};

module.exports = { recordStairs, getRecords };
