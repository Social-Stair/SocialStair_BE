const { getAuth } = require('firebase-admin/auth');

// ──────────────────────────────────────────
// JWT 토큰 검증 미들웨어
// Authorization: Bearer {token} 헤더 검증
// ──────────────────────────────────────────
const verifyToken = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '인증 토큰이 없습니다' });
    return null;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await getAuth().verifyIdToken(token);
    return decoded;
  } catch (e) {
    res.status(401).json({ error: '유효하지 않은 토큰입니다' });
    return null;
  }
};

module.exports = { verifyToken };
