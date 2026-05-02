I'm working on a project called **TrustAI** — an AI-powered deception detection and credibility analysis platform. I need you to fully understand the system so you can help me build, debug, and extend it. Here is a complete description of the project:

---

## What TrustAI Does

TrustAI analyzes facial expressions, voice stress, and speech to estimate credibility and deception probability. It has 3 analysis modes:
- **Criminal Investigation** — suspect interrogation deception detection (high risk focus)
- **Interview Analysis** — HR candidate credibility scoring
- **Business Analysis** — meeting communication & intent analysis

Users can upload audio/video files or use their microphone for real-time live analysis. The system generates reports with credibility scores, stress levels, deception indicators, and risk assessments.

---

## Architecture (Monorepo)

```
trustai/
├── aimodel/                # Python AI service (Flask, port 8000)
│   ├── modules/            # Core AI modules
│   │   ├── face_module.py    # FaceAnalyzer — DeepFace (emotion, age, gender, race)
│   │   ├── voice_module.py   # VoiceAnalyzer — Whisper transcription + Librosa stress + wav2vec2 emotion
│   │   ├── lie_module.py     # LieDetector — combines face+voice for credibility/deception scoring
│   │   └── report_module.py  # ReportGenerator — generates contextual text reports
│   ├── modes/              # Analysis mode configs
│   │   ├── business_mode.py
│   │   ├── criminal_mode.py
│   │   └── hr_mode.py
│   ├── flask_api.py        # Flask REST API wrapping the AI system
│   ├── main.py             # AIAnalysisSystem orchestrator
│   └── requirements.txt
├── apps/
│   ├── backend/            # Express.js API (TypeScript, port 9999)
│   │   ├── src/
│   │   │   ├── routes/         # API route definitions
│   │   │   ├── controllers/    # Request handlers
│   │   │   ├── services/       # Business logic + Flask integration (flask.ai.service.ts)
│   │   │   ├── db/             # Drizzle ORM schemas (PostgreSQL)
│   │   │   ├── middleware/     # Auth (JWT), error handling, logging, uploads (Multer)
│   │   │   └── utils/          # Audio conversion (FFmpeg), file helpers
│   │   └── websocket-server.js # Live audio WebSocket server (port 8080)
│   └── frontend/           # React + Vite + TypeScript (port 5173)
│       └── src/
│           ├── pages/          # ModeSelectionNew, BusinessAnalysis, InterviewAnalysis, CriminalAnalysis, ResultsPage, AdminDashboardNew, UserProfile
│           ├── components/     # AnalysisResults, AnalysisProgress, LiveAnalysisDisplay, FileUploader, Navbar, etc.
│           ├── hooks/          # useAudioRecorder, useMicrophoneStream, useAnalysisState, useRetry, etc.
│           └── services/       # Axios API client
├── docker-compose.yml      # PostgreSQL 15, Redis 7, Backend, Frontend containers
└── package.json            # Root workspace scripts
```

### Data Flow

```
Browser (React :5173) → Express Backend (:9999) → Flask AI Service (:8000)
                                ↕                        ↕
                        PostgreSQL + Redis         DeepFace + Whisper + Librosa + wav2vec2
```

**Live streaming path:** Browser mic → MediaRecorder (WebM/Opus) → POST chunks to Express `/analyze/live` or via WebSocket (:8080) → Flask → real-time results back to UI.

---

## Tech Stack

**Frontend:** React 19, TypeScript, Vite 7, TailwindCSS, Framer Motion, Recharts, Axios, jsPDF (PDF export), React Router DOM, Lucide icons

**Backend:** Express 4, TypeScript, Drizzle ORM + drizzle-kit (PostgreSQL), BullMQ (job queue), JWT + bcrypt (auth), Multer (file uploads), Pino (logging), Swagger (API docs), nodemailer, Google Auth Library (OAuth)

**AI/ML:** Flask 2.3, DeepFace 0.0.79, OpenAI Whisper, Librosa 0.9.2, Transformers (wav2vec2-base-superb-er), PyTorch 2.0, OpenCV, scikit-learn, Gunicorn (production)

