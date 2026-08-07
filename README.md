# Lumen — On-Screen Intelligence

> A Manifest V3 Chrome extension that turns the content already on your screen into a structured, actionable brief — without forcing you to copy, switch tabs, and paste into a separate chatbot.

Lumen is built for the **TechBharat Cohort #2 Buildathon — Use Case A: On-Screen Summarization**. It combines DOM extraction, strict selected-text capture, visual region analysis, multilingual output, follow-up Q&A, privacy controls, local history, and tab-isolated state in one side-panel workflow.

---

## What Lumen Does

Lumen supports three explicit capture modes:

- **Whole Page** — extracts readable page content and summarizes the current page.
- **Current Selection** — summarizes only the text highlighted by the user. No surrounding page content is silently added.
- **Draw a Region** — lets the user drag a rectangle over a chart, dashboard, table, or visual section; Lumen captures that exact region and sends the cropped image to a vision model.

Every brief uses the same predictable structure:

1. Summary
2. Key Points
3. Actions
4. Numbers & Metrics
5. Decisions
6. Risks

When a category is genuinely absent, Lumen reports that instead of inventing information.

---

## Core Capabilities

| Capability | Implementation |
| --- | --- |
| Manifest V3 | Service worker + Chrome Side Panel API |
| Invocation | Toolbar action and `Alt + Shift + S` |
| Whole-page capture | Structured DOM text extraction |
| Current Selection | Strict highlighted-text-only context |
| Draw a Region | Rectangle overlay → visible-tab screenshot → exact crop → multimodal analysis |
| Structured briefs | Summary, Key Points, Actions, Metrics, Decisions, Risks |
| Follow-up chat | Reuses the exact capture context for the current tab |
| Multilingual output | English, Hindi, Telugu, Tamil, Bengali, Marathi |
| Language enforcement | Server validates target script and performs a translation repair pass when needed |
| Text models | Groq production text models plus `groq/compound-mini` and `groq/compound` |
| Vision model | Separate vision model; Compound systems are never used for image capture |
| Per-tab isolation | Summary, chat, language, model choices and behavior settings remain scoped to their tab |
| New-tab behavior | Newly opened tabs start with Lumen closed and English as the default language |
| Regenerate Brief | Reuses the original capture and regenerates only after a language change |
| Privacy mode | Optional client/server-side redaction of common sensitive identifiers |
| Local history | Opt-in summary history stored in Chrome local storage |
| Failure honesty | Restricted or unreadable pages produce an explicit error instead of a fake summary |

---

## AI Routing

Lumen deliberately separates text and image workflows.

```text
Webpage / Selection ──> Text Model ─────────────┐
                                                │
Drawn Screen Region ─> Vision Model ────────────┼─> Structured Lumen Brief
                                                │
Follow-up Question ──> Selected Text Model ─────┘
```

Available text choices include:

- `llama-3.3-70b-versatile`
- `llama-3.1-8b-instant`
- `openai/gpt-oss-120b`
- `openai/gpt-oss-20b`
- `groq/compound-mini`
- `groq/compound`

`groq/compound-mini` and `groq/compound` are exposed only as **text systems**. Draw-a-Region always routes through the separately configured vision model.

---

## Tab Isolation Model

Lumen treats each browser tab as an independent workspace.

Each tab keeps its own:

- output language
- text model
- vision model
- privacy preference
- history preference
- current summary
- capture mode and original captured context
- follow-up conversation
- region screenshot context

A newly created tab always begins with:

```text
Panel: Closed
Language: English
Summary state: Empty
Chat state: Empty
```

Reusable infrastructure credentials such as the Groq API key and backend endpoint are stored locally so the user does not need to re-enter them on every tab.

---

## Permissions & Why They Are Needed

| Permission | Precise use |
| --- | --- |
| `activeTab` | Interacts with the webpage only after an explicit Lumen action. |
| `tabs` | Tracks tab creation/activation for tab-specific panel lifecycle and isolation. |
| `scripting` | Supports extension-to-page capture interactions where required. |
| `storage` | Stores tab-scoped sessions/options, reusable local credentials, and opt-in history. |
| `commands` | Registers the Lumen keyboard shortcut. |
| `sidePanel` | Opens a tab-specific native Chrome side panel without navigating away from the webpage. |
| `<all_urls>` content-script match | Allows user-requested capture on normal web pages across domains. |

Lumen does **not** continuously scan browsing activity in the background.

---

## Architecture

```text
┌──────────────────────────── Chrome ────────────────────────────┐
│                                                               │
│  Active Webpage                                               │
│  ├─ DOM extractor                                             │
│  ├─ selected-text capture                                     │
│  └─ rectangle region selector                                 │
│          │                                                    │
│          ▼                                                    │
│  MV3 Service Worker                                           │
│  ├─ tab-specific side-panel lifecycle                         │
│  ├─ visible-tab screenshot capture                            │
│  └─ exact region cropping                                     │
│          │                                                    │
│          ▼                                                    │
│  React Side Panel                                             │
│  ├─ capture modes                                             │
│  ├─ structured summary                                        │
│  ├─ follow-up chat                                            │
│  └─ per-tab settings                                          │
└──────────┬────────────────────────────────────────────────────┘
           │ HTTPS / SSE
           ▼
┌──────────────────── Lumen Proxy Server ───────────────────────┐
│ Express + TypeScript                                          │
│ ├─ request validation                                         │
│ ├─ privacy redaction                                          │
│ ├─ prompt routing                                             │
│ ├─ structured JSON validation/repair                          │
│ ├─ target-language validation/repair                          │
│ └─ Groq streaming                                             │
└──────────┬────────────────────────────────────────────────────┘
           ▼
        Groq API
```

