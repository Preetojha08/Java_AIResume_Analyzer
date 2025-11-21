package com.preet.airesumeanalyzer.service;

import com.preet.airesumeanalyzer.domain.dto.ResumeAnalysisResult;

public interface BedrockService {
    ResumeAnalysisResult analyzeResumeText(String resumeText);
}

