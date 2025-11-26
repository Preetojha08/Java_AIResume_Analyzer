# AI Resume Analyzer

Backend reference implementation that ingests PDF resumes, stores them on the local filesystem, extracts the text with Apache Tika, and asks OpenAI to generate ATS-style insights that are persisted to PostgreSQL.

## Tech Stack
- Java 17, Spring Boot 3.3
- Spring MVC, Spring Data JPA, Validation, Actuator
- PostgreSQL (local Docker or managed service)
- Apache Tika for document parsing
- OpenAI Chat Completions API for analysis
- Maven build

## Architecture Overview
```
Client
  |
ResumeController (REST)
  |
ResumeService ---------------------------------------------------------+
  |            |                     |                  |              |
StorageService | TextExtractionService AiAnalysisService ResumeAnalysisService
    |                   |                     |                  |
 Local disk        Apache Tika          OpenAI Chat API     PostgreSQL (JPA)
```

## Domain Model
- `Resume` – UUID id, storage key (relative file path), original filename, MIME type, uploaded timestamp.
- `ResumeAnalysis` – UUID id, FK to `Resume`, ATS score, skill arrays (stored as JSON), strengths/weaknesses, suggested roles, missing keywords, summary, creation timestamp.

## REST API
### `POST /api/resumes/upload`
Multipart field `file` (PDF). Returns:
```json
{
  "resumeId": "e4a96e55-9c0c-4f8c-b77a-2c42f0e70b3f",
  "analysisId": "d86a4a7d-0e10-4885-bb9a-43728cefa897",
  "status": "COMPLETED",
  "message": "Resume processed successfully",
  "uploadedAt": "2025-11-18T20:15:13.012Z"
}
```

### `GET /api/resumes/{id}/analysis`
Returns skills, strengths/weaknesses, suggested roles, missing keywords, summary, ATS score, timestamps.

### `GET /api/resumes/{id}/score`
Lightweight payload with `atsScore`, `shortSummary`, and timestamps.

### `DELETE /api/resumes/{id}`
Deletes the stored PDF and DB rows. Response: `204 No Content`.

> **Security** – All `/api/**` endpoints expect header `X-API-KEY`. Configure the value via `security.api-key` or `API_KEY_HEADER` env var.

## Configuration (`src/main/resources/application.yml`)
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/resume_analyzer
    username: postgres
    password: postgres
  jpa:
    hibernate:
      ddl-auto: update

openai:
  api-key: ${OPENAI_API_KEY:change-me}
  model: gpt-4.1-mini

storage:
  local:
    base-path: ./uploads/resumes

security:
  api-key: ${API_KEY_HEADER:change-me-api-key}
```
Override anything using environment variables or profile-specific YAML files.

## Local Setup
1. **PostgreSQL** (Docker example):
   ```bash
   docker run --name resume-db -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=resume_analyzer -p 5432:5432 -d postgres:15
   ```
2. **Environment variables** (PowerShell example):
   ```powershell
   $env:OPENAI_API_KEY="sk-your-key"
   $env:API_KEY_HEADER="local-dev-key"
   ```
3. **Build & run**:
   ```bash
   mvn clean verify
   mvn spring-boot:run
   ```
4. **Smoke test**:
   ```bash
   curl -X POST http://localhost:8080/api/resumes/upload `
        -H "X-API-KEY: local-dev-key" `
        -F "file=@/path/to/resume.pdf"
   ```

## Deployment Notes
- Package with `mvn clean package` and run `java -jar target/ai-resume-analyzer-0.0.1-SNAPSHOT.jar`.
- Ensure the runtime host has:
  1. Java 17,
  2. Access to PostgreSQL,
  3. Writable directory for `storage.local.base-path`,
  4. `OPENAI_API_KEY` + `API_KEY_HEADER` environment variables.
- For containerization, mount a volume to `/app/uploads/resumes` (or whichever base path you set) so files persist.

## Interview Talking Points
- Clean layering: controllers → services → repositories with DTO boundaries.
- Text extraction is deterministic (Apache Tika) before LLM processing, enabling auditing and caching later.
- OpenAI integration encapsulated in `AiAnalysisService`, making it easy to swap providers (Anthropic, Bedrock) without touching controllers.
- Security: API key filter, validation, and centralized exception handling mimic production hardening.

