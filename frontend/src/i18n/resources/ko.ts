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
  },
  language: {
    label: '화면 언어',
    korean: '한국어',
    english: 'English',
    detecting: '알맞은 언어를 확인하는 중…',
  },
} as const;

export type TranslationShape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : TranslationShape<T[K]>;
};
