const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getTodayKey } = require('../utils/dateUtils');

// nfc 통계 업데이트
const updateStats = async (floorsClimbed, sectionKey, cardUid) => {
  const db = getFirestore();
  const statsRef = db.collection('stats').doc(getTodayKey());
  await statsRef.set(
    {
      totalFloors: FieldValue.increment(floorsClimbed),
      [`sectionStats.${sectionKey}`]: FieldValue.increment(1),
      taggedCards: FieldValue.arrayUnion(cardUid), // 중복 자동 제거
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
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
