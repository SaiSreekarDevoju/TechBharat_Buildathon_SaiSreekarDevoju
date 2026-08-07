import { SummaryResponse, UserOptions, CaptureMode, SupportedLanguage, redactSensitiveData } from '@lumen/shared';

export interface SummarizeParams {
  captureMode: CaptureMode;
  content?: string;
  selectedText?: string;
  contextText?: string;
  imageDataUrl?: string;
  title: string;
  url: string;
  options: UserOptions;
  onChunk?: (chunk: string) => void;
  signal?: AbortSignal;
}

export async function requestSummary(params: SummarizeParams): Promise<SummaryResponse> {
  const { captureMode, content, selectedText, contextText, imageDataUrl, title, url, options, onChunk, signal } = params;

  const endpoint = `${options.proxyUrl.replace(/\/$/, '')}/api/summarize`;

  // Privacy Redaction is always on: redact text locally BEFORE network transmission.
  const safeContent = redactSensitiveData(String(content || '')).redactedText;
  const safeSelectedText = redactSensitiveData(String(selectedText || '')).redactedText;
  const safeContextText = redactSensitiveData(String(contextText || '')).redactedText;

  const payload = {
    captureMode,
    content: safeContent,
    selectedText: safeSelectedText,
    contextText: safeContextText,
    imageDataUrl,
    title,
    url,
    language: options.language,
    privacyMode: true,
    groqApiKey: options.groqApiKey || undefined,
    model: options.model,
    visionModel: options.visionModel,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.error || `Server HTTP Error ${response.status}`);
  }

  if (!response.body) {
    throw new Error('Response body is empty.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let finalResult: SummaryResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          if (json.error) {
            throw new Error(json.error);
          }
          if (json.chunk && onChunk) {
            onChunk(json.chunk);
          }
          if (json.completed && json.result) {
            finalResult = json.result;
          }
        } catch (e: any) {
          if (e.message && !e.message.includes('JSON')) {
            throw e;
          }
        }
      }
    }
  }

  if (!finalResult) {
    throw new Error('Summary generation ended without producing valid result structure.');
  }

  return finalResult;
}

export async function requestFollowUp(params: {
  question: string;
  contextSummary: SummaryResponse;
  capturedBlocks: any;
  captureMode?: CaptureMode;
  imageDataUrl?: string;
  options: UserOptions;
  onChunk: (chunk: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const { question, contextSummary, capturedBlocks, captureMode, imageDataUrl, options, onChunk, signal } = params;
  const endpoint = `${options.proxyUrl.replace(/\/$/, '')}/api/followup`;

  const safeQuestion = redactSensitiveData(String(question || '')).redactedText;
  const safeSummary = redactSensitiveData(JSON.stringify(contextSummary || {})).redactedText;
  const safeBlocks = redactSensitiveData(typeof capturedBlocks === 'string' ? capturedBlocks : JSON.stringify(capturedBlocks || '')).redactedText;

  const payload = {
    question: safeQuestion,
    contextSummary: safeSummary,
    capturedBlocks: safeBlocks,
    captureMode,
    imageDataUrl: captureMode === 'region' ? imageDataUrl : undefined,
    language: options.language,
    groqApiKey: options.groqApiKey || undefined,
    model: options.model,
    visionModel: options.visionModel,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.error || `Server HTTP Error ${response.status}`);
  }

  if (!response.body) {
    throw new Error('Response body is empty.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullAnswer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          if (json.error) {
            throw new Error(json.error);
          }
          if (json.chunk) {
            fullAnswer += json.chunk;
            onChunk(json.chunk);
          }
        } catch (e: any) {
          if (e.message && !e.message.includes('JSON')) {
            throw e;
          }
        }
      }
    }
  }

  return fullAnswer;
}
