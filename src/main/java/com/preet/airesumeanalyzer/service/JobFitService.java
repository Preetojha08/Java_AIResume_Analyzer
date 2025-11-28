package com.preet.airesumeanalyzer.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.preet.airesumeanalyzer.domain.dto.JobFitAiResult;
import com.preet.airesumeanalyzer.domain.dto.JobFitRequest;
import com.preet.airesumeanalyzer.domain.dto.JobFitResponse;
import com.preet.airesumeanalyzer.domain.entity.JobFitAnalysis;
import com.preet.airesumeanalyzer.domain.entity.Resume;
import com.preet.airesumeanalyzer.exception.ResourceNotFoundException;
import com.preet.airesumeanalyzer.repository.JobFitAnalysisRepository;
import com.preet.airesumeanalyzer.repository.ResumeRepository;
import java.io.InputStream;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JobFitService {

    private static final Logger log = LoggerFactory.getLogger(JobFitService.class);

    private final ResumeRepository resumeRepository;
    private final JobFitAnalysisRepository jobFitAnalysisRepository;
    private final StorageService storageService;
    private final TextExtractionService textExtractionService;
    private final JobFitAiService jobFitAiService;
    private final ObjectMapper objectMapper;

    public JobFitResponse createJobFitAnalysis(UUID resumeId, JobFitRequest request) {
        Resume resume = getResumeOrThrow(resumeId);
        String resumeText = extractResumeText(resume);

        JobFitAiResult aiResult = jobFitAiService.analyzeJobFit(resumeText, request.getJobTitle(), request.getJobDescription());

        JobFitAnalysis analysis = JobFitAnalysis.builder()
                .resume(resume)
                .jobTitle(request.getJobTitle() != null && !request.getJobTitle().isBlank()
                        ? request.getJobTitle()
                        : aiResult.getTargetJobTitle())
                .jobDescriptionText(request.getJobDescription())
                .matchScore(aiResult.getMatchScore())
                .requiredTechnicalSkillsJson(writeList(aiResult.getRequiredTechnicalSkills()))
                .requiredSoftSkillsJson(writeList(aiResult.getRequiredSoftSkills()))
                .niceToHaveSkillsJson(writeList(aiResult.getNiceToHaveSkills()))
                .matchedKeywordsJson(writeList(aiResult.getMatchedKeywords()))
                .missingRequiredKeywordsJson(writeList(aiResult.getMissingRequiredKeywords()))
                .missingNiceToHaveKeywordsJson(writeList(aiResult.getMissingNiceToHaveKeywords()))
                .tailoredSuggestionsJson(writeList(aiResult.getTailoredSuggestions()))
                .createdAt(Instant.now())
                .build();

        JobFitAnalysis saved = jobFitAnalysisRepository.save(analysis);
        log.info("Created job fit analysis {} for resume {}", saved.getId(), resumeId);
        return toResponse(saved);
    }

    public JobFitResponse getJobFitAnalysis(UUID resumeId, UUID jobFitId) {
        JobFitAnalysis analysis = jobFitAnalysisRepository.findByIdAndResumeId(jobFitId, resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Job fit analysis not found"));
        return toResponse(analysis);
    }

    public List<JobFitResponse> listJobFits(UUID resumeId) {
        return jobFitAnalysisRepository.findAllByResumeIdOrderByCreatedAtDesc(resumeId).stream()
                .map(this::toResponse)
                .toList();
    }

    private String extractResumeText(Resume resume) {
        try (InputStream inputStream = storageService.load(resume.getStorageKey())) {
            return textExtractionService.extractText(inputStream);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to load resume for job fit analysis", e);
        }
    }

    private Resume getResumeOrThrow(UUID resumeId) {
        return resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found for id " + resumeId));
    }

    private JobFitResponse toResponse(JobFitAnalysis analysis) {
        return JobFitResponse.builder()
                .jobFitId(analysis.getId())
                .resumeId(analysis.getResume().getId())
                .jobTitle(analysis.getJobTitle())
                .matchScore(analysis.getMatchScore())
                .requiredTechnicalSkills(readList(analysis.getRequiredTechnicalSkillsJson()))
                .requiredSoftSkills(readList(analysis.getRequiredSoftSkillsJson()))
                .niceToHaveSkills(readList(analysis.getNiceToHaveSkillsJson()))
                .matchedKeywords(readList(analysis.getMatchedKeywordsJson()))
                .missingRequiredKeywords(readList(analysis.getMissingRequiredKeywordsJson()))
                .missingNiceToHaveKeywords(readList(analysis.getMissingNiceToHaveKeywordsJson()))
                .tailoredSuggestions(readList(analysis.getTailoredSuggestionsJson()))
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
