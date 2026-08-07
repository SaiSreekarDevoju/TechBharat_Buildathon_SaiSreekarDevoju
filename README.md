# Lumen — On-Screen Intelligence

> **Turn anything on your screen into structured, actionable intelligence — without leaving the page.**

**Lumen** is a Manifest V3 Chrome extension built for the **TechBharat Cohort #2 Buildathon — Use Case A: On-Screen Summarization**.

Instead of forcing users to select content, copy it, switch tabs, paste it into a chatbot, and repeatedly provide context, Lumen brings AI directly to the content the user is already viewing.

It supports **whole-page summarization, strict selected-text analysis, visual region understanding, grounded follow-up Q&A, multilingual output, privacy redaction, local history, and tab-isolated intelligence** — all inside a native Chrome side-panel workflow.

---

## 🎯 The Problem

Knowledge workers spend hours inside browsers reading:

* Long articles and news reports
* Technical documentation
* Research papers
* GitHub pull requests
* Dashboards and charts
* Internal documents
* Regional-language content
* Dense webpages

The information is already on the screen.

The problem is the effort required to understand it.

The traditional workflow looks like:

```text
Read → Select → Copy → Switch Tab → Paste → Prompt → Read → Switch Back
```

Lumen replaces it with:

```text
See → Capture → Understand → Ask
```

---

# ✨ What Lumen Does

Lumen provides three explicit capture modes.

### 📄 Whole Page

Extracts the readable content of the current webpage and converts it into a structured brief.

Designed for:

* Long articles
* Documentation
* News
* Technical pages
* Research content
* Dense webpages

Long contexts are processed without requiring the user to manually copy or split the content.

### ✂️ Current Selection

Analyzes **only the text explicitly highlighted by the user**.

No surrounding webpage content is silently added.

Follow-up questions remain grounded in the original selected text, making this mode useful when the user needs precise analysis of a paragraph, section, quote, or code explanation.

### ⛶ Draw a Region

The user draws a rectangle around a visible region such as:

* Chart
* Dashboard
* KPI
* Table
* Graph
* Infographic
* Visual report section

Lumen captures the visible browser tab, crops the exact selected rectangle, and routes the image to a dedicated vision model for analysis.

---

# 🧠 Predictable Structured Intelligence

Every Lumen brief follows the same structure:

1. **Summary**
2. **Key Points**
3. **Actions**
4. **Numbers & Metrics**
5. **Decisions**
6. **Risks**

This makes outputs easier to scan and act upon than an unstructured AI response.

If information for a section does not exist in the captured source, Lumen reports that it was **not found in the context** rather than inventing information.

---

# 🚀 Core Capabilities

| Capability                | Implementation                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------- |
| **Manifest V3**           | Service worker + Chrome Side Panel API                                                  |
| **Invocation**            | Toolbar action + `Alt + Shift + S`                                                      |
| **Whole Page**            | Structured DOM content extraction                                                       |
| **Current Selection**     | Strict highlighted-text-only capture                                                    |
| **Draw a Region**         | Rectangle → screenshot → exact crop → vision analysis                                   |
| **Structured Briefs**     | Summary, Key Points, Actions, Metrics, Decisions, Risks                                 |
| **Follow-up Chat**        | Reuses the exact original capture context                                               |
| **Long Context Handling** | Processes large webpage contexts instead of failing with a simple “too long” response   |
| **Multilingual Output**   | English, Hindi, Telugu, Tamil, Bengali, Marathi                                         |
| **Language Validation**   | Target-language/script validation with repair when required                             |
| **Text Models**           | Multiple Groq-hosted text model choices                                                 |
| **Vision Analysis**       | Dedicated vision model routing for region captures                                      |
| **Tab Isolation**         | Independent summary, chat, language, models and state per browser tab                   |
| **State Persistence**     | Existing tab intelligence remains available while switching between tabs                |
| **New-Tab Isolation**     | New tabs start with a clean Lumen workspace                                             |
| **Regenerate Brief**      | Regenerates the existing capture when output language changes                           |
| **Privacy Redaction**     | Sensitive identifiers are redacted before transmitted text is processed                 |
| **Local History**         | Summary history stored locally through Chrome storage                                   |
| **Failure Honesty**       | Restricted/unreadable pages return explicit limitations instead of fabricated summaries |

---

# 🤖 AI Routing

Lumen deliberately separates text understanding from visual understanding.

```text
                     ┌─────────────────────┐
Webpage ────────────►│                     │
                     │     Text Model      │──────┐
Selection ──────────►│                     │      │
                     └─────────────────────┘      │
                                                │
                                                ▼
                                      ┌──────────────────┐
                                      │ Structured Lumen │
                                      │      Brief       │
                                      └──────────────────┘
                                                ▲
                                                │
                     ┌─────────────────────┐    │
Screen Region ──────►│    Vision Model     │────┘
                     └─────────────────────┘

Follow-up Question
        │
        ▼
Original Capture Context
        │
        ▼
Selected Text Model
        │
        ▼
Grounded Answer
```

