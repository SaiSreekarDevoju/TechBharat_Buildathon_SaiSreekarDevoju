# Lumen — On-Screen Intelligence

> A Manifest V3 Chrome extension that turns the content already on your screen into a structured, actionable brief — without the copy → switch tab → paste → prompt workflow.

Built for the **TechBharat Cohort #2 Buildathon — Use Case A: On-Screen Summarization**.

Lumen works directly with the content a user is viewing. It can summarize an entire webpage, analyze only highlighted text, understand a selected visual region, and answer follow-up questions using the same captured context.

---

## Why Lumen

A large part of the work we do in a browser is reading.

Long articles, documentation, research papers, pull requests, dashboards and reports already contain the information we need. The unnecessary part is moving that information somewhere else just to understand it.

The usual workflow is:

```text
Read → Select → Copy → Open Chatbot → Paste → Explain Context → Ask
```

With Lumen:

```text
Open Lumen → Choose Capture Mode → Get Brief → Ask Follow-ups
```

The source stays in front of the user throughout the process.

---

## Capture Modes

Lumen has three capture modes, each with a strict context boundary.

### Whole Page

Extracts the readable content of the current webpage and creates a structured brief.

This is intended for long articles, documentation, news, technical pages and other text-heavy webpages.

For pages that exceed the model's practical request size, the extracted content is processed in chunks and combined before the final brief is generated.

### Current Selection

Uses only the text highlighted by the user.

The rest of the webpage is not silently included in the prompt.

Follow-up questions in this mode continue to use the captured selection rather than switching back to whole-page context.

### Draw a Region

Allows the user to draw a rectangle over a visible part of the webpage.

The extension:

```text
Region Selection
      ↓
Visible Tab Capture
      ↓
Exact Region Crop
      ↓
Vision Analysis
      ↓
Structured Brief
```

This mode is useful for dashboards, charts, tables, KPIs, graphs and other visual information that cannot be reliably understood through DOM text extraction alone.

---

## Structured Brief

Every capture produces the same six-section output:

1. **Summary**
2. **Key Points**
3. **Actions**
4. **Numbers & Metrics**
5. **Decisions**
6. **Risks**

If the captured source does not contain information for a section, Lumen reports it as not found instead of filling the section with unrelated information.

---

## Features

| Feature             | Implementation                                                               |
| ------------------- | ---------------------------------------------------------------------------- |
| Whole Page          | Structured DOM extraction with long-context handling                         |
| Current Selection   | Strict selected-text-only capture                                            |
| Draw a Region       | Rectangle selection → screenshot → crop → vision analysis                    |
| Structured Output   | Summary, Key Points, Actions, Metrics, Decisions and Risks                   |
| Follow-up Q&A       | Questions use the original capture context                                   |
| Streaming           | Summary and follow-up responses are streamed into the panel                  |
| Long Pages          | Large extracted contexts are chunked before final synthesis                  |
| Multilingual Output | English, Hindi, Telugu, Tamil, Bengali and Marathi                           |
| Language Refresh    | Existing capture can be regenerated in another language                      |
| Privacy Redaction   | Sensitive identifiers are redacted before transmitted text is processed      |
| Tab Isolation       | Summary, conversation and capture state are maintained independently per tab |
| Tab Persistence     | Returning to a previously summarized tab restores its existing state         |
| Local History       | Previous summaries can be stored and accessed locally                        |
| Source Highlighting | Key points can be traced back to relevant source content                     |
| Failure Handling    | Unsupported/restricted pages return a clear capture limitation               |

---

## Follow-up Q&A

Lumen keeps the context used to create each brief.

That context is also used for subsequent questions.

```text
Whole Page
   └── Follow-ups use captured page content

Current Selection
   └── Follow-ups use selected text only

Draw a Region
   └── Follow-ups use the region-derived context
```

This prevents context leakage between capture modes.

For example, if a user highlights one paragraph from a long article and asks a question afterward, Lumen does not use unrelated sections of the article to answer it.

---

## Long-Page Handling

Large webpages were one of the main cases considered during the build.

Sending an entire extracted page directly to a model can exceed request or token limits. Lumen therefore processes large contexts in smaller segments before producing the final brief.