---

## Repository Layout

```text
apps/
  extension/   Chrome MV3 extension source
  server/      Express + TypeScript AI proxy
  landing/     Lumen landing page
packages/
  shared/      Shared types, schemas, prompts and utilities
extension/     Ready-to-load production extension build
```

---

## Local Setup

### Install

```bash
npm install
```

### Configure the backend

Copy `.env.example` and provide your own Groq API key. Never commit a real key.

```env
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_VISION_MODEL=qwen/qwen3.6-27b
PORT=3001
```

### Run / build

```bash
npm run dev:server
npm run typecheck
npm run test
npm run build
```

The complete production extension is also available in the repository-level `extension/` directory.

---

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the repository's `extension/` folder after a production build.
5. Open a normal `http://` or `https://` page.
6. Click the Lumen toolbar icon or press `Alt + Shift + S`.

Chrome **142+** is recommended/required for Lumen's per-tab side-panel close/open lifecycle.

---

## Suggested Buildathon Validation

| Scenario | What to verify |
| --- | --- |
| Long article | Whole Page produces all six sections with grounded facts. |
| Highlighted paragraph | Current Selection uses only the highlighted text. |
| Regional-language news | Choosing Telugu/Hindi/etc. produces the full brief in that selected language. |
| New browser tab | Lumen is closed and language defaults to English. |
| Two different tabs | Language/model/settings changes remain isolated between tabs. |
| Dashboard/chart | Draw a Region captures the exact rectangle and explains visible trends/metrics. |
| Follow-up chat | Questions remain grounded in the original capture and conversation remains restored. |
| Language change | Regenerate Brief becomes available only when the requested language differs from the existing brief. |
| Restricted Chrome page | Lumen reports the capture limitation rather than generating fabricated content. |

Useful public pages for testing include news sites, Python documentation, GitHub pull requests, public dashboards such as Grafana Play, and long-form technical articles.

---

## Demo Flow

A short selector-friendly demo can show Lumen's value in four moves:

1. **Summarize** a long article with Whole Page.
2. **Highlight one paragraph** and prove that Current Selection ignores the rest of the page.
3. **Draw a rectangle over a chart** and let the vision model explain only that visual region.
4. **Open a fresh tab** to demonstrate a closed panel, English default, and complete state isolation from the previous tab.

For multilingual validation, switch one tab to Telugu or Hindi, regenerate/create a brief, then open another tab and show that it still starts in English.

---

## Privacy & Failure Honesty

- Lumen captures only after explicit user interaction.
- API keys are never committed to the repository.
- Privacy Redaction Mode can mask common sensitive identifiers before model transmission.
- Current Selection is intentionally strict: unselected webpage content is not included.
- Draw-a-Region uses the cropped screenshot as its primary visual evidence.
- Browser-internal/restricted pages return a clear limitation instead of a fabricated summary.

---

## Project Goal

Lumen is designed around one simple principle:

> **The information is already on the screen. The user should not have to leave the screen to understand it.**


## 🧪 Recommended Buildathon Test Pages

Use these pages to demonstrate Lumen across news, documentation, regional-language content, dashboards, code review, research PDFs, and long-form articles. Availability and page structure may change over time, so results should be evaluated honestly rather than hard-coded.

| Scenario | Test page | What to validate |
| --- | --- | --- |
| Company / product page | https://paradigmit.ai/ | Whole-page extraction and structured summary |
| English news | https://www.thehindu.com/ | News summarization, dates, names, key points |
| Telugu / regional news | https://www.eenadu.net/ | Native-script extraction and multilingual regeneration |
| Technical documentation | https://docs.python.org/3.13/library/sched.html | Long technical context, APIs, actions and caveats |
| Dashboard / charts | https://play.grafana.org/d/000000110/business-metrics?orgId=1&from=now-24h&to=now&timezone=browser | Draw a Region on charts, KPIs, legends and tables |
| GitHub pull request | https://github.com/anthropics/claude-agent-sdk-python/pull/1076 | Code-review discussion, decisions and risks |
| Research PDF | https://arxiv.org/pdf/1706.03762 | Browser/PDF limitations and region-based visual analysis where supported |
| Long-form engineering article | https://www.seangoedecke.com/llms-reward-expertise/ | Dense article summarization and follow-up grounding |

### Suggested validation checklist

For each applicable page, verify that **Summary, Key Points, Actions, Numbers & Metrics, Decisions, and Risks** are grounded in the selected source. When a category is genuinely absent, Lumen should state that it was not found instead of inventing content. Privacy Redaction is always enabled for transmitted text.
