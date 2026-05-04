const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getWeekKey } = require('../utils/dateUtils');

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
// 계단 기록 입력
// - records 리스트로 받아서 저장
// - withColleague true면 층수 2배 반영
// - 30%, 60% 달성 시 milestone 반환
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

  // 목표 조회
  const goalDoc = await db.collection('weeklyGoals').doc(goalDocId).get();
  if (!goalDoc.exists) throw new Error('목표를 먼저 설정해주세요');

  const { goalFloors, currentFloors } = goalDoc.data();
  const prevFloors = currentFloors || 0;
  const newFloors = prevFloors + addedFloors;
  const achievementRate = Math.round((newFloors / goalFloors) * 100);

  // milestone 체크
  let milestone = null;
  const prev = Math.round((prevFloors / goalFloors) * 100);
  if (prev < 30 && achievementRate >= 30) {
    milestone = await getMilestoneMessage('30');
  } else if (prev < 60 && achievementRate >= 60) {
    milestone = await getMilestoneMessage('60');
  }

  // 기록 저장
  const recordRef = db.collection('stairRecords').doc();
  await Promise.all([
    // 기록 저장
    recordRef.set({
      userId,
      weekKey,
      records: processedRecords,
      totalFloors: addedFloors,
      createdAt: FieldValue.serverTimestamp(),
    }),
    // 목표 현재 층수 업데이트
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
// userId + weekKey 기준
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
