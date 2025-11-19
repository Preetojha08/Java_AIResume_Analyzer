package com.preet.airesumeanalyzer.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.preet.airesumeanalyzer.domain.dto.ResumeAnalysisResult;
import com.preet.airesumeanalyzer.domain.dto.ResumeAnalysisResponse;
import com.preet.airesumeanalyzer.domain.dto.ResumeScoreResponse;
import com.preet.airesumeanalyzer.domain.entity.Resume;
import com.preet.airesumeanalyzer.domain.entity.ResumeAnalysis;
import com.preet.airesumeanalyzer.exception.ResourceNotFoundException;
import com.preet.airesumeanalyzer.repository.ResumeAnalysisRepository;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ResumeAnalysisService {

    private final ResumeAnalysisRepository resumeAnalysisRepository;
    private final ObjectMapper objectMapper;

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
}