### Available Text Systems

Lumen supports text choices including:

```text
llama-3.3-70b-versatile
llama-3.1-8b-instant
openai/gpt-oss-120b
openai/gpt-oss-20b
groq/compound-mini
groq/compound
```

`groq/compound-mini` and `groq/compound` are treated as **text systems only**.

Visual-region requests are routed independently through the configured vision workflow.

---

# 💬 Context-Grounded Follow-Up Chat

A summary is often only the beginning.

After capturing content, users can continue asking questions directly inside Lumen.

The important distinction is that Lumen preserves the **capture boundary**.

```text
Whole Page
    ↓
Follow-ups use Whole Page context

Current Selection
    ↓
Follow-ups use ONLY selected-text context

Draw a Region
    ↓
Follow-ups remain associated with region-derived context
```

This prevents a question about one selected paragraph from unexpectedly being answered using unrelated parts of the webpage.

---

# 🌐 Multilingual Intelligence

Lumen supports output in:

* 🇬🇧 English
* 🇮🇳 Hindi
* 🇮🇳 Telugu
* 🇮🇳 Tamil
* 🇮🇳 Bengali
* 🇮🇳 Marathi

Language behavior is tab-isolated.

For example:

```text
Tab A
Language: Telugu
Summary: Telugu

Tab B
Language: English
Summary: English
```

Changing the language of one tab does not silently modify another tab.

When the requested output language changes, **Regenerate Brief** can reuse the existing capture instead of forcing the user to refresh and recapture the webpage.

---

# 🗂️ Tab-Isolated Intelligence

Browser tabs represent different tasks.

Lumen therefore treats every tab as an independent intelligence workspace.

Each tab maintains its own:

* Summary
* Capture mode
* Original captured context
* Follow-up conversation
* Output language
* Text model
* Vision model
* Region context
* Relevant behavior state

Switching away from a summarized tab does **not** destroy its existing Lumen session.

When the user returns, the previous summary and conversation remain associated with that tab.

A newly created tab starts clean:

```text
Panel: Closed
Language: English
Summary: Empty
Chat: Empty
```

Reusable infrastructure configuration, such as API credentials and backend configuration, can remain stored locally so it does not need to be entered repeatedly.

---

# 🔐 Privacy by Design

Lumen is designed around explicit user interaction.

### Privacy principles

* Capture begins only after a Lumen action.
* Sensitive identifiers in transmitted text are redacted before model processing.
* Current Selection sends only the selected context.
* Region mode uses the selected screenshot crop as its visual evidence.
* API credentials are never committed to the repository.
* History is stored locally.
* Lumen does not continuously summarize browsing activity in the background.

---

# 🛡️ Failure Honesty

A trustworthy summarizer must also know when it **cannot** access something.

Chrome and websites can restrict extension access in cases such as:

```text
chrome:// pages
Browser-internal pages
Protected frames
Restricted iframes
Cross-origin content
Authentication-protected content
Unavailable page content
```

When reliable capture is impossible, Lumen surfaces the limitation rather than generating a summary that appears grounded but is not.

---

# 🏗️ Architecture

```text
┌──────────────────────── Chrome Browser ────────────────────────┐
│                                                               │
│  Active Webpage                                               │
│  │                                                            │
│  ├── DOM Extractor                                            │
│  ├── Selected Text Capture                                    │
│  └── Rectangle Region Selector                                │
│           │                                                   │
│           ▼                                                   │
│  ┌──────────────────────────────┐                             │
│  │     MV3 Service Worker       │                             │
│  │                              │                             │
│  │ • Tab lifecycle              │                             │
│  │ • Side-panel control         │                             │
│  │ • Screenshot capture         │                             │
│  │ • Region coordination        │                             │
│  └──────────────┬───────────────┘                             │
│                 │                                             │
│                 ▼                                             │
│  ┌──────────────────────────────┐                             │
│  │      React Side Panel        │                             │
│  │                              │                             │
│  │ • Capture modes              │                             │
│  │ • Structured brief           │                             │
│  │ • Follow-up chat             │                             │
│  │ • Per-tab state              │                             │
│  │ • Language/model settings    │                             │
│  └──────────────┬───────────────┘                             │
│                 │                                             │
└─────────────────┼─────────────────────────────────────────────┘
                  │
                  │ HTTPS / Streaming
                  ▼
┌───────────────────────────────────────────────────────────────┐
│                    Lumen Proxy Server                         │
│                    Express + TypeScript                       │
│                                                               │
│  • Request validation                                         │
│  • Privacy redaction                                          │
│  • Prompt routing                                             │
│  • Long-context processing                                    │
│  • Structured-output validation                               │
│  • Language validation / repair                               │
│  • Streaming                                                  │
│                                                               │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
                         ┌──────────┐
                         │ Groq API │
                         └──────────┘
```

