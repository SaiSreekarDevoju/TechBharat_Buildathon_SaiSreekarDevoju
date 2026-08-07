export async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.tabs) return resolve(null);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0] || null);
    });
  });
}

export async function getTabById(tabId: number): Promise<chrome.tabs.Tab | null> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.tabs || !tabId) return resolve(null);
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) return resolve(null);
      resolve(tab || null);
    });
  });
}

export async function sendMessageToTab<T = any>(tabId: number, message: any): Promise<T> {
  if (!tabId) throw new Error('No browser tab was provided for this capture.');
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      resolve(response);
    });
  });
}

export async function sendMessageToActiveTab<T = any>(message: any): Promise<T> {
  const tab = await getActiveTab();
  if (!tab || !tab.id) throw new Error('No active browser tab found.');
  return sendMessageToTab<T>(tab.id, message);
}
