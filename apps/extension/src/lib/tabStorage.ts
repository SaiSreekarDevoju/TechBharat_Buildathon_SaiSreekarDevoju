import { TabSessionState, SupportedLanguage, UserOptions, DEFAULT_USER_OPTIONS } from '@lumen/shared';
import { getGlobalCredentials } from './storage.js';

const TAB_SESSION_PREFIX = 'lumen_session_tab_';
const TAB_OPTIONS_PREFIX = 'lumen_options_tab_';

export function getDefaultTabSession(tabId: number, defaultLang: SupportedLanguage = 'en'): TabSessionState {
  return {
    tabId,
    step: 'chooser',
    summary: null,
    errorMessage: null,
    capturedBlocks: [],
    rawCapturedText: '',
    selectedText: '',
    contextText: '',
    croppedImageDataUrl: undefined,
    metrics: null,
    captureMode: 'page',
    tabLanguage: defaultLang || 'en',
    messages: [],
  };
}

function getSessionArea(): chrome.storage.StorageArea | null {
  if (typeof chrome === 'undefined' || !chrome.storage) return null;
  return chrome.storage.session || chrome.storage.local;
}

export async function getTabSession(tabId: number): Promise<TabSessionState> {
  const key = `${TAB_SESSION_PREFIX}${tabId}`;
  const area = getSessionArea();
  if (!area) return getDefaultTabSession(tabId);
  return new Promise((resolve) => {
    area.get([key], (res) => resolve(res?.[key] || getDefaultTabSession(tabId)));
  });
}

export async function saveTabSession(session: TabSessionState): Promise<void> {
  const key = `${TAB_SESSION_PREFIX}${session.tabId}`;
  const area = getSessionArea();
  if (!area) return;
  await new Promise<void>((resolve) => area.set({ [key]: session }, () => resolve()));
}

export async function getTabOptions(tabId: number): Promise<UserOptions> {
  const key = `${TAB_OPTIONS_PREFIX}${tabId}`;
  const credentials = await getGlobalCredentials();
  const defaults: UserOptions = {
    ...DEFAULT_USER_OPTIONS,
    ...credentials,
    // Every never-configured tab ALWAYS starts in English.
    language: 'en',
    privacyMode: true,
  };

  const area = getSessionArea();
  if (!area) return defaults;

  return new Promise((resolve) => {
    area.get([key], (res) => {
      const tabOptions = res?.[key] || {};
      resolve({
        ...defaults,
        ...tabOptions,
        // credentials are shared infrastructure, not behavior state
        ...credentials,
      });
    });
  });
}

export async function saveTabOptions(tabId: number, options: Partial<UserOptions>): Promise<UserOptions> {
  const current = await getTabOptions(tabId);
  const next: UserOptions = { ...current, ...options, privacyMode: true };
  const key = `${TAB_OPTIONS_PREFIX}${tabId}`;
  const area = getSessionArea();
  if (area) {
    const tabOnly = {
      model: next.model,
      visionModel: next.visionModel,
      language: next.language,
      privacyMode: true,
      localHistoryEnabled: next.localHistoryEnabled,
      theme: 'dark' as const,
    };
    await new Promise<void>((resolve) => area.set({ [key]: tabOnly }, () => resolve()));
  }
  return next;
}

export async function removeTabSession(tabId: number): Promise<void> {
  const area = getSessionArea();
  if (!area) return;
  await new Promise<void>((resolve) => area.remove([
    `${TAB_SESSION_PREFIX}${tabId}`,
    `${TAB_OPTIONS_PREFIX}${tabId}`,
  ], () => resolve()));
}
