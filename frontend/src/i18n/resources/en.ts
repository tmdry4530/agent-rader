import type { TranslationShape } from './ko';
import { ko } from './ko';

export const en = {
  common: {
    appName: 'Trendar',
    loading: 'Loading…',
    loadingData: 'Loading data…',
    retry: 'Try again',
    confirm: 'Confirm',
    cancel: 'Cancel',
    delete: 'Delete',
    processing: 'Working…',
    close: 'Close',
    help: 'Help',
    unknown: 'Unknown',
  },
  language: {
    label: 'Display language',
    korean: '한국어',
    english: 'English',
    detecting: 'Choosing the best language…',
  },
  auth: {
    checking: 'Checking your sign-in status…',
  },
} as const satisfies TranslationShape<typeof ko>;