```text
Extract Page
     ↓
Clean Content
     ↓
Estimate Context Size
     ↓
Split When Required
     ↓
Process Chunks
     ↓
Combine Relevant Information
     ↓
Generate Final Structured Brief
```

This allows Whole Page mode to continue working on substantially longer pages instead of returning a simple context-too-large failure.

---

## Multilingual Output

Lumen currently supports:

* English
* Hindi
* Telugu
* Tamil
* Bengali
* Marathi

The selected output language belongs to the current tab.

Changing one tab to Telugu, for example, does not change the default language of another newly opened tab.

When the language is changed after a capture, the same captured context can be regenerated without refreshing the webpage.

---

## Tab-Isolated State

One issue with browser-side AI tools is state leaking between unrelated tabs.

Lumen treats every browser tab as a separate working context.

Each tab maintains its own:

* current brief
* captured context
* capture mode
* follow-up conversation
* language
* model selection
* region context

Example:

```text
TAB 1
Python Documentation
├── Whole Page
├── English
├── Existing Summary
└── Existing Follow-up Chat


TAB 2
Grafana Dashboard
├── Draw a Region
├── Telugu
├── Dashboard Summary
└── Separate Follow-up Chat
```

Switching between the two does not overwrite either session.

A new tab starts with a clean state and English as its default output language.

---

## Privacy Redaction

Privacy redaction is applied before transmitted text is processed by the model workflow.

The redaction layer detects common sensitive patterns such as email addresses, phone numbers and similar identifiers and replaces them before the request leaves the extension/server processing path.

The original webpage itself is not modified.

---

## AI Routing

Text and visual captures use separate processing paths.

```text
                    ┌────────────────────┐
Whole Page ────────►│                    │
                    │     Text Model     │──────┐
Selection ─────────►│                    │      │
                    └────────────────────┘      │
                                               │
                                               ▼
                                      Structured Lumen Brief
                                               ▲
                                               │
                    ┌────────────────────┐      │
Region Capture ────►│    Vision Model    │──────┘
                    └────────────────────┘
```

Text model options include:

```text
llama-3.3-70b-versatile
llama-3.1-8b-instant
openai/gpt-oss-120b
openai/gpt-oss-20b
groq/compound-mini
groq/compound
```

`groq/compound-mini` and `groq/compound` are used only for text workflows.

Draw a Region is routed separately through the configured vision model.

---

## Architecture

```text
┌────────────────────────── Chrome ──────────────────────────┐
│                                                           │
│  Webpage                                                  │
│     │                                                     │
│     ├── DOM Extraction                                    │
│     ├── Selection Capture                                 │
│     └── Region Selection                                  │
│                │                                          │
│                ▼                                          │
│        MV3 Service Worker                                 │
│        ├── Tab lifecycle                                  │
│        ├── Side panel lifecycle                           │
│        ├── Screenshot capture                             │
│        └── Region processing                              │
│                │                                          │
│                ▼                                          │
│          React Side Panel                                 │
│          ├── Capture modes                                │
│          ├── Structured brief                             │
│          ├── Follow-up chat                               │
│          ├── History                                      │
│          └── Settings                                     │
│                                                           │
└───────────────────────┬───────────────────────────────────┘
                        │
                        │ HTTPS / Streaming
                        ▼
┌──────────────────── Lumen Server ─────────────────────────┐
│                                                         │
│  Express + TypeScript                                   │
│                                                         │
│  ├── Request validation                                 │
│  ├── Privacy redaction                                  │
│  ├── Long-context processing                            │
│  ├── Model routing                                      │
│  ├── Structured-output validation                       │
│  ├── Language validation                                │
│  └── Streaming                                          │
│                                                         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
                      Groq API
```

---

## Tech Stack

### Extension

* Manifest V3
* React
* TypeScript
* Chrome Side Panel API
* Chrome Storage API
* Chrome Scripting API
* Chrome Tabs API

### Server

* Node.js
* Express
* TypeScript
* Groq API
* Server-Sent Events / streaming responses

### Models

* Groq-hosted text models
* Compound text systems
* Dedicated vision model for region analysis

---

## Repository Structure

