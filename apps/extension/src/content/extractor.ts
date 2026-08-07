import { ExtractedBlock, ExtractedPageContent } from '@lumen/shared';

export function extractPageContent(): ExtractedPageContent {
  const title = document.title || 'Untitled Page';
  const url = window.location.href;
  const language = document.documentElement.lang || navigator.language || 'en';

  if (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:')
  ) {
    return {
      title,
      url,
      language,
      wordCount: 0,
      blocks: [],
      rawText: '',
      pageType: 'generic',
      isTruncated: false,
      unreadableReason: 'Browser security policies prevent extensions from reading this internal page.',
    };
  }

  const blocks: ExtractedBlock[] = [];
  let blockCounter = 1;

  let pageType: ExtractedPageContent['pageType'] = 'generic';
  if (url.includes('github.com') && url.includes('/pull/')) {
    pageType = 'github_pr';
  } else if (url.includes('mail.google.com')) {
    pageType = 'email';
  } else if (url.includes('jira') || url.includes('/issues/')) {
    pageType = 'issue_tracker';
  } else if (url.includes('docs.') || url.includes('/docs/')) {
    pageType = 'documentation';
  } else if (url.includes('arxiv.org') || url.toLowerCase().includes('.pdf')) {
    pageType = 'paper';
  } else if (url.includes('grafana') || url.includes('dashboard')) {
    pageType = 'dashboard';
  }

  const domElements = Array.from(
    document.body.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6, p, ul, ol, table, pre, blockquote')
  );

  domElements.forEach((el) => {
    const text = (el.innerText || el.textContent || '').trim();
    if (!text || text.length < 5) return;

    const blockId = `block-${blockCounter++}`;
    el.setAttribute('data-lumen-id', blockId);

    const tagName = el.tagName.toLowerCase();
    let type: ExtractedBlock['type'] = 'paragraph';
    let level: number | undefined;

    if (/^h[1-6]$/.test(tagName)) {
      type = 'heading';
      level = Number(tagName.substring(1));
    } else if (tagName === 'ul' || tagName === 'ol') {
      type = 'list';
    } else if (tagName === 'table') {
      type = 'table';
    } else if (tagName === 'pre') {
      type = 'code';
    }

    blocks.push({ id: blockId, type, content: text, level });
  });

  const rawText = blocks.map((block) => block.content).join('\n\n').trim();
  const wordCount = rawText ? rawText.split(/\s+/).filter(Boolean).length : 0;

  if (!rawText) {
    return {
      title,
      url,
      language,
      wordCount: 0,
      blocks: [],
      rawText: '',
      pageType,
      isTruncated: false,
      unreadableReason: 'Lumen could not extract readable webpage text. Try Current Selection or Draw a Region.',
    };
  }

  return {
    title,
    url,
    language,
    wordCount,
    blocks,
    rawText,
    pageType,
    isTruncated: wordCount > 8000,
  };
}

/**
 * Return ONLY the text the user actually highlighted.
 * No parent element, nearby paragraph, or whole-page fallback is included.
 */
export function extractSelectedContent(): { selectedText: string; contextText: string; wordCount: number } {
  const selectedText = (window.getSelection()?.toString() || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!selectedText) {
    return { selectedText: '', contextText: '', wordCount: 0 };
  }

  return {
    selectedText,
    contextText: '',
    wordCount: selectedText.split(/\s+/).filter(Boolean).length,
  };
}
