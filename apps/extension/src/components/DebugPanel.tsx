import React from 'react';
import { ProcessMetrics } from '@lumen/shared';

interface DebugPanelProps {
  metrics: ProcessMetrics;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ metrics }) => {
  return (
    <details style={{ background: '#050607', border: '1px solid #272A2D', borderRadius: '6px', padding: '8px 12px', marginTop: '12px', fontSize: '11px', color: '#929292' }}>
      <summary style={{ cursor: 'pointer', color: '#E8FF3B', fontWeight: 600 }}>🛠️ Developer Debug Metrics</summary>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px', fontFamily: 'monospace' }}>
        <div>Block Count: <span style={{ color: '#FAFAF5' }}>{metrics.blockCount}</span></div>
        <div>Word Count: <span style={{ color: '#FAFAF5' }}>{metrics.wordCount}</span></div>
        <div>Truncated: <span style={{ color: metrics.isTruncated ? '#FF5C5C' : '#8FE388' }}>{metrics.isTruncated ? 'YES' : 'NO'}</span></div>
        <div>First Token: <span style={{ color: '#FAFAF5' }}>{metrics.firstTokenTimeMs}ms</span></div>
        <div>Total Latency: <span style={{ color: '#FAFAF5' }}>{metrics.totalTimeMs}ms</span></div>
        <div>Model: <span style={{ color: '#FAFAF5' }}>{metrics.modelName}</span></div>
        <div>Payload Size: <span style={{ color: '#FAFAF5' }}>{(metrics.payloadSizeBytes / 1024).toFixed(1)} KB</span></div>
        <div>Confidence: <span style={{ color: '#E8FF3B' }}>{metrics.confidenceLevel.toUpperCase()}</span></div>
      </div>
    </details>
  );
};
