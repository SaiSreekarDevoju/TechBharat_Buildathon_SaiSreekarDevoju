import { UserOptions, HistoryItem, DEFAULT_USER_OPTIONS } from '@lumen/shared';

const STORAGE_KEYS = {
  LEGACY_OPTIONS: 'lumen_user_options',
  CREDENTIALS: 'lumen_global_credentials',
  HISTORY: 'lumen_local_history',
};

export interface GlobalCredentials {
  groqApiKey: string;
  proxyUrl: string;
}

export async function getGlobalCredentials(): Promise<GlobalCredentials> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return resolve({ groqApiKey: '', proxyUrl: DEFAULT_USER_OPTIONS.proxyUrl });
    }

    chrome.storage.local.get([STORAGE_KEYS.CREDENTIALS, STORAGE_KEYS.LEGACY_OPTIONS], (result) => {
      const legacy = result[STORAGE_KEYS.LEGACY_OPTIONS] || {};
      const credentials = result[STORAGE_KEYS.CREDENTIALS] || {};
      resolve({
        groqApiKey: credentials.groqApiKey ?? legacy.groqApiKey ?? '',
        proxyUrl: credentials.proxyUrl ?? legacy.proxyUrl ?? DEFAULT_USER_OPTIONS.proxyUrl,
      });
    });
  });
}

export async function saveGlobalCredentials(credentials: Partial<GlobalCredentials>): Promise<void> {
  const current = await getGlobalCredentials();
  const updated = { ...current, ...credentials };
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) return resolve();
    chrome.storage.local.set({ [STORAGE_KEYS.CREDENTIALS]: updated }, resolve);
  });
}

/**
 * Legacy compatibility helper. Runtime behavior settings are now tab-scoped.
 * This returns defaults plus reusable credentials only.
 */
export async function getUserOptions(): Promise<UserOptions> {
  const credentials = await getGlobalCredentials();
  return { ...DEFAULT_USER_OPTIONS, ...credentials, language: 'en', privacyMode: true };
}

/**
 * Legacy compatibility helper. Only reusable credentials are persisted globally.
 */
export async function saveUserOptions(options: Partial<UserOptions>): Promise<void> {
  const patch: Partial<GlobalCredentials> = {};
  if (typeof options.groqApiKey === 'string') patch.groqApiKey = options.groqApiKey;
  if (typeof options.proxyUrl === 'string') patch.proxyUrl = options.proxyUrl;
  if (Object.keys(patch).length > 0) await saveGlobalCredentials(patch);
}

export async function getLocalHistory(): Promise<HistoryItem[]> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) return resolve([]);
    chrome.storage.local.get(STORAGE_KEYS.HISTORY, (result) => {
      resolve(result[STORAGE_KEYS.HISTORY] || []);
    });
  });
}

export async function saveHistoryItem(item: HistoryItem): Promise<void> {
  const history = await getLocalHistory();
  const updated = [item, ...history.filter((h) => h.id !== item.id)].slice(0, 100);
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) return resolve();
    chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: updated }, resolve);
  });
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const history = await getLocalHistory();
  const updated = history.filter((h) => h.id !== id);
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) return resolve();
    chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: updated }, resolve);
  });
}

export async function clearAllHistory(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) return resolve();
    chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: [] }, resolve);
  });
}
