---
feature: plain-language-copy
status: approved
created: 2026-08-10
requirements: approved
approved: 2026-08-10
---

# 쉬운 제품 문구·다국어 개편 — 기술 설계

## 1. 아키텍처 개요

문구 교체와 다국어 기반을 한 번에 적용한다. 한국어와 영어 문구는 프론트엔드 번역 리소스에서 관리하고, 첫 접속 시 사용할 언어만 공개 백엔드 API가 결정한다.

```text
앱 시작
  ├─ localStorage에 사용자가 고른 언어가 있음 ───────────────→ 즉시 사용
  └─ 직접 고른 언어가 없음
       └─ GET /api/localization
            ├─ Railway X-Real-IP → MaxMind GeoLite 국가 조회
            │    └─ 국가 후보 + Accept-Language → ko 또는 en
            └─ 조회 불가/시간 초과 → Accept-Language → en 기본값
                  ↓
            i18next 초기화 → document.lang 설정 → 화면 렌더
```

- 인증 확인과 언어 판정은 동시에 시작한다. 언어가 정해지기 전에는 번역되지 않은 본문 대신 브랜드 로딩 표시만 보여 문구가 바뀌는 깜빡임을 막는다.
- 수동 선택은 `localStorage`에 저장하며 국가 판정보다 항상 우선한다.
- 위치 판정은 국가 단위 한 번으로 끝내고, IP·국가·판정 결과를 DB나 로그에 남기지 않는다.
- MaxMind가 실패하거나 설정되지 않아도 서비스는 브라우저 언어 또는 영어로 정상 동작한다.

## 2. 기술 선택

| 선택 | 역할 | 선택 이유 |
|---|---|---|
| `i18next` + `react-i18next` | React 화면의 번역 키, 보간, 복수형, 언어 변경 | 화면 전반과 동적 알림까지 바뀌므로 직접 만든 문자열 치환기보다 누락·확장 위험이 낮다 |
| 앱 번들에 포함한 `ko`·`en` 리소스 | 번역 파일 로딩 | 언어가 2개이고 문구 양이 작아 별도 CDN·동적 요청 없이 첫 화면을 안정적으로 렌더한다 |
| MaxMind GeoLite Country 웹 서비스 | IP의 ISO 국가 코드 조회 | Railway 접속 거점은 실제 사용자 위치가 아니며, 로컬 DB는 다운로드·주 2회 갱신 운영이 추가된다 |
| `@maxmind/geoip2-node` | 서버 전용 GeoLite 클라이언트 | 인증·시간 초과·응답 모델을 공식 클라이언트 경계에 모은다 |
| `Accept-Language` 직접 파서 | 위치 실패 시 선호 언어 판정 | 지원 언어가 2개라 별도 감지 패키지 없이 길이·항목 수를 제한한 작은 순수 함수로 충분하다 |

추가 런타임 의존성은 프론트엔드 2개(`i18next`, `react-i18next`), 백엔드 1개(`@maxmind/geoip2-node`)다.

## 3. 공개 API 계약

### `GET /api/localization`

인증 없이 호출하는 단일 조회 API다. 입력 쿼리나 요청 본문은 받지 않는다.

```ts
type SupportedLocale = 'ko' | 'en';

interface LocalizationResponse {
  ok: true;
  data: {
    locale: SupportedLocale;
  };
}
```

- 성공: 항상 `200`. 위치 조회 실패도 API 오류가 아니라 정상적인 대체 경로로 처리한다.
- 헤더: `Cache-Control: private, no-store`를 설정해 IP별 판정이 공유 캐시에 남지 않게 한다.
- 응답에서 제외: IP 주소, 국가 코드, GeoIP 공급자, 판정 실패 이유.
- 호환성: 기존 API 응답 형식 `{ ok, data }`를 유지하고 기존 엔드포인트를 변경하지 않는다.

### 서버 내부 인터페이스