## Future Enhancements
1. Add async processing (queue up uploads, respond fast).
2. Implement resumable uploads & virus scanning.
3. Cache analysis results per resume checksum.
4. Add observability (structured logs, metrics, tracing).
5. Optional AWS profile that re-enables S3/Bedrock using the same service interfaces.

## Frontend (React + Vite)
- Location: `frontend/` (React + TypeScript + Vite + Tailwind).
- Routes: `/` upload view, `/analysis/:resumeId` analysis view.
- API client automatically sends `X-API-KEY` from env vars to the Spring Boot backend.

### Setup
1. `cd frontend`
2. Copy env template: `cp .env.example .env.local`
3. Set values:
   - `VITE_API_BASE_URL=http://localhost:8080`
   - `VITE_API_KEY=local-dev-key` (or your configured key)
4. Install deps: `npm install`
5. Run dev server: `npm run dev` then open the shown URL (default `http://localhost:5173`)

### What the UI does
- Upload PDF resumes (drag-and-drop) with animated CTA, shows upload status and links to the analysis view.
- Analysis page: hero ATS score ring, summary, skills, strengths/weaknesses, suggested roles, missing keywords, timestamps, and delete flow with confirmation + toasts.

---

# Full Project README

## Overview
AI Resume Analyzer with Spring Boot backend and React/Vite frontend. Upload a PDF, get an ATS-style analysis powered by Gemini, and view/delete results.

## Tech Stack
- Backend: Java 17, Spring Boot 3.3, Spring MVC, JPA, PostgreSQL, Apache Tika, Google Gemini
- Frontend: React 18, TypeScript, Vite, TailwindCSS, Framer Motion, React Router
- Auth: API key header `X-API-KEY` (default `local-dev-key`)

## Backend
### Prereqs
- Java 17, Maven
- PostgreSQL running with DB `resume_analyzer`, user `postgres`, password `postgres` (matching `src/main/resources/application.yml`)
- Gemini API key set via env (`GEMINI_API_KEY`) if you want real analysis

### Run
```bash
mvn spring-boot:run
# server on http://localhost:8080
```

### Env/config notes
- `security.api-key` in `application.yml` controls the required `X-API-KEY` (default `local-dev-key`).
- Files stored under `./uploads/resumes`.
- CORS is enabled for `http://localhost:5173` and preflights skip API key checks.

### Smoke test
```bash
curl -i http://localhost:8080/actuator/health
curl -i -X POST http://localhost:8080/api/resumes/upload \
  -H "X-API-KEY: local-dev-key" \
  -F "file=@/path/to/resume.pdf"
```

## Frontend
### Prereqs
- Node 18+, npm

### Setup
```bash
cd frontend
cp .env.example .env.local
# edit .env.local if needed
# VITE_API_BASE_URL=http://localhost:8080
# VITE_API_KEY=local-dev-key
npm install
npm run dev
# open http://localhost:5173
```

### Build
```bash
npm run build
# output in frontend/dist
```

### Features
- Upload PDF (drag/drop or browse) with validation, loading, toasts
- Analysis view:
  - Hero ATS score ring (animated)
  - Technical/soft skills, strengths, weaknesses
  - Suggested roles, missing keywords with warning chips
  - Executive and full summaries, timestamps
  - Delete resume with confirmation modal + success toast
- Responsive 12-col layout, glass/gradient styling, animated cards/chips
- Footer on all pages:
  - © 2025 Creatures Inc. | Crafted by Preet Ojha
  - Languages & Frameworks: React, TypeScript | Styling: TailwindCSS
  - AI Model: Google Gemini 2.5 Pro

## Running everything locally
1. Start PostgreSQL and ensure creds match `application.yml`.
2. Backend: `mvn spring-boot:run` (port 8080).
3. Frontend: `cd frontend && npm install && npm run dev` (port 5173).
4. Open `http://localhost:5173`, upload a PDF, click “View Full Analysis”. Delete via the floating button on the analysis page.

## Common issues
- CORS / preflight: Already enabled for `http://localhost:5173`; ensure you restarted backend after changes.
- 401/403: Check `VITE_API_KEY` matches `security.api-key` and backend is running.
- DB errors: Confirm Postgres is up and `resume_analyzer` DB exists with matching user/pass.
