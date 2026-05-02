const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onSchedule: onScheduleV2 } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const {
  getPrevTag,
  calcSection,
  isValidSession,
  getUserInfo,
} = require('./services/tagService');
const { updateStats, updateManualStats } = require('./services/statsService');
const {
  createJournalHandler,
  getJournalsHandler,
  updateJournalHandler,
  deleteJournalHandler,
} = require('./routes/journalRoutes');
const { getWeekKey } = require('./utils/dateUtils');

initializeApp();

// ──────────────────────────────────────────
// NFC 태그 이벤트 처리
// /tags 컬렉션에 문서 생성 시 자동 실행
// ──────────────────────────────────────────
exports.onTagCreated = onDocumentCreated('tags/{docId}', async (event) => {
  const { cardUid, floor, inputType, fromFloor, toFloor } = event.data.data();

  if (inputType === 'manual') {
    await updateManualStats(fromFloor, toFloor);
    return;
  }

  const prevTag = await getPrevTag(cardUid);
  if (!prevTag) return;

  const { floorsClimbed, sectionKey } = calcSection(prevTag.floor, floor);
  if (floorsClimbed === 0) return;
  if (!isValidSession(floorsClimbed)) return;

  // 팀 정보 + 닉네임 조회
  const userInfo = await getUserInfo(cardUid);
  if (!userInfo) return; // /users에 등록되지 않은 카드

  const { team, nickname } = userInfo;

  await updateStats(floorsClimbed, sectionKey, cardUid, floor, team, nickname);
});

// ──────────────────────────────────────────
// 주간 리셋 스케줄러
// 매주 월요일 00:00 (KST) 자동 실행
// ──────────────────────────────────────────
exports.weeklyReset = onScheduleV2(
  { schedule: '0 15 * * 0', timeZone: 'UTC' },
  async () => {
    const db = getFirestore();
    const weekKey = getWeekKey();

    await db.collection('weeklyStats').doc(weekKey).set({
      goalFloors: 0,
      bossMaxHp: 0,
      bossCurrentHp: 0,
      teamStats: {},
      updatedAt: new Date(),
    });

    console.log(`주간 리셋 완료: ${weekKey}`);
  }
);

// ──────────────────────────────────────────
// 성찰일지 API
// ──────────────────────────────────────────
exports.createJournal = createJournalHandler;
exports.getJournals = getJournalsHandler;
exports.updateJournal = updateJournalHandler;
exports.deleteJournal = deleteJournalHandler;
