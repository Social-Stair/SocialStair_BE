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

module.exports = { getTodayKey, getWeekKey };