```ts
type CountryCode = string;
type SupportedLocale = 'ko' | 'en';

interface CountryResolver {
  resolve(ipAddress: string): Promise<CountryCode | null>;
}

interface LocaleInput {
  countryCode: CountryCode | null;
  acceptedLanguages: string[];
}

function resolveLocale(input: LocaleInput): SupportedLocale;
```

외부 응답 처리와 언어 정책을 분리한다. 테스트는 `CountryResolver`를 가짜 구현으로 주입하며 실제 MaxMind 호출을 하지 않는다.

## 4. 언어 선택 정책

프론트엔드와 서버가 공유하는 지원 언어 집합은 `ko`, `en` 두 개다.

1. 프론트엔드가 `localStorage['trendar.uiLocale']`에서 유효한 수동 선택을 찾으면 API를 호출하지 않는다.
2. 수동 선택이 없으면 서버가 국가 코드를 조회한다.
3. 국가별 후보 언어와 `Accept-Language`의 지원 언어가 겹치면 브라우저 우선순위가 높은 언어를 고른다.
4. 교집합이 없으면 국가 기본 언어를 쓴다. 초기 매핑은 `KR → ko`, 그 외 국가 → `en`이다.
5. 국가를 알 수 없으면 `Accept-Language`에서 첫 지원 언어를 고른다.
6. 어디에도 맞지 않으면 `en`을 쓴다.

`Accept-Language` 파서는 최대 512자·상위 10개 항목만 처리하고 `q` 가중치를 검증한다. 잘못된 언어 태그와 가중치는 무시한다.

## 5. 백엔드 구성

### 새 파일

- `backend/src/routes/localization.routes.js`: 공개 `GET /api/localization` 라우트.
- `backend/src/controllers/localization.controller.js`: IP 추출, 국가 조회, 언어 정책 적용, 항상 성공하는 대체 처리.
- `backend/src/services/country-resolver.js`: MaxMind GeoLite Country 어댑터. 응답에서 ISO 국가 코드만 꺼내 검증한다.
- `backend/src/utils/locale.js`: `Accept-Language` 파싱과 국가-언어 매핑 순수 함수.
- `backend/test/localization.test.js`: 정책·라우트·장애 대체 검증.

### 기존 파일

- `backend/src/app.js`: 인증 미들웨어보다 앞에 공개 localization 라우트를 연결한다.
- `backend/.env.example`: `MAXMIND_ACCOUNT_ID`, `MAXMIND_LICENSE_KEY` 설명을 추가한다.
- `backend/package.json`·lockfile: 공식 MaxMind 클라이언트를 추가한다.

### 요청 IP 경계

- 프로덕션에서는 Railway가 제공하는 단일 `X-Real-IP`만 읽고 Node `net.isIP()`로 IPv4/IPv6를 검증한다.
- `X-Forwarded-For`의 임의 목록이나 클라이언트가 보낸 쿼리 값은 사용하지 않는다.
- 개발·테스트의 루프백·사설 IP는 외부로 보내지 않고 국가 없음으로 처리한다.
- IP·국가 코드는 애플리케이션 로그에 출력하지 않는다.

### 외부 서비스 경계

- `MAXMIND_ACCOUNT_ID`와 `MAXMIND_LICENSE_KEY`는 서버 환경변수에서만 읽고 프론트 번들·응답·로그에 포함하지 않는다.
- GeoLite Country 호스트만 허용하고 환경변수로 임의 URL을 받지 않아 SSRF 표면을 만들지 않는다.
- 조회 제한 시간은 800ms다. 시간 초과, 인증 실패, 404, 429, 5xx, 비정상 응답은 모두 `null`로 정규화한다.
- 응답 국가 코드는 대문자 ISO 2자리(`/^[A-Z]{2}$/`)만 허용한다.
- 같은 프로세스 안에서는 무작위 프로세스 키로 HMAC 처리한 IP를 키로 사용해 국가 코드 결과를 최대 10분 캐시한다. 원본 IP는 저장하지 않으며 캐시는 최대 5,000개·프로세스 재시작 시 소멸한다.
- 같은 IP의 동시 요청은 한 외부 요청으로 합쳐 과도한 조회를 막는다.

