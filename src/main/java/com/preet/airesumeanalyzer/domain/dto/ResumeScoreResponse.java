package com.preet.airesumeanalyzer.domain.dto;

import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ResumeScoreResponse {
    UUID resumeId;
    UUID analysisId;
    int atsScore;
    String shortSummary;
    Instant createdAt;
}
