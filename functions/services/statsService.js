const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getTodayKey } = require('../utils/dateUtils');

// nfc 통계 업데이트
const updateStats = async (
  floorsClimbed,
  sectionKey,
  cardUid,
  currentFloor
) => {
  const db = getFirestore();
  const today = getTodayKey();
  const statsRef = db.collection('stats').doc(today);
  const userStatsRef = db
    .collection('userStats')
    .doc(today)
    .collection('cards')
    .doc(cardUid);

  // stats, userStats 동시에 업데이트
  await Promise.all([
    statsRef.set(
      {
        totalFloors: FieldValue.increment(floorsClimbed),
        [`sectionStats.${sectionKey}`]: FieldValue.increment(1),
        taggedCards: FieldValue.arrayUnion(cardUid),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    ),
    userStatsRef.set(
      {
        floors: FieldValue.increment(floorsClimbed),
        count: FieldValue.increment(1),
        lastFloor: currentFloor,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    ),
  ]);
};

// 수기 통계 업데이트
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
