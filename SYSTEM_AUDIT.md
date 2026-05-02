# TrustAI — Full System Architecture & Integration Audit

**Scope:** All three tiers (Flask AI, Express Backend, React Frontend)  
**Method:** Static analysis of source files — no runtime testing performed  

---

## Summary Table

| Severity | Count |
|----------|-------|
| 🔴 Critical (broken functionality) | 8 |
| 🟠 High (broken in production) | 4 |
| 🟡 Medium (degraded behavior) | 5 |
| 🔵 Low / Tech-debt | 4 |

---

## Architecture Overview

```
Browser (React/Vite :5173)
     │
     ├── REST → Express (:9999)  →  Flask (:8000)
     │              │
     │           PostgreSQL
     │
     └── WebSocket → websocket-server.js (:8080) → Flask (:8000/analyze/business)
```

**Ports:**
- Frontend dev server: `5173`
- Express backend: `9999`
- Standalone WebSocket server: `8080` (separate process)
- Flask AI: `8000` (per `flask.ai.service.ts`) **or** `5000` (per `analysisService.ts`) — inconsistent

---

## 🔴 Critical Issues

### C1 — Live analysis bypasses the backend entirely

**Files:** `BusinessAnalysis.tsx:61`, `InterviewAnalysis.tsx:61`

Both live-mode analysis flows directly `fetch()` the Flask server from the browser:

```ts
// BusinessAnalysis.tsx and InterviewAnalysis.tsx — IDENTICAL hardcoded call
const response = await fetch("http://localhost:8000/analyze/business", {
  method: "POST",
  body: formData,
});
```

**Problems:**
- Hardcoded `localhost:8000` — breaks immediately in production, Docker, or any deployed environment
- Bypasses the Express backend and all auth middleware — unauthenticated access to Flask
- No JWT verification, no rate limiting, no DB record creation for live analysis
- No env-var substitute (`VITE_FLASK_URL` or similar) defined anywhere in the project

---

### C2 — Interview live mode calls the wrong Flask endpoint

**File:** `InterviewAnalysis.tsx:61`

The Interview analysis page is explicitly named "Interview Analysis" but its live path POSTs to `/analyze/business`:

```ts
fetch("http://localhost:8000/analyze/business", ...)  // should be /analyze/hr or /analyze/interview
```

Interview analysis results will be processed by the business analysis pipeline and returned with business-mode scoring.

---

### C3 — File upload sends a browser Blob URL to the backend

**Files:** `BusinessAnalysis.tsx:108`, `InterviewAnalysis.tsx:108`

```ts
const fileUrl = URL.createObjectURL(selectedFile);  // → "blob:http://localhost:5173/abc-123"
const response = await analysisAPI.create({ fileUrl, modes: ["BUSINESS"] });
```

`URL.createObjectURL()` produces a `blob:` URL that is only valid within the current browser tab's memory. The backend receives this string and attempts to treat it as an uploadable file location — it cannot fetch, read, or pass it to Flask. **File upload analysis is completely non-functional.**

---

### C4 — Backend `createAnalysis` never triggers Flask

**File:** `apps/backend/src/controllers/analysis.controller.ts`

The POST `/api/analyses` handler:
1. Validates the request
2. Creates a DB record with `status: "QUEUED"`
3. Returns `201 Created`
4. **Does nothing else**

There is no job queue, no worker process, no immediate Flask call, and no async trigger. Every file analysis request stays in QUEUED status permanently. The backend has no mechanism to transition analyses to COMPLETED.

---

### C5 — WebSocket server corrupts audio before sending to Flask

**File:** `apps/backend/websocket-server.js`

```js
function createWavHeader(dataLength) {
  const buffer = Buffer.alloc(44);
  // ... writes PCM WAV header (RIFF/WAVE/fmt /data chunks)
  return buffer;
}

function combineChunksToWav(chunks) {
  const audioData = Buffer.concat(chunks);
  const header = createWavHeader(audioData.length);
  return Buffer.concat([header, audioData]);   // ← prepends PCM header to WebM/Opus binary
}
```

`MediaRecorder` in the browser emits **WebM/Opus** containers, not raw PCM. Prepending a PCM WAV header to a WebM binary produces a file that is neither valid WAV nor valid WebM. Flask's `librosa.load()` will throw an exception on every audio chunk sent from the microphone stream.

---

### C6 — Flask port conflict between two competing service files

**Files:** `apps/backend/src/services/flask.ai.service.ts:~L20`, `apps/backend/src/services/analysisService.ts:~L8`

```ts
// flask.ai.service.ts
const FLASK_URL = process.env.FLASK_API_URL || "http://localhost:8000";

// analysisService.ts
const FLASK_API_URL = process.env.FLASK_API_URL || "http://localhost:5000";
```

