import React, { useState, useEffect } from 'react';
import './styles.css';

const iconUrl = '/favicon.png';

const iconPaths: Record<string, string> = {
  Sparkles: `<path d="m12 3-1.9 4.8L5 10l5.1 2.2L12 17l1.9-4.8L19 10l-5.1-2.2Z"/><path d="M5 3v4M3 5h4M19 17v4M17 19h4"/>`,
  Page: `<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/>`,
  Text: `<path d="M5 5h14M12 5v14M8 19h8"/>`,
  Region: `<path d="M4 9V5a1 1 0 0 1 1-1h4"/><path d="M15 4h4a1 1 0 0 1 1 1v4"/><path d="M20 15v4a1 1 0 0 1-1 1h-4"/><path d="M9 20H5a1 1 0 0 1-1-1v-4"/>`,
  Chat: `<path d="M5 18.5A3 3 0 0 1 3 15.7V7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9l-4 3v-2.5Z"/>`,
  Arrow: `<path d="m9 6 6 6-6 6"/>`,
  Check: `<path d="m5 12 4 4L19 6"/>`,
  Shield: `<path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3Z"/><path d="m9 12 2 2 4-4"/>`,
  Stream: `<path d="M5 6h14M5 12h9M5 18h12"/><path d="m17 10 3 2-3 2"/>`,
  Chart: `<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>`,
  History: `<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>`,
  Download: `<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>`,
  Language: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18"/><path d="M12 3a15 15 0 0 0 0 18"/>`,
  Tabs: `<rect x="3" y="5" width="14" height="14" rx="2"/><path d="M7 2h12a2 2 0 0 1 2 2v12"/>`,
  Locate: `<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>`,
  Alert: `<path d="M10.3 3.7 2.5 17.2A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.8L13.7 3.7a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>`,
  Lock: `<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>`,
};

function renderIcon(name: string, size = 20) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: iconPaths[name] || '' }}
    />
  );
}

// Custom Lumen Brand Logo SVG
function renderLumenLogo(size = 36) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: '#0A0A0A',
        border: '1px solid #E8FF3B',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 12px rgba(232, 255, 59, 0.25)',
      }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="#E8FF3B" stroke="#F3FF75" strokeWidth="1" />
      </svg>
    </div>
  );
}

const captureModes = [
  { icon: 'Page', number: '01', title: 'Whole page', copy: 'Lumen extracts meaningful page content, filters repeated boilerplate, and condenses long pages before generating the final brief.' },
  { icon: 'Text', number: '02', title: 'Text selection', copy: 'Highlight the exact passage you want to understand. Only the selected text becomes the primary context.' },
  { icon: 'Region', number: '03', title: 'Visual region', copy: 'Draw around a chart, dashboard, table, infographic, PDF viewport, or dense part of the interface.' },
];

const structuredSections = [
  { number: '01', title: 'Summary', copy: 'Two concise lines covering the central meaning and its most important implication.' },
  { number: '02', title: 'Key Points', copy: 'The strongest facts, arguments, findings, changes, or visible patterns.' },
  { number: '03', title: 'Actions', copy: 'Explicit tasks, owners, requirements, and deadlines when they exist.' },
  { number: '04', title: 'Numbers & Metrics', copy: 'Dates, percentages, prices, counts, durations, rankings, thresholds, and KPIs.' },
  { number: '05', title: 'Decisions', copy: 'Approvals, rejections, agreements, outcomes, and resolved choices.' },
  { number: '06', title: 'Risks', copy: 'Warnings, limitations, blockers, unresolved issues, and evidence-backed concerns.' },
];

