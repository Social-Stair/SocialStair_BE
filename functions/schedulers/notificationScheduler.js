const { onSchedule } = require('firebase-functions/v2/scheduler');
const { getFirestore } = require('firebase-admin/firestore');
const { getSkippedUsers } = require('../services/dailyStatusService');
const { sendToAll, sendToUser } = require('../services/notificationService');
const {
  getWeekKey,
  getExperimentWeek,
  getDayKST,
} = require('../utils/dateUtils');

// ──────────────────────────────────────────
// 주차 + 요일별 오전 메시지
// ──────────────────────────────────────────
const getMorningMessage = () => {
  const week = getExperimentWeek();
  const day = getDayKST();

  if (!week) return null;

  const messages = {
    1: {
      1: {
        title: '계단 챌린지 🏃',
        body: '이번 주 엘리베이터 대신 계단을 이용해볼까요? 계단 이용은 별도의 운동 시간 없이 신체활동을 늘리는 효과적인 방법입니다 (Eves & Webb, 2006). 삼성관에서 가볍게 한 층부터 시작해보세요!',
      },
      2: {
        title: '계단 챌린지 🏃',
        body: '화요일이네요. 오늘은 밥 먹고 돌아오면서 계단을 이용해보세요!',
      },
      3: {
        title: '계단 챌린지 🏃',
        body: '수요일이네요. 오늘 수업이나 업무 이동이 있다면, 가까운 한 층은 계단으로 이동해보세요!',
      },
      4: {
        title: '계단 챌린지 🏃',
        body: '목요일이네요. 오늘은 머리를 식힐 겸 계단에서 스트레칭을 해볼까요?',
      },
      5: {
        title: '계단 챌린지 🏃',
        body: '오늘 점심 후 수업이나 업무 이동이 있다면 가까운 한 층은 계단으로 이동해보세요!',
      },
      6: {
        title: '계단 챌린지 🏃',
        body: '오늘은 계단을 이용해 스트레칭을 해보시면 어떨까요? 계단을 활용한 스트레칭 사진을 연구원에게 보내주세요. 작은 선물이 있을지도~?',
      },
    },
    2: {
      1: {
        title: '계단 챌린지 🏃',
        body: '2주차 월요일입니다 🤓 오후에 몸이 무겁게 느껴진다면 이동시 계단을 활용해보세요!',
      },
      2: {
        title: '계단 챌린지 🏃',
        body: '하루 5층만 오르면 심혈관질환 위험이 20% 낮아집니다 (Song et al., 2023). 오늘 수업이나 업무 이동이 있다면, 가까운 한 층은 계단으로 이동해보세요!',
      },
      3: {
        title: '계단 챌린지 🏃',
        body: '계단 오르기는 걷기보다 훨씬 효율적인 운동으로, 유산소와 근력 운동을 동시에 얻을 수 있는 일상 속 최고의 운동입니다 (Sanchez-Lastra et al., 2021). 오르락 팀원들의 목표 달성 현황을 확인하고, 나의 이번 주 목표도 달성해보세요🪜🔥',
      },
      4: {
        title: '계단 챌린지 🏃',
        body: '오늘은 계단을 이용해 스트레칭을 해보시면 어떨까요? 계단을 활용한 스트레칭 사진을 연구원에게 보내주세요. 작은 선물이 있을지도~?',
      },
      5: {
        title: '계단 챌린지 🏃',
        body: '오늘 점심 식사 후 소화 루틴으로 계단 오르기 같이 도전해 보실래요?',
      },
      6: {
        title: '계단 챌린지 🏃',
        body: '지금까지 작성하신 성찰일지를 한 번 되돌아볼까요? 혹시 마음이 바뀌었거나 더 기록하고 싶은 내용이 생겼는지 확인해 보세요 ☺️',
      },
    },
    3: {
      1: {
        title: '계단 챌린지 🏃',
        body: '날씨가 점점 더워지고 있습니다. 오늘은 친구와 함께 계단을 이용하고, 연구원에게 인증사진을 보내주세요. 작은 선물이 있을지도~? 🧚',
      },
      2: {
        title: '계단 챌린지 🏃',
        body: '하루 6층(약 60계단)만 오르면 전체 사망률과 심혈관질환 사망률을 줄일 수 있습니다 (Sanchez-Lastra et al., 2021). 오늘 수업이나 업무 이동이 있다면, 계단으로 이동해보세요!',
      },
      3: {
        title: '계단 챌린지 🏃',
        body: '허벅지 근육이 전체 포도당의 70%를 소모하므로 식후 계단 오르기가 당뇨 예방에 탁월합니다 (Sanchez-Lastra et al., 2021). 오늘 점심 식사 후 소화 루틴으로 계단 오르기 도전해보세요!',
      },
      4: {
        title: '계단 챌린지 🏃',
        body: '오르락 팀원들의 목표 달성 현황을 확인하고, 나의 이번 주 목표도 달성해보세요🪜🔥',
      },
      5: {
        title: '계단 챌린지 🏃',
        body: '지금까지 작성하신 성찰일지를 한 번 되돌아볼까요? 혹시 마음이 바뀌었거나 더 기록하고 싶은 내용이 생겼는지 확인해 보세요 ☺️',
      },
      6: {
        title: '계단 챌린지 🏃',
        body: '마지막 기록 날입니다. 3주간 오르락 팀원으로 함께 해주셔서 감사합니다.',
      },
    },
  };

  return messages[week]?.[day] || null;
};

