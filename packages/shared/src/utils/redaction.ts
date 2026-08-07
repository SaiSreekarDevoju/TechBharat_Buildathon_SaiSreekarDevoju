import { RedactionResult } from '../types/index.js';

const PATTERNS: Record<string, RegExp> = {
  BEARER_TOKEN: /Bearer\s+[A-Za-z0-9\-\._~\+\/]+=*/g,
  API_KEY: /(?:sk-|gsk_|AKIA|AIza)[a-zA-Z0-9_\-]{16,}/g,
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  PAN: /[A-Z]{5}[0-9]{4}[A-Z]{1}/g,
  PHONE: /\b(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  AADHAAR: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
  CREDIT_CARD: /\b(?:\d[ -]*?){13,16}\b/g,
  IP_ADDRESS: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
  UPI_ID: /\b[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}\b/g,
  INDIAN_PASSPORT: /\b[A-PR-WYa-pr-wy][0-9]{7}\b/g,
  SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
  PRIVATE_KEY_BLOCK: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
};

export function redactSensitiveData(text: string): RedactionResult {
  let redactedText = text;
  let wasRedacted = false;
  const redactedCounts: Record<string, number> = {};

  for (const [key, pattern] of Object.entries(PATTERNS)) {
    const matches = redactedText.match(pattern);
    if (matches && matches.length > 0) {
      wasRedacted = true;
      redactedCounts[key] = (redactedCounts[key] || 0) + matches.length;
      redactedText = redactedText.replace(pattern, `[REDACTED_${key}]`);
    }
  }

  return {
    redactedText,
    wasRedacted,
    redactedCounts,
  };
}
