// Service Worker for Lumen Chrome MV3 Extension

const PANEL_PATH = 'src/sidepanel/index.html';
const PANEL_OPEN_PREFIX = 'lumen_panel_open_tab_';

async function setPanelMarkedOpen(tabId: number, isOpen: boolean): Promise<void> {
  try {
    if (chrome.storage?.session) {
      await chrome.storage.session.set({ [`${PANEL_OPEN_PREFIX}${tabId}`]: isOpen });
    }
  } catch {
    // Session metadata is best-effort only; it must never prevent panel usage.
  }
}

/**
 * Register a genuinely tab-specific panel instance without opening it.
 *
 * IMPORTANT: we intentionally do NOT call sidePanel.close({tabId}) for a tab
 * that has no tab-specific panel. Chrome <145 can fall back to closing the
 * window's global panel in that case, which was the reason Lumen could become
 * impossible to reopen / close across unrelated tabs.
 */
async function ensureTabSpecificPanel(tabId: number): Promise<void> {
  if (!chrome.sidePanel?.setOptions) return;
  try {
    await chrome.sidePanel.setOptions({
      tabId,
      path: PANEL_PATH,
      enabled: true,
    });
  } catch {
    // Restricted/closing tabs can reject setOptions. The next activation/update
    // will retry, and action-click has a fallback registration path below.
  }
}

function registerExistingTabs(): void {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (typeof tab.id === 'number') void ensureTabSpecificPanel(tab.id);
    }
  });
}

chrome.runtime.onInstalled.addListener(() => {
  // We open the tab-specific panel ourselves. This avoids global side-panel
  // instances and gives every tab its own independent React/session instance.
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => undefined);
  }
  registerExistingTabs();
});

chrome.runtime.onStartup.addListener(() => {
  registerExistingTabs();
});

/**
 * Open immediately from the user gesture. sidePanel.open() is only legal from
 * a user action; awaiting storage/setOptions first can lose that gesture on
 * some Chrome versions. Tabs are proactively registered, so this is normally
 * a single direct open() call.
 */
function openPanelFromUserGesture(tabId: number): void {
  // Keep this call synchronous with the action/command event.
  chrome.sidePanel.open({ tabId }).then(
    () => void setPanelMarkedOpen(tabId, true),
    async () => {
      // Rare fallback: service worker woke before this tab was registered.
      // Configure now. The user can click once more if Chrome no longer accepts
      // the original gesture after the async registration.
      await ensureTabSpecificPanel(tabId);
      try {
        await chrome.sidePanel.open({ tabId });
        await setPanelMarkedOpen(tabId, true);
      } catch (error) {
        console.error('Error opening Lumen side panel:', error);
      }
    }
  );
}

chrome.action.onClicked.addListener((tab) => {
  if (typeof tab.id !== 'number') return;
  openPanelFromUserGesture(tab.id);
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== 'toggle-lumen' || typeof tab?.id !== 'number') return;
  openPanelFromUserGesture(tab.id);
});

// A new tab gets its own panel configuration but it is NOT opened. Therefore
// entering a newly created tab always starts with Lumen closed and English/tab
// defaults are handled by tab storage in the side-panel app.
chrome.tabs.onCreated.addListener((tab) => {
  if (typeof tab.id !== 'number') return;
  void ensureTabSpecificPanel(tab.id);
  void setPanelMarkedOpen(tab.id, false);
});

// Ensure tabs that existed before extension reload/restart also become
// tab-specific. Merely configuring a path never opens the panel.
chrome.tabs.onActivated.addListener(({ tabId }) => {
  void ensureTabSpecificPanel(tabId);
});

chrome.tabs.onUpdated.addListener((tabId) => {
  void ensureTabSpecificPanel(tabId);
});

const sidePanelAny = chrome.sidePanel as any;
if (sidePanelAny?.onOpened?.addListener) {
  sidePanelAny.onOpened.addListener((info: any) => {
    if (typeof info?.tabId === 'number') void setPanelMarkedOpen(info.tabId, true);
  });
}
if (sidePanelAny?.onClosed?.addListener) {
  sidePanelAny.onClosed.addListener((info: any) => {
    if (typeof info?.tabId === 'number') void setPanelMarkedOpen(info.tabId, false);
  });
}

interface ScreenshotRect {
  x: number;
  y: number;
  width: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
  dpr?: number;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  const buffer = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < buffer.length; i += chunkSize) {
    binary += String.fromCharCode(...buffer.subarray(i, Math.min(i + chunkSize, buffer.length)));
  }
  return `data:${blob.type};base64,${btoa(binary)}`;
}

function approxDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.ceil((base64.length * 3) / 4);
}

