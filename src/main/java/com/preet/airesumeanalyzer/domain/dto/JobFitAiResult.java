package com.preet.airesumeanalyzer.domain.dto;

import java.util.List;
import lombok.Data;

@Data
public class JobFitAiResult {
    private String targetJobTitle;
    private int matchScore;
    private List<String> requiredTechnicalSkills;
    private List<String> requiredSoftSkills;
    private List<String> niceToHaveSkills;
    private List<String> matchedKeywords;
    private List<String> missingRequiredKeywords;
    private List<String> missingNiceToHaveKeywords;
    private List<String> tailoredSuggestions;
}
