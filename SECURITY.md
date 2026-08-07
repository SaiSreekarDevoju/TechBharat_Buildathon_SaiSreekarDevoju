# Security Policy

## Reporting a Vulnerability

If you discover a potential security vulnerability in Lumen, please do not open a public issue. Instead, send an email to `security@lumen-app.internal` or contact the maintainers directly.

## Security Practices

- **Zero Remote Scripts:** All executable JavaScript code in the Chrome extension is bundled locally.
- **Strict Content Security Policy (CSP):** The extension enforces Manifest V3 CSP standards.
- **Input Sanitization:** Captured page text is treated as untrusted data in LLM prompt templates to prevent prompt injection.
- **Redaction Engine:** Regex-based privacy scanner redacts emails, phone numbers, API keys, tokens, and identity numbers prior to inference API requests.
- **Local Secret Storage:** API keys are saved exclusively in `chrome.storage.local`.
