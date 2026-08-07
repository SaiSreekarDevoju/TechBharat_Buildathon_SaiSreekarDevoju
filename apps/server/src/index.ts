import express, { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import {
  SYSTEM_PROMPT_SUMMARY,
  SYSTEM_PROMPT_FOLLOWUP,
  buildWholePagePrompt,
  buildSelectionPrompt,
  buildRegionPrompt,
  buildFollowUpPrompt,
  SummaryResponseSchema,
  DEFAULT_GROQ_MODEL,
  DEFAULT_GROQ_VISION_MODEL,
  redactSensitiveData,
  NOT_FOUND_TEXT,
} from '@lumen/shared';
import { callGroqStream, callGroqNonStreaming, GroqMessage } from './providers/groq.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
app.use(express.json({ limit: '12mb' }));
app.use(cors({ origin: (_origin, callback) => callback(null, true) }));
app.use('/api/', rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  message: { error: 'Too many requests from this client. Please try again later.' },
}));

const LANGUAGE_LABELS: Record<string, string> = {
  hi: 'Hindi', te: 'Telugu', ta: 'Tamil', bn: 'Bengali', mr: 'Marathi',
};
const LOCALIZER_MODEL = 'openai/gpt-oss-120b';
const LONG_PAGE_CHAR_THRESHOLD = 15000;
const CHUNK_TARGET_CHARS = 10000;
const CHUNK_OVERLAP_CHARS = 500;
const LONG_PAGE_MODEL = 'openai/gpt-oss-120b';
const FAST_FOLLOWUP_MODEL = 'openai/gpt-oss-20b';
const MAX_FOLLOWUP_CONTEXT_CHARS = 14000;

function emptyItems() {
  return {
    keyPoints: [{ text: NOT_FOUND_TEXT, evidence: [], confidence: 'low' }],
    actions: [{ text: NOT_FOUND_TEXT, owner: null, dueDate: null, evidence: [], confidence: 'low' }],
    numbersMetrics: [{ label: NOT_FOUND_TEXT, value: '', context: '', evidence: [], confidence: 'low' }],
    decisions: [{ text: NOT_FOUND_TEXT, evidence: [], confidence: 'low' }],
    risks: [{ text: NOT_FOUND_TEXT, severity: 'unknown', evidence: [], confidence: 'low' }],
  };
}

function normalizeSummary(value: any, meta: { title: string; url: string; captureMode: string; language: string; wordCount: number }) {
  const empty = emptyItems();
  const out: any = value && typeof value === 'object' ? value : {};
  if (!out.summary || typeof out.summary !== 'object') out.summary = {};
  if (!String(out.summary.line1 || '').trim()) out.summary.line1 = 'Summary could not be produced from the supplied context.';
  if (!String(out.summary.line2 || '').trim()) out.summary.line2 = 'No unsupported facts were added.';
  for (const key of ['keyPoints', 'actions', 'numbersMetrics', 'decisions', 'risks']) {
    if (!Array.isArray(out[key]) || out[key].length === 0) out[key] = (empty as any)[key];
  }
  out.source = {
    ...(out.source || {}),
    title: meta.title,
    url: meta.url,
    captureMode: meta.captureMode,
    capturedAt: out.source?.capturedAt || new Date().toISOString(),
    language: meta.language,
    wordCount: meta.wordCount,
  };
  if (!Array.isArray(out.warnings)) out.warnings = [];
  if (!out.coverage) out.coverage = { textCoverage: 'high', visualCoverage: meta.captureMode === 'region' ? 'high' : 'low', unreadableAreas: [] };
  return out;
}

async function generateJson(messages: GroqMessage[], apiKey: string, model: string, signal?: AbortSignal, maxTokens = 5500): Promise<any> {
  let raw = await callGroqNonStreaming(messages, apiKey, model, signal, true, maxTokens);
  try { return JSON.parse(raw); } catch {}

  const repair: GroqMessage[] = [
    { role: 'system', content: 'Repair the supplied model output into one valid JSON object. Preserve every factual detail. Do not invent anything. Return JSON only.' },
    { role: 'user', content: raw },
  ];
  raw = await callGroqNonStreaming(repair, apiKey, LOCALIZER_MODEL, signal, true, maxTokens);
  try { return JSON.parse(raw); } catch {
    throw new Error('The AI returned an invalid structured response after a repair attempt. Please retry the capture.');
  }
}

