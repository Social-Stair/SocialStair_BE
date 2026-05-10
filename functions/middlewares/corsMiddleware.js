const cors = require('cors')({ origin: true });

// ──────────────────────────────────────────
// CORS 미들웨어 래퍼
// 모든 HTTP 함수에 적용
// ──────────────────────────────────────────
const withCors = (handler) => (req, res) => {
  cors(req, res, () => handler(req, res));
};

module.exports = { withCors };
