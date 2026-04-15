const { getFirestore } = require('firebase-admin/firestore');

const MAX_TIME_MS = 45 * 60 * 1000; // 45분
const MAX_FLOORS = 6; // 최대 6층

// 이전태그 조회
const getPrevTag = async (cardUid) => {
  const db = getFirestore();
  const snap = await db
    .collection('tags')
    .where('cardUid', '==', cardUid)
    .orderBy('timestamp', 'desc')
    .limit(2)
    .get();

  if (snap.size < 2) return null;

  const prevTag = snap.docs[1].data();

  // 30분 초과 시 무효
  const currentTime = Date.now();
  const prevTime = prevTag.timestamp.toMillis();
  if (currentTime - prevTime > MAX_TIME_MS) return null;

  return prevTag;
};

// 층수계산
const calcSection = (prevFloor, currFloor) => {
  const floorsClimbed = Math.abs(currFloor - prevFloor);
  const sectionKey = `${Math.min(prevFloor, currFloor)}-${Math.max(
    prevFloor,
    currFloor
  )}`;
  return { floorsClimbed, sectionKey };
};

// 유효성 검사
const isValidSession = (floorsClimbed) => {
  return floorsClimbed <= MAX_FLOORS;
};

module.exports = { getPrevTag, calcSection, isValidSession };