/** Groq base64 image requests are capped at 4 MB; leave headroom for JSON. */
const MAX_REGION_IMAGE_BYTES = 3_500_000;

async function encodeCanvasWithinLimit(canvas: OffscreenCanvas): Promise<string> {
  // PNG is ideal for charts/tables because it keeps small labels crisp.
  const png = await canvas.convertToBlob({ type: 'image/png' });
  let dataUrl = await blobToDataUrl(png);
  if (approxDataUrlBytes(dataUrl) <= MAX_REGION_IMAGE_BYTES) return dataUrl;

  // Large dashboard crops can exceed Groq's base64 limit. JPEG usually cuts
  // size dramatically while preserving enough detail for chart/table OCR.
  for (const quality of [0.94, 0.9, 0.84, 0.78]) {
    const jpeg = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    dataUrl = await blobToDataUrl(jpeg);
    if (approxDataUrlBytes(dataUrl) <= MAX_REGION_IMAGE_BYTES) return dataUrl;
  }

  // Last resort: downscale proportionally, never distort the selected region.
  const maxSide = 1800;
  const ratio = Math.min(1, maxSide / Math.max(canvas.width, canvas.height));
  if (ratio < 1) {
    const w = Math.max(1, Math.round(canvas.width * ratio));
    const h = Math.max(1, Math.round(canvas.height * ratio));
    const scaled = new OffscreenCanvas(w, h);
    const scaledCtx = scaled.getContext('2d');
    if (scaledCtx) {
      scaledCtx.imageSmoothingEnabled = true;
      scaledCtx.imageSmoothingQuality = 'high';
      scaledCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, w, h);
      for (const quality of [0.92, 0.86, 0.8]) {
        const jpeg = await scaled.convertToBlob({ type: 'image/jpeg', quality });
        dataUrl = await blobToDataUrl(jpeg);
        if (approxDataUrlBytes(dataUrl) <= MAX_REGION_IMAGE_BYTES) return dataUrl;
      }
    }
  }

  throw new Error('The selected region is too large to analyze. Draw a slightly smaller rectangle around the graph, table, chart, or pattern.');
}

async function cropScreenshot(dataUrl: string, rect: ScreenshotRect): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const image = await createImageBitmap(blob);

  // Use independent X/Y scale factors. Browser zoom / display scaling can make
  // the captured bitmap ratio differ slightly in each dimension.
  const scaleX = image.width / Math.max(1, rect.viewportWidth || 1);
  const scaleY = image.height / Math.max(1, rect.viewportHeight || 1);
  const fallbackScale = rect.dpr || 1;
  const sx = scaleX > 0 && Number.isFinite(scaleX) ? scaleX : fallbackScale;
  const sy = scaleY > 0 && Number.isFinite(scaleY) ? scaleY : fallbackScale;

  const cropX = Math.max(0, Math.round(rect.x * sx));
  const cropY = Math.max(0, Math.round(rect.y * sy));
  const cropWidth = Math.min(Math.max(1, Math.round(rect.width * sx)), image.width - cropX);
  const cropHeight = Math.min(Math.max(1, Math.round(rect.height * sy)), image.height - cropY);

  if (cropWidth <= 0 || cropHeight <= 0) {
    image.close();
    throw new Error('Selected region coordinates are outside the visible screenshot viewport.');
  }

  const canvas = new OffscreenCanvas(cropWidth, cropHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    image.close();
    throw new Error('Unable to create screenshot crop canvas.');
  }

  ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  image.close();
  return encodeCanvasWithinLimit(canvas);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action !== 'CAPTURE_VISIBLE_TAB') return false;

  const windowId = sender.tab?.windowId ?? chrome.windows.WINDOW_ID_CURRENT;
  chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, async (dataUrl) => {
    if (chrome.runtime.lastError || !dataUrl) {
      sendResponse({
        success: false,
        error: chrome.runtime.lastError?.message || 'Failed to capture visible tab screenshot.',
      });
      return;
    }

    try {
      const finalDataUrl = message.rect
        ? await cropScreenshot(dataUrl, message.rect as ScreenshotRect)
        : dataUrl;
      sendResponse({ success: true, dataUrl: finalDataUrl });
    } catch (error: any) {
      sendResponse({ success: false, error: error?.message || 'Failed to crop visible region.' });
    }
  });

  return true;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  const keys = [
    `lumen_session_tab_${tabId}`,
    `lumen_options_tab_${tabId}`,
    `${PANEL_OPEN_PREFIX}${tabId}`,
  ];
  if (chrome.storage?.session) chrome.storage.session.remove(keys);
  else if (chrome.storage?.local) chrome.storage.local.remove(keys);
});
