---
feature: plain-language-copy
status: completed
created: 2026-08-10
requirements: approved
design: approved
approved: 2026-08-10
---

# 쉬운 제품 문구·다국어 개편 — 구현 태스크

## 1. 실행 원칙

- 공통 번역 리소스 `ko.ts`, `en.ts`를 대부분의 화면 태스크가 함께 수정하므로 태스크를 번호 순서대로 실행한다.
- 각 태스크는 최대 5개 파일 안에서 구현하고 바로 관련 테스트 또는 빌드를 실행한다.
- 기능 동작, 기존 REST 응답 필드, DB 스키마는 변경하지 않는다.
- 외부 응답·요청 헤더는 경계에서 검증하고 IP·국가·비밀값을 로그에 남기지 않는다.
- 사용자 소유의 관련 없는 미추적 파일은 수정하지 않는다.

## 2. 태스크 목록

### Phase A. 번역 기반

#### Task 1. i18next와 타입 안전 번역 리소스 도입

**설명:** 프론트엔드 의존성을 추가하고 한국어·영어 번역 리소스의 공통 구조와 초기화 모듈을 만든다.

**Acceptance:**
- [x] `ko`, `en`만 지원하고 기본 대체 언어는 `en`이다.
- [x] 영어 리소스에서 키가 빠지거나 구조가 달라지면 TypeScript 검사가 실패한다.
- [x] 기존 화면은 이 단계에서도 빌드된다.

**Verify:** `cd frontend && npm run typecheck && npm run build`

**Dependencies:** 없음

