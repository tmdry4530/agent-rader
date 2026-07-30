---
feature: trend-ranking-v2
status: draft
created: 2026-07-30
related:
  - .claude/specs/trend-ranking-v2/requirements.md
  - .claude/specs/trend-ranking-v2/design.md
---

# 트렌드 수집·랭킹 개편 v2 — 태스크

> 체크박스가 실행 상태의 단일 진실 공급원. 완료 = 완료 조건 + 연결된 인수 조건 충족 + 관련 테스트 통과.
> `의존:` 필드는 claude-flow 병렬 스케줄링 입력.

- [x] **T1. 수집 깊이 100 + 설정(risingWindowDays) + 테스트**
  - 의존: 없음
  - 내용: `extract.js` `PER = Math.min(env ETL_PER_QUERY || 100, 100)`. `utils/limits.js`에 `risingWindowDays()`(env `RISING_WINDOW_DAYS`, 기본 30, 양의 정수). `test/extract.test.js`에 per_page=100·클램프 케이스, `test/kst.test.js`에 risingWindowDays 케이스 추가
  - 요구사항: R1.1~R1.3, R5.2, R5.3
  - 완료 조건: `cd backend && npm test` 전부 통과(기존 + 신규), extract가 per_page 100 전달·100 초과 클램프 검증

- [ ] **T2. 조회 쿼리 개편 — rising 30일·정체필터, trends 정체필터, bookmarks 신규**
  - 의존: T1
  - 내용: `repo.model.js` — `risingRepos`에 `AND star_delta > 0` 추가(정렬 유지), `trends`에 `AND star_delta > 0` 추가, `bookmarkedRepos(userId, limit)` 신규(design §3 SQL). `repo.controller.js` `rising`이 `risingWindowDays()` 사용하도록 교체 + `bookmarks` 컨트롤러 신규. `routes/stats.routes.js`에 `GET /bookmarks` 등록
  - 요구사항: R2.1~R2.3, R3.1, R3.2, R4.1~R4.3
  - 완료 조건: `node -c` 통과, SQL이 design 문장과 일치(WHERE·ORDER·user 스코프), `npm test` 무회귀

- [ ] **T3. 프론트 — 관심 레포 섹션 + 목/타입 반영**
  - 의존: T2
  - 내용: `types.ts` `BookmarkRepo`, `api/stats.ts` `getBookmarks`, `api/mock.ts` `/bookmarks` 핸들러(시드 북마크) + `/rising`·`/trends` 목에 `star_delta>0` 필터·30일 창 반영. `components/BookmarkTable.tsx`(+css, table--dense 톤). `DashboardPage.tsx` 2열 아래 전체폭 관심 레포 패널 추가, 빈 상태 안내
  - 요구사항: R3.3, R4.1, R4.2, R4.4
  - 완료 조건: `cd frontend && npm run build`(tsc+vite) 통과, 목 모드 헤드리스 스크린샷으로 관심 레포 렌더·빈 상태·정체 필터 확인

- [ ] **T4. 배포 + 실서비스 검증**
  - 의존: T3
  - 내용: 커밋·푸시 → Railway 자동 배포 → 부팅 정상 → `/api/bookmarks` 응답, `/api/rising`·`/api/trends`가 정체 레포 제외 확인. `.env.example`에 `RISING_WINDOW_DAYS` 추가, `ETL_PER_QUERY` 기본값 주석 갱신
  - 요구사항: R1, 성공 기준 전체
  - 완료 조건: 배포 SUCCESS, 라이브 200, 세 엔드포인트 정상

- [ ] **T5. (수동 E2E — 사용자 확인) 커버리지·리얼핫·관심레포**
  - 의존: T4
  - 내용: 다음 수집 후 라이브에서 — 신생 급상승이 30일 내 + 움직이는 레포만 속도순, 정체 레포 사라짐, 폭발 레포가 Top Movers에 등장(깊이 100 효과), 관심 레포 섹션 표시 확인
  - 요구사항: 성공 기준
  - 완료 조건: 사용자 확인 코멘트