**Infra:** Docker Compose 3.9, PostgreSQL 15, Redis 7, FFmpeg 8.0.1

---

## Key API Endpoints

**Auth:** `POST /api/auth/signup`, `/login`, `/google-login`, `/forgot-password`, `/change-password`

**Analysis:** `POST /api/analyses` (from URL), `POST /api/analyses/upload` (file upload), `GET /api/analyses/:id` (get result)

**Direct Analysis:** `POST /analyze/business`, `/analyze/interview`, `/analyze/investigation`, `/analyze/live` — accept audio file + mode, return immediate results

**Admin:** `GET /api/admin/metrics`, `/analytics`, `/logs`, `/health`, `/backups`, CRUD for backups, export users/analyses

**User:** `GET /api/users/profile`, `PUT /api/users/profile`, `GET /api/users/analyses`

---

## Database Schema (PostgreSQL + Drizzle ORM)

- **users** — id (UUID), email (unique), password (bcrypt), name, role, isActive, timestamps
- **analyses** — id (UUID), userId (FK), status (PENDING→PROCESSING→COMPLETED/FAILED), modes (array), overallRiskScore, confidenceLevel, results (JSONB), timestamps
- **files** — id (UUID), analysisId (FK), fileType, filePath, fileSize, uploadedAt
- **analysisLogs** — analysisId (FK), logLevel, message, timestamp
- **auditLogs** — userId (FK), action, resource, changes, timestamp, ipAddress
- **systemSettings** — maintenanceMode, maxConcurrentAnalyses, sessionTimeout

---

## AI Module Details

**FaceAnalyzer:** Uses DeepFace (Facenet512 model) to detect emotion, age, gender, race from images/video. Methods: `analyze_image()`, `analyze_video()`, `compare_faces()`.

**VoiceAnalyzer:** Whisper (base) for transcription, Librosa RMS for stress level (0-100), wav2vec2 for voice emotion. Methods: `transcribe_audio()`, `analyze_audio_file()`, `detect_emotion()`, `record_audio()`. Supports WAV, MP3, M4A, OGG, FLAC.

**LieDetector:** Combines face + voice data. Calculates `lie_probability` (0-100), `credibility_score` (0-100), `risk_assessment` (LOW/MEDIUM/HIGH), `deception_indicators` list. Logic: high stress + neutral face = deception signal; emotion-voice mismatch = suspicious.

**ReportGenerator:** Creates formatted reports (General/HR/Criminal/Business) with executive summary, facial/voice analysis breakdown, credibility analysis, recommendations.

**AIAnalysisSystem (main.py):** Orchestrator that runs all modules in sequence: face analysis → voice analysis → lie detection → report generation.

---

## Audio Handling

- **Live recording:** MediaRecorder API → WebM/Opus → 2-3s chunks → POST as FormData
- **Audio conversion:** FFmpeg converts all formats to 16kHz mono PCM WAV for AI models
- **WebSocket streaming (port 8080):** Binary audio frames → buffer 5 chunks → create WAV → send to Flask → return results
- **Mic settings:** Echo cancellation, noise suppression, auto gain control enabled

---

## Environment Variables

**Backend:** `PORT=9999`, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `FLASK_URL=http://localhost:8000`, `FLASK_TIMEOUT=60000`, `FLASK_MAX_RETRIES=3`, `GOOGLE_CLIENT_ID/SECRET`, `CORS_ORIGINS`

**Frontend:** `VITE_API_URL=http://localhost:9999/api`, `VITE_AI_SERVICE_URL=http://localhost:8000`, `VITE_WS_URL=ws://localhost:8080`

**Flask:** `API_PORT=8000`, `UPLOAD_FOLDER=uploads`, `FACE_MODEL=Facenet512`, `USE_GPU=true`

---

You now have complete context about TrustAI. When I ask you to modify, fix, or add features — reference this architecture. Always consider the full data flow (Frontend → Express → Flask → AI modules) and maintain consistency across all 3 layers. Ask me to clarify if my request could affect multiple layers.
