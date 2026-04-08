const getTodayKey = () => {
  return new Date().toISOString().split('T')[0];
};

module.exports = { getTodayKey };
