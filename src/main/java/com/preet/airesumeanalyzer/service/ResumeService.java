package com.preet.airesumeanalyzer.service;

import com.preet.airesumeanalyzer.domain.dto.ResumeAnalysisResponse;
import com.preet.airesumeanalyzer.domain.dto.ResumeAnalysisResult;
import com.preet.airesumeanalyzer.domain.dto.ResumeScoreResponse;
import com.preet.airesumeanalyzer.domain.dto.ResumeUploadResponse;
import com.preet.airesumeanalyzer.domain.entity.Resume;
import com.preet.airesumeanalyzer.domain.entity.ResumeAnalysis;
import com.preet.airesumeanalyzer.exception.ResourceNotFoundException;
import com.preet.airesumeanalyzer.exception.ResumeProcessingException;
import com.preet.airesumeanalyzer.repository.ResumeRepository;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private static final Logger log = LoggerFactory.getLogger(ResumeService.class);

    private final ResumeRepository resumeRepository;
    private final StorageService storageService;
    private final TextExtractionService textExtractionService;
    private final BedrockService bedrockService;
    private final ResumeAnalysisService resumeAnalysisService;

    public ResumeUploadResponse uploadAndAnalyze(MultipartFile file) {
        validateFile(file);
        byte[] bytes = toBytes(file);

        Resume resume = saveResumeMetadata(file, bytes.length);
        storageService.upload(resume.getS3Key(), new ByteArrayInputStream(bytes), bytes.length, file.getContentType());

        String resumeText = textExtractionService.extractText(new ByteArrayInputStream(bytes));
        ResumeAnalysisResult analysisResult = bedrockService.analyzeResumeText(resumeText);
        ResumeAnalysis analysis = resumeAnalysisService.saveAnalysis(resume, analysisResult);

        return ResumeUploadResponse.builder()
                .resumeId(resume.getId())
                .analysisId(analysis.getId())
                .status("COMPLETED")
                .message("Resume processed successfully")
                .uploadedAt(resume.getUploadedAt())
                .build();
    }

    public ResumeAnalysisResponse getAnalysis(UUID resumeId) {
        Resume resume = getResumeOrThrow(resumeId);
        ResumeAnalysis analysis = resumeAnalysisService.getByResumeId(resumeId);
        return resumeAnalysisService.toResponse(resume, analysis);
    }

    public ResumeScoreResponse getScore(UUID resumeId) {
        Resume resume = getResumeOrThrow(resumeId);
        ResumeAnalysis analysis = resumeAnalysisService.getByResumeId(resumeId);
        return resumeAnalysisService.toScoreResponse(resume, analysis);
    }

    public void deleteResume(UUID resumeId) {
        Resume resume = getResumeOrThrow(resumeId);
        storageService.delete(resume.getS3Key());
        resumeAnalysisService.deleteByResumeId(resumeId);
        resumeRepository.delete(resume);
        log.info("Deleted resume {} and associated analysis", resumeId);
    }

    private Resume saveResumeMetadata(MultipartFile file, long size) {
        Resume resume = Resume.builder()
                .s3Key(buildS3Key(file.getOriginalFilename()))
                .originalFileName(file.getOriginalFilename())
                .contentType(file.getContentType())
                .uploadedAt(Instant.now())
                .build();
        return resumeRepository.save(resume);
    }

    private String buildS3Key(String originalFileName) {
        String suffix = ".pdf";
        if (originalFileName != null && originalFileName.contains(".")) {
            suffix = originalFileName.substring(originalFileName.lastIndexOf('.'));
        }
        return "resumes/" + UUID.randomUUID() + suffix;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResumeProcessingException("File is required");
        }
        if (!"application/pdf".equalsIgnoreCase(file.getContentType())) {
            throw new ResumeProcessingException("Only PDF resumes are supported");
        }
    }

    private byte[] toBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new ResumeProcessingException("Unable to read uploaded file", e);
        }
    }

    private Resume getResumeOrThrow(UUID resumeId) {
        return resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found for id " + resumeId));
    }
}
