package com.preet.airesumeanalyzer.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.preet.airesumeanalyzer.domain.dto.JobFitAiResult;
import com.preet.airesumeanalyzer.exception.ResumeProcessingException;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
@RequiredArgsConstructor
public class JobFitAiService {

    private static final Logger log = LoggerFactory.getLogger(JobFitAiService.class);

    @Value("${gemini.api-key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-2.5-pro}")
    private String geminiModel;

    private final ObjectMapper objectMapper;
    private final RestClient restClient = RestClient.builder()
            .baseUrl("https://generativelanguage.googleapis.com/v1")
            .build();

    public JobFitAiResult analyzeJobFit(String resumeText, String jobTitle, String jobDescription) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new ResumeProcessingException("Gemini API key not configured");
        }
        try {
            String response = restClient.post()
                    .uri("/models/" + geminiModel + ":generateContent?key={key}", geminiApiKey)
                    .body(buildRequestPayload(resumeText, jobTitle, jobDescription))
                    .retrieve()
                    .body(String.class);

            String content = normalizeJson(extractText(response));
            if (content == null || content.isBlank()) {
                throw new ResumeProcessingException("Gemini returned empty response");
            }
            return objectMapper.readValue(content, JobFitAiResult.class);
        } catch (ResumeProcessingException e) {
            throw e;
        } catch (RestClientResponseException e) {
            log.error("Gemini HTTP error status={}, body={}", e.getRawStatusCode(), e.getResponseBodyAsString());
            throw new ResumeProcessingException("Gemini HTTP error: " + e.getStatusText(), e);
        } catch (Exception e) {
            log.error("Gemini job-fit analysis failed", e);
            throw new ResumeProcessingException("Gemini job-fit analysis failed: " + e.getMessage(), e);
        }
    }

    private Object buildRequestPayload(String resumeText, String jobTitle, String jobDescription) {
        return Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", buildPrompt(resumeText, jobTitle, jobDescription))
                        ))
                )
        );
    }

    private String buildPrompt(String resumeText, String jobTitle, String jobDescription) {
        return """
You are an ATS-style evaluator focusing on JOB-SPECIFIC MATCHING.

You will receive:
1. Full Resume Text
2. A Job Title (optional)
3. A Full Job Description

RULE: ANALYZE THE JOB DESCRIPTION FIRST to determine what the job requires. ONLY AFTER that, evaluate the resume AGAINST the extracted JD requirements.

Step 1 — Analyze ONLY the Job Description:
- targetJobTitle: the primary role being hired for.
- requiredTechnicalSkills: core technical skills required.
- requiredSoftSkills: interpersonal/communication/team skills required.
- niceToHaveSkills: skills listed as plus/bonus/nice-to-have.
- coreResponsibilities: major duties, tasks, and expectations. (optional for context)

Step 2 — Compare the Resume AGAINST the JD skills:
- matchedKeywords: skills/keywords present in BOTH JD and resume.
- missingRequiredKeywords: required JD skills NOT found in the resume.
- missingNiceToHaveKeywords: nice-to-have JD skills NOT found in the resume.

Step 3 — Compute Job Match Score:
- 0 to 100, derived from JD-FIRST → resume-SECOND logic.

Step 4 — Tailored Suggestions:
- 3–7 resume-ready improvements to better match THIS JD.

Return ONLY valid JSON:
{
  "targetJobTitle": "string",
  "requiredTechnicalSkills": ["string"],
  "requiredSoftSkills": ["string"],
  "niceToHaveSkills": ["string"],
  "matchedKeywords": ["string"],
  "missingRequiredKeywords": ["string"],
  "missingNiceToHaveKeywords": ["string"],
  "matchScore": 0-100,
  "tailoredSuggestions": ["string"]
}

Do NOT include any commentary or text outside this JSON.

Resume:
%s

Job Title:
%s

Job Description:
%s
""".formatted(resumeText, jobTitle == null ? "" : jobTitle, jobDescription);
    }

    private String extractText(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode candidates = root.path("candidates");
        if (candidates.isArray() && candidates.size() > 0) {
            JsonNode parts = candidates.get(0).path("content").path("parts");
            if (parts.isArray() && parts.size() > 0) {
                return parts.get(0).path("text").asText();
            }
        }
        return null;
    }

    private String normalizeJson(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("```json\\s*", "")
                    .replaceFirst("^```\\s*", "")
                    .replaceAll("```\\s*$", "")
                    .trim();
        }
        if (!trimmed.startsWith("{")) {
            int start = trimmed.indexOf('{');
            int end = trimmed.lastIndexOf('}');
            if (start >= 0 && end > start) {
                trimmed = trimmed.substring(start, end + 1);
            }
        }
        return trimmed.trim();
    }
}
