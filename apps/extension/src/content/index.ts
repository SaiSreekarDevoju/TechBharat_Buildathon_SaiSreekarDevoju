import { extractPageContent, extractSelectedContent } from './extractor.js';
import { startRegionSelection } from './regionSelector.js';
import { toggleInPagePanel } from './inPagePanel.js';

let activeHighlightTimeout: ReturnType<typeof setTimeout> | null = null;
let currentHighlightedEl: HTMLElement | null = null;
let originalStyles: { outline: string; boxShadow: string; backgroundColor: string; transition: string } | null = null;

function clearPreviousHighlight(): void {
  if (activeHighlightTimeout) {
    clearTimeout(activeHighlightTimeout);
    activeHighlightTimeout = null;
  }
  if (currentHighlightedEl && originalStyles) {
    currentHighlightedEl.style.outline = originalStyles.outline;
    currentHighlightedEl.style.boxShadow = originalStyles.boxShadow;
    currentHighlightedEl.style.backgroundColor = originalStyles.backgroundColor;
    currentHighlightedEl.style.transition = originalStyles.transition;
  }
  currentHighlightedEl = null;
  originalStyles = null;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'EXTRACT_PAGE') {
    try {
      sendResponse(extractPageContent());
    } catch (error: any) {
      sendResponse({ unreadableReason: error?.message || 'Unable to extract webpage content.' });
    }
    return true;
  }

  if (message.action === 'EXTRACT_SELECTION') {
    try {
      sendResponse(extractSelectedContent());
    } catch (error: any) {
      sendResponse({ selectedText: '', contextText: '', wordCount: 0, error: error?.message || 'Unable to read selected text.' });
    }
    return true;
  }

  if (message.action === 'START_REGION_SELECTION' || message.action === 'TRIGGER_REGION_CROPPER') {
    try {
      startRegionSelection();
      sendResponse({ success: true, started: true });
    } catch (error: any) {
      sendResponse({ success: false, started: false, error: error?.message || 'Unable to start region selection.' });
    }
    return true;
  }

  if (message.action === 'TOGGLE_INPAGE_PANEL') {
    toggleInPagePanel();
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'HIGHLIGHT_BLOCK') {
    clearPreviousHighlight();

    const { blockId, textSnippet } = message;
    let targetEl: HTMLElement | null = null;

    if (blockId) {
      targetEl = document.querySelector<HTMLElement>(`[data-lumen-id="${CSS.escape(blockId)}"]`);
    }

    if (!targetEl && textSnippet) {
      const candidates = Array.from(
        document.body.querySelectorAll<HTMLElement>('p, h1, h2, h3, h4, h5, h6, li, tr, td, pre, blockquote')
      );
      const cleanedSnippet = String(textSnippet).slice(0, 50).trim().toLowerCase();
      targetEl = candidates.find((el) => (el.textContent || '').toLowerCase().includes(cleanedSnippet)) || null;
    }

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      originalStyles = {
        outline: targetEl.style.outline,
        boxShadow: targetEl.style.boxShadow,
        backgroundColor: targetEl.style.backgroundColor,
        transition: targetEl.style.transition,
      };
      currentHighlightedEl = targetEl;
      targetEl.style.outline = '2px solid #E8FF3B';
      targetEl.style.boxShadow = '0 0 20px rgba(232, 255, 59, 0.75)';
      targetEl.style.backgroundColor = 'rgba(232, 255, 59, 0.22)';
      targetEl.style.transition = 'all 0.3s ease';
      activeHighlightTimeout = setTimeout(clearPreviousHighlight, 3500);
      sendResponse({ success: true, found: true });
    } else {
      sendResponse({ success: false, found: false, error: 'Source section not found on webpage.' });
    }
    return true;
  }

  return false;
});
