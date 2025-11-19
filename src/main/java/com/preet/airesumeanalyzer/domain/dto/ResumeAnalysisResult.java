package com.preet.airesumeanalyzer.domain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.Data;

@Data
public class ResumeAnalysisResult {
    @JsonProperty("atsScore")
    private int atsScore;

    @JsonProperty("skillsTechnical")
    private List<String> skillsTechnical;

    @JsonProperty("skillsSoft")
    private List<String> skillsSoft;

    @JsonProperty("strengths")
    private List<String> strengths;

    @JsonProperty("weaknesses")
    private List<String> weaknesses;

    @JsonProperty("suggestedRoles")
    private List<String> suggestedRoles;

    @JsonProperty("missingKeywords")
    private List<String> missingKeywords;

    @JsonProperty("summary")
    private String summary;
}