## 6. 프론트엔드 구성

### 번역 기반

- `frontend/src/i18n/index.ts`: i18next 초기화, `fallbackLng: 'en'`, 지원 언어 검증.
- `frontend/src/i18n/resources/ko.ts`: 승인된 쉬운 한국어 문구.
- `frontend/src/i18n/resources/en.ts`: 같은 의미의 쉬운 영어 문구.
- `frontend/src/i18n/types.ts`: `SupportedLocale`와 리소스 키 타입.
- `frontend/src/i18n/LocaleBootstrap.tsx`: 수동 선택 확인, 서버 자동 판정, 초기 렌더 대기.

한국어 리소스를 기준 타입으로 삼고 영어 리소스가 같은 키 구조를 만족하도록 TypeScript `satisfies` 검사를 둔다. 리소스는 TypeScript 번들에 포함해 네트워크 번역 파일 실패를 없앤다.

```ts
const selected = readStoredLocale();
const locale = selected ?? await detectLocale();

await i18n.changeLanguage(locale);
document.documentElement.lang = locale;
```

### 언어 선택 UI

- `frontend/src/components/LanguageSwitcher.tsx`: 국기 대신 언어 이름(`한국어`, `English`)을 사용한다.
- 로그인 화면과 로그인 후 `TopNav` 모두에 배치한다.
- 키보드 조작, 포커스 표시, 현재 선택의 접근 가능한 이름을 제공한다.
- 변경 즉시 `i18n.changeLanguage()`와 `document.documentElement.lang`을 적용하고 `trendar.uiLocale`에 저장한다.
- 자동 선택으로 돌아가는 별도 옵션은 첫 배포에서 제외한다. 저장소 값을 지우는 기능이 필요해지면 후속으로 추가한다.

### 날짜·숫자·오류

- `frontend/src/lib/format.ts`의 날짜·숫자 포맷 함수가 현재 locale을 명시적으로 받게 한다.
- API의 `error.code`를 번역 키에 매핑하고 서버의 `message`는 사용자에게 그대로 표시하지 않는다.
- `NOT_FOUND`처럼 문맥에 따라 뜻이 달라지는 코드는 호출부가 `errors.projectNotFound` 같은 대체 키를 제공한다.
- 알 수 없는 코드·네트워크 오류는 선택 언어의 일반 오류 문구로 표시한다. 내부 ID, HTTP 번호, 환경변수, 스택은 숨긴다.
- 예시 데이터 API도 실제 API와 같은 오류 코드를 사용해 동일한 번역 경로를 거친다.

## 7. 문구 마이그레이션 범위

다음 사용자 노출 영역의 하드코딩 문구를 번역 키로 이동한다.

- 앱 시작·인증 확인·토큰 만료 안내
- 로그인 소개·기능 설명·예시 표·OAuth 오류
- 상단 메뉴·사용자 메뉴·언어 선택·예시 데이터 표시
- 대시보드 카드·급상승 표·북마크·언어 분포·빈 상태
- 수집 조건 등록·수정·삭제·수집 실행·한도 안내
- 프로젝트 검색·표·상세·차트·메모·삭제 확인
- 토스트·확인 대화상자·로딩·오류·빈 상태

GitHub 프로젝트의 이름·설명, 사용자 메모, 프로그래밍 언어 이름은 원문을 유지한다.

## 8. 실패 처리와 보안