Both files are separate Flask client implementations. They share the same env var name (`FLASK_API_URL`) but have different fallback ports. If `FLASK_API_URL` is not set, one service hits port 8000 and the other hits port 5000. Only one can be correct — the other will always fail with connection refused.

---

### C7 — `analysisService.ts` calls Flask endpoints that do not exist

**File:** `apps/backend/src/services/analysisService.ts`

```ts
await axios.post(`${FLASK_API_URL}/api/analyze/blob`, formData);
await axios.post(`${FLASK_API_URL}/api/analyze/file`, formData);
```

The Flask app (`flask_api.py` / `aimodel/flask_api.py`) exposes `/analyze/business`, `/analyze/criminal`, `/analyze/hr` — not `/api/analyze/blob` or `/api/analyze/file`. These calls will always return 404.

---

### C8 — `flask.ai.service.ts` ignores the `mode` parameter, always calls `/analyze/business`

**File:** `apps/backend/src/services/flask.ai.service.ts`

Regardless of which mode is passed to `analyzeWithMode(mode, ...)`, the function always forwards to `/analyze/business`. Criminal and Interview modes are never executed by their correct Flask pipelines.

---

## 🟠 High Issues

### H1 — WebSocket URL hardcoded, no env var

**File:** `apps/frontend/src/hooks/useMicrophoneStream.ts`

```ts
const wsUrl = options?.wsUrl ?? "ws://localhost:8080";
```

This works only in local development. In production or with Docker, the connection will fail. No `VITE_WS_URL` env variable is defined anywhere in the project.

---

### H2 — WebSocket server must be started as a separate process

**File:** `apps/backend/websocket-server.js`

`websocket-server.js` is a standalone Node.js script. It is **not imported or started** by `apps/backend/src/server.ts`. The npm dev script in `apps/backend/package.json` should be checked to confirm whether it starts this server alongside Express. If it does not, the entire microphone streaming feature is silently unavailable.

---

### H3 — WebSocket server always uses business mode regardless of client intent

**File:** `apps/backend/websocket-server.js`

```js
const response = await axios.post('http://localhost:8000/analyze/business', formData);
```

No per-client mode tracking exists. Every connected client's audio is always analyzed as a business meeting, regardless of which analysis page the user is on.

---

### H4 — `ResultsPage` calls `analysisAPI.get('/analysis/${id}')` but no such Express route exists

**File:** `apps/frontend/src/pages/ResultsPage.tsx:42`

```ts
const response = await analysisAPI.get(`/analysis/${id}`);
```

The Express router registers `/api/analyses/:id` (plural). The frontend calls `/api/analysis/:id` (singular). This 404 means the results page never loads real data.

> **Check:** Verify route registration in `apps/backend/src/routes/analysis.routes.ts` — if the route is `/analyses/:id`, the frontend URL must match.

---

## 🟡 Medium Issues

### M1 — Two Flask service files with no clear owner

`flask.ai.service.ts` is used by the active Express routes. `analysisService.ts` appears to be dead code (no active import found). Having duplicate Flask clients causes confusion and drift. `analysisService.ts` should either be deleted or consolidated.

---

### M2 — Live form sends audio as `interview-audio-*.wav` but it is not WAV

**Files:** `BusinessAnalysis.tsx:50`, `InterviewAnalysis.tsx:50`

```ts
formData.append("audio", audioBlob, `interview-audio-${Date.now()}.wav`);
```

The `audioBlob` from `InterviewLiveForm` is returned from `MediaRecorder`, which records in WebM/Opus. Naming it `.wav` and appending it with a `.wav` filename does not convert it. Flask's audio pipeline will receive a WebM file masquerading as WAV, and librosa may fail to decode it.

---

### M3 — `useMicrophoneStream` reads Flask response at wrong path

**File:** `apps/frontend/src/hooks/useMicrophoneStream.ts`

The hook reads:
```ts
flaskData?.analysis?.credibility?.score
flaskData?.analysis?.credibility?.label
```

But the actual Flask response structure (from `flask_api.py`) returns a flat object with fields like `credibility_score`, `lie_probability`, `voice_stress`, etc. — not nested under `analysis.credibility`. The live streaming display will always show `undefined` values.

---

### M4 — No reconnect logic in the WebSocket hook

**File:** `apps/frontend/src/hooks/useMicrophoneStream.ts`

If the WebSocket connection drops (server restart, network blip), the hook transitions to an error state with no automatic retry. The user must manually reload the page.

---

### M5 — Pre-existing TypeScript build errors (5 files)

