package com.preet.airesumeanalyzer.domain.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class JobFitResponse {
    private UUID jobFitId;
    private UUID resumeId;
    private String jobTitle;
    private Integer matchScore;
    private List<String> requiredTechnicalSkills;
    private List<String> requiredSoftSkills;
    private List<String> niceToHaveSkills;
    private List<String> matchedKeywords;
    private List<String> missingRequiredKeywords;
    private List<String> missingNiceToHaveKeywords;
    private List<String> tailoredSuggestions;
    private Instant createdAt;
}