---

# 🔑 Permissions & Why They Are Needed

| Permission   | Purpose                                                   |
| ------------ | --------------------------------------------------------- |
| `activeTab`  | Interacts with the webpage after an explicit Lumen action |
| `tabs`       | Maintains tab-specific lifecycle and state                |
| `scripting`  | Supports page capture interactions                        |
| `storage`    | Stores local sessions, settings, credentials and history  |
| `commands`   | Registers keyboard shortcuts                              |
| `sidePanel`  | Provides the native Chrome side-panel experience          |
| `<all_urls>` | Allows user-requested capture across normal websites      |

Lumen does **not** use these permissions to continuously scan browser activity.

---

# 📁 Repository Structure

```text
apps/
├── extension/        Chrome MV3 extension source
├── server/           Express + TypeScript AI proxy
└── landing/          Lumen landing page

packages/
└── shared/           Shared schemas, types, prompts and utilities

extension/            Ready-to-load production extension build
```

---

# ⚙️ Local Setup

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Backend

Copy `.env.example` and configure your Groq credentials.

```env
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_VISION_MODEL=your_supported_vision_model
PORT=3001
```

> ⚠️ Never commit a real API key to GitHub.

## 3. Run / Build

```bash
npm run dev:server
npm run typecheck
npm run test
npm run build
```

The production-ready Chrome extension build is available in:

```text
extension/
```

---

# 🧩 Load Lumen in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the repository-level `extension/` directory
5. Open a normal `http://` or `https://` webpage
6. Click the **Lumen** extension icon or press:

```text
Alt + Shift + S
```

Chrome **142+** is recommended for the intended per-tab side-panel lifecycle.

---

# ✅ Buildathon Validation Results

Lumen was manually checked across the provided/recommended Buildathon evaluation websites.

The validation set intentionally covers substantially different webpage types instead of testing only on simple articles.

| #  | Test Type               | Website                                          | Primary Validation                                             | Result |
| -- | ----------------------- | ------------------------------------------------ | -------------------------------------------------------------- | ------ |
| 01 | Company / Product       | `paradigmit.ai`                                  | Whole-page extraction and structured summarization             | ✅ PASS |
| 02 | English News            | `thehindu.com`                                   | Article/news extraction, names, dates and key information      | ✅ PASS |
| 03 | Regional News           | `eenadu.net`                                     | Regional-language content extraction and multilingual handling | ✅ PASS |
| 04 | Technical Documentation | Python `sched` documentation                     | Dense technical content, APIs, caveats and structured brief    | ✅ PASS |
| 05 | Dashboard / Charts      | Grafana Play — Business Metrics                  | Visual-region capture, charts, KPIs and metrics                | ✅ PASS |
| 06 | Code Review             | Anthropic Claude Agent SDK Python PR #1076       | Pull-request discussion, decisions, changes and risks          | ✅ PASS |
| 07 | Research Paper          | *Attention Is All You Need* — arXiv `1706.03762` | Research/PDF content and supported capture workflow            | ✅ PASS |
| 08 | Long-form Engineering   | Sean Goedecke — *LLMs Reward Expertise*          | Dense long-form extraction, summarization and follow-ups       | ✅ PASS |

### Validation Summary

```text
Test Pages Checked : 8
Passed             : 8
Failed             : 0
Result             : 8 / 8 PASS
```

> **All listed Buildathon validation websites were successfully checked with Lumen.**

---

# 🧪 Detailed Validation Matrix

The tests covered more than whether the extension simply opened on each website.

| Validation Area                       | Status |
| ------------------------------------- | :----: |
| Extension opens correctly             |    ✅   |
| Whole Page capture                    |    ✅   |
| Current Selection capture             |    ✅   |
| Strict selection-only context         |    ✅   |
| Draw a Region workflow                |    ✅   |
| Structured summary generation         |    ✅   |
| Summary grounding                     |    ✅   |
| Key Points generation                 |    ✅   |
| Actions extraction                    |    ✅   |
| Numbers & Metrics extraction          |    ✅   |
| Decisions extraction                  |    ✅   |
| Risks extraction                      |    ✅   |
| Follow-up Q&A                         |    ✅   |
| Capture-specific follow-up grounding  |    ✅   |
| Long-context handling                 |    ✅   |
| Multilingual output                   |    ✅   |
| Language regeneration workflow        |    ✅   |
| Tab-specific state                    |    ✅   |
| State persistence when switching tabs |    ✅   |
| Clean new-tab state                   |    ✅   |
| English default on new tabs           |    ✅   |
| Privacy redaction workflow            |    ✅   |
| Dashboard/chart region analysis       |    ✅   |
| Local history workflow                |    ✅   |
| Restricted-page failure handling      |    ✅   |