```text
apps/
├── extension/       Chrome extension source
├── server/          Express + TypeScript backend
└── landing/         Lumen landing page

packages/
└── shared/          Shared types, schemas and utilities

extension/           Built Chrome extension
```

---

## Running the Project

Install dependencies:

```bash
npm install
```

Create the backend environment configuration:

```env
GROQ_API_KEY=<groq-api-key>
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_VISION_MODEL=<vision-model>
PORT=3001
```

Run the server:

```bash
npm run dev:server
```

Build the project:

```bash
npm run typecheck
npm run test
npm run build
```

The built Chrome extension is available in:

```text
extension/
```

---

## Loading the Extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Select **Load unpacked**
4. Choose the `extension/` directory
5. Open a normal webpage
6. Click the Lumen extension icon or press `Alt + Shift + S`

The side panel opens without automatically scanning the page. The user chooses the required capture mode before content is processed.

---

# Buildathon Validation

The final extension was checked against all **8 provided evaluation pages**.

These pages cover different content structures rather than variations of the same article format.

## Results

|  #  | Evaluation Page                    | Content Type              | Main Test                            |  Result  |
| :-: | ---------------------------------- | ------------------------- | ------------------------------------ | :------: |
|  01 | ParadigmIT                         | Product / company webpage | Whole-page extraction                | **PASS** |
|  02 | The Hindu                          | English news              | Article extraction and summarization | **PASS** |
|  03 | Eenadu                             | Telugu news               | Regional-language content            | **PASS** |
|  04 | Python `sched` Documentation       | Technical documentation   | Dense/long technical context         | **PASS** |
|  05 | Grafana Play — Business Metrics    | Dashboard                 | Region capture and visual analysis   | **PASS** |
|  06 | Claude Agent SDK Python — PR #1076 | GitHub pull request       | Engineering discussion and decisions | **PASS** |
|  07 | Attention Is All You Need          | Research PDF              | Research/PDF content                 | **PASS** |
|  08 | LLMs Reward Expertise              | Long-form article         | Long-context summary and follow-ups  | **PASS** |

### Final Result

```text
Evaluation pages tested    8
Passed                     8
Failed                     0

Result                     8 / 8 PASS
```

---

## Evaluation Page Details

### 01 — ParadigmIT

**Test:** Whole Page
**Result:** PASS

Used to verify standard webpage extraction and structured summarization.

Validated:

* readable content extraction
* structured brief
* follow-up context

---

### 02 — The Hindu

**Test:** Whole Page
**Result:** PASS

Used to test Lumen against a real news website with headlines, navigation, article content, dates and named entities.

Validated:

* article extraction
* key information
* names and dates
* follow-up questions

---

### 03 — Eenadu

**Test:** Whole Page + Multilingual
**Result:** PASS

Used to verify handling of Telugu webpage content.

Validated:

* Telugu content extraction
* native-script handling
* multilingual summary generation
* language regeneration

---

### 04 — Python `sched` Documentation

**Test:** Whole Page
**Result:** PASS

Used as a technical-documentation test.

Validated:

* dense technical extraction
* API-related content
* long-context processing
* grounded follow-up answers

---

### 05 — Grafana Play / Business Metrics

**Test:** Draw a Region
**Result:** PASS

Used to test content that DOM extraction alone cannot represent reliably.

Validated:

* rectangle selection
* screenshot capture
* exact region crop
* chart/KPI interpretation
* visible numbers and metrics
* visual follow-up context

---

### 06 — Claude Agent SDK Python PR #1076

**Test:** Whole Page
**Result:** PASS

Used to test engineering and code-review content.

Validated:

* pull-request context
* discussion summarization
* decisions
* changes
* risks
* follow-up questions

---

### 07 — Attention Is All You Need

**Test:** Research / PDF
**Result:** PASS

Used to test research-oriented content and PDF/browser capture behavior.

Validated:

* research content
* technical terminology
* structured summarization
* region-based analysis where applicable

---

### 08 — LLMs Reward Expertise

**Test:** Whole Page
**Result:** PASS

Used as the long-form engineering article test.

Validated:

* long-page extraction
* context processing
* structured brief
* grounded follow-up Q&A

---

# Functional Validation

The final build was also checked across the main extension workflows.

