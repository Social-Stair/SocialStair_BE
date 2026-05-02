# Social Stair - Backend

건물 계단 사용량을 측정하고 게이밍 요소와 함께 앱에 실시간으로 표시하는 서비스의 백엔드입니다.

## 프로젝트 구조

```
social-stair/
  ├── functions/
  │     ├── routes/
  │     │     └── journalRoutes.js  # 성찰일지 API 엔드포인트
  │     ├── services/
  │     │     ├── tagService.js     # 태그 조회 및 세션 계산
  │     │     ├── statsService.js   # 통계 업데이트
  │     │     └── journalService.js # 성찰일지 CRUD
  │     ├── utils/
  │     │     └── dateUtils.js      # 날짜 유틸
  │     └── index.js                # Cloud Functions 진입점
  ├── firestore.rules               # Firestore 보안 규칙
  ├── firestore.indexes.json
  └── firebase.json
```

## 시스템 흐름

```
NFC 스티커 태그
    ↓
안드로이드 단말기 (각 층 고정)
    ↓
Firestore /tags 저장
    ↓
Cloud Functions 자동 실행 (세션 계산)
    ↓
Firestore /stats, /weeklyStats, /weeklyUserStats 업데이트
    ↓
앱 (실시간 구독 + API 호출)
```

## 참여자 구조

```
총 20명 (18명 주요 참여자 + 테스터 2명)
2층 ~ 7층, 층별 3명씩 팀 구성
```

---

## Firestore 컬렉션

### /tags

안드로이드가 태그 이벤트 발생 시 저장하는 raw 데이터입니다. **앱에서 직접 읽을 필요 없습니다.**

```json
{
  "cardUid": "04:AB:CD:12:34",
  "floor": 3,
  "inputType": "nfc",
  "timestamp": "Timestamp",
  "deviceUuid": "android-device-id"
}
```

---

### /stats ← 일별 통계

문서 ID는 날짜입니다. (예: `2025-04-07`)

```json
{
  "totalFloors": 1240,
  "taggedCards": ["04:AB:CD:12:34", "04:FF:11:98:76"],
  "sectionStats": {
    "1-2": 34,
    "2-3": 28,
    "3-4": 19
  },
  "updatedAt": "Timestamp"
}
```

| 필드         | 타입      | 설명                                  |
| ------------ | --------- | ------------------------------------- |
| totalFloors  | number    | 오늘 총 올라간 층수                   |
| taggedCards  | array     | 오늘 태그한 카드 UID 목록 (중복 제거) |
| sectionStats | map       | 구간별 이용 횟수                      |
| updatedAt    | Timestamp | 마지막 업데이트 시각                  |

참여 인원은 `taggedCards.length`로 계산합니다.

---

### /weeklyStats ← 주간 통계 (보스 HP)

문서 ID는 주차입니다. (예: `2025-W15`)

```json
{
  "goalFloors": 100,
  "bossMaxHp": 600,
  "bossCurrentHp": 185,
  "teamStats": {
    "floor-2": {
      "floors": 120,
      "contribution": 100,
      "achieved": true,
      "achievedAt": "Timestamp"
    },
    "floor-3": {
      "floors": 80,
      "contribution": 80,
      "achieved": false,
      "achievedAt": null
    }
  },
  "updatedAt": "Timestamp"
}
```

| 필드                            | 타입      | 설명                              |
| ------------------------------- | --------- | --------------------------------- |
| goalFloors                      | number    | 팀별 주간 목표 층수               |
| bossMaxHp                       | number    | 보스 최대 HP (goalFloors × 6)     |
| bossCurrentHp                   | number    | 보스 현재 HP                      |
| teamStats.{teamId}.floors       | number    | 팀 실제 올라간 층수               |
| teamStats.{teamId}.contribution | number    | 팀 기여분 (최대 goalFloors)       |
| teamStats.{teamId}.achieved     | boolean   | 목표 달성 여부                    |
| teamStats.{teamId}.achievedAt   | Timestamp | 달성 시각 → 달성 순서 정렬에 사용 |

---

### /weeklyUserStats ← 주간 개인 기록

문서 ID는 주차, 하위 컬렉션 `users` 안에 카드별 기록이 저장됩니다.

```
/weeklyUserStats/{주차키}/users/{cardUid}
```

```json
{
  "floors": 23,
  "count": 5,
  "team": "floor-2",
  "lastFloor": 4,
  "updatedAt": "Timestamp"
}
```

| 필드      | 타입      | 설명                    |
| --------- | --------- | ----------------------- |
| floors    | number    | 이번 주 총 올라간 층수  |
| count     | number    | 이번 주 계단 이용 횟수  |
| team      | string    | 소속 팀 (예: "floor-2") |
| lastFloor | number    | 마지막 태그 층수        |
| updatedAt | Timestamp | 마지막 업데이트 시각    |

`floors` 기준 내림차순 정렬로 랭킹 구현합니다.

---

### /journals ← 성찰일지

상위 문서 ID는 cardUid, 하위 컬렉션 `entries` 안에 일지가 저장됩니다.
일지 하나당 Firestore가 자동 생성하는 고유 entryId를 가집니다.

```
/journals/{cardUid}/entries/{entryId}
```

```json
{
  "cardUid": "04:AB:CD:12:34",
  "date": "2025-04-07",
  "mood": "happy",
  "content": "오늘 계단을 5번 올랐다.",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

| 필드      | 타입      | 설명                               |
| --------- | --------- | ---------------------------------- |
| cardUid   | string    | 작성자 스티커 UUID                 |
| date      | string    | 작성 날짜                          |
| mood      | string    | 기분 아이콘 키 (기획 확정 후 수정) |
| content   | string    | 성찰일지 내용                      |
| createdAt | Timestamp | 작성 시각                          |
| updatedAt | Timestamp | 수정 시각                          |

---

### /testTeams ← 팀 정보

문서 ID는 팀 ID입니다. (예: `floor-2`)

```json
{
  "name": "2층팀",
  "floor": 2,
  "members": ["04:AB:CD:12:34", "04:FF:11:98:76"]
}
```

---

### /weeklyConfig ← 주간 목표 설정

기획자가 Firebase 콘솔에서 직접 수정합니다. 문서 ID는 `current`입니다.

```json
{
  "goalFloors": 100
}
```

---

### /devices

단말기 설정 정보입니다. 앱에서 사용하지 않아도 됩니다.

---

## 성찰일지 API (Cloud Functions HTTP)

베이스 URL은 백엔드 담당자에게 요청하세요.

| 메서드 | 엔드포인트     | 설명           |
| ------ | -------------- | -------------- |
| POST   | /createJournal | 일지 작성      |
| GET    | /getJournals   | 일지 목록 조회 |
| PUT    | /updateJournal | 일지 수정      |
| DELETE | /deleteJournal | 일지 삭제      |

**POST /createJournal**

- Request body: `{ cardUid, mood, content }` (mood 선택, 나머지 필수)
- Response: `{ entryId }`
  **GET /getJournals**
- Query parameter: `?cardUid=xxx`
- Response: `{ entries: [{ id, date, mood, content, createdAt, updatedAt }] }`
  **PUT /updateJournal**
- Request body: `{ cardUid, entryId, mood, content }` (mood 선택, 나머지 필수)
- Response: `{ success: true }`
  **DELETE /deleteJournal**
- Request body: `{ cardUid, entryId }`
- Response: `{ success: true }`

---

```

## 주간 리셋

매주 월요일 00:00 (KST) 자동 리셋됩니다.

```
