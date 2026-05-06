const { onSchedule } = require('firebase-functions/v2/scheduler');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { getSkippedUsers } = require('../services/dailyStatusService');
const { getWeekKey } = require('../utils/dateUtils');

// ──────────────────────────────────────────
// 알림 발송 (skipToday 유저 제외)
// ──────────────────────────────────────────
const sendNotification = async (title, body, excludeUserIds = []) => {
  const db = getFirestore();
  const snap = await db.collection('users').get();

  const tokens = snap.docs
    .map((doc) => doc.data())
    .filter((user) => !excludeUserIds.includes(user.userId))
    .map((user) => user.fcmToken)
    .filter((token) => token !== null && token !== undefined);

  if (tokens.length === 0) return;

  await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
  });
};

// ──────────────────────────────────────────
// 요일별 오전 메시지
// ──────────────────────────────────────────
const getMorningMessage = () => {
  const day = new Date().getDay(); // 0:일 1:월 2:화 3:수 4:목 5:금 6:토
  const messages = {
    1: {
      title: '계단 챌린지 🏃',
      body: '이번 주 엘리베이터 대신 계단을 이용해볼까요? 삼성관에서 가볍게 한 층부터 시작해보세요!',
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
      body: '오늘은 계단을 이용해 스트레칭을 해보시면 어떨까요?',
    },
  };
  return (
    messages[day] || {
      title: '계단 챌린지 🏃',
      body: '오늘도 계단을 이용해보세요!',
    }
  );
};

// ──────────────────────────────────────────
// 기록 없는 유저 체크
// ──────────────────────────────────────────
const getUsersWithNoRecord = async () => {
  const db = getFirestore();
  const weekKey = getWeekKey();
  const today = new Date().toISOString().split('T')[0];

  const usersSnap = await db.collection('users').get();
  const allUserIds = usersSnap.docs.map((doc) => doc.data().userId);

  const recordsSnap = await db
    .collection('stairRecords')
    .where('weekKey', '==', weekKey)
    .get();

  const todayRecordUserIds = recordsSnap.docs
    .filter((doc) => {
      const createdAt = doc.data().createdAt?.toDate();
      return createdAt && createdAt.toISOString().split('T')[0] === today;
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
    await sendNotification(
      '이번 주 목표를 설정해주세요! 🎯',
      '이번 주 계단 목표 층수를 입력해주세요'
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
    const { title, body } = getMorningMessage();
    await sendNotification(title, body);
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
    const skippedUsers = await getSkippedUsers();
    await sendNotification(
      '계단 기록을 입력해주세요! 🏃',
      '오후에 오른 계단을 기록해주세요',
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
    const skippedUsers = await getSkippedUsers();
    await sendNotification(
      '계단 기록을 입력해주세요! 🏃',
      '저녁에 오른 계단을 기록해주세요',
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

        await getMessaging().send({
          token: user.fcmToken,
          notification: {
            title: '한 주의 절반, 수요일입니다 💪',
            body: '계단 이용은 별도의 운동 시간 없이 신체활동을 늘리는 효과적인 방법입니다. 오늘 퇴근길에 가볍게 딱 2층만 계단으로 올라가 보는 것은 어떨까요?',
          },
        });
      }
    }
    console.log('수요일 미달성 체크 완료');
  }
);

module.exports = {
  weeklyGoalReminder,
  morningReminder,
  afternoonReminder,
  eveningReminder,
  wednesdayCheck,
};
