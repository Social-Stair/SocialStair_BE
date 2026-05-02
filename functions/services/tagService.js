const { getFirestore } = require('firebase-admin/firestore');

const MAX_TIME_MS = 45 * 60 * 1000; // 45분
const MAX_FLOORS = 6; // 최대 6층

// ──────────────────────────────────────────
// 이전 태그 조회
// 같은 cardUid의 최신 태그 2개를 가져와서
// 두 번째 (직전) 태그를 반환
// 45분 초과 시 null 반환
// ──────────────────────────────────────────
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

  // 45분 초과 시 무효
  const currentTime = Date.now();
  const prevTime = prevTag.timestamp.toMillis();
  if (currentTime - prevTime > MAX_TIME_MS) return null;

  return prevTag;
};

// ──────────────────────────────────────────
// 층수 및 구간 계산
// prevFloor: 이전 층, currFloor: 현재 층
// ──────────────────────────────────────────
const calcSection = (prevFloor, currFloor) => {
  const floorsClimbed = Math.abs(currFloor - prevFloor);
  const sectionKey = `${Math.min(prevFloor, currFloor)}-${Math.max(
    prevFloor,
    currFloor
  )}`;
  return { floorsClimbed, sectionKey };
};

// ──────────────────────────────────────────
// 세션 유효성 검사
// 6층 초과 이동은 무효 처리
// ──────────────────────────────────────────
const isValidSession = (floorsClimbed) => {
  return floorsClimbed <= MAX_FLOORS;
};

// ──────────────────────────────────────────
// 사용자 팀 정보 + 닉네임 조회
// /users/{cardUid} 에서 team, nickname 반환
// ──────────────────────────────────────────
const getUserInfo = async (cardUid) => {
  const db = getFirestore();
  const userDoc = await db.collection('users').doc(cardUid).get();
  if (!userDoc.exists) return null;
  const { team, nickname } = userDoc.data();
  return { team, nickname }; // 예) { team: "floor-2", nickname: "용사1" }
};

module.exports = { getPrevTag, calcSection, isValidSession, getUserInfo };
