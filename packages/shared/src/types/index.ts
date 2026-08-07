export type CaptureMode = 'page' | 'selection' | 'region';

export type SupportedLanguage = 'en' | 'hi' | 'te' | 'ta' | 'bn' | 'mr';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type RiskSeverity = 'low' | 'medium' | 'high' | 'unknown';

export interface SummaryOverview {
  line1: string;
  line2: string;
}

export interface KeyPointItem {
  text: string;
  evidence: string[];
  confidence: ConfidenceLevel;
}

export interface ActionItem {
  text: string;
  owner: string | null;
  dueDate: string | null;
  evidence: string[];
  confidence: ConfidenceLevel;
}

export interface NumberMetricItem {
  label: string;
  value: string;
  context: string;
  evidence: string[];
  confidence: ConfidenceLevel;
}

export interface DecisionItem {
  text: string;
  evidence: string[];
  confidence: ConfidenceLevel;
}

export interface RiskItem {
  text: string;
  severity: RiskSeverity;
  evidence: string[];
  confidence: ConfidenceLevel;
}

export interface SummarySource {
  title: string;
  url: string;
  captureMode: CaptureMode;
  capturedAt: string;
  language: string | null;
  wordCount: number;
}

export interface SummaryCoverage {
  textCoverage: ConfidenceLevel;
  visualCoverage: ConfidenceLevel;
  unreadableAreas: string[];
}

export interface SummaryResponse {
  summary: SummaryOverview;
  keyPoints: KeyPointItem[];
  actions: ActionItem[];
  numbersMetrics: NumberMetricItem[];
  decisions: DecisionItem[];
  risks: RiskItem[];
  source: SummarySource;
  warnings: string[];
  coverage: SummaryCoverage;
}

export interface ExtractedBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'table' | 'code' | 'caption' | 'metadata';
  content: string;
  level?: number;
  selector?: string;
}

export interface ExtractedPageContent {
  title: string;
  url: string;
  language: string | null;
  wordCount: number;
  blocks: ExtractedBlock[];
  rawText: string;
  pageType: 'generic' | 'article' | 'documentation' | 'paper' | 'pdf' | 'github_pr' | 'email' | 'issue_tracker' | 'dashboard' | 'spreadsheet' | 'news';
  isTruncated: boolean;
  unreadableReason?: string;
}

export interface RegionSelection {
  x: number;
  y: number;
  width: number;
  height: number;
  devicePixelRatio: number;
  scrollX: number;
  scrollY: number;
  windowWidth: number;
  windowHeight: number;
  imageDataUrl?: string;
}

export interface ChartObservation {
  label: string;
  value: string;
  confidence: ConfidenceLevel;
}

export interface ChartSeries {
  name: string;
  color?: string | null;
  observations: ChartObservation[];
}

export interface VisualEvidence {
  chartType: 'line' | 'bar' | 'area' | 'pie' | 'table' | 'unknown';
  title: string | null;
  timeRange: string | null;
  xAxis: string | null;
  yAxis: string | null;
  units: string | null;
  series: ChartSeries[];
  observedTrend: 'increasing' | 'decreasing' | 'flat' | 'mixed' | 'volatile' | 'unclear';
  limitations: string[];
}

export interface HistoryItem {
  id: string;
  title: string;
  url: string;
  timestamp: string;
  captureMode: CaptureMode;
  language: SupportedLanguage;
  summary: SummaryResponse;
  previewText: string;
  redactionApplied: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  blockCitations?: string[];
}

export interface UserOptions {
  groqApiKey: string;
  proxyUrl: string;
  model: string;
  visionModel: string;
  language: SupportedLanguage;
  privacyMode: boolean;
  localHistoryEnabled: boolean;
  theme: 'dark';
}

export interface TabSessionState {
  tabId: number;
  step: 'chooser' | 'selection_prompt' | 'loading' | 'summary' | 'error';
  summary: SummaryResponse | null;
  errorMessage: string | null;
  capturedBlocks: ExtractedBlock[];
  rawCapturedText: string;
  selectedText: string;
  contextText: string;
  croppedImageDataUrl?: string;
  metrics: ProcessMetrics | null;
  captureMode: CaptureMode;
  tabLanguage: SupportedLanguage;
  messages: ChatMessage[];
}

export interface RedactionResult {
  redactedText: string;
  wasRedacted: boolean;
  redactedCounts: Record<string, number>;
}

export interface ProcessMetrics {
  extractionTimeMs: number;
  firstTokenTimeMs: number;
  totalTimeMs: number;
  blockCount: number;
  wordCount: number;
  payloadSizeBytes: number;
  isTruncated: boolean;
  modelName: string;
  confidenceLevel: ConfidenceLevel;
}
