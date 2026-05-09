const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// ──────────────────────────────────────────
// 회원가입
// Firebase Auth에 유저 생성 후
// /users/{userId}에 추가 정보 저장
// 완료 후 자동 로그인하여 토큰 반환
// ──────────────────────────────────────────
const register = async (email, password, nickname, floor) => {
  const auth = getAuth();
  const db = getFirestore();

  // 닉네임 중복 확인
  const nicknameSnap = await db
    .collection('users')
    .where('nickname', '==', nickname)
    .limit(1)
    .get();

  if (!nicknameSnap.empty) {
    throw new Error('이미 사용중인 닉네임입니다');
  }

  // Firebase Auth에 유저 생성
  const userRecord = await auth.createUser({ email, password });

  // Firestore에 추가 정보 저장
  await db.collection('users').doc(userRecord.uid).set({
    userId: userRecord.uid,
    email,
    nickname,
    floor,
    fcmToken: null,
    createdAt: FieldValue.serverTimestamp(),
  });

  // 회원가입 후 자동 로그인
  const loginResult = await login(email, password);

  return {
    userId: userRecord.uid,
    email,
    nickname,
    floor,
    token: loginResult.token,
    refreshToken: loginResult.refreshToken,
  };
};

// ──────────────────────────────────────────
// 로그인
// Firebase Auth REST API로 로그인 (토큰 발급)
// /users/{userId}에서 추가 정보 조회
// ──────────────────────────────────────────
const login = async (email, password) => {
  const db = getFirestore();

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다');
  }

  const { idToken, refreshToken, localId } = await response.json();

  // Firestore에서 추가 정보 조회
  const userDoc = await db.collection('users').doc(localId).get();
  const userData = userDoc.data();

  return {
    userId: localId,
    token: idToken,
    refreshToken,
    email: userData.email,
    nickname: userData.nickname,
    floor: userData.floor,
  };
};

// ──────────────────────────────────────────
// 토큰 갱신
// refreshToken으로 새 token 발급
// ──────────────────────────────────────────
const refreshToken = async (token) => {
  const response = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${process.env.API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: token,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('토큰 갱신에 실패했습니다. 다시 로그인해주세요');
  }

  const data = await response.json();

  return {
    token: data.id_token,
    refreshToken: data.refresh_token,
  };
};

// ──────────────────────────────────────────
// FCM 토큰 업데이트
// ──────────────────────────────────────────
const updateFcmToken = async (userId, fcmToken) => {
  const db = getFirestore();
  await db.collection('users').doc(userId).update({ fcmToken });
};

module.exports = { register, login, refreshToken, updateFcmToken };