These errors exist independently of the above issues and will block production builds:

| File | Error |
|------|-------|
| `AnalysisLive.tsx` | Prop type mismatch on component |
| `InterviewLiveForm.tsx` | Unused import errors |
| `UI/Input.tsx` | framer-motion type conflict |
| `useMicrophoneStream.ts` | `string\|undefined` vs `string\|null` mismatch |
| `AdminDashboardNew.tsx` | `Variants` type incompatibility from framer-motion |

---

## 🔵 Low / Tech-Debt

### L1 — `analysisService.ts` is dead code

No active route or controller imports `analysisService.ts`. It should be removed to avoid confusion with `flask.ai.service.ts`.

---

### L2 — No file upload mechanism exists anywhere

The codebase has no multipart file upload endpoint on Express. Files selected in the UI are converted to blob URLs and sent as strings. A proper upload pipeline (Express `multer` → temp storage → Flask `multipart/form-data`) needs to be built.

---

### L3 — `CriminalAnalysis.tsx` mode

Quick check recommended: `CriminalAnalysis.tsx` live mode should be verified to not also call `/analyze/business` like BusinessAnalysis and InterviewAnalysis do.

---

### L4 — No queue worker ever processes QUEUED analyses

Even if file upload were fixed, there is no background worker polling the database for QUEUED analyses. Options to implement: BullMQ job queue, a cron loop in Express, or switching to inline synchronous Flask calls on POST.

---

## Recommended Fix Priority

### Phase 1 — Make live analysis work end-to-end

1. **C1** — Replace hardcoded `http://localhost:8000` in `BusinessAnalysis.tsx` and `InterviewAnalysis.tsx` with `import.meta.env.VITE_FLASK_URL` and add to `.env`
2. **C2** — Change `InterviewAnalysis.tsx` to call `/analyze/hr` (or whichever endpoint the Flask app exposes for interviews)
3. **C8** — Fix `flask.ai.service.ts` to route to the correct endpoint per `mode`
4. **M2** — Convert audio to WAV before sending, or ensure `MediaRecorder` is configured for audio/wav (use `mimeType: 'audio/webm'` explicitly and let Flask handle it, or use `RecordRTC` with WAV output)

### Phase 2 — Fix WebSocket streaming

5. **C5** — Remove `createWavHeader` corruption; either accept raw WebM and configure Flask to handle it, or use `audioContext.createScriptProcessor` for true PCM
6. **H1** — Add `VITE_WS_URL` env var and use it in `useMicrophoneStream.ts`
7. **H2** — Confirm WebSocket server starts alongside Express (check `package.json` dev script)
8. **H3** — Pass mode through WebSocket message protocol and route accordingly in `websocket-server.js`
9. **M3** — Align `useMicrophoneStream` response parsing with actual Flask JSON schema

### Phase 3 — Fix file upload flow

10. **C3** — Implement actual file upload: send `File` object via `FormData` to a new Express endpoint (`POST /api/analyses/upload`), use `multer` to store the file, then call Flask with the real file path
11. **C4 + L4** — Either inline the Flask call (synchronous, simpler) or implement a job worker (BullMQ, async)
12. **L2** — Wire up the complete upload pipeline

### Phase 4 — Cleanup

13. **C6** — Standardize Flask port across all files; pick port 8000, delete the 5000 fallback
14. **C7 + M1 + L1** — Delete `analysisService.ts`; consolidate all Flask calls through `flask.ai.service.ts`
15. **H4** — Verify and align the results page API URL with actual Express route path
16. **M5** — Fix the 5 pre-existing TypeScript errors so production builds succeed

---

## Key Files Reference

| File | Role | Status |
|------|------|--------|
| `apps/frontend/src/pages/BusinessAnalysis.tsx` | Business live + upload page | 🔴 C1, C3 |
| `apps/frontend/src/pages/InterviewAnalysis.tsx` | Interview live + upload page | 🔴 C1, C2, C3 |
| `apps/frontend/src/pages/ResultsPage.tsx` | Shows analysis results | 🟠 H4 |
| `apps/frontend/src/hooks/useMicrophoneStream.ts` | WS + MediaRecorder hook | 🟠 H1, 🟡 M3, M4 |
| `apps/backend/websocket-server.js` | Standalone WS server | 🔴 C5, 🟠 H2, H3 |
| `apps/backend/src/services/flask.ai.service.ts` | Primary Flask client | 🔴 C6, C8 |
| `apps/backend/src/services/analysisService.ts` | Dead Flask client | 🔴 C6, C7, 🔵 L1 |
| `apps/backend/src/controllers/analysis.controller.ts` | Analysis REST controller | 🔴 C4 |
