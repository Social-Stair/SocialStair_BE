const { getFirestore } = require('firebase-admin/firestore');

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
  return snap.docs[1].data();
};

// 층수계산
const calcSection = (prevFloor, currFloor) => {
  const db = getFirestore();
  const floorsClimbed = Math.abs(currFloor - prevFloor);
  const sectionKey = `${Math.min(prevFloor, currFloor)}-${Math.max(
    prevFloor,
    currFloor
  )}`;
  return { floorsClimbed, sectionKey };
};

module.exports = { getPrevTag, calcSection };
