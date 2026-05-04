const { onRequest } = require('firebase-functions/v2/https');
const { register, login, updateFcmToken } = require('../services/authService');

// ──────────────────────────────────────────
// 회원가입
// POST /register
// body: { email, password, nickname, floor, team }
// ──────────────────────────────────────────
const registerHandler = onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { email, password, nickname, floor, team } = req.body;
  if (!email || !password || !nickname || !floor || !team) {
    return res.status(400).json({ error: '모든 필드를 입력해주세요' });
  }

  try {
    const user = await register(email, password, nickname, floor, team);
    res.status(200).json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ──────────────────────────────────────────
// 로그인
// POST /login
// body: { email, password }
// ──────────────────────────────────────────
const loginHandler = onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요' });
  }

  try {
    const result = await login(email, password);
    res.status(200).json(result);
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

// ──────────────────────────────────────────
// FCM 토큰 업데이트
// POST /updateFcmToken
// body: { userId, fcmToken }
// ──────────────────────────────────────────
const updateFcmTokenHandler = onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { userId, fcmToken } = req.body;
  if (!userId || !fcmToken) {
    return res.status(400).json({ error: 'userId, fcmToken 필수' });
  }

  try {
    await updateFcmToken(userId, fcmToken);
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = { registerHandler, loginHandler, updateFcmTokenHandler };
