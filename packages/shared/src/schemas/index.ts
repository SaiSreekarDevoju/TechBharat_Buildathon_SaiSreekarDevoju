import { z } from 'zod';

export const ConfidenceLevelSchema = z.enum(['high', 'medium', 'low']);
export const RiskSeveritySchema = z.enum(['low', 'medium', 'high', 'unknown']);
export const CaptureModeSchema = z.enum(['page', 'selection', 'region']);
export const SupportedLanguageSchema = z.enum(['en', 'hi', 'te', 'ta', 'bn', 'mr']);

export const SummaryOverviewSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().min(1),
});

export const KeyPointItemSchema = z.object({
  text: z.string(),
  evidence: z.array(z.string()).default([]),
  confidence: ConfidenceLevelSchema.default('medium'),
});

export const ActionItemSchema = z.object({
  text: z.string(),
  owner: z.string().nullable().default(null),
  dueDate: z.string().nullable().default(null),
  evidence: z.array(z.string()).default([]),
  confidence: ConfidenceLevelSchema.default('medium'),
});

export const NumberMetricItemSchema = z.object({
  label: z.string(),
  value: z.string(),
  context: z.string().default(''),
  evidence: z.array(z.string()).default([]),
  confidence: ConfidenceLevelSchema.default('medium'),
});

export const DecisionItemSchema = z.object({
  text: z.string(),
  evidence: z.array(z.string()).default([]),
  confidence: ConfidenceLevelSchema.default('medium'),
});

export const RiskItemSchema = z.object({
  text: z.string(),
  severity: RiskSeveritySchema.default('unknown'),
  evidence: z.array(z.string()).default([]),
  confidence: ConfidenceLevelSchema.default('medium'),
});

export const SummarySourceSchema = z.object({
  title: z.string().default('Untitled Page'),
  url: z.string().default(''),
  captureMode: CaptureModeSchema.default('page'),
  capturedAt: z.string().default(() => new Date().toISOString()),
  language: z.string().nullable().default('en'),
  wordCount: z.number().default(0),
});

export const SummaryCoverageSchema = z.object({
  textCoverage: ConfidenceLevelSchema.default('high'),
  visualCoverage: ConfidenceLevelSchema.default('high'),
  unreadableAreas: z.array(z.string()).default([]),
});

export const SummaryResponseSchema = z.object({
  summary: SummaryOverviewSchema,
  keyPoints: z.array(KeyPointItemSchema).default([]),
  actions: z.array(ActionItemSchema).default([]),
  numbersMetrics: z.array(NumberMetricItemSchema).default([]),
  decisions: z.array(DecisionItemSchema).default([]),
  risks: z.array(RiskItemSchema).default([]),
  source: SummarySourceSchema,
  warnings: z.array(z.string()).default([]),
  coverage: SummaryCoverageSchema,
});

export const FollowUpRequestSchema = z.object({
  question: z.string().min(1),
  capturedBlocks: z.array(
    z.object({
      id: z.string(),
      content: z.string(),
    })
  ),
  previousMessages: z.array(
    z.object({
      sender: z.enum(['user', 'assistant']),
      text: z.string(),
    })
  ).default([]),
  language: SupportedLanguageSchema.default('en'),
});

export type SummaryResponseInput = z.input<typeof SummaryResponseSchema>;