function splitLongText(text: string): string[] {
  if (text.length <= LONG_PAGE_CHAR_THRESHOLD) return [text];
  const paragraphs = text.split(/\n{2,}/).map(x => x.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  for (const p of paragraphs) {
    if (current && current.length + p.length + 2 > CHUNK_TARGET_CHARS) {
      chunks.push(current);
      const overlap = current.slice(Math.max(0, current.length - CHUNK_OVERLAP_CHARS));
      current = `${overlap}\n\n${p}`;
    } else {
      current += `${current ? '\n\n' : ''}${p}`;
    }
  }
  if (current) chunks.push(current);
  if (chunks.length === 0) {
    for (let i = 0; i < text.length; i += CHUNK_TARGET_CHARS - CHUNK_OVERLAP_CHARS) {
      chunks.push(text.slice(i, i + CHUNK_TARGET_CHARS));
    }
  }
  return chunks;
}

function looksLikeContextLimitError(error: unknown): boolean {
  const msg = String((error as any)?.message || error || '').toLowerCase();
  return /413|too large|context|token|request.*large|payload.*large|max.*token/.test(msg);
}

function chooseGroundedLongPageModel(requestedModel: string): string {
  // Compound is excellent when tools/web research are desired, but internal-page
  // summarization must remain source-only and predictable. Use Groq's production
  // long-context text model for the map/merge stages when Compound was selected.
  return requestedModel === 'groq/compound' || requestedModel === 'groq/compound-mini'
    ? LONG_PAGE_MODEL
    : requestedModel;
}

async function summarizeChunkResilient(
  chunk: string,
  title: string,
  url: string,
  apiKey: string,
  model: string,
  signal?: AbortSignal,
  depth = 0
): Promise<any> {
  try {
    return await generateJson([
      { role: 'system', content: SYSTEM_PROMPT_SUMMARY },
      {
        role: 'user',
        content: `${buildWholePagePrompt(chunk, title, url, 'en')}\n\nThis is one part of a longer webpage. Extract only the important grounded facts from THIS PART. Keep every section concise for a later merge.`,
      },
    ], apiKey, model, signal, 3600);
  } catch (error) {
    // If any provider/model rejects a large piece, transparently split it again.
    // This prevents a user-facing "too long" failure for whole-page capture.
    if (depth < 3 && chunk.length > 4500 && (looksLikeContextLimitError(error) || chunk.length > 8000)) {
      const midpoint = Math.floor(chunk.length / 2);
      const boundary = chunk.lastIndexOf('\n', midpoint);
      const cut = boundary > chunk.length * 0.3 ? boundary : midpoint;
      const [a, b] = [chunk.slice(0, cut), chunk.slice(cut)];
      const children = await Promise.all([
        summarizeChunkResilient(a, title, url, apiKey, model, signal, depth + 1),
        summarizeChunkResilient(b, title, url, apiKey, model, signal, depth + 1),
      ]);
      return generateJson([
        { role: 'system', content: SYSTEM_PROMPT_SUMMARY },
        { role: 'user', content: `Merge these two grounded partial summaries without inventing facts. Deduplicate overlap and return the standard Lumen JSON schema only.\n\n${JSON.stringify(children)}` },
      ], apiKey, model, signal, 4000);
    }
    throw error;
  }
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

async function mergePartialSummaries(partials: any[], title: string, url: string, language: any, apiKey: string, model: string, signal?: AbortSignal): Promise<any> {
  // Hierarchical merge keeps even extremely long pages below request limits.
  let layer = partials;
  while (layer.length > 1) {
    const groups: any[][] = [];
    for (let i = 0; i < layer.length; i += 6) groups.push(layer.slice(i, i + 6));
    layer = await mapWithConcurrency(groups, 2, async (group) => {
      const mergePrompt = `Merge these grounded partial summaries from the SAME webpage. Deduplicate overlap. Preserve exact names, dates, numbers, units, decisions, actions and risks. Never invent facts. Return the standard Lumen JSON schema only. Page: ${title} (${url}).\n\n${JSON.stringify(group)}`;
      return generateJson([
        { role: 'system', content: SYSTEM_PROMPT_SUMMARY },
        { role: 'user', content: mergePrompt },
      ], apiKey, model, signal, 5000);
    });
  }

  const finalPrompt = `Polish this grounded webpage brief into the final Lumen schema with exactly Summary (2 useful lines), Key Points, Actions, Numbers & Metrics, Decisions, Risks. Do not invent facts. If a category is genuinely absent use "${NOT_FOUND_TEXT}". Target language code: ${language}. Return JSON only.\n\n${JSON.stringify(layer[0])}`;
  return generateJson([
    { role: 'system', content: SYSTEM_PROMPT_SUMMARY },
    { role: 'user', content: finalPrompt },
  ], apiKey, model, signal, 5500);
}

async function summarizeLongPage(content: string, title: string, url: string, language: any, apiKey: string, requestedModel: string, signal?: AbortSignal): Promise<any> {
  const chunks = splitLongText(content);
  const model = chooseGroundedLongPageModel(requestedModel);
  const partials = await mapWithConcurrency(chunks, 3, (chunk) =>
    summarizeChunkResilient(chunk, title, url, apiKey, model, signal)
  );
  return mergePartialSummaries(partials, title, url, language, apiKey, model, signal);
}

async function localizeSummary(parsed: any, language: string, apiKey: string, signal?: AbortSignal): Promise<any> {
  if (language === 'en' || !LANGUAGE_LABELS[language]) return parsed;
  const target = LANGUAGE_LABELS[language];
  const messages: GroqMessage[] = [
    {
      role: 'system',
      content: `You are Lumen's strict localization layer. Translate EVERY human-readable explanatory string into fluent native ${target}. Native ${target} script is mandatory. Preserve JSON keys, numbers, dates, URLs, code, model names, evidence IDs, confidence/severity enum values, captureMode, and source metadata. Preserve the exact placeholder phrase \"${NOT_FOUND_TEXT}\" unchanged so the UI can recognize empty sections. Do not add, remove, or reinterpret facts. Return JSON only.`,
    },
    { role: 'user', content: JSON.stringify(parsed) },
  ];
  try {
    const translated = await generateJson(messages, apiKey, LOCALIZER_MODEL, signal, 6000);
    translated.source = { ...(translated.source || parsed.source || {}), language };
    return translated;
  } catch (err) {
    console.warn('[Lumen] Localization pass failed:', err);
    throw new Error(`The brief was generated, but reliable ${target} localization failed. Please retry Regenerate Brief.`);
  }
}

app.get('/health', (_req, res) => res.json({ status: 'ok', name: 'Lumen Proxy Server', timestamp: new Date().toISOString(), privacyRedaction: 'always-on' }));

app.post('/api/summarize', async (req: Request, res: Response) => {
  const abortController = new AbortController();
  res.on('close', () => { if (!res.writableEnded) abortController.abort(); });
  try {
    const {
      captureMode = 'page', content = '', selectedText = '', contextText = '', imageDataUrl,
      title = 'Untitled Page', url = '', language = 'en', groqApiKey: userKey,
      model: userModel, visionModel: userVisionModel,
    } = req.body;
    const apiKey = userKey || process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'Missing Groq API Key.' });

    // Privacy Redaction is intentionally ALWAYS ON. Client flags cannot disable it.
    const processedContent = redactSensitiveData(String(content || '')).redactedText;
    const processedSelectedText = redactSensitiveData(String(selectedText || '')).redactedText;
    const processedContextText = redactSensitiveData(String(contextText || '')).redactedText;
    const wordCount = (processedContent || processedSelectedText || processedContextText).split(/\s+/).filter(Boolean).length;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`data: ${JSON.stringify({ chunk: 'Analyzing grounded context…' })}\n\n`);

    let parsed: any;
    if (captureMode === 'selection') {
      if (!processedSelectedText.trim()) throw new Error('No selected text was received. Highlight text and try again.');
      parsed = await generateJson([
        { role: 'system', content: SYSTEM_PROMPT_SUMMARY },
        { role: 'user', content: buildSelectionPrompt(processedSelectedText, '', title, url, language) },
      ], apiKey, userModel || process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL, abortController.signal, 5000);
    } else if (captureMode === 'region') {
      if (!imageDataUrl) throw new Error('No cropped region image was received. Draw the region again.');
      parsed = await generateJson([
        { role: 'system', content: SYSTEM_PROMPT_SUMMARY },
        { role: 'user', content: [
          { type: 'text', text: buildRegionPrompt(processedContextText, title, url, language) },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ] },
      ], apiKey, userVisionModel || process.env.GROQ_VISION_MODEL || DEFAULT_GROQ_VISION_MODEL, abortController.signal, 5000);
    } else {
      if (!processedContent.trim()) throw new Error('No readable page content was captured. Try Current Selection or Draw a Region.');
      const model = userModel || process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
      if (processedContent.length > LONG_PAGE_CHAR_THRESHOLD) {
        res.write(`data: ${JSON.stringify({ chunk: 'Large page detected — summarizing in grounded chunks…' })}\n\n`);
        parsed = await summarizeLongPage(processedContent, title, url, language, apiKey, model, abortController.signal);
      } else {
        try {
          parsed = await generateJson([
            { role: 'system', content: SYSTEM_PROMPT_SUMMARY },
            { role: 'user', content: buildWholePagePrompt(processedContent, title, url, language) },
          ], apiKey, model, abortController.signal, 5500);
        } catch (error) {
          if (!looksLikeContextLimitError(error)) throw error;
          res.write(`data: ${JSON.stringify({ chunk: 'Optimizing page context into smaller grounded chunks…' })}\n\n`);
          parsed = await summarizeLongPage(processedContent, title, url, language, apiKey, model, abortController.signal);
        }
      }
    }

    parsed = normalizeSummary(parsed, { title, url, captureMode, language, wordCount });
    parsed = await localizeSummary(parsed, language, apiKey, abortController.signal);
    parsed = normalizeSummary(parsed, { title, url, captureMode, language, wordCount });
    const validated = SummaryResponseSchema.parse(parsed);
    res.write(`data: ${JSON.stringify({ completed: true, result: validated })}\n\n`);
    res.end();
  } catch (err: any) {
    if (!res.headersSent) return res.status(500).json({ error: err.message || 'Summary generation failed.' });
    res.write(`data: ${JSON.stringify({ error: err.message || 'Summary generation failed.' })}\n\n`);
    res.end();
  }
});

