package com.preet.airesumeanalyzer.controller;

import com.preet.airesumeanalyzer.domain.dto.JobFitRequest;
import com.preet.airesumeanalyzer.domain.dto.JobFitResponse;
import com.preet.airesumeanalyzer.service.JobFitService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class JobFitController {

    private final JobFitService jobFitService;

    @PostMapping("/{resumeId}/job-fit")
    public ResponseEntity<JobFitResponse> createJobFit(
            @PathVariable("resumeId") UUID resumeId, @Valid @RequestBody JobFitRequest request) {
        return ResponseEntity.ok(jobFitService.createJobFitAnalysis(resumeId, request));
    }

    @GetMapping("/{resumeId}/job-fit")
    public ResponseEntity<List<JobFitResponse>> listJobFits(@PathVariable("resumeId") UUID resumeId) {
        return ResponseEntity.ok(jobFitService.listJobFits(resumeId));
    }

    @GetMapping("/{resumeId}/job-fit/{jobFitId}")
    public ResponseEntity<JobFitResponse> getJobFit(
            @PathVariable("resumeId") UUID resumeId, @PathVariable("jobFitId") UUID jobFitId) {
        return ResponseEntity.ok(jobFitService.getJobFitAnalysis(resumeId, jobFitId));
    }
}