**Files:**
- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/src/i18n/index.ts`
- `frontend/src/i18n/resources/ko.ts`
- `frontend/src/i18n/resources/en.ts`

#### Task 2. 언어 초기화와 수동 선택 우선순위 연결

**설명:** 저장된 수동 언어를 먼저 읽고, 없으면 공개 API를 호출한 뒤 브라우저 언어·영어로 대체하는 앱 시작 흐름을 만든다.

**Acceptance:**
- [x] 유효한 `trendar.uiLocale`이 있으면 위치 API를 호출하지 않는다.
- [x] API 실패·잘못된 저장값에서도 앱이 렌더되고 `html[lang]`이 선택 언어와 일치한다.
- [x] 언어 판정 중 번역 전 본문이 깜빡이지 않는다.

**Verify:** `cd frontend && npm run typecheck && npm run build`

**Dependencies:** Task 1

**Files:**
- `frontend/src/i18n/LocaleBootstrap.tsx`
- `frontend/src/api/localization.ts`
- `frontend/src/i18n/index.ts`
- `frontend/src/main.tsx`
- `frontend/src/App.tsx`

### Phase B. 국가 기반 언어 판정

#### Task 3. 언어 정책을 순수 함수와 테스트로 고정

**설명:** 국가 코드와 `Accept-Language`를 받아 `ko` 또는 `en`을 결정하는 정책을 테스트 우선으로 구현한다.

**Acceptance:**
- [x] `KR`, 비한국 국가, 국가 없음, 다중 언어, 잘못된 `q` 값의 결과가 승인된 우선순위와 일치한다.
- [x] 헤더는 512자·10개 항목까지만 처리하고 항상 지원 언어 하나를 반환한다.

**Verify:** `cd backend && node --test test/locale.test.js`

**Dependencies:** 없음

**Files:**
- `backend/src/utils/locale.js`
- `backend/test/locale.test.js`

#### Task 4. MaxMind 국가 조회 어댑터 보호

**설명:** 공식 GeoLite 클라이언트를 추가하고 IP 검증, 800ms 시간 초과, HMAC 메모리 캐시와 동시 요청 병합을 구현한다.

**Acceptance:**
- [x] 사설·루프백·잘못된 IP는 외부로 전송하지 않는다.
- [x] 정상 응답에서는 ISO 국가 코드만 반환하고 모든 외부 오류는 `null`로 정규화한다.
- [x] 원본 IP·비밀값을 저장하거나 로그에 남기지 않고 캐시는 10분·5,000개로 제한된다.

**Verify:** `cd backend && node --test test/country-resolver.test.js`

**Dependencies:** Task 3

**Files:**
- `backend/package.json`
- `backend/package-lock.json`
- `backend/.env.example`
- `backend/src/services/country-resolver.js`
- `backend/test/country-resolver.test.js`

#### Task 5. 공개 localization API 완성

**설명:** Railway의 검증된 `X-Real-IP`와 브라우저 언어를 결합해 초기 locale만 반환하는 공개 API를 연결한다.

**Acceptance:**
- [x] `GET /api/localization`은 인증 없이 `{ ok: true, data: { locale } }`만 반환한다.
- [x] 외부 조회가 실패해도 `200`과 브라우저 언어 또는 영어를 반환한다.
- [x] 응답은 `private, no-store`이며 IP·국가·공급자·실패 이유를 포함하지 않는다.

**Verify:** `cd backend && node --test test/localization.test.js && npm test`

**Dependencies:** Task 3, Task 4

**Files:**
- `backend/src/routes/localization.routes.js`
- `backend/src/controllers/localization.controller.js`
- `backend/src/app.js`
- `backend/test/localization.test.js`

### Checkpoint A. 기반 통합

- [x] `cd backend && npm test`
- [x] `cd frontend && npm run typecheck && npm run build`
- [x] MaxMind 키가 없는 로컬 환경에서도 브라우저 언어로 앱이 열린다.

### Phase C. 공통 UI와 첫 화면

#### Task 6. 날짜·숫자 형식을 locale 대응으로 변경

**설명:** 기존 포맷 유틸이 선택 언어를 받아 `Intl` 기반 날짜·숫자·상대 시간을 반환하게 한다. 기존 호출부용 기본값은 마이그레이션 동안 한국어로 유지한다.

**Acceptance:**
- [x] 한국어와 영어에서 숫자·날짜·상대 시간이 각 locale 규칙에 맞는다.
- [x] null·잘못된 날짜 처리와 기존 축약 형식이 회귀하지 않는다.

**Verify:** `cd frontend && npm run typecheck && npm run build`

**Dependencies:** Task 1

**Files:**
- `frontend/src/lib/format.ts`

#### Task 7. 공통 상태·경고·확인 문구 이전

**설명:** 모든 화면이 공유하는 로딩, 오류, 재시도, 토큰 만료, 확인 대화상자 기본 문구를 번역 키로 이동한다.

**Acceptance:**
- [x] 언어 변경 시 열린 공통 상태와 대화상자 문구가 즉시 바뀐다.
- [x] 버튼의 접근 가능한 이름과 기존 키보드 동작을 유지한다.
- [x] 내부 오류 세부사항을 공통 오류 상태에서 표시하지 않는다.

**Verify:** `cd frontend && npm run typecheck && npm run build`

**Dependencies:** Task 1, Task 2

**Files:**
- `frontend/src/components/States.tsx`
- `frontend/src/components/TokenInvalidBanner.tsx`
- `frontend/src/components/ConfirmDialog.tsx`
- `frontend/src/i18n/resources/ko.ts`
- `frontend/src/i18n/resources/en.ts`

#### Task 8. 언어 선택기와 상단 메뉴 적용

**설명:** 국기 없이 언어 이름을 사용하는 선택기를 만들고 로그인 후 상단 메뉴와 사용자 메뉴를 쉬운 문구로 바꾼다.

**Acceptance:**
- [x] `한국어`, `English`를 키보드로 선택할 수 있고 현재 언어가 접근 가능하게 표시된다.
- [x] 선택 즉시 화면과 `html[lang]`이 바뀌고 새로고침 후 유지된다.
- [x] `Dashboard`, `Queries`, `Repos`, `mock`이 쉬운 현재 언어 문구로 교체된다.

**Verify:** `cd frontend && npm run typecheck && npm run build`

**Dependencies:** Task 2, Task 7

**Files:**
- `frontend/src/components/LanguageSwitcher.tsx`
- `frontend/src/components/LanguageSwitcher.module.css`
- `frontend/src/components/TopNav.tsx`
- `frontend/src/i18n/resources/ko.ts`
- `frontend/src/i18n/resources/en.ts`

#### Task 9. 로그인 소개 화면을 쉬운 두 언어로 개편

**설명:** 첫 방문 안내, 기능 설명, 사용 순서, 예시 표, OAuth 오류와 위치 안내를 쉬운 한국어·영어로 제공한다.

**Acceptance:**
- [x] 전문 용어를 승인된 쉬운 용어로 교체하고 모든 로그인 화면 문구가 두 언어에 존재한다.
- [x] 언어 선택기와 국가 단위 위치 일시 확인 안내가 로그인 전에도 보인다.
- [x] GitHub 로그인 동작과 OAuth 오류 분기는 유지된다.

**Verify:** `cd frontend && npm run typecheck && npm run build`; 브라우저 `/login` 한국어·영어 확인

**Dependencies:** Task 8

**Files:**
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/LoginPage.module.css`
- `frontend/src/i18n/resources/ko.ts`
- `frontend/src/i18n/resources/en.ts`

