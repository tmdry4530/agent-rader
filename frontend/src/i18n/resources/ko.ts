export const ko = {
  common: {
    appName: 'Trendar',
    loading: '불러오는 중…',
    loadingData: '데이터를 불러오는 중…',
    retry: '다시 시도',
    confirm: '확인',
    cancel: '취소',
    delete: '삭제',
    processing: '처리 중…',
    close: '닫기',
    help: '도움말',
    unknown: '알 수 없음',
    requestFailed: '요청을 처리하지 못했습니다',
  },
  language: {
    label: '화면 언어',
    korean: '한국어',
    english: 'English',
    detecting: '알맞은 언어를 확인하는 중…',
  },
  nav: {
    tagline: '// GitHub 트렌드 찾기',
    dashboard: '대시보드',
    filters: '수집 조건',
    projects: '프로젝트',
    sampleData: '예시 데이터',
    sampleDataMode: '예시 데이터 모드',
    accountMenu: '{{user}} 계정 메뉴',
    logout: '로그아웃',
    deleteAccount: '계정 삭제',
    deleteAccountMessage: '계정과 모든 데이터(수집 조건·프로젝트·관심 표시·메모)가 영구 삭제됩니다. 되돌릴 수 없습니다.',
    deletePermanently: '영구 삭제',
  },
  auth: {
    checking: '로그인 상태를 확인하는 중…',
    githubExpired: 'GitHub 연결이 만료되었습니다. 수집을 계속하려면 다시 로그인해 주세요.',
    signInAgain: '다시 로그인',
  },
} as const;

export type TranslationShape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : TranslationShape<T[K]>;
};
