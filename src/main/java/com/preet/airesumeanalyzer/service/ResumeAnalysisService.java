package com.preet.airesumeanalyzer.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.preet.airesumeanalyzer.domain.dto.ResumeAnalysisResult;
import com.preet.airesumeanalyzer.domain.dto.ResumeAnalysisResponse;
import com.preet.airesumeanalyzer.domain.dto.ResumeScoreResponse;
import com.preet.airesumeanalyzer.domain.entity.Resume;
import com.preet.airesumeanalyzer.domain.entity.ResumeAnalysis;
import com.preet.airesumeanalyzer.exception.ResourceNotFoundException;
import com.preet.airesumeanalyzer.exception.ResumeProcessingException;
import com.preet.airesumeanalyzer.repository.ResumeAnalysisRepository;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
@RequiredArgsConstructor
public class ResumeAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(ResumeAnalysisService.class);
    @Value("${gemini.api-key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-2.5-pro}")
    private String geminiModel;

    private final ResumeAnalysisRepository resumeAnalysisRepository;
    private final ObjectMapper objectMapper;
    private final RestClient restClient = RestClient.builder()
            .baseUrl("https://generativelanguage.googleapis.com/v1")
            .build();

    public ResumeAnalysisResult analyzeResumeText(String resumeText) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new ResumeProcessingException("Gemini API key not configured");
        }
        try {
            String response = restClient.post()
                    .uri("/models/" + geminiModel + ":generateContent?key={key}", geminiApiKey)
                    .body(buildRequestPayload(resumeText))
                    .retrieve()
                    .body(String.class);

            String content = normalizeJson(extractText(response));
            if (content == null || content.isBlank()) {
                throw new ResumeProcessingException("Gemini returned empty response");
            }
            return objectMapper.readValue(content, ResumeAnalysisResult.class);
        } catch (ResumeProcessingException e) {
            throw e;
        } catch (RestClientResponseException e) {
            log.error("Gemini HTTP error status={}, body={}", e.getRawStatusCode(), e.getResponseBodyAsString());
            throw new ResumeProcessingException("Gemini HTTP error: " + e.getStatusText(), e);
        } catch (Exception e) {
            log.error("Gemini analysis failed", e);
            throw new ResumeProcessingException("Gemini analysis failed: " + e.getMessage(), e);
        }
    }

    public ResumeAnalysis saveAnalysis(Resume resume, ResumeAnalysisResult result) {
        ResumeAnalysis analysis = ResumeAnalysis.builder()
                .resume(resume)
                .atsScore(result.getAtsScore())
                .skillsTechnical(writeList(result.getSkillsTechnical()))
                .skillsSoft(writeList(result.getSkillsSoft()))
                .strengths(writeList(result.getStrengths()))
                .weaknesses(writeList(result.getWeaknesses()))
                .suggestedRoles(writeList(result.getSuggestedRoles()))
                .missingKeywords(writeList(result.getMissingKeywords()))
                .summary(result.getSummary())
                .createdAt(Instant.now())
                .build();
        return resumeAnalysisRepository.save(analysis);
    }

    public ResumeAnalysis getByResumeId(UUID resumeId) {
        return resumeAnalysisRepository.findByResumeId(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume analysis not found for id " + resumeId));
    }

    public void deleteByResumeId(UUID resumeId) {
        resumeAnalysisRepository.deleteByResumeId(resumeId);
    }

    public ResumeAnalysisResponse toResponse(Resume resume, ResumeAnalysis analysis) {
        return ResumeAnalysisResponse.builder()
                .resumeId(resume.getId())
                .analysisId(analysis.getId())
                .originalFileName(resume.getOriginalFileName())
                .atsScore(analysis.getAtsScore())
                .skillsTechnical(readList(analysis.getSkillsTechnical()))
                .skillsSoft(readList(analysis.getSkillsSoft()))
                .strengths(readList(analysis.getStrengths()))
                .weaknesses(readList(analysis.getWeaknesses()))
                .suggestedRoles(readList(analysis.getSuggestedRoles()))
                .missingKeywords(readList(analysis.getMissingKeywords()))
                .summary(analysis.getSummary())
                .uploadedAt(resume.getUploadedAt())
                .createdAt(analysis.getCreatedAt())
                .build();
    }

    public ResumeScoreResponse toScoreResponse(Resume resume, ResumeAnalysis analysis) {
        return ResumeScoreResponse.builder()
                .resumeId(resume.getId())
                .analysisId(analysis.getId())
                .atsScore(analysis.getAtsScore())
                .shortSummary(analysis.getSummary())
                .createdAt(analysis.getCreatedAt())
                .build();
    }

    private String writeList(List<String> values) {
        try {
            return objectMapper.writeValueAsString(values == null ? Collections.emptyList() : values);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Unable to serialize list", e);
        }
    }

    private List<String> readList(String value) {
        if (value == null || value.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(value, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Unable to deserialize list", e);
        }
    }

    private String buildPrompt(String resumeText) {
        return """
Analyze this resume text and return JSON with the following fields:
- atsScore (integer 0-100)
- skillsTechnical (array of strings)
- skillsSoft (array of strings)
- strengths (array of strings)
- weaknesses (array of strings)
- suggestedRoles (array of strings)
- missingKeywords (array of strings)
- summary (string, 3-4 sentences)

Resume:
%s
Output only JSON, no prose or Markdown fences.
""".formatted(resumeText);
    }

    private Object buildRequestPayload(String resumeText) {
        return Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", buildPrompt(resumeText))
                        ))
                )
        );
    }

    private String extractText(String responseBody) throws JsonProcessingException {
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
        // Strip Markdown fences if present
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("```json\\s*", "")
                    .replaceFirst("^```\\s*", "")
                    .replaceAll("```\\s*$", "")
                    .trim();
        }
        // If JSON is embedded in text, extract first/last brace
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