// ──────────────────────────────────────────
// 기록 없는 유저 체크
// ──────────────────────────────────────────
const getUsersWithNoRecord = async () => {
  const db = getFirestore();
  const weekKey = getWeekKey();
  const todayUTC = new Date().toISOString().split('T')[0];

  const usersSnap = await db.collection('users').get();
  const allUserIds = usersSnap.docs.map((doc) => doc.data().userId);

  const recordsSnap = await db
    .collection('stairRecords')
    .where('weekKey', '==', weekKey)
    .get();

  const todayRecordUserIds = recordsSnap.docs
    .filter((doc) => {
      const createdAt = doc.data().createdAt?.toDate();
      return createdAt && createdAt.toISOString().split('T')[0] === todayUTC;
    })
    .map((doc) => doc.data().userId);

  return allUserIds.filter((id) => !todayRecordUserIds.includes(id));
};

// ──────────────────────────────────────────
// 일요일 20:00 (KST) 목표 설정 알림
// UTC 11:00 = KST 20:00
// ──────────────────────────────────────────
const weeklyGoalReminder = onSchedule(
  { schedule: '0 11 * * 0', timeZone: 'UTC' },
  async () => {
    const week = getExperimentWeek();
    if (!week) return;

    await sendToAll(
      '이번 주 목표를 설정해주세요! 🎯',
      '이번 주 계단 목표 층수를 입력해주세요',
      'weeklyGoal'
    );
    console.log('목표 설정 알림 발송 완료');
  }
);

// ──────────────────────────────────────────
// 월~토 10:00 (KST) 오전 알림
// UTC 01:00 = KST 10:00
// ──────────────────────────────────────────
const morningReminder = onSchedule(
  { schedule: '0 1 * * 1-6', timeZone: 'UTC' },
  async () => {
    const message = getMorningMessage();
    if (!message) return;

    await sendToAll(message.title, message.body, 'morning');
    console.log('오전 알림 발송 완료');
  }
);

// ──────────────────────────────────────────
// 월~토 14:00 (KST) 오후 알림
// skipToday 유저 제외
// UTC 05:00 = KST 14:00
// ──────────────────────────────────────────
const afternoonReminder = onSchedule(
  { schedule: '0 5 * * 1-6', timeZone: 'UTC' },
  async () => {
    if (!getExperimentWeek()) return;

    const skippedUsers = await getSkippedUsers();
    await sendToAll(
      '계단 기록을 입력해주세요! 🏃',
      '오후에 오른 계단을 기록해주세요',
      'afternoon',
      skippedUsers
    );
    console.log('오후 알림 발송 완료');
  }
);

// ──────────────────────────────────────────
// 월~토 19:00 (KST) 저녁 알림
// skipToday 유저 제외
// UTC 10:00 = KST 19:00
// ──────────────────────────────────────────
const eveningReminder = onSchedule(
  { schedule: '0 10 * * 1-6', timeZone: 'UTC' },
  async () => {
    if (!getExperimentWeek()) return;

    const skippedUsers = await getSkippedUsers();
    await sendToAll(
      '계단 기록을 입력해주세요! 🏃',
      '저녁에 오른 계단을 기록해주세요',
      'evening',
      skippedUsers
    );
    console.log('저녁 알림 발송 완료');
  }
);

// ──────────────────────────────────────────
// 수요일 14:00 (KST) 1/2 미달성 체크
// UTC 05:00 = KST 14:00 (수요일만)
// ──────────────────────────────────────────
const wednesdayCheck = onSchedule(
  { schedule: '0 5 * * 3', timeZone: 'UTC' },
  async () => {
    if (!getExperimentWeek()) return;

    const db = getFirestore();
    const weekKey = getWeekKey();
    const skippedUsers = await getSkippedUsers();

    const goalsSnap = await db
      .collection('weeklyGoals')
      .where('weekKey', '==', weekKey)
      .get();

    const usersSnap = await db.collection('users').get();
    const usersMap = {};
    usersSnap.docs.forEach((doc) => {
      const data = doc.data();
      usersMap[data.userId] = data;
    });

    for (const doc of goalsSnap.docs) {
      const { userId, goalFloors, currentFloors } = doc.data();
      if (skippedUsers.includes(userId)) continue;

      const rate = goalFloors > 0 ? currentFloors / goalFloors : 0;
      if (rate < 0.5) {
        const user = usersMap[userId];
        if (!user?.fcmToken) continue;

        await sendToUser(
          user.fcmToken,
          '한 주의 절반, 수요일입니다 💪',
          '계단 이용은 별도의 운동 시간 없이 신체활동을 늘리는 효과적인 방법입니다 (Eves & Webb, 2006). 오늘 퇴근길에 가볍게 딱 2층만 계단으로 올라가 보는 것은 어떨까요?',
          'wednesday',
          userId
        );
      }
    }
    console.log('수요일 미달성 체크 완료');
  }
);

// ──────────────────────────────────────────
// 일요일 19:00 (KST) 주간 리셋
// UTC 10:00 = KST 19:00
// weeklyGoals currentFloors 초기화
// ──────────────────────────────────────────
const weeklyReset = onSchedule(
  { schedule: '0 10 * * 0', timeZone: 'UTC' },
  async () => {
    if (!getExperimentWeek()) return;

    const db = getFirestore();
    const weekKey = getWeekKey();

    const goalsSnap = await db
      .collection('weeklyGoals')
      .where('weekKey', '==', weekKey)
      .get();

    const batch = db.batch();
    goalsSnap.docs.forEach((doc) => {
      batch.update(doc.ref, { currentFloors: 0 });
    });
    await batch.commit();

    console.log(`주간 리셋 완료: ${weekKey}`);
  }
);

module.exports = {
  weeklyGoalReminder,
  morningReminder,
  afternoonReminder,
  eveningReminder,
  wednesdayCheck,
  weeklyReset,
};