---

# 🌍 Website Coverage

### 1. ParadigmIT

**Type:** Company / product webpage
**Result:** ✅ Passed

Validated Lumen's ability to extract normal webpage content and transform it into the standard six-section intelligence brief.

### 2. The Hindu

**Type:** English news
**Result:** ✅ Passed

Validated article-oriented summarization and extraction of important entities, events, dates, key points and available metrics.

### 3. Eenadu

**Type:** Telugu / regional-language content
**Result:** ✅ Passed

Validated handling of native-script webpage content and Lumen's multilingual workflow.

### 4. Python Documentation — `sched`

**Type:** Technical documentation
**Result:** ✅ Passed

Validated structured extraction from dense technical documentation containing API descriptions, parameters, concepts and caveats.

### 5. Grafana Play — Business Metrics

**Type:** Dashboard / data visualization
**Result:** ✅ Passed

Validated **Draw a Region** against dashboard content including charts, KPIs, legends, tables and visible metrics.

### 6. Anthropic Claude Agent SDK Python — PR #1076

**Type:** GitHub pull request / code review
**Result:** ✅ Passed

Validated Lumen against engineering discussion where important information can include implementation changes, decisions, concerns and risks.

### 7. Attention Is All You Need

**Type:** Research paper / PDF
**Result:** ✅ Passed

Validated Lumen's supported research/PDF capture workflow against the landmark Transformer research paper.

### 8. LLMs Reward Expertise

**Type:** Long-form engineering article
**Result:** ✅ Passed

Validated dense long-form summarization and grounded follow-up analysis.

---

# 🎬 Buildathon Demo Flow

A concise Lumen demonstration can show the complete value proposition in four steps.

### Step 1 — Whole Page Intelligence

Open a long article or technical page.

```text
Click Lumen
      ↓
Whole Page
      ↓
Structured Brief
```

Show:

**Summary → Key Points → Actions → Numbers & Metrics → Decisions → Risks**

### Step 2 — Prove Context Grounding

Highlight one specific paragraph.

Select:

```text
Current Selection
```

Generate the brief and ask a follow-up question.

The answer remains grounded in the selected text rather than silently using the entire webpage.

### Step 3 — Understand Visual Information

Open the Grafana dashboard.

Select:

```text
Draw a Region
```

Draw a rectangle around a chart/KPI region.

Lumen captures the region and analyzes the visible metrics and trends using the vision workflow.

### Step 4 — Prove Tab Isolation

Keep the completed summary open.

Open another browser tab.

The new tab begins with:

```text
Panel: Closed
Language: English
Summary: Empty
Chat: Empty
```

Return to the original tab.

Its previous Lumen session remains available.

---

# 📊 Evaluation Philosophy

Lumen is designed around four principles that matter for real on-screen intelligence.

### 1. Grounded

The answer should come from what the user captured — not unrelated context.

### 2. Structured

Users should not need to read another wall of AI-generated text to understand the original wall of text.

### 3. Context-Aware

A selected paragraph, complete webpage, and visual dashboard are fundamentally different inputs and should be handled differently.

### 4. Honest

If Lumen cannot reliably access something, it should say so instead of pretending that it can.

---

# 🏆 Why Lumen

Lumen is not intended to be another chatbot placed inside a browser.

The core difference is the interaction model:

```text
Traditional AI Workflow

Webpage
   ↓
Select
   ↓
Copy
   ↓
Open AI
   ↓
Paste
   ↓
Explain Context
   ↓
Ask
```

With Lumen:

```text
Webpage
   ↓
Lumen
   ↓
Understand
   ↓
Ask
```

The user's screen becomes the context.

---

# 🎯 Project Goal

Lumen is built around one simple principle:

> **The information is already on the screen. The user should not have to leave the screen to understand it.**

---

## 🧪 Final Buildathon Status

```text
Chrome Extension       ✅ Working
Manifest V3            ✅ Implemented
Whole Page             ✅ Passed
Current Selection      ✅ Passed
Draw a Region          ✅ Passed
Follow-up Q&A          ✅ Passed
Long Context           ✅ Passed
Multilingual Output    ✅ Passed
Privacy Redaction      ✅ Passed
Tab Isolation          ✅ Passed
State Persistence      ✅ Passed
Failure Honesty        ✅ Implemented

Validation Websites    8 / 8 Passed
```

**Lumen — Read less. Understand more. Act faster.**
