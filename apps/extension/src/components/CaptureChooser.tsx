import React from 'react';
import { CaptureMode } from '@lumen/shared';

interface CaptureChooserProps {
  onSelectMode: (mode: CaptureMode) => void;
}

export const CaptureChooser: React.FC<CaptureChooserProps> = ({ onSelectMode }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#E8FF3B', letterSpacing: '0.1em' }}>
        CHOOSE CAPTURE MODE
      </div>

      <div
        onClick={() => onSelectMode('page')}
        style={{
          background: '#111111',
          border: '1px solid #272A2D',
          borderRadius: '12px',
          padding: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#E8FF3B')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#272A2D')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ fontSize: '18px' }}>📄</span>
          <strong style={{ fontSize: '14px', color: '#FAFAF5' }}>Whole page</strong>
        </div>
        <p style={{ fontSize: '12px', color: '#929292' }}>
          Extract and condense readable text, tables, headers, and code from the full webpage.
        </p>
      </div>

      <div
        onClick={() => onSelectMode('selection')}
        style={{
          background: '#111111',
          border: '1px solid #272A2D',
          borderRadius: '12px',
          padding: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#E8FF3B')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#272A2D')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ fontSize: '18px' }}>📝</span>
          <strong style={{ fontSize: '14px', color: '#FAFAF5' }}>Current selection</strong>
        </div>
        <p style={{ fontSize: '12px', color: '#929292' }}>
          Focus purely on the passage of text you have highlighted on the page.
        </p>
      </div>

      <div
        onClick={() => onSelectMode('region')}
        style={{
          background: '#111111',
          border: '1px solid #272A2D',
          borderRadius: '12px',
          padding: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#E8FF3B')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#272A2D')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ fontSize: '18px' }}>📐</span>
          <strong style={{ fontSize: '14px', color: '#FAFAF5' }}>Draw a region</strong>
        </div>
        <p style={{ fontSize: '12px', color: '#929292' }}>
          Select a rectangular area over a chart, graph, dashboard, table, or PDF section.
        </p>
      </div>

      <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(232, 255, 59, 0.05)', borderRadius: '8px', border: '1px solid rgba(232, 255, 59, 0.2)', fontSize: '11px', color: '#E8E8E0' }}>
        💡 <strong>Shortcut:</strong> Press <kbd style={{ background: '#181818', padding: '2px 6px', borderRadius: '4px', border: '1px solid #333' }}>Alt+Shift+S</kbd> anytime to open Lumen.
      </div>
    </div>
  );
};