const productFeatures = [
  { icon: 'Stream', title: 'Continuous streaming', copy: 'The loading state remains visible until useful response text is ready, then transitions smoothly into the streamed brief.' },
  { icon: 'Chat', title: 'Grounded follow-ups', copy: 'Ask questions against the retained capture. Lumen answers from that context or says the information is unavailable.' },
  { icon: 'Chart', title: 'Visual intelligence', copy: 'Interpret charts, KPI cards, dashboards, tables, visual PDFs, trends, comparisons, peaks, declines, and anomalies.' },
  { icon: 'Language', title: 'Multilingual output', copy: 'Generate summaries in English, Hindi, Telugu, Tamil, Bengali, or Marathi while preserving technical meaning.' },
  { icon: 'History', title: 'Searchable local history', copy: 'Reopen previous summaries with their source URL and timestamp, or delete one, multiple, or every stored entry.' },
  { icon: 'Tabs', title: 'Cross-tab comparison', copy: 'Select up to three open tabs and create one comparative brief showing similarities, differences, metrics, actions, and risks.' },
  { icon: 'Shield', title: 'Privacy mode', copy: 'Redact email addresses, phone numbers, PAN-like values, Aadhaar-like values, API keys, tokens, and other sensitive patterns.' },
  { icon: 'Locate', title: 'Source navigation', copy: 'Select a grounded summary point to locate and temporarily highlight the closest matching source section on the page.' },
  { icon: 'Download', title: 'Copy and Markdown export', copy: 'Copy the structured result or download it as a clean Markdown file, including optional follow-up conversation.' },
];

const workflowSteps = [
  { number: '01', title: 'Open Lumen', copy: 'Click the extension icon or press Alt + Shift + S. The sidebar opens, but the page is not captured.' },
  { number: '02', title: 'Choose the capture', copy: 'Select Whole page, Text selection, or Visual region. Every transmission begins with deliberate user action.' },
  { number: '03', title: 'Watch the brief stream', copy: 'Lumen keeps a continuous loading presentation and reveals the structured response as soon as useful content arrives.' },
  { number: '04', title: 'Act on the result', copy: 'Ask follow-up questions, locate source sections, change language, copy the brief, export Markdown, or save it to local history.' },
];

const supportedContexts = [
  'News articles', 'Documentation', 'Research papers', 'GitHub pull requests',
  'Gmail threads', 'Jira tickets', 'Dashboards', 'Tables', 'Charts', 'Long-form articles', 'Internal wikis', 'Visible PDF pages'
];