| Test                               | Result |
| ---------------------------------- | :----: |
| Extension opens through toolbar    |  PASS  |
| `Alt + Shift + S` opens Lumen      |  PASS  |
| No automatic scan on opening       |  PASS  |
| Whole Page capture                 |  PASS  |
| Current Selection capture          |  PASS  |
| Selection-only context             |  PASS  |
| Draw a Region                      |  PASS  |
| Region screenshot crop             |  PASS  |
| Structured six-section brief       |  PASS  |
| Follow-up Q&A                      |  PASS  |
| Capture-specific follow-up context |  PASS  |
| Long-page processing               |  PASS  |
| Streaming responses                |  PASS  |
| English output                     |  PASS  |
| Hindi output                       |  PASS  |
| Telugu output                      |  PASS  |
| Tamil output                       |  PASS  |
| Bengali output                     |  PASS  |
| Marathi output                     |  PASS  |
| Language regeneration              |  PASS  |
| Privacy redaction                  |  PASS  |
| Tab isolation                      |  PASS  |
| Tab state persistence              |  PASS  |
| Clean state on new tab             |  PASS  |
| English default on new tab         |  PASS  |
| Local history                      |  PASS  |
| Restricted-page handling           |  PASS  |

---

## Failure Handling

Some browser surfaces cannot be captured by a Chrome extension because of browser security restrictions.

Examples include Chrome internal pages and other restricted browser contexts.

Lumen handles these cases explicitly instead of generating a response from unavailable content.

This distinction is important because a failed capture should remain a failed capture — it should not become an apparently valid AI summary.

---

# Demo Flow

The final demo is designed around four different capabilities rather than repeatedly summarizing similar pages.

### 1. Long Page

Open a long article or documentation page.

```text
Whole Page
    ↓
Extract
    ↓
Structured Brief
    ↓
Follow-up Question
```

This demonstrates page extraction, long-context handling and grounded Q&A.

### 2. Strict Selection

Highlight a specific paragraph and use **Current Selection**.

Ask a question whose answer exists elsewhere on the webpage but not inside the selected paragraph.

Lumen remains inside the selected context.

This demonstrates that selection mode is actually isolated rather than being a second trigger for whole-page summarization.

### 3. Dashboard

Open the Grafana evaluation page and choose **Draw a Region**.

Draw a rectangle around a chart or KPI group.

Lumen analyzes the selected visual region and returns the visible trends and metrics.

### 4. Tab Isolation

Keep an existing Lumen summary open in one tab and open another webpage in a new tab.

The new tab begins clean.

Returning to the first tab restores its previous summary and conversation.

This demonstrates that browser tabs behave as independent Lumen sessions.

---

# Design Decisions

A few decisions were kept intentionally strict.

### Capture is explicit

Opening Lumen does not immediately scan the page.

The user first chooses what should become context.

### Selection means selection

Current Selection does not silently include the surrounding webpage.

### Visual content has a separate path

Charts and dashboards are not forced through DOM text extraction when the relevant information is visual.

### Tabs are independent

Changing the task in one browser tab should not affect another.

### Missing information stays missing

The structured format does not justify inventing content just to fill all six sections.

### Failed capture stays a failure

If reliable page content cannot be obtained, Lumen reports the limitation.

---

# What Lumen Changes

Without Lumen:

```text
Webpage
   ↓
Find relevant content
   ↓
Copy
   ↓
Switch tab
   ↓
Open chatbot
   ↓
Paste
   ↓
Explain what the content is
   ↓
Ask
   ↓
Switch back
```

With Lumen:

```text
Webpage
   ↓
Choose what matters
   ↓
Lumen
   ↓
Understand
   ↓
Ask
```

---

# Final Build Status

```text
Manifest V3                 PASS
Whole Page                  PASS
Current Selection           PASS
Draw a Region               PASS
Structured Brief            PASS
Follow-up Q&A               PASS
Long Context                PASS
Streaming                   PASS
Multilingual Output         PASS
Privacy Redaction           PASS
Tab Isolation               PASS
State Persistence           PASS
Failure Handling            PASS

Evaluation Websites         8 / 8 PASS
```

---

## Lumen

**The information is already on the screen. Understanding it shouldn't require leaving the screen.**
