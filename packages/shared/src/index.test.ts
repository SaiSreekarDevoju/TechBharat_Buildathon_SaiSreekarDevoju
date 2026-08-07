import { describe, it, expect } from 'vitest';
import { redactSensitiveData } from './utils/redaction.js';
import { chunkExtractedBlocks } from './utils/chunking.js';
import { exportSummaryToMarkdown } from './utils/markdown.js';
import { SummaryResponseSchema } from './schemas/index.js';
import { ExtractedBlock, SummaryResponse } from './types/index.js';

describe('Shared Package Unit Tests', () => {
  it('redacts sensitive data patterns correctly', () => {
    const text = 'Contact john@example.com or call 555-123-4567. API key: gsk_1234567890abcdef123456789';
    const result = redactSensitiveData(text);
    expect(result.wasRedacted).toBe(true);
    expect(result.redactedText).toContain('[REDACTED_EMAIL]');
    expect(result.redactedText).toContain('[REDACTED_PHONE]');
    expect(result.redactedText).toContain('[REDACTED_API_KEY]');
  });

  it('chunks extracted blocks correctly', () => {
    const blocks: ExtractedBlock[] = Array.from({ length: 20 }, (_, i) => ({
      id: `block-${i + 1}`,
      type: 'paragraph',
      content: `This is paragraph number ${i + 1} with some text content to test chunking logic.`.repeat(10),
    }));

    const chunks = chunkExtractedBlocks(blocks);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].blocks.length).toBeGreaterThan(0);
    expect(chunks[0].id).toBe('chunk-1');
  });

  it('validates a complete SummaryResponse schema', () => {
    const dummySummary: SummaryResponse = {
      summary: {
        line1: 'Primary overview line.',
        line2: 'Next steps or secondary overview line.',
      },
      keyPoints: [{ text: 'Key point 1', evidence: ['block-1'], confidence: 'high' }],
      actions: [{ text: 'Action 1', owner: 'Alice', dueDate: '2026-09-01', evidence: ['block-2'], confidence: 'high' }],
      numbersMetrics: [{ label: 'Revenue', value: '$1M', context: 'Q2', evidence: ['block-3'], confidence: 'high' }],
      decisions: [{ text: 'Decision 1', evidence: ['block-4'], confidence: 'high' }],
      risks: [{ text: 'Risk 1', severity: 'medium', evidence: ['block-5'], confidence: 'high' }],
      source: {
        title: 'Test Page',
        url: 'https://example.com',
        captureMode: 'page',
        capturedAt: new Date().toISOString(),
        language: 'en',
        wordCount: 150,
      },
      warnings: [],
      coverage: {
        textCoverage: 'high',
        visualCoverage: 'high',
        unreadableAreas: [],
      },
    };

    const parsed = SummaryResponseSchema.safeParse(dummySummary);
    expect(parsed.success).toBe(true);
  });

  it('exports summary to markdown correctly containing all 6 required headings', () => {
    const dummySummary: SummaryResponse = {
      summary: { line1: 'Summary Line 1', line2: 'Summary Line 2' },
      keyPoints: [{ text: 'KP text', evidence: [], confidence: 'high' }],
      actions: [],
      numbersMetrics: [],
      decisions: [],
      risks: [],
      source: { title: 'Test Title', url: 'https://test.com', captureMode: 'page', capturedAt: new Date().toISOString(), language: 'en', wordCount: 50 },
      warnings: [],
      coverage: { textCoverage: 'high', visualCoverage: 'high', unreadableAreas: [] },
    };

    const markdown = exportSummaryToMarkdown(dummySummary);
    expect(markdown).toContain('# Test Title');
    expect(markdown).toContain('## 1. Summary');
    expect(markdown).toContain('## 2. Key Points');
    expect(markdown).toContain('## 3. Actions');
    expect(markdown).toContain('## 4. Numbers & Metrics');
    expect(markdown).toContain('## 5. Decisions');
    expect(markdown).toContain('## 6. Risks');
    expect(markdown).toContain('Not found in the context.');
  });
});
