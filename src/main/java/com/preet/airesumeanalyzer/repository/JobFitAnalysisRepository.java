package com.preet.airesumeanalyzer.repository;

import com.preet.airesumeanalyzer.domain.entity.JobFitAnalysis;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobFitAnalysisRepository extends JpaRepository<JobFitAnalysis, UUID> {
    List<JobFitAnalysis> findAllByResumeIdOrderByCreatedAtDesc(UUID resumeId);

    Optional<JobFitAnalysis> findByIdAndResumeId(UUID id, UUID resumeId);
}
