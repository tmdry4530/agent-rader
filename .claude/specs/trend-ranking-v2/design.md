---
feature: trend-ranking-v2
status: approved
created: 2026-07-30
related:
  - .claude/specs/trend-ranking-v2/requirements.md
  - .claude/specs/adr/0005-trend-slice-and-velocity.md
  - .claude/specs/adr/0006-coverage-depth-and-hot-score.md
---

# 트렌드 수집·랭킹 개편 v2 — 기술 설계

## 1. 아키텍처 개요

세 갈래 변경 — 수집(더 넓게), 랭킹(신생=속도·최근 증가 필터), 노출(관심 레포 섹션).

```
수집:  extract per_page 30 → 100  (요청 수 불변, 응답만 큼 — R1)
         ↓ (base·trend 슬라이스, dedup 그대로)
       repos / repo_snapshots  (스키마 변경 없음)

노출:  GET /api/rising   → risingRepos: created ≤30일 AND star_delta>0,
                            ORDER BY star_delta/GREATEST(age,1) DESC   (R2·R3)
       GET /api/trends   → trends: star_delta>0, ORDER BY growth_rate DESC (R3)
       GET /api/bookmarks→ bookmarkedRepos: is_bookmarked, user 스코프 (R4)
                            ↓
       대시보드: 신생 급상승 · 성장률 상위 · 관심 레포 · 언어 top3
```

핵심 통찰:
- **커버리지는 표본 깊이로 푼다** — GitHub Search에 "증가순"이 없으니, 스타순 상위를 30→100으로 넓혀 급상승 레포가 표본에 들어올 확률을 높인다. `per_page` 상한이 100이라 **요청 1회 그대로**(비용 거의 0) ([ADR-0006](../adr/0006-coverage-depth-and-hot-score.md)).
- **신생=속도, 노출 창과 수집 창을 분리** — 수집은 90일(넓게 추적), 신생 급상승 노출은 30일(진짜 최신). 30~90일 레포는 추적되어 Top Movers엔 나올 수 있다 (R2.4).
- **정체 숨김은 조회 WHERE 한 줄** — `star_delta > 0`. 저장·수집은 그대로, 노출에서만 거른다.

## 2. 기술 선택과 이유

| 기술/패턴 | 역할 | 왜 이것인가 (대안 대비) |
|---|---|---|
| `per_page` 30→100 | 수집 표본 확대 | Search `per_page` 상한 100 — 단일 요청으로 3배 넓힘. 페이지네이션(>100)은 API·복잡도 증가라 배제 (R1.2) |
| 속도 점수 `delta/age` | 신생 급상승 순위 | 절대 델타는 큰 레포 편향, 순수 창 축소만으론 "어린 폭발" 강조 부족. delta/age가 최신·급증 동시 반영 (R2.2) |
| 노출/수집 창 분리 (30 vs 90) | 신생 정의 좁히되 추적은 유지 | 수집까지 30으로 좁히면 30~90일 급상승 레포를 아예 못 추적. 분리가 "진짜 신생 표시 + 놓치지 않기" 둘 다 만족 (R2.4) |
| `star_delta > 0` 필터 | 정체 레포 숨김 | 최소 임계값(예: >=5)도 검토했으나 니치별 규모 편차가 커 절대 임계는 부적절. ">0(움직임 있음)"이 규모 무관하게 공정 (R3) |
| 신규 `GET /api/bookmarks` | 관심 레포 조회 | 기존 `/repos?bookmarked=true`(페이지네이션·필터 응답)와 목적·응답 형태가 달라 대시보드 전용 경량 엔드포인트가 명확 (R4) |

## 3. 컴포넌트와 인터페이스

### `backend/src/etl/extract.js` (수정)
- `const PER = Math.min(Number(process.env.ETL_PER_QUERY) || 100, 100);` — 기본 100, 상한 100 클램프 (R1.1~R1.3)

### `backend/src/utils/limits.js` (확장)
- `risingWindowDays()` → `RISING_WINDOW_DAYS` 양의 정수 아니면 30 (R5.2, R5.3)
- 참고: 수집 창 `trendWindowDays()`(90)는 유지 — R2.4

