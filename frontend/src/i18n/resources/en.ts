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
    requestFailed: 'We could not complete that request',
  },
  language: {
    label: 'Display language',
    korean: '한국어',
    english: 'English',
    detecting: 'Choosing the best language…',
  },
  nav: {
    tagline: '// GitHub trend finder',
    dashboard: 'Dashboard',
    filters: 'Collection filters',
    projects: 'Projects',
    sampleData: 'Sample data',
    sampleDataMode: 'Sample data mode',
    accountMenu: '{{user}} account menu',
    logout: 'Sign out',
    deleteAccount: 'Delete account',
    deleteAccountMessage: 'Your account and all collection filters, projects, saved items, and notes will be permanently deleted. This cannot be undone.',
    deletePermanently: 'Delete permanently',
  },
  auth: {
    checking: 'Checking your sign-in status…',
    githubExpired: 'Your GitHub connection has expired. Sign in again to keep collecting projects.',
    signInAgain: 'Sign in again',
  },
} as const satisfies TranslationShape<typeof ko>;
