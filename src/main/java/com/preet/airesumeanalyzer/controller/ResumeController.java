package com.preet.airesumeanalyzer.controller;

import com.preet.airesumeanalyzer.domain.dto.ResumeAnalysisResponse;
import com.preet.airesumeanalyzer.domain.dto.ResumeScoreResponse;
import com.preet.airesumeanalyzer.domain.dto.ResumeUploadResponse;
import com.preet.airesumeanalyzer.service.ResumeService;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
@Validated
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResumeUploadResponse> uploadResume(@RequestParam("file") @NotNull MultipartFile file) {
        return ResponseEntity.ok(resumeService.uploadAndAnalyze(file));
    }

    @GetMapping("/{resumeId}/analysis")
    public ResponseEntity<ResumeAnalysisResponse> getAnalysis(@PathVariable("resumeId") UUID resumeId) {
        return ResponseEntity.ok(resumeService.getAnalysis(resumeId));
    }

    @GetMapping("/{resumeId}/score")
    public ResponseEntity<ResumeScoreResponse> getScore(@PathVariable("resumeId") UUID resumeId) {
        return ResponseEntity.ok(resumeService.getScore(resumeId));
    }

    @DeleteMapping("/{resumeId}")
    public ResponseEntity<Void> deleteResume(@PathVariable("resumeId") UUID resumeId) {
        resumeService.deleteResume(resumeId);
        return ResponseEntity.noContent().build();
    }
}

