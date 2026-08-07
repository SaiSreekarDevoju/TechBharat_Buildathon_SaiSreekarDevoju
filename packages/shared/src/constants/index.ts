import { SupportedLanguage, UserOptions } from '../types/index.js';

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  hi: 'Hindi (हिंदी)',
  te: 'Telugu (తెలుగు)',
  ta: 'Tamil (தமிழ்)',
  bn: 'Bengali (বাংলা)',
  mr: 'Marathi (मराठी)',
};

export const NOT_FOUND_TEXT = 'Not found in the context.';

export const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';
export const DEFAULT_GROQ_VISION_MODEL = 'qwen/qwen3.6-27b';
export const DEFAULT_BACKEND_URL = 'http://localhost:3001';

export const SECTION_KEYS = [
  'summary',
  'keyPoints',
  'actions',
  'numbersMetrics',
  'decisions',
  'risks',
] as const;

export const DEFAULT_USER_OPTIONS: UserOptions = {
  groqApiKey: '',
  proxyUrl: DEFAULT_BACKEND_URL,
  model: DEFAULT_GROQ_MODEL,
  visionModel: DEFAULT_GROQ_VISION_MODEL,
  language: 'en',
  privacyMode: true,
  localHistoryEnabled: true,
  theme: 'dark',
};
