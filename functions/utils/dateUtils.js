// ──────────────────────────────────────────
// 실험 기간 설정 (KST 기준)
// 테스트: 2026.05.10 ~ 2026.05.16 → 1주차 메시지
// 1주차:  2026.05.17 ~ 2026.05.23
// 2주차:  2026.05.24 ~ 2026.05.30
// 3주차:  2026.05.31 ~ 2026.06.06
// ──────────────────────────────────────────
const TEST_START = new Date('2026-05-10T00:00:00+09:00');
const EXP_START = new Date('2026-05-17T00:00:00+09:00');
const EXP_END = new Date('2026-06-07T00:00:00+09:00');

const getTodayKey = () => {
  return new Date().toISOString().split('T')[0];
};

// ──────────────────────────────────────────
// 특정 날짜 기준 주차 키 계산
// ──────────────────────────────────────────
const calcWeekKey = (date) => {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const week = Math.ceil(
    ((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `${year}-W${String(week).padStart(2, '0')}`;
};

const getWeekKey = () => {
  return calcWeekKey(new Date());
};

// ──────────────────────────────────────────
// 다음 주차 키 계산
// 일요일 목표 설정 시 다음 주차로 저장하기 위함
// ──────────────────────────────────────────
const getNextWeekKey = () => {
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return calcWeekKey(nextWeek);
};

// ──────────────────────────────────────────
// 실험 주차 계산 (KST 기준)
// 테스트 주간 → 1
// 1주차 → 1, 2주차 → 2, 3주차 → 3
// 실험 전/후 → null
// ──────────────────────────────────────────
const getExperimentWeek = () => {
  const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000);

  if (nowKST < TEST_START) return null;
  if (nowKST >= EXP_END) return null;
  if (nowKST < EXP_START) return 1;

  const diffDays = Math.floor((nowKST - EXP_START) / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1;

  return week <= 3 ? week : null;
};

// ──────────────────────────────────────────
// KST 기준 현재 요일 반환
// 0:일 1:월 2:화 3:수 4:목 5:금 6:토
// ──────────────────────────────────────────
const getDayKST = () => {
  const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return nowKST.getDay();
};

module.exports = {
  getTodayKey,
  getWeekKey,
  getNextWeekKey,
  getExperimentWeek,
  getDayKST,
};
