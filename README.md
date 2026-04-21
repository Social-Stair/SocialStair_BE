# Social Stair - Backend

건물 계단 사용량을 측정하고 전광판에 실시간으로 표시하는 서비스의 백엔드입니다.

## 프로젝트 구조

```
social-stair/
  ├── functions/
  │     ├── services/
  │     │     ├── tagService.js     # 태그 조회 및 세션 계산
  │     │     └── statsService.js   # 통계 업데이트
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
Firestore /stats 업데이트
    ↓
전광판 웹 (실시간 구독)
```

## Firestore 컬렉션

### /tags

안드로이드가 태그 이벤트 발생 시 저장하는 raw 데이터입니다. **전광판에서 직접 읽을 필요 없습니다.**

```json
{
  "cardUid": "04:AB:CD:12:34",
  "floor": 3,
  "inputType": "nfc",
  "timestamp": "Timestamp",
  "deviceUuid": "android-device-id"
}
```

### /stats ← 전광판 메인 통계

문서 ID는 날짜입니다. (예: `2025-04-07`)

```json
{
  "totalFloors": 1240,
  "participants": 87,
  "sectionStats": {
    "1-2": 34,
    "2-3": 28,
    "3-4": 19
  },
  "updatedAt": "Timestamp"
}
```

| 필드         | 타입      | 설명                 |
| ------------ | --------- | -------------------- |
| totalFloors  | number    | 오늘 총 올라간 층수  |
| participants | number    | 오늘 참여 인원       |
| sectionStats | map       | 구간별 이용 횟수     |
| updatedAt    | Timestamp | 마지막 업데이트 시각 |

### /userStats ← 전광판 랭킹용

문서 ID는 날짜, 하위 컬렉션 `cards` 안에 카드별 기록이 저장됩니다.

```
/userStats/2025-04-07/cards/{cardUid}
```

```json
{
  "floors": 23,
  "count": 3,
  "lastFloor": 4,
  "updatedAt": "Timestamp"
}
```

| 필드      | 타입      | 설명                 |
| --------- | --------- | -------------------- |
| floors    | number    | 오늘 총 올라간 층수  |
| count     | number    | 오늘 계단 이용 횟수  |
| lastFloor | number    | 마지막 태그 층수     |
| updatedAt | Timestamp | 마지막 업데이트 시각 |

### /devices

단말기 설정 정보입니다. 전광판에서 사용하지 않아도 됩니다.