function selectRelevantPageEvidence(text: string, question: string, maxChars = MAX_FOLLOWUP_CONTEXT_CHARS): string {
  if (!text || text.length <= maxChars) return text;
  const terms = Array.from(new Set(
    question.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || []
  )).filter(term => !['what','when','where','which','this','that','from','about','with','have','does','were','will','give','list','main'].includes(term));

  const sections = text.split(/\n{2,}/).map((value, index) => ({ value: value.trim(), index })).filter(x => x.value);
  const ranked = sections.map(section => {
    const lower = section.value.toLowerCase();
    const score = terms.reduce((sum, term) => sum + (lower.includes(term) ? 3 : 0), 0);
    return { ...section, score };
  }).sort((a, b) => b.score - a.score || a.index - b.index);

  const picked: typeof sections = [];
  let size = 0;
  for (const item of ranked) {
    if (size + item.value.length > maxChars && picked.length >= 3) continue;
    picked.push(item);
    size += item.value.length + 2;
    if (size >= maxChars) break;
  }
  return picked.sort((a, b) => a.index - b.index).map(x => x.value).join('\n\n').slice(0, maxChars);
}

app.post('/api/followup', async (req: Request, res: Response) => {
  const abortController = new AbortController();
  res.on('close', () => { if (!res.writableEnded) abortController.abort(); });
  try {
    const {
      question, contextSummary, capturedBlocks, captureMode = 'page', imageDataUrl,
      language = 'en', groqApiKey: userKey, visionModel: userVisionModel,
    } = req.body;
    const apiKey = userKey || process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'Missing Groq API Key.' });

    const redactedQuestion = redactSensitiveData(String(question || '')).redactedText;
    const redactedSummary = redactSensitiveData(typeof contextSummary === 'string' ? contextSummary : JSON.stringify(contextSummary)).redactedText;
    const rawEvidence = redactSensitiveData(typeof capturedBlocks === 'string' ? capturedBlocks : JSON.stringify(capturedBlocks)).redactedText;
    const evidence = captureMode === 'page'
      ? selectRelevantPageEvidence(rawEvidence, redactedQuestion)
      : rawEvidence.slice(0, 20000);
    const prompt = buildFollowUpPrompt(redactedQuestion, redactedSummary, evidence, captureMode, language);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let fullAnswer = '';
    const emit = (chunk: string) => {
      if (!chunk) return;
      fullAnswer += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    };

    if (captureMode === 'region' && imageDataUrl) {
      await callGroqStream([
        { role: 'system', content: SYSTEM_PROMPT_FOLLOWUP },
        { role: 'user', content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ] },
      ], apiKey, userVisionModel || process.env.GROQ_VISION_MODEL || DEFAULT_GROQ_VISION_MODEL, emit, abortController.signal, false, 1800);
    } else {
      // Follow-ups are source-grounded Q&A; Compound's web/tool planning adds
      // latency and can violate grounding. Use Groq's fastest production text
      // model with a compact, question-relevant context instead.
      await callGroqStream([
        { role: 'system', content: SYSTEM_PROMPT_FOLLOWUP },
        { role: 'user', content: prompt },
      ], apiKey, process.env.GROQ_FOLLOWUP_MODEL || FAST_FOLLOWUP_MODEL, emit, abortController.signal, false, 1600);
    }

    if (!fullAnswer.trim()) throw new Error('The model returned an empty follow-up answer. Please retry the question.');
    res.write(`data: ${JSON.stringify({ completed: true })}\n\n`);
    res.end();
  } catch (err: any) {
    if (!res.headersSent) return res.status(500).json({ error: err.message || 'Follow-up query failed.' });
    res.write(`data: ${JSON.stringify({ error: err.message || 'Follow-up query failed.' })}\n\n`);
    res.end();
  }
});

if (process.env.NODE_ENV !== 'test') app.listen(PORT, () => console.log(`[Lumen Server] Server running on port ${PORT}`));
export default app;
