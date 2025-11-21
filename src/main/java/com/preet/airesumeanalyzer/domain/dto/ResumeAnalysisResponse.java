package com.preet.airesumeanalyzer.domain.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ResumeAnalysisResponse {
    UUID resumeId;
    UUID analysisId;
    String originalFileName;
    int atsScore;
    List<String> skillsTechnical;
    List<String> skillsSoft;
    List<String> strengths;
    List<String> weaknesses;
    List<String> suggestedRoles;
    List<String> missingKeywords;
    String summary;
    Instant uploadedAt;
    Instant createdAt;
}

