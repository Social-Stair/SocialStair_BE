const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getWeekKey, getExperimentWeek } = require('../utils/dateUtils');
const { sendToUser } = require('./notificationService');

// ──────────────────────────────────────────
// 주차별 달성 메시지
// ──────────────────────────────────────────
const getMilestoneMessages = (goalFloors) => {
  const oneThird = Math.floor(goalFloors / 3);
  const twoThird = Math.floor((goalFloors * 2) / 3);

  return {
    oneThird: {
      1: {
        title: '🎉 목표의 1/3 달성!',
        body: `목표층수 ${goalFloors}층 중 ${oneThird}층을 달성하셨네요! 계단 오르기를 통해 몸을 움직이면 머리를 맑게하여 기분 전환에 도움이 됩니다 (Stenling et al., 2024). 좋은 흐름을 타서, 3층을 추가로 도전해 보는 것은 어떨까요?`,
      },
      2: {
        title: '🎉 목표의 1/3 달성!',
        body: `목표층수 ${goalFloors}층 중 ${oneThird}층을 달성하셨네요! ✨ 하루 6층(약 60계단)만 오르면 전체 사망률과 심혈관질환 사망률을 줄일 수 있습니다 (Sanchez-Lastra et al., 2021). 오늘 수업이나 업무 이동이 있다면, 계단으로 이동해보세요!`,
      },
      3: {
        title: '🎉 목표의 1/3 달성!',
        body: `목표층수 ${goalFloors}층 중 ${oneThird}층을 달성하셨네요! ✨ 계단 오르기는 심폐 체력을 향상시키는 데 도움이 됩니다 (Boreham et al., 2005). 좋은 흐름을 타서, 3층을 추가로 도전해 보는 것은 어떨까요?`,
      },
    },
    twoThird: {
      1: {
        title: '🎉 목표의 2/3 달성!',
        body: `목표층수 ${goalFloors}층 중 ${twoThird}층에 도달했습니다! 일상에서 계단을 오르는 것만으로도 전체 사망 위험이 낮아지는 경향이 보고됩니다 (Paddock et al., 2024). 남은 층은 호흡을 조금 가다듬고 자신의 페이스에 맞추면서 목표를 이뤄보세요!`,
      },
      2: {
        title: '🎉 목표의 2/3 달성!',
        body: `목표층수 ${goalFloors}층 중 ${twoThird}층에 도달하셨네요! 🌟 계단 이용은 일상 속 신체활동을 늘리는 가장 효과적인 방법입니다 (Eves & Webb, 2006). 자신의 페이스에 맞추며 목표를 이뤄보세요!`,
      },
      3: {
        title: '🎉 목표의 2/3 달성!',
        body: `목표층수 ${goalFloors}층 중 ${twoThird}층에 도달하셨네요 🤓 계단 오르기는 유산소와 근력 운동을 동시에 얻을 수 있는 일상 속 최고의 운동으로, 별도의 시간 투자 없이도 중강도 운동 효과를 낼 수 있습니다. 자신의 페이스에 맞추어 목표층수를 끝까지 이뤄보세요!`,
      },
    },
    complete: {
      1: {
        title: '🏆 목표 달성!',
        body: `축하합니다. 이번주 목표했던 ${goalFloors}층을 모두 올랐습니다. 다음주에도 이 모습을 유지해 주세요!`,
      },
      2: {
        title: '🏆 목표 달성!',
        body: `축하합니다. 이번주 목표층수를 모두 이루었습니다!! 오르락 팀원들과 함께 다음주도 목표를 이뤄보도록 해요 💪`,
      },
      3: {
        title: '🏆 목표 달성!',
        body: `축하합니다. 이번주 목표층수를 모두 이루었습니다!! 지금까지 작성하신 성찰일지를 한 번 되돌아보고, 혹시 마음이 바뀌었거나 더 기록하고 싶은 내용이 생겼는지 확인해 보세요 ☺️`,
      },
    },
  };
};

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

  // 주차 계산
  const week = getExperimentWeek() || 1;
  const milestoneMessages = getMilestoneMessages(goalFloors);

  // milestone 체크 (1/3, 2/3, 100%)
  let milestone = null;
  const prevRate = prevFloors / goalFloors;
  const currentRate = newFloors / goalFloors;

  if (prevRate < 1 / 3 && currentRate >= 1 / 3) {
    milestone = milestoneMessages.oneThird[week];
    await sendToUser(
      fcmToken,
      milestone.title,
      milestone.body,
      'milestone_33',
      userId
    );
  } else if (prevRate < 2 / 3 && currentRate >= 2 / 3) {
    milestone = milestoneMessages.twoThird[week];
    await sendToUser(
      fcmToken,
      milestone.title,
      milestone.body,
      'milestone_66',
      userId
    );
  } else if (prevRate < 1 && currentRate >= 1) {
    milestone = milestoneMessages.complete[week];
    await sendToUser(
      fcmToken,
      milestone.title,
      milestone.body,
      'milestone_100',
      userId
    );
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
