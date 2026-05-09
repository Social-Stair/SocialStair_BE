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

const getWeekKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const week = Math.ceil(
    ((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `${year}-W${String(week).padStart(2, '0')}`;
};

// ──────────────────────────────────────────
// 실험 주차 계산 (KST 기준)
// 테스트 주간 → 1
// 1주차 → 1, 2주차 → 2, 3주차 → 3
// 실험 전/후 → null
// ──────────────────────────────────────────
const getExperimentWeek = () => {
  const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000);

  if (nowKST < TEST_START) return null; // 실험 전
  if (nowKST >= EXP_END) return null; // 실험 종료

  if (nowKST < EXP_START) return 1; // 테스트 주간 → 1주차 메시지

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

module.exports = { getTodayKey, getWeekKey, getExperimentWeek, getDayKST };