### `backend/src/models/repo.model.js` (수정)
- `risingRepos(userId, windowDays, limit)` — WHERE에 `AND star_delta > 0` 추가, 정렬은 기존 `star_delta/GREATEST(DATEDIFF(NOW(),github_created_at),1)` 유지(이미 v1에서 도입한 velocity 식을 그대로 순위로 사용). windowDays는 호출부에서 `risingWindowDays()`(30) 주입 (R2.1~R2.3)
- `trends(userId, limit)` — WHERE에 `star_delta > 0` 추가 (R3.1)
- `bookmarkedRepos(userId, limit = 8)` (신규):
  ```sql
  SELECT id, full_name, language, stars, star_delta
  FROM repos WHERE user_id = ? AND is_bookmarked = 1
  ORDER BY star_delta DESC, stars DESC LIMIT ?
  ```
  (R4)

### `backend/src/controllers/repo.controller.js` + `routes/stats.routes.js` (수정)
- `rising` 컨트롤러: `trendWindowDays()` → `risingWindowDays()`로 교체 (노출 창 30)
- `bookmarks` 컨트롤러 신규 + `r.get('/bookmarks', c.bookmarks)` — requireAuth 뒤 (R4.3)

### 프론트엔드
- `types.ts`: `BookmarkRepo { id, full_name, language, stars, star_delta }`
- `api/stats.ts`: `getBookmarks(limit?)`
- `api/mock.ts`: `/bookmarks` 핸들러(시드 북마크), `/rising`·`/trends` 목도 `star_delta>0` 필터·30일 창 반영
- `DashboardPage.tsx`: 관심 레포 패널 추가. **레이아웃 확정(A)** — 현행 2열(신생 급상승 ‖ 성장률 상위)은 그대로 두고, 그 아래에 관심 레포를 전체폭 행으로 추가(테이블 재정렬 이슈 재발 방지). BookmarkTable은 신생/성장률과 같은 `table--dense` 톤
- 빈 상태: 세 목록 모두 기존 `EmptyState`/인라인 톤 재사용 (R3.3, R4.4)

## 4. 데이터 모델

**스키마 변경 없음.** 필요한 컬럼(`star_delta`, `github_created_at`, `is_bookmarked`)이 모두 존재. 이번 개편은 조회 쿼리·수집 깊이·노출 레이어에 한정된다.

## 5. 에러 처리

| 시나리오 | 처리 | 근거 |
|---|---|---|
| 필터 후 대상 0건 | 각 API가 빈 배열 → 프론트 빈 상태 | R3.3, R4.4 |
| `ETL_PER_QUERY` 과대 설정 | 100으로 클램프 | R1.3 |
| 비정상 `RISING_WINDOW_DAYS` | 기본 30 폴백 | R5.3 |
| 첫 수집 delta=0 | 정체 필터로 잠깐 제외 → 2회차부터 노출 (의도된 동작) | R3 |

## 6. 테스트 전략

기존 node:test + DI. 대부분 조회 SQL 변경이라 컨트롤러/모델 단위 + 목 검증 중심.

- `limits.test`(kst.test.js) 확장: `risingWindowDays` 기본·env·비정상값 (R5.2)
- `extract.test` 확장: `PER` 기본 100, 100 초과 시 클램프, per_page 반영 (R1)
- 모델은 실DB 필요 → `risingRepos`/`trends`의 `star_delta>0` WHERE와 `bookmarkedRepos` SQL을 design 문장으로 고정, 배포 후 시연 체크리스트로 확인
- 프론트: `tsc`+`vite build`, 목 모드 헤드리스로 관심 레포 렌더·정체 필터(전부 delta 0이면 빈 상태)·신생 30일 창 확인
- (선택) rising/trends 컨트롤러가 있으면 필터 파라미터 전달 단위 테스트

## 7. 결정 기록

- [ADR-0006: 커버리지는 표본 깊이로, 신생 랭킹은 속도 점수로](../adr/0006-coverage-depth-and-hot-score.md)
