package com.preet.airesumeanalyzer.domain.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class JobFitRequest {

    private String jobTitle;

    @NotBlank(message = "Job description is required")
    private String jobDescription;
}
