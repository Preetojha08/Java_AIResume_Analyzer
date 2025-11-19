# AI Resume Analyzer

AI-powered backend that ingests PDF resumes, stores them on Amazon S3, extracts the text with Apache Tika, and leverages AWS Bedrock to deliver ATS-style insights that persist inside PostgreSQL.

## Tech Stack
- Java 17, Spring Boot 3
- Spring Web/Data JPA/Validation/Actuator
- PostgreSQL (local + AWS RDS ready)
- Apache Tika for document parsing
- AWS SDK v2 (S3 + Bedrock Runtime)
- Maven build

## Architecture Overview
```
Client
  |
ResumeController (REST)
  |
ResumeService -----------------------------------------------+
  |            |             |                |               |
StorageService | TextExtractionService BedrockService ResumeAnalysisService
    |                   |              |                 |
 AWS S3           Apache Tika     AWS Bedrock       PostgreSQL (JPA Repos)
```

## Domain Model
- `Resume` – UUID primary key, S3 key, original filename, content type, uploaded timestamp.
- `ResumeAnalysis` – UUID primary key, FK to `Resume`, ATS score,技能 arrays (stored as JSON strings), strengths/weaknesses/suggestions, summary, created timestamp.

## REST API
### 1. `POST /api/resumes/upload`
Multipart field `file` (PDF only).
Response
```json
{
  "resumeId": "e4a96e55-9c0c-4f8c-b77a-2c42f0e70b3f",
  "analysisId": "d86a4a7d-0e10-4885-bb9a-43728cefa897",
  "status": "COMPLETED",
  "message": "Resume processed successfully",
  "uploadedAt": "2025-11-18T20:15:13.012Z"
}
```

### 2. `GET /api/resumes/{id}/analysis`
Response
```json
{
  "resumeId": "...",
  "analysisId": "...",
  "originalFileName": "preet_resume.pdf",
  "atsScore": 82,
  "skillsTechnical": ["Java", "Spring Boot", "PostgreSQL"],
  "skillsSoft": ["Leadership", "Communication"],
  "strengths": ["Strong API design"],
  "weaknesses": ["Limited AWS experience"],
  "suggestedRoles": ["Backend Developer", "Cloud Engineer"],
  "missingKeywords": ["Kubernetes", "CI/CD"],
  "summary": "(3-4 sentence summary)",
  "uploadedAt": "2025-11-18T20:15:13.012Z",
  "createdAt": "2025-11-18T20:15:18.350Z"
}
```

### 3. `GET /api/resumes/{id}/score`
```json
{
  "resumeId": "...",
  "analysisId": "...",
  "atsScore": 82,
  "shortSummary": "Concise summary text",
  "createdAt": "2025-11-18T20:15:18.350Z"
}
```

### 4. `DELETE /api/resumes/{id}`
Deletes S3 object and DB rows, responds with `204 No Content`.

### Security
All `/api/**` endpoints require header `X-API-KEY`. Configure the value via `security.api-key` property or env var.

## Configuration (`src/main/resources/application.yml`)
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/resume_analyzer
    username: postgres
    password: change-me # TODO: move to env var
  jpa:
    hibernate:
      ddl-auto: update

aws:
  region: ca-central-1 # TODO: set preferred region
  s3:
    bucket-name: preet-resume-analyzer-resumes # TODO: actual bucket
  bedrock:
    model-id: anthropic.claude-3-sonnet-20240229-v1:0 # TODO: choose model

security:
  api-key: change-me-api-key # TODO: set secret via env var
```
Use environment variables or `application-*.yml` overrides for production. AWS credentials should be provided via standard SDK providers (env vars, AWS profile, or IAM role).

## Running Locally
1. Install Java 17 and Maven 3.9+.
2. Start PostgreSQL locally (Docker example):
   ```bash
   docker run --name resume-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=resume_analyzer -p 5432:5432 -d postgres:15
   ```
3. Set env vars (powershell example):
   ```powershell
   $env:AWS_ACCESS_KEY_ID="..."
   $env:AWS_SECRET_ACCESS_KEY="..."
   $env:AWS_REGION="ca-central-1"
   $env:SECURITY_API_KEY="local-dev-key"
   ```
4. Run the service:
   ```bash
   mvn spring-boot:run
   ```

## AWS Resources Needed
- **S3 bucket** for resume PDFs (e.g., `preet-resume-analyzer-resumes`). Configure bucket + IAM policy for Put/Delete.
- **RDS PostgreSQL**: create DB instance, update JDBC URL in config, ensure security group allows traffic from app host/EB environment.
- **AWS Bedrock access**: enable Bedrock in selected region and ensure IAM role/user has `bedrock:InvokeModel` permission on the chosen model.

## Deployment Guide
### EC2 / Elastic Beanstalk (single Jar)
1. Build artifact: `mvn clean package -DskipTests` (produces `target/ai-resume-analyzer-0.0.1-SNAPSHOT.jar`).
2. Provision EC2 or Elastic Beanstalk environment (Java 17 platform) in desired region.
3. Configure environment variables: JDBC URL/credentials, `AWS_REGION`, `SECURITY_API_KEY`, `AWS_ACCESS_KEY_ID/SECRET` (or assign IAM role with Bedrock, S3, RDS access).
4. Ensure the EC2/EB security group can reach RDS and S3 endpoints.
5. Upload jar and run:
   ```bash
   java -jar ai-resume-analyzer-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
   ```
6. (Optional) place jar + startup command in systemd unit for auto restart.

### Elastic Beanstalk specifics
1. Create new EB app (Java 17 platform).
2. Zip the jar as `application.jar` or provide Dockerrun if using containers.
3. Set environment variables under Configuration → Software.
4. Attach IAM instance profile granting S3 (put/delete), RDS (via VPC SG), and Bedrock (InvokeModel) permissions.
5. Deploy version; EB handles load balancing/auto-scaling.

## How To Explain In An Interview
- Highlight clean layering (controllers → services → repositories) and AWS integrations (S3, Bedrock, RDS) with Apache Tika for deterministic parsing.
- Emphasize defense-in-depth: validation, API key filter, centralized error handling.
- Talk through the resume flow (upload→S3→Tika→Bedrock→Postgres) and how it mirrors production best practices (config-driven, DTOs, logging).
- Mention extensibility ideas: add queued processing, caching, or UI later.

## Next Steps / Enhancements
1. Add async processing (SQS/Lambda) for heavy resumes.
2. Implement audit logging and structured metrics.
3. Build a front-end or CLI for demonstration.
4. Automate infrastructure with Terraform or CDK.