export const App: React.FC = () => {
  const [selectedPreviewMode, setSelectedPreviewMode] = useState(0);
  const [streamDemoText, setStreamDemoText] = useState('');

  // Live streaming demo effect
  useEffect(() => {
    const text = "Lumen has identified the central subject, visible evidence, actions, decisions, numbers, and risks. The structured brief appears without a blank transition.";
    let index = 0;
    let timer: any = null;

    const run = () => {
      setStreamDemoText('');
      index = 0;
      timer = setInterval(() => {
        setStreamDemoText(text.substring(0, index + 1));
        index++;
        if (index >= text.length) {
          clearInterval(timer);
          setTimeout(run, 2400);
        }
      }, 24);
    };

    run();
    return () => clearInterval(timer);
  }, []);

  const previewCopy = [
    { state: 'Ready', summary: 'The visible webpage is ready. No content is captured until Whole page is selected.' },
    { state: 'Selection', summary: 'Highlight the exact passage you want to summarize, then release the mouse to begin.' },
    { state: 'Visual', summary: 'Draw around one complete chart, table, dashboard panel, or visible PDF section.' },
  ];

  return (
    <div className="site-shell">
      <header className="topbar container">
        <a className="brand" href="#top" aria-label="Lumen home">
          {renderLumenLogo(38)}
          <span>Lumen</span>
        </a>

        <nav className="top-navigation" aria-label="Primary navigation">
          <a href="#workflow">Workflow</a>
          <a href="#features">Features</a>
          <a href="#privacy">Privacy</a>
          <a href="#install">Install</a>
          <a href="/manifest.json" download="manifest.json" style={{ color: '#E8FF3B', fontWeight: 'bold' }}>
            {renderIcon('Download', 14)} manifest.json
          </a>
        </nav>

        <span className="manifest-label">MANIFEST V3 · USER INITIATED</span>
      </header>

      <main id="top">
        {/* HERO SECTION */}
        <section className="hero container">
          <div className="hero-copy-column">
            <p className="eyebrow">ON-SCREEN INTELLIGENCE</p>
            <h1>
              Understand what is <span>already in front of you.</span>
            </h1>
            <p className="hero-copy">
              Lumen captures a webpage, selected text, or a visual region and turns it into a structured, source-grounded intelligence brief directly inside the current tab.
            </p>

            <div className="hero-actions">
              <a className="primary-button" href="#install">
                Install unpacked build {renderIcon('Arrow', 18)}
              </a>

              <a
                href="/manifest.json"
                download="manifest.json"
                style={{
                  minHeight: '54px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0 20px',
                  borderRadius: '16px',
                  border: '1px solid #E8FF3B',
                  color: '#E8FF3B',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: 'rgba(232, 255, 59, 0.08)',
                }}
              >
                {renderIcon('Download', 16)} Download manifest.json
              </a>

              <span className="shortcut-chip">
                <small>Open Lumen</small>
                <kbd>Alt + Shift + S</kbd>
              </span>
            </div>

            <div className="hero-trust-row">
              <span>{renderIcon('Check', 14)} No automatic scanning</span>
              <span>{renderIcon('Check', 14)} User-supplied API key</span>
              <span>{renderIcon('Check', 14)} Honest failure handling</span>
            </div>
          </div>

          <div className="hero-product-preview" aria-label="Lumen sidebar preview">
            <div className="preview-browser">
              <header className="preview-browser-bar" style={{ position: 'relative' }}>
                <div className="preview-browser-dots">
                  <i></i><i></i><i></i>
                </div>
                <div
                  className="preview-tab-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: '#151719',
                    border: '1px solid #272A2D',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  {renderLumenLogo(18)}
                  <span style={{ fontSize: '11px', color: '#FAFAF5', fontWeight: 600 }}>
                    Quarterly Review — Lumen Active
                  </span>

                  {/* Tab Hover Preview Card */}
                  <div className="tab-hover-preview-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      {renderLumenLogo(22)}
                      <div>
                        <strong style={{ fontSize: '12px', color: '#FAFAF5', display: 'block' }}>Lumen Brief Ready</strong>
                        <small style={{ color: '#E8FF3B', fontSize: '10px' }}>Alt + Shift + S to trigger</small>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#929292', lineHeight: '1.4' }}>
                      On-screen intelligence active for this tab. No data captured until invoked.
                    </div>
                  </div>
                </div>
              </header>

              <div className="preview-page-content">
                <span className="preview-page-kicker">QUARTERLY BUSINESS REVIEW</span>
                <h2>Customer activity increased during the second half.</h2>
                <p>The source page remains visible while Lumen opens as an adjustable sidebar inside the tab.</p>
                <div className="preview-chart">
                  <span style={{ '--bar-height': '38%' } as any}></span>
                  <span style={{ '--bar-height': '51%' } as any}></span>
                  <span style={{ '--bar-height': '64%' } as any}></span>
                  <span style={{ '--bar-height': '88%' } as any}></span>
                </div>
              </div>

              <aside className="preview-sidebar">
                <header className="preview-sidebar-header">
                  <span className="preview-logo">{renderLumenLogo(26)}</span>
                  <div>
                    <strong>Lumen</strong>
                    <small>On-screen intelligence</small>
                  </div>
                  <span className="preview-live">
                    <i></i> {previewCopy[selectedPreviewMode].state}
                  </span>
                </header>

                <div className="preview-capture-row">
                  {captureModes.map((mode, index) => (
                    <button
                      key={index}
                      type="button"
                      className={selectedPreviewMode === index ? 'is-selected' : ''}
                      onClick={() => setSelectedPreviewMode(index)}
                    >
                      {renderIcon(mode.icon, 16)}
                      <span>{mode.title}</span>
                    </button>
                  ))}
                </div>

                <div className="preview-summary-card">
                  <div className="preview-section-heading">
                    <span>01</span>
                    <strong>Summary</strong>
                  </div>
                  <p>{previewCopy[selectedPreviewMode].summary}</p>
                </div>

                <div className="preview-summary-card compact">
                  <div className="preview-section-heading">
                    <span>02</span>
                    <strong>Key Points</strong>
                  </div>
                  <ul>
                    <li>Q4 contains the highest visible value.</li>
                    <li>Growth appears continuous across all four periods.</li>
                  </ul>
                </div>

                <div className="preview-question">
                  <span>Ask about the captured context…</span>
                  <button type="button" aria-label="Send follow-up question">
                    {renderIcon('Arrow', 15)}
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* PROOF STRIP */}
        <section className="proof-strip" aria-label="Core product principles">
          <div className="container proof-strip-inner">
            <span><strong>3</strong> capture modes</span>
            <span><strong>6</strong> output languages</span>
            <span><strong>6</strong> required summary sections</span>
            <span><strong>0</strong> background scraping</span>
          </div>
        </section>

        {/* WORKFLOW SECTION */}
        <section className="container section-block workflow-section" id="workflow">
          <div className="section-introduction">
            <p className="section-kicker">CURRENT WORKFLOW</p>
            <h2>One sidebar. Three deliberate ways to capture.</h2>
            <p>Opening Lumen never triggers a scan. The extension waits for the user to choose exactly what should be read.</p>
          </div>

          <div className="workflow-grid">
            {workflowSteps.map((step, idx) => (
              <article key={idx} className="workflow-card">
                <span className="workflow-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </article>
            ))}
          </div>
        </section>

        {/* CAPTURE MODES */}
        <section className="container section-block capture-section">
          <div className="section-introduction">
            <p className="section-kicker">CAPTURE WHAT MATTERS</p>
            <h2>Use the right capture for the content in front of you.</h2>
          </div>

          <div className="capture-grid">
            {captureModes.map((mode, idx) => (
              <article key={idx} className="capture-card">
                <div className="capture-card-top">
                  <span className="capture-card-icon">{renderIcon(mode.icon)}</span>
                  <small>{mode.number}</small>
                </div>
                <h3>{mode.title}</h3>
                <p>{mode.copy}</p>
              </article>
            ))}
          </div>
        </section>

        {/* SIDEBAR EXPERIENCE & LIVE STREAM */}
        <section className="sidebar-experience-section">
          <div className="container sidebar-experience-grid">
            <div>
              <p className="section-kicker">INSIDE THE CURRENT TAB</p>
              <h2>An adjustable intelligence workspace, not a disposable popup.</h2>
              <p>The sidebar remains attached to the webpage, preserves the current tab's context, and can be resized without covering the whole screen.</p>
              <ul className="experience-list">
                <li>{renderIcon('Check', 15)} Independent session for every open webpage</li>
                <li>{renderIcon('Check', 15)} Adjustable sidebar width and side</li>
                <li>{renderIcon('Check', 15)} Smooth loading-to-streaming transition</li>
                <li>{renderIcon('Check', 15)} Stop control during active requests</li>
                <li>{renderIcon('Check', 15)} Source-grounded follow-up conversation</li>
              </ul>
            </div>

            <div className="stream-demo-card">
              <div className="stream-demo-header">
                <span>{renderIcon('Stream', 18)} Streaming intelligence</span>
                <small>LIVE</small>
              </div>

              <div className="stream-demo-loading">
                <span className="stream-demo-orbit">{renderLumenLogo(30)}</span>
                <div>
                  <strong>Understanding the captured context</strong>
                  <p>The loading component remains visible until useful public content is ready.</p>
                </div>
              </div>

              <div className="stream-demo-output">
                <span>Generating structured brief</span>
                <p>{streamDemoText}</p>
                <i className="stream-demo-caret"></i>
              </div>
            </div>
          </div>
        </section>

        {/* STRUCTURED OUTPUT */}
        <section className="container section-block">
          <div className="section-introduction">
            <p className="section-kicker">STRUCTURED, NOT GENERIC</p>
            <h2>Every result follows the same dependable structure.</h2>
            <p>Missing evidence is not silently omitted. Lumen explicitly displays “Not found in the context.”</p>
          </div>

          <div className="structured-grid">
            {structuredSections.map((section, idx) => (
              <article key={idx} className="structured-card">
                <span>{section.number}</span>
                <div>
                  <h3>{section.title}</h3>
                  <p>{section.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* VISUAL INTELLIGENCE */}
        <section className="visual-section">
          <div className="container visual-grid">
            <div className="visual-preview">
              <header>
                <div>
                  <span className="visual-preview-label">VISUAL REGION</span>
                  <strong>Customer Activity</strong>
                </div>
                <small>Last 24 hours</small>
              </header>

              <div className="visual-kpis">
                <article><span>Sign ups</span><strong>549</strong></article>
                <article><span>Logins</span><strong>3,483</strong></article>
                <article><span>Support calls</span><strong>86</strong></article>
              </div>

              <div className="visual-chart">
                <div className="visual-chart-lines"><i></i><i></i><i></i><i></i></div>
                <svg viewBox="0 0 540 210" aria-hidden="true">
                  <path className="visual-area" d="M10 180 C80 160,105 145,150 148 C220 151,230 105,290 112 C350 119,365 72,420 79 C480 86,500 38,530 28 L530 200 L10 200 Z" />
                  <path className="visual-line" d="M10 180 C80 160,105 145,150 148 C220 151,230 105,290 112 C350 119,365 72,420 79 C480 86,500 38,530 28" />
                </svg>
              </div>

              <div className="visual-selection-box">
                <span></span>
                <small>Selected region</small>
              </div>
            </div>

            <div>
              <p className="section-kicker">CHART AND DASHBOARD UNDERSTANDING</p>
              <h2>Explain the pattern, not only the labels.</h2>
              <p>Lumen combines the selected screenshot with nearby accessible text to interpret visible trends while preserving uncertainty.</p>
              <div className="analysis-output">
                <strong>Analyst-style interpretation</strong>
                <p>Activity increases across the visible period and reaches its highest level near the end. The strongest acceleration appears in the second half, although the screenshot alone does not establish what caused the change.</p>
              </div>
              <div className="visual-capabilities">
                <span>Growth and decline</span>
                <span>Highest and lowest</span>
                <span>Outliers</span>
                <span>Comparisons</span>
                <span>Anomalies</span>
                <span>Business implications</span>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="container section-block" id="features">
          <div className="section-introduction">
            <p className="section-kicker">BUILT FOR REAL BROWSER WORK</p>
            <h2>More than a one-shot summarizer.</h2>
          </div>

          <div className="feature-grid">
            {productFeatures.map((feat, idx) => (
              <article key={idx} className="feature-card">
                <span className="feature-icon">{renderIcon(feat.icon)}</span>
                <h3>{feat.title}</h3>
                <p>{feat.copy}</p>
              </article>
            ))}
          </div>
        </section>

        {/* DOMAIN AWARE INTELLIGENCE */}
        <section className="domain-section">
          <div className="container">
            <div className="section-introduction">
              <p className="section-kicker">DOMAIN-AWARE INTELLIGENCE</p>
              <h2>Different pages deserve different summaries.</h2>
              <p>Lumen adapts its instructions to the page type instead of forcing every source into a generic article summary.</p>
            </div>
            <div className="context-cloud">
              {supportedContexts.map((ctx, idx) => (
                <span key={idx}>{ctx}</span>
              ))}
            </div>
          </div>
        </section>

        {/* PRIVACY SECTION */}
        <section className="container privacy-section" id="privacy">
          <div className="privacy-copy">
            <p className="section-kicker">PRIVACY BY DESIGN</p>
            <h2>Nothing is captured until you deliberately request it.</h2>
            <p>Lumen does not scrape pages in the background. Content is read only after a toolbar-icon click, keyboard shortcut interaction, or an explicit capture action inside the sidebar.</p>
          </div>

          <div className="privacy-grid">
            <article className="privacy-card primary">
              <span>{renderIcon('Shield', 23)}</span>
              <div>
                <strong>Sensitive-pattern redaction</strong>
                <p>Privacy mode detects and replaces email addresses, phone numbers, PAN-like values, Aadhaar-like values, API keys, bearer tokens, JWTs, card-like values, and IP addresses before text leaves the browser.</p>
              </div>
            </article>

            <article className="privacy-card">
              <span>{renderIcon('Lock', 22)}</span>
              <div>
                <strong>No bundled model key</strong>
                <p>Users configure their own provider, endpoint, text model, vision model (e.g., <code>qwen/qwen3.6-27b</code>), and API key in extension settings.</p>
              </div>
            </article>

            <article className="privacy-card">
              <span>{renderIcon('History', 22)}</span>
              <div>
                <strong>Local history controls</strong>
                <p>Saved summaries remain under the user's control and can be removed individually, in a selected group, or all at once.</p>
              </div>
            </article>
          </div>
        </section>

        {/* FAILURE HONESTY */}
        <section className="failure-section">
          <div className="container failure-grid">
            <div>
              <p className="section-kicker">FAILURE HONESTY</p>
              <h2>When Lumen cannot read something, it says so.</h2>
              <p>Browser internal pages, protected frames, restricted PDFs, cross-origin content, and authentication walls may be inaccessible. Lumen must never pretend that blocked content was captured.</p>
            </div>

            <article className="failure-preview">
              <span className="failure-icon">{renderIcon('Alert', 23)}</span>
              <small>ACCESS RESTRICTED</small>
              <h3>Unable to summarize this page.</h3>
              <p>Chrome security policies prevent extensions from accessing this content.</p>
              <div>
                <strong>Try:</strong>
                <ul>
                  <li>Whole Page on a supported website</li>
                  <li>Visual Region capture</li>
                  <li>Text Selection</li>
                </ul>
              </div>
              <span className="failure-footnote">No content was sent to the model.</span>
            </article>
          </div>
        </section>

        {/* SHORTCUT */}
        <section className="container section-block shortcut-section">
          <div>
            <p className="section-kicker">ONE SHORTCUT</p>
            <h2>Open the sidebar without leaving your place.</h2>
            <p>Press the shortcut, choose a capture mode, and continue working in the same tab.</p>
          </div>
          <div className="shortcut-keys">
            <kbd>Alt</kbd><span>+</span><kbd>Shift</kbd><span>+</span><kbd>S</kbd>
          </div>
        </section>

        {/* INSTALLATION */}
        <section className="container install-section" id="install">
          <div className="install-heading">
            <p className="section-kicker">INSTALL IN CHROME</p>
            <h2>Load the unpacked extension and start testing.</h2>
            <p>Chrome Web Store publication is not required for local testing.</p>
          </div>

          <ol className="install-steps">
            <li>
              <span>01</span>
              <div><strong>Open extensions</strong><p>Visit <code>chrome://extensions</code> in Google Chrome.</p></div>
            </li>
            <li>
              <span>02</span>
              <div><strong>Enable Developer mode</strong><p>Use the toggle switch in the top-right corner.</p></div>
            </li>
            <li>
              <span>03</span>
              <div><strong>Load unpacked</strong><p>Click <code>Load unpacked</code> and select <code>Lumen_Optimizer/extension</code>.</p></div>
            </li>
            <li>
              <span>04</span>
              <div><strong>Configure the provider</strong><p>Open Lumen settings and set your API key and vision model (<code>qwen/qwen3.6-27b</code>).</p></div>
            </li>
          </ol>

          <div className="install-callout">
            <span>{renderIcon('Download', 21)}</span>
            <div>
              <strong>Download Manifest File</strong>
              <p>Get <a href="/manifest.json" download="manifest.json" style={{ color: '#E8FF3B', textDecoration: 'underline' }}>manifest.json</a> directly to configure or install the extension locally on your device.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="container footer">
        <a className="footer-brand" href="#top">
          {renderLumenLogo(32)}
          <span>Lumen</span>
        </a>
        <p>On-screen intelligence activated only when requested.</p>
        <span>Manifest V3</span>
      </footer>
    </div>
  );
};