### Checkpoint B. 첫 방문 흐름

- [x] 저장 언어 없음·한국/비한국·위치 실패·수동 선택의 우선순위가 맞다.
- [x] 로그인 화면과 상단 메뉴가 320px·데스크톱에서 두 언어로 동작한다.
- [x] `cd frontend && npm run build`

### Phase D. 제품 화면 문구

#### Task 10. 대시보드 요약과 언어 분포 개편

**설명:** 통계 카드, 마지막 수집, 패널 제목, 언어 분포와 빈 상태를 쉬운 두 언어로 옮기고 locale 포맷을 적용한다.

**Acceptance:**
- [x] `Repos`, `Active Queries`, `Last ETL` 같은 표현이 승인된 쉬운 용어로 바뀐다.
- [x] 숫자와 마지막 수집 시간이 현재 언어 형식으로 표시된다.

**Verify:** `cd frontend && npm run typecheck && npm run build`; 대시보드 두 언어 확인

**Dependencies:** Task 6, Task 7

**Files:**
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/components/LangMiniCard.tsx`
- `frontend/src/components/LanguageBars.tsx`
- `frontend/src/i18n/resources/ko.ts`
- `frontend/src/i18n/resources/en.ts`

#### Task 11. 급상승·북마크 표 문구 개편

**설명:** 대시보드 표의 프로젝트, 언어, 스타, 최근 24시간 증가, 만들어진 지 표현과 빈·오류 상태를 두 언어로 맞춘다.

**Acceptance:**
- [x] `Repo`, `Lang`, `Δ24H`, `TOP MOVERS`, `RISING`, `BOOKMARKS`가 쉬운 현재 언어 문구로 바뀐다.
- [x] 툴팁과 접근 가능한 이름에도 기술 약어가 남지 않는다.

**Verify:** `cd frontend && npm run typecheck && npm run build`; 대시보드 표 두 언어 확인

**Dependencies:** Task 6, Task 10

**Files:**
- `frontend/src/components/TrendTable.tsx`
- `frontend/src/components/RisingTable.tsx`
- `frontend/src/components/BookmarkTable.tsx`
- `frontend/src/i18n/resources/ko.ts`
- `frontend/src/i18n/resources/en.ts`

#### Task 12. 수집 조건 화면 개편

**설명:** 조건 등록·수정·삭제, 검색 방식, 수집 실행, 일일 한도, 완료·실패 알림을 쉬운 두 언어로 바꾼다.

**Acceptance:**
- [x] 사용자 화면에서 `ETL`, `Query`, `Repos`, `Actions`, `KST`가 승인된 표현으로 바뀐다.
- [x] 키워드·주제 검색의 차이와 수집 결과 단위가 비전문가도 이해할 문장으로 표시된다.
- [x] CRUD·개별/전체 수집·한도 동작은 유지된다.

**Verify:** `cd frontend && npm run typecheck && npm run build`; 예시 데이터에서 조건 CRUD·수집 확인

**Dependencies:** Task 6, Task 7, Task 9

**Files:**
- `frontend/src/pages/QueriesPage.tsx`
- `frontend/src/components/QueryForm.tsx`
- `frontend/src/components/Help.tsx`
- `frontend/src/i18n/resources/ko.ts`
- `frontend/src/i18n/resources/en.ts`

#### Task 13. 프로젝트 목록 화면 개편

**설명:** 검색, 필터, 표 제목, 북마크, 삭제, 페이지 이동 문구를 프로젝트 중심의 쉬운 두 언어로 바꾼다.

**Acceptance:**
- [x] `repo/레포`, `Lang`, `Stars`, `Δ`, `Actions`가 승인된 쉬운 표현으로 바뀐다.
- [x] 검색·정렬·필터·북마크·삭제·페이지 이동 기능과 숫자 형식이 유지된다.

**Verify:** `cd frontend && npm run typecheck && npm run build`; 프로젝트 목록 두 언어·모바일 확인

**Dependencies:** Task 6, Task 7

**Files:**
- `frontend/src/pages/ReposPage.tsx`
- `frontend/src/components/RepoRow.tsx`
- `frontend/src/i18n/resources/ko.ts`
- `frontend/src/i18n/resources/en.ts`

#### Task 14. 프로젝트 상세·차트 화면 개편

**설명:** 상세 지표, 수집 조건, 열린 이슈, 수집 기록, 메모, 북마크, 삭제와 차트 툴팁을 두 언어로 바꾼다.

**Acceptance:**
- [x] `query`, `snapshot`, `issues`, `delta`가 승인된 쉬운 표현으로 바뀐다.
- [x] 날짜·숫자·차트 툴팁이 현재 언어 형식으로 표시된다.
- [x] 메모·북마크·삭제와 외부 GitHub 링크 동작은 유지된다.

**Verify:** `cd frontend && npm run typecheck && npm run build`; 상세 화면 두 언어 확인

**Dependencies:** Task 6, Task 7

**Files:**
- `frontend/src/pages/RepoDetailPage.tsx`
- `frontend/src/components/StarChart.tsx`
- `frontend/src/i18n/resources/ko.ts`
- `frontend/src/i18n/resources/en.ts`

### Phase E. 오류와 일관성

#### Task 15. API 오류를 코드 기반 번역으로 전환

**설명:** 서버 원문 대신 안정적인 오류 코드와 호출 문맥으로 사용자 메시지를 번역하고 예시 데이터도 같은 경로를 사용한다.

**Acceptance:**
- [x] `query_id`, `query_type`, HTTP 번호, 서버 내부 메시지가 토스트·오류 상태에 직접 노출되지 않는다.
- [x] 네트워크·인증·검증·중복·한도·찾을 수 없음 오류가 현재 언어로 표시된다.
- [x] 예시 데이터와 실제 API의 같은 오류 코드가 같은 문구를 만든다.

**Verify:** `cd frontend && npm run typecheck && npm run build`; 예시 오류 상태 두 언어 확인

**Dependencies:** Task 1, Task 7, Task 12, Task 13, Task 14

**Files:**
- `frontend/src/api/client.ts`
- `frontend/src/api/mock.ts`
- `frontend/src/lib/useAsync.ts`
- `frontend/src/i18n/resources/ko.ts`
- `frontend/src/i18n/resources/en.ts`

#### Task 16. 백엔드 사용자 메시지와 수집 결과 정리

**설명:** 기존 오류 코드와 API 형식은 유지하면서 사용자에게 도달할 수 있는 기본 메시지와 수집 결과에서 내부 필드·슬라이스 용어를 제거한다.

**Acceptance:**
- [x] 오류 응답과 수집 결과에 `query_id`, `query_type`, `base/trend`, 내부 ID, 원시 외부 오류가 노출되지 않는다.
- [x] `ETL`, `쿼리`, `저장소`, `KST` 사용자 표현이 `수집`, `수집 조건`, `프로젝트`, `한국 시간`으로 바뀐다.
- [x] 서버 로그는 진단 정보를 유지하되 응답·DB 상태 메시지와 분리된다.

**Verify:** `cd backend && npm test`

**Dependencies:** Task 5

**Files:**
- `backend/src/controllers/query.controller.js`
- `backend/src/controllers/repo.controller.js`
- `backend/src/controllers/etl.controller.js`
- `backend/src/middleware/errorHandler.js`
- `backend/src/etl/pipeline.js`

### Checkpoint C. 기능 완료

- [x] `cd backend && npm test`
- [x] `cd frontend && npm run typecheck && npm run build`
- [x] 한국어와 영어의 주요 사용자 흐름에서 하드코딩된 전문 용어와 번역 키 누락이 없다.

### Phase F. 화면·보안 검증

#### Task 17. 두 언어 반응형·접근성 보정

**설명:** 실제 브라우저에서 320px와 데스크톱을 확인하고 긴 영어·한국어 문구, 언어 메뉴, 표와 대화상자의 레이아웃을 보정한다.

**Acceptance:**
- [x] 로그인·상단 메뉴·수집 조건·프로젝트 목록·상세에서 가로 넘침과 잘린 주요 동작이 없다.
- [x] 언어 선택과 대화상자를 키보드로 사용할 수 있고 포커스가 보인다.
- [x] 보정이 5개 파일을 넘으면 화면별 후속 태스크로 나눠 진행한다.

**Verify:** 브라우저 한국어·영어 × 320px·데스크톱 스크린 확인

**Dependencies:** Task 8~Task 16

**Files:**
- `frontend/src/components/TopNav.module.css`
- `frontend/src/pages/LoginPage.module.css`
- `frontend/src/pages/QueriesPage.module.css`
- `frontend/src/pages/ReposPage.module.css`
- `frontend/src/pages/RepoDetailPage.module.css`

#### Task 18. 전체 회귀·보안·문구 잔존 검사

**설명:** 자동 테스트, 프로덕션 빌드, 의존성 감사, 비밀값·위치 정보·전문 용어 잔존 검사와 브라우저 최종 확인을 수행한다.

**Acceptance:**
- [x] 모든 자동 검증과 프로덕션 빌드가 통과한다.
- [x] 사용자 화면에서 금지 용어와 내부 구현 정보가 남아 있지 않다.
- [x] localization 응답·로그·빌드 산출물·diff에 IP, 국가 코드, MaxMind 키가 없다.
- [x] 요구사항 R1~R8을 증거와 함께 셀프 리뷰한다.

**Verify:**
- `cd backend && npm test && npm audit --omit=dev`
- `cd frontend && npm run typecheck && npm run build && npm audit`
- `rg` 문구·비밀값 검사와 한국어·영어 브라우저 회귀 확인

**Dependencies:** Task 1~Task 17

**Files:** 검증 중심. 수정이 필요하면 해당 태스크 파일 범위로 돌아가 최소 변경한다.

## 3. 위험과 완화

| 위험 | 영향 | 완화 |
|---|---|---|
| 첫 접속 GeoLite 지연 | 첫 본문 렌더가 늦어짐 | 인증과 병렬 호출, 800ms 제한, 브라우저 언어 대체 |
| MaxMind 키·서비스 장애 | 위치 기반 선택 불가 | 키가 없어도 기동, 모든 오류를 브라우저 언어로 대체 |
| 외부 공급자의 IP 처리 | 개인정보 안내 필요 | 국가 API만 서버에서 호출, 앱 저장·로그 금지, 안내 문구 제공 |
| 번역 키 누락·혼용 | 한 화면에 두 언어가 섞임 | 리소스 타입 동등성, 잔존 문자열 검색, 두 언어 브라우저 QA |
| 긴 영어 문구 | 모바일 레이아웃 깨짐 | 320px 검증과 Phase F CSS 보정 |
| 서버 원문 오류 의존 | 영어 화면에 한국어·내부 정보 노출 | `error.code` 번역, 알 수 없는 오류는 일반 메시지 |

## 4. 승인 후 진행

태스크 승인 시 Task 1부터 순차 구현한다. 각 Checkpoint에서 테스트·빌드 실패를 먼저 해소하고 다음 단계로 진행하며, 완료 후 셀프 리뷰와 한 번의 Conventional Commit으로 커밋·푸시한다.
