import React, { useState } from 'react';
import { SummaryResponse, SupportedLanguage, LANGUAGE_NAMES } from '@lumen/shared';
import { exportSummaryToMarkdown, exportSummaryToPlainText, NOT_FOUND_TEXT } from '@lumen/shared';
import { sendMessageToActiveTab } from '../lib/tab.js';

interface SummaryViewProps {
  summary: SummaryResponse;
  currentLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  onNewCapture: () => void;
  onRegenerateLanguage?: (lang: SupportedLanguage) => void;
  onHighlightBlock?: (blockId: string, textSnippet?: string) => void;
  isRegenerating?: boolean;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  summary,
  currentLanguage,
  targetLanguage,
  onNewCapture,
  onRegenerateLanguage,
  onHighlightBlock,
  isRegenerating = false,
}) => {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      const text = exportSummaryToPlainText(summary);
      await navigator.clipboard.writeText(text);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      setCopyFeedback('Failed');
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  };

  const handleExportMarkdown = () => {
    const md = exportSummaryToMarkdown(summary);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumen-brief-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCitationClick = (blockId?: string, textSnippet?: string) => {
    if (onHighlightBlock && blockId) {
      onHighlightBlock(blockId, textSnippet);
    } else {
      sendMessageToActiveTab({ action: 'HIGHLIGHT_BLOCK', blockId, textSnippet }).catch(() => {});
    }
  };

  const { source, summary: overview, keyPoints, actions, numbersMetrics, decisions, risks, warnings } = summary;
  const isDiffLang = targetLanguage !== currentLanguage;
  const canRegenerate = !isRegenerating && isDiffLang;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header bar actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
          {source.title || 'Summary Brief'}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={handleCopy}
            style={{ padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '11px', color: 'var(--text-primary)' }}
            title="Copy plain text"
          >
            📋 {copyFeedback || 'Copy'}
          </button>
          <button
            onClick={handleExportMarkdown}
            style={{ padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '11px', color: 'var(--text-primary)' }}
            title="Export Markdown file"
          >
            📥 Markdown
          </button>
          <button
            onClick={onNewCapture}
            style={{ padding: '4px 8px', background: 'var(--lemon-primary)', border: 'none', borderRadius: '4px', fontSize: '11px', color: '#0A0A0A', fontWeight: 'bold' }}
          >
            + New
          </button>
        </div>
      </div>

      {/* Language Bar (Requirement 4) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Language: <strong style={{ color: 'var(--text-primary)' }}>{LANGUAGE_NAMES[currentLanguage] || currentLanguage}</strong>
          </span>
          {isDiffLang && (
            <span style={{ fontSize: '10px', color: 'var(--lemon-primary)' }}>
              Settings language: {LANGUAGE_NAMES[targetLanguage] || targetLanguage}
            </span>
          )}
        </div>
        <button
          disabled={!canRegenerate}
          onClick={() => canRegenerate && onRegenerateLanguage && onRegenerateLanguage(targetLanguage)}
          title={
            !isDiffLang
              ? 'Choose a different language from Settings to regenerate the brief.'
              : `Regenerate brief in ${LANGUAGE_NAMES[targetLanguage] || targetLanguage}`
          }
          style={{
            marginLeft: 'auto',
            padding: '6px 12px',
            background: canRegenerate ? 'var(--lemon-primary)' : 'var(--bg-tertiary)',
            color: canRegenerate ? '#0A0A0A' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '11px',
            borderRadius: '6px',
            border: 'none',
            cursor: canRegenerate ? 'pointer' : 'not-allowed',
            opacity: canRegenerate ? 1 : 0.6,
          }}
        >
          {isRegenerating ? '🔄 Regenerating...' : '🔄 Regenerate Brief'}
        </button>
      </div>

      {warnings && warnings.length > 0 && (
        <div style={{ padding: '8px 12px', background: 'rgba(255, 92, 92, 0.1)', border: '1px solid var(--error)', borderRadius: '6px', color: 'var(--error)', fontSize: '11px' }}>
          ⚠️ {warnings.join(' ')}
        </div>
      )}

      {/* 1. SUMMARY */}
      <section style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
        <h4 style={{ color: 'var(--lemon-primary)', fontSize: '12px', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>01</span> SUMMARY
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '6px', fontWeight: 500 }}>{overview.line1}</p>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{overview.line2}</p>
      </section>

      {/* 2. KEY POINTS (Click to highlight source section on webpage) */}
      <section style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
        <h4 style={{ color: 'var(--lemon-primary)', fontSize: '12px', letterSpacing: '0.05em', marginBottom: '8px' }}>02 KEY POINTS</h4>
        {keyPoints.length === 0 || (keyPoints.length === 1 && keyPoints[0].text === NOT_FOUND_TEXT) ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{NOT_FOUND_TEXT}</div>
        ) : (
          <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {keyPoints.map((kp, idx) => (
              <li
                key={idx}
                onClick={() => handleCitationClick(kp.evidence?.[0], kp.text)}
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: '6px',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                title="Click to locate and highlight exact source section on webpage"
              >
                {kp.text}
                <span style={{ marginLeft: '6px', color: 'var(--lemon-primary)', fontSize: '10px', fontWeight: 600 }}>
                  🎯 Highlight
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 3. ACTIONS */}
      <section style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
        <h4 style={{ color: 'var(--lemon-primary)', fontSize: '12px', letterSpacing: '0.05em', marginBottom: '8px' }}>03 ACTIONS</h4>
        {actions.length === 0 || (actions.length === 1 && actions[0].text === NOT_FOUND_TEXT) ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{NOT_FOUND_TEXT}</div>
        ) : (
          <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {actions.map((act, idx) => (
              <li key={idx} style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {act.text}
                {act.owner && <span style={{ color: 'var(--info)', marginLeft: '6px', fontSize: '11px' }}>({act.owner})</span>}
                {act.dueDate && <span style={{ color: 'var(--lemon-muted)', marginLeft: '4px', fontSize: '11px' }}>[Due: {act.dueDate}]</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 4. NUMBERS & METRICS */}
      <section style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
        <h4 style={{ color: 'var(--lemon-primary)', fontSize: '12px', letterSpacing: '0.05em', marginBottom: '8px' }}>04 NUMBERS & METRICS</h4>
        {numbersMetrics.length === 0 || (numbersMetrics.length === 1 && numbersMetrics[0].label === NOT_FOUND_TEXT) ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{NOT_FOUND_TEXT}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {numbersMetrics.map((nm, idx) => (
              <div key={idx} style={{ background: 'var(--bg-tertiary)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{nm.label}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--lemon-primary)' }}>{nm.value}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. DECISIONS */}
      <section style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
        <h4 style={{ color: 'var(--lemon-primary)', fontSize: '12px', letterSpacing: '0.05em', marginBottom: '8px' }}>05 DECISIONS</h4>
        {decisions.length === 0 || (decisions.length === 1 && decisions[0].text === NOT_FOUND_TEXT) ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{NOT_FOUND_TEXT}</div>
        ) : (
          <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {decisions.map((dec, idx) => (
              <li key={idx} style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {dec.text}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 6. RISKS */}
      <section style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
        <h4 style={{ color: 'var(--lemon-primary)', fontSize: '12px', letterSpacing: '0.05em', marginBottom: '8px' }}>06 RISKS</h4>
        {risks.length === 0 || (risks.length === 1 && risks[0].text === NOT_FOUND_TEXT) ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{NOT_FOUND_TEXT}</div>
        ) : (
          <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {risks.map((r, idx) => (
              <li key={idx} style={{ fontSize: '12px', color: r.severity === 'high' ? 'var(--error)' : 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 700, fontSize: '10px', padding: '2px 4px', borderRadius: '3px', background: r.severity === 'high' ? 'rgba(255,92,92,0.2)' : 'var(--bg-tertiary)', marginRight: '6px' }}>
                  {r.severity.toUpperCase()}
                </span>
                {r.text}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
