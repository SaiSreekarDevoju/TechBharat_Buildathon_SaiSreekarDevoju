import React, { useState, useEffect, useRef } from 'react';
import {
  CaptureMode,
  SummaryResponse,
  UserOptions,
  ProcessMetrics,
  HistoryItem,
  SupportedLanguage,
  TabSessionState,
  DEFAULT_USER_OPTIONS,
} from '@lumen/shared';
import { Header } from '../components/Header.js';
import { CaptureChooser } from '../components/CaptureChooser.js';
import { LoadingState } from '../components/LoadingState.js';
import { SummaryView } from '../components/SummaryView.js';
import { FollowUpChat } from '../components/FollowUpChat.js';
import { SettingsView } from '../components/SettingsView.js';
import { HistoryView } from '../components/HistoryView.js';
import { DebugPanel } from '../components/DebugPanel.js';
import { saveHistoryItem } from '../lib/storage.js';
import { sendMessageToActiveTab, sendMessageToTab, getActiveTab, getTabById } from '../lib/tab.js';
import { requestSummary } from '../lib/api.js';
import { getTabSession, saveTabSession, getDefaultTabSession, getTabOptions } from '../lib/tabStorage.js';

export const SidePanelApp: React.FC = () => {
  const [view, setView] = useState<'main' | 'history' | 'settings'>('main');
  const [options, setOptions] = useState<UserOptions>(DEFAULT_USER_OPTIONS);
  const [activeTabId, setActiveTabId] = useState<number>(1);
  const activeTabIdRef = useRef<number>(1);
  const [currentSession, setCurrentSession] = useState<TabSessionState>(getDefaultTabSession(1));
  const [statusText, setStatusText] = useState('');
  const [selectionToast, setSelectionToast] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const mainContainerRef = useRef<HTMLDivElement>(null);

  const setCurrentTabId = (id: number) => {
    setActiveTabId(id);
    activeTabIdRef.current = id;
  };

  // The Chrome side panel can remain mounted while the user changes tabs.
  // Always rebind this UI to the newly active tab so a never-used/new tab starts
  // with a clean chooser, while revisiting an old tab restores only THAT tab's state.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');

    let loadGeneration = 0;
    const loadTab = async (tabId: number) => {
      const generation = ++loadGeneration;
      setCurrentTabId(tabId);
      // Clear the visible panel synchronously. This prevents even a brief flash
      // of the previous tab's summary when entering a brand-new tab.
      setCurrentSession(getDefaultTabSession(tabId, 'en'));
      setOptions((prev) => ({ ...prev, language: 'en', privacyMode: true }));
      setView('main');
      setStatusText('');
      setSelectionToast(null);

      const [session, tabOptions] = await Promise.all([
        getTabSession(tabId),
        getTabOptions(tabId),
      ]);

      // Ignore a slower storage read for a tab that is no longer active.
      if (generation !== loadGeneration || activeTabIdRef.current !== tabId) return;
      setCurrentSession(session);
      setOptions(tabOptions);
    };

    void getActiveTab().then((tab) => {
      if (typeof tab?.id === 'number') void loadTab(tab.id);
    });

    const onActivated = ({ tabId }: chrome.tabs.TabActiveInfo) => {
      void loadTab(tabId);
    };
    chrome.tabs.onActivated.addListener(onActivated);
    return () => chrome.tabs.onActivated.removeListener(onActivated);
  }, []);

  /**
   * Persist a patch to the tab that OWNS the operation. A request started in
   * Tab A may finish after the user switches to Tab B; that late result must
   * never be written into Tab B's session.
   */
  const updateSessionForTab = (tabId: number, patch: Partial<TabSessionState>) => {
    if (activeTabIdRef.current === tabId) {
      setCurrentSession((prev) => {
        const base = prev.tabId === tabId ? prev : getDefaultTabSession(tabId);
        const next = { ...base, ...patch, tabId };
        void saveTabSession(next);
        return next;
      });
      return;
    }

    void getTabSession(tabId).then((stored) => {
      const next = { ...stored, ...patch, tabId };
      return saveTabSession(next);
    });
  };

  const updateSession = (patch: Partial<TabSessionState>) => {
    updateSessionForTab(activeTabIdRef.current, patch);
  };

  const scrollToTop = () => {
    if (mainContainerRef.current) {
      mainContainerRef.current.scrollTop = 0;
    }
  };

  const executeSummary = async (mode: CaptureMode, extraData?: any, targetLang?: SupportedLanguage) => {
    const requestTabId = activeTabIdRef.current;
    const originOptions = options;
    const originSession = currentSession;
    const langToUse = targetLang || originOptions.language || originSession.tabLanguage || 'en';
    const updateOriginSession = (patch: Partial<TabSessionState>) => updateSessionForTab(requestTabId, patch);
    updateOriginSession({ errorMessage: null, step: 'loading', captureMode: mode, tabLanguage: langToUse });
    setStatusText('Preparing capture...');

    const controller = new AbortController();
    setAbortController(controller);

    const startTime = performance.now();
    let firstTokenTime = 0;

    try {
      const activeTab = await getTabById(requestTabId);
      const title = activeTab?.title || 'Current Webpage';
      const url = activeTab?.url || '';

      if (mode === 'page') {
        setStatusText('Extracting readable page content...');
        const pageData = await sendMessageToTab(requestTabId, { action: 'EXTRACT_PAGE' });

        if (pageData.unreadableReason) {
          updateOriginSession({ errorMessage: pageData.unreadableReason, step: 'error' });
          return;
        }

        setStatusText('Organizing evidence & generating brief...');
        updateOriginSession({
          captureMode: 'page',
          capturedBlocks: pageData.blocks || [],
          rawCapturedText: pageData.rawText || '',
          selectedText: '',
          contextText: '',
          croppedImageDataUrl: undefined,
          messages: [],
        });

        const result = await requestSummary({
          captureMode: 'page',
          content: pageData.rawText,
          title,
          url,
          options: { ...originOptions, language: langToUse },
          onChunk: () => {
            if (!firstTokenTime) firstTokenTime = performance.now();
            setStatusText('Streaming brief...');
          },
          signal: controller.signal,
        });

        const endTime = performance.now();
        const procMetrics: ProcessMetrics = {
          extractionTimeMs: Math.round(firstTokenTime ? firstTokenTime - startTime : 500),
          firstTokenTimeMs: Math.round(firstTokenTime ? firstTokenTime - startTime : 1200),
          totalTimeMs: Math.round(endTime - startTime),
          blockCount: pageData.blocks?.length || 0,
          wordCount: pageData.wordCount || 0,
          payloadSizeBytes: JSON.stringify(pageData).length,
          isTruncated: pageData.isTruncated || false,
          modelName: originOptions.model,
          confidenceLevel: result.coverage?.textCoverage || 'high',
        };

        updateOriginSession({ summary: result, step: 'summary', metrics: procMetrics });
        setTimeout(scrollToTop, 20);

        if (originOptions.localHistoryEnabled) {
          saveHistoryItem({
            id: `history-${Date.now()}`,
            title,
            url,
            timestamp: new Date().toISOString(),
            captureMode: 'page',
            language: langToUse,
            summary: result,
            previewText: result.summary.line1,
            redactionApplied: true,
          });
        }
      } else if (mode === 'selection') {
        const selText = String(extraData?.selectedText || originSession.selectedText || '').trim();

        if (!selText) {
          updateOriginSession({ step: 'selection_prompt', captureMode: 'selection' });
          setSelectionToast('No text highlighted on page. Please drag your cursor over text on the webpage first, then click Summarize Selected Text.');
          setTimeout(() => setSelectionToast(null), 4000);
          return;
        }

        // Selection mode is intentionally isolated from all previous whole-page/region context.
        updateOriginSession({
          captureMode: 'selection',
          selectedText: selText,
          contextText: '',
          rawCapturedText: selText,
          capturedBlocks: [],
          croppedImageDataUrl: undefined,
          messages: [],
        });
        setStatusText('Analyzing selected passage...');

        const result = await requestSummary({
          captureMode: 'selection',
          selectedText: selText,
          contextText: '',
          title,
          url,
          options: { ...originOptions, language: langToUse },
          onChunk: () => {
            if (!firstTokenTime) firstTokenTime = performance.now();
            setStatusText('Streaming brief...');
          },
          signal: controller.signal,
        });

        updateOriginSession({ summary: result, step: 'summary' });
        setTimeout(scrollToTop, 20);
      } else if (mode === 'region') {
        const imageDataUrl = extraData?.imageDataUrl as string | undefined;
        const regionText = String(extraData?.regionText || extraData?.text || '').trim();

        // First invocation only starts the cropper. The completed crop is delivered
        // later as EXECUTE_SUMMARIZE_PAYLOAD, just like Neeraj's working extension.
        if (!imageDataUrl) {
          setStatusText('Draw a rectangle over the area you want to summarize...');
          const started = await sendMessageToTab(requestTabId, { action: 'TRIGGER_REGION_CROPPER' });
          if (!started?.success) {
            throw new Error(started?.error || 'Unable to start region selection.');
          }
          return;
        }

        updateOriginSession({
          captureMode: 'region',
          croppedImageDataUrl: imageDataUrl,
          contextText: regionText,
          rawCapturedText: regionText,
          selectedText: '',
          capturedBlocks: [],
          messages: [],
          step: 'loading',
        });
        setStatusText('Analyzing selected visual region...');

        const result = await requestSummary({
          captureMode: 'region',
          imageDataUrl,
          contextText: regionText || '[Drawn Region Screenshot Captured for Visual Analysis]',
          title: extraData?.title || title,
          url: extraData?.url || url,
          options: { ...originOptions, language: langToUse },
          onChunk: () => {
            if (!firstTokenTime) firstTokenTime = performance.now();
            setStatusText('Streaming visual brief...');
          },
          signal: controller.signal,
        });

        updateOriginSession({ summary: result, step: 'summary', captureMode: 'region' });
        setTimeout(scrollToTop, 20);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        updateOriginSession({ step: 'chooser' });
        return;
      }
      updateOriginSession({
        errorMessage: err.message || 'An unexpected error occurred during capture.',
        step: 'error',
      });
    }
  };

  // Neeraj-style asynchronous region completion channel. The content script sends
  // a brand-new runtime message after the user finishes drawing and background
  // cropping has completed, so no long-lived sendResponse callback is required.
  useEffect(() => {
    const listener = (message: any, sender: chrome.runtime.MessageSender) => {
      if (sender.tab?.id && sender.tab.id !== activeTabIdRef.current) return;

      if (message.action === 'EXECUTE_SUMMARIZE_PAYLOAD' && message.payload?.mode === 'region') {
        const payload = message.payload;
        if (!payload.imageDataUrl) {
          updateSession({ step: 'error', captureMode: 'region', errorMessage: 'Region capture completed without an image.' });
          return;
        }
        void executeSummary(
          'region',
          {
            imageDataUrl: payload.imageDataUrl,
            regionText: payload.text || '',
            region: payload.region,
            title: payload.title,
            url: payload.url,
          },
          options.language || currentSession.tabLanguage || 'en'
        );
        return;
      }

      if (message.action === 'REGION_CAPTURE_CANCELLED') {
        setStatusText('');
        updateSession({ step: 'chooser', captureMode: 'region' });
        return;
      }

      if (message.action === 'REGION_CAPTURE_ERROR') {
        setStatusText('');
        updateSession({
          step: 'error',
          captureMode: 'region',
          errorMessage: message.error || 'Unable to capture selected region.',
        });
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [currentSession.tabLanguage, options]);

  const handleSelectMode = async (mode: CaptureMode) => {
    if (mode === 'selection') {
      const selData = await sendMessageToActiveTab({ action: 'EXTRACT_SELECTION' });
      if (selData && selData.selectedText && selData.selectedText.trim()) {
        executeSummary('selection', selData);
      } else {
        updateSession({ step: 'selection_prompt', captureMode: 'selection' });
      }
    } else {
      executeSummary(mode);
    }
  };

  const handleConfirmSelectionCapture = async () => {
    setSelectionToast(null);
    const selData = await sendMessageToActiveTab({ action: 'EXTRACT_SELECTION' });
    if (selData && selData.selectedText && selData.selectedText.trim()) {
      executeSummary('selection', selData);
    } else {
      setSelectionToast('No text highlighted on page. Please drag your cursor over text on the webpage first, then click Summarize Selected Text.');
      setTimeout(() => setSelectionToast(null), 4000);
    }
  };

  // Regenerate the EXISTING capture in the language selected in Settings.
  // The source content is reused exactly as captured; the webpage is not re-read.
  const handleRegenerateLanguage = async (newLang: SupportedLanguage) => {
    if (isRegenerating || !currentSession.summary) return;

    const existingSummaryLanguage = (
      currentSession.summary.source?.language ||
      currentSession.tabLanguage ||
      'en'
    ) as SupportedLanguage;

    // Do nothing if Settings still points to the language already used by this brief.
    if (newLang === existingSummaryLanguage) return;

    setIsRegenerating(true);
    setStatusText(`Regenerating brief in ${newLang}...`);

    try {
      const activeTab = await getActiveTab();
      const title = currentSession.summary.source?.title || activeTab?.title || 'Current Webpage';
      const url = currentSession.summary.source?.url || activeTab?.url || '';
      const mode = currentSession.captureMode;

      if (mode === 'page' && !currentSession.rawCapturedText?.trim()) {
        throw new Error('The original webpage capture is no longer available. Create a new brief first.');
      }

      if (mode === 'selection' && !currentSession.selectedText?.trim()) {
        throw new Error('The original selected text is no longer available. Select the text again and create a new brief.');
      }

      if (mode === 'region' && !currentSession.croppedImageDataUrl) {
        throw new Error('The original region screenshot is no longer available. Draw the region again and create a new brief.');
      }

      const result = await requestSummary({
        captureMode: mode,
        content: mode === 'page' ? currentSession.rawCapturedText : undefined,
        selectedText: mode === 'selection' ? currentSession.selectedText : undefined,
        contextText: mode === 'region' ? (currentSession.contextText || '') : '',
        imageDataUrl: mode === 'region' ? currentSession.croppedImageDataUrl : undefined,
        title,
        url,
        options: { ...options, language: newLang },
        onChunk: () => setStatusText(`Regenerating brief in ${newLang}...`),
      });

      // Treat the requested language as authoritative for UI state. Models can
      // occasionally echo a stale source.language value even when prose is translated.
      const normalizedResult: SummaryResponse = {
        ...result,
        source: {
          ...result.source,
          title: result.source?.title || title,
          url: result.source?.url || url,
          captureMode: mode,
          language: newLang,
        },
      };

      // Only commit tabLanguage AFTER a successful regeneration. This keeps the
      // Regenerate button enabled when the request fails and lets the user retry.
      updateSession({
        summary: normalizedResult,
        tabLanguage: newLang,
        step: 'summary',
        errorMessage: null,
      });
      setStatusText('');
      setTimeout(scrollToTop, 20);
    } catch (err: any) {
      setStatusText('');
      console.error('Regenerate Brief failed:', err);
      alert(`Regeneration failed: ${err?.message || 'Failed to regenerate the brief in the selected language.'}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleResetSession = () => {
    const defaultSession = getDefaultTabSession(activeTabId, 'en');
    setCurrentSession(defaultSession);
    saveTabSession(defaultSession);
  };

  const handleCancelLoading = () => {
    if (abortController) abortController.abort();
    updateSession({ step: 'chooser' });
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    updateSession({ summary: item.summary, step: 'summary', tabLanguage: item.language });
    setView('main');
    setTimeout(scrollToTop, 20);
  };

  const getChatContextBlocks = () => {
    if (currentSession.captureMode === 'selection') {
      return currentSession.selectedText || '';
    }
    if (currentSession.captureMode === 'region') {
      return currentSession.contextText || '[The original source was a cropped visual region. No readable DOM text was detected.]';
    }
    return currentSession.rawCapturedText || currentSession.capturedBlocks;
  };

  return (
    <div className="lumen-app-container">
      <Header
        currentView={view}
        onNavigate={(v) => setView(v)}
      />

      <div className="lumen-content-body" ref={mainContainerRef}>
        {view === 'settings' && (
          <SettingsView
            tabId={activeTabId}
            options={options}
            onOptionsChange={setOptions}
            onClose={() => setView('main')}
          />
        )}

        {view === 'history' && (
          <HistoryView onSelectSummary={handleSelectHistoryItem} onClose={() => setView('main')} />
        )}

        {view === 'main' && (
          <>
            {currentSession.step === 'chooser' && <CaptureChooser onSelectMode={handleSelectMode} />}

            {currentSession.step === 'selection_prompt' && (
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--lemon-primary)', letterSpacing: '0.05em' }}>
                  TEXT SELECTION CAPTURE
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                  Highlight any passage of text on your webpage using your mouse or keyboard cursor, then click <strong>Summarize Selected Text</strong>.
                </div>

                {selectionToast && (
                  <div style={{ padding: '8px 12px', background: 'rgba(236, 255, 50, 0.1)', border: '1px solid var(--lemon-primary)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '11px' }}>
                    💡 {selectionToast}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    onClick={handleConfirmSelectionCapture}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      background: 'var(--lemon-primary)',
                      color: '#0A0A0A',
                      fontWeight: 700,
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  >
                    Summarize Selected Text ➔
                  </button>
                  <button
                    onClick={() => updateSession({ step: 'chooser' })}
                    style={{
                      padding: '10px 14px',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-muted)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {currentSession.step === 'loading' && (
              <LoadingState statusText={statusText} onCancel={handleCancelLoading} />
            )}

            {currentSession.step === 'error' && (
              <div
                style={{
                  padding: '20px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--error)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ color: 'var(--error)', fontWeight: 700, fontSize: '14px' }}>
                  ⚠️ Unable to summarize page
                </div>
                <div style={{ color: 'var(--text-primary)', fontSize: '12px' }}>{currentSession.errorMessage}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  <strong>Try:</strong>
                  <ul style={{ paddingLeft: '16px', marginTop: '4px' }}>
                    <li>Whole Page on a normal HTTP/HTTPS website</li>
                    <li>Highlighting text and using Selection capture</li>
                    <li>Using Visual Region capture</li>
                  </ul>
                </div>
                <button
                  onClick={() => updateSession({ step: 'chooser' })}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--lemon-primary)',
                    color: '#0A0A0A',
                    fontWeight: 700,
                    borderRadius: '6px',
                    alignSelf: 'flex-start',
                  }}
                >
                  ← Try Another Mode
                </button>
              </div>
            )}

            {currentSession.step === 'summary' && currentSession.summary && (
              <>
                <SummaryView
                  summary={currentSession.summary}
                  currentLanguage={(currentSession.summary.source?.language || currentSession.tabLanguage || 'en') as SupportedLanguage}
                  targetLanguage={options.language}
                  onNewCapture={handleResetSession}
                  onRegenerateLanguage={handleRegenerateLanguage}
                  isRegenerating={isRegenerating}
                />
                <FollowUpChat
                  summary={currentSession.summary}
                  capturedBlocks={getChatContextBlocks()}
                  options={options}
                  captureMode={currentSession.captureMode}
                  imageDataUrl={currentSession.captureMode === 'region' ? currentSession.croppedImageDataUrl : undefined}
                  messages={currentSession.messages || []}
                  onUpdateMessages={(msgs) => updateSession({ messages: msgs })}
                />
                {currentSession.metrics && <DebugPanel metrics={currentSession.metrics} />}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