| 상황 | 사용자 동작 | 내부 처리 |
|---|---|---|
| MaxMind 키 없음 | 브라우저 언어로 정상 진입 | 외부 호출 없이 `null`, 비밀값은 로그하지 않음 |
| GeoLite 시간 초과·장애 | 최대 800ms 뒤 정상 진입 | 브라우저 언어 또는 영어 사용 |
| 잘못된 IP·사설 IP | 정상 진입 | 외부 전송 없이 위치 없음 처리 |
| 잘못된 `Accept-Language` | 영어로 정상 진입 | 제한 길이·항목만 파싱, 나머지 무시 |
| 손상된 localStorage 값 | 자동 판정 사용 | `ko`·`en` 외 값 삭제 |
| 번역 키 누락 | 빌드 실패 | 한국어·영어 리소스 타입 동등성 검사 |
| 외부 조회 반복 | 서비스 유지 | 짧은 인메모리 HMAC 캐시와 동시 요청 병합 |

개인정보 안내에는 “언어 자동 선택을 위해 국가 단위 위치만 일시 확인하며 저장하지 않는다”는 문장을 로그인 화면 또는 언어 선택 도움말에 표시한다. 외부 공급자가 IP를 처리한다는 점은 배포 전 개인정보 안내에 반영한다.

## 9. 검증 전략

### 백엔드 자동 테스트

- `cd backend && npm test`
- `KR + ko/en 브라우저`, `비한국 국가`, `국가 없음`, `잘못된 헤더`, `GeoLite 실패·시간 초과`별 locale 결과.
- 공개 라우트가 인증 없이 동작하고 `{ ok, data: { locale } }` 외 위치 정보를 반환하지 않는지 확인.
- 사설·잘못된 IP는 resolver를 호출하지 않는지 확인.
- 같은 IP 동시 요청 병합과 캐시 상한·만료 확인.
- 기존 API 테스트 회귀 확인.

### 프론트엔드 자동 검증

- `cd frontend && npm run typecheck`
- `cd frontend && npm run build`
- 번역 리소스 키 동등성은 TypeScript 빌드에서 검증한다.

### 브라우저 검증

- 한국어·영어 각각 로그인 화면, 대시보드, 수집 조건, 프로젝트 목록·상세를 확인한다.
- 직접 선택한 언어가 새로고침 후 유지되고 자동 판정보다 우선하는지 확인한다.
- 모바일 320px와 데스크톱에서 메뉴·표·대화상자가 깨지지 않는지 확인한다.
- 네트워크에서 localization 요청을 실패시켜도 브라우저 언어로 진입하는지 확인한다.
- `html[lang]`, 키보드 언어 변경, 포커스, 스크린리더용 이름을 확인한다.

### 출시 전 보안 검증

- `cd backend && npm audit --omit=dev`
- `cd frontend && npm audit`
- 빌드 산출물과 git diff에 MaxMind 키가 없는지 확인한다.
- localization 응답과 서버 로그에 IP·국가가 남지 않는지 확인한다.

## 10. 구현 순서

1. 번역 리소스·i18next 초기화와 언어 선택 UI.
2. 기존 사용자 노출 문구를 쉬운 한국어·영어 번역 키로 이동.
3. 순수 언어 정책과 공개 localization API.
4. MaxMind 어댑터·시간 초과·인메모리 보호 장치.
5. API 오류 코드 기반 번역과 예시 데이터 정합성.
6. 자동 테스트, 빌드, 두 언어·두 화면 폭 브라우저 검증.

## 11. 확정된 결정

- 프론트엔드에 `i18next`, `react-i18next`를 추가한다.
- 백엔드에 `@maxmind/geoip2-node`를 추가하고 MaxMind GeoLite 계정의 `MAXMIND_ACCOUNT_ID`, `MAXMIND_LICENSE_KEY`를 Railway에 설정한다.
- 정확한 위치 권한이나 Railway 접속 거점 대신 서버 측 IP 국가 조회를 사용한다.
- 첫 배포는 한국어·영어만 지원하고, `KR → ko`, 그 외 → `en`을 국가 기본값으로 한다.
- 위치 조회 결과는 원본 IP 없이 프로세스 메모리에 최대 10분만 캐시하며 DB·로그에는 저장하지 않는다.

## 12. 결정 기록

- [ADR-0007: 클라이언트 번역 리소스 + 서버 국가 힌트](../adr/0007-client-i18n-server-country-hint.md)
