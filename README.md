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
