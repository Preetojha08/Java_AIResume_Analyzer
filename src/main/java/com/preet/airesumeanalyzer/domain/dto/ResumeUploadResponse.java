package com.preet.airesumeanalyzer.domain.dto;

import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ResumeUploadResponse {
    UUID resumeId;
    UUID analysisId;
    String status;
    String message;
    Instant uploadedAt;
}

