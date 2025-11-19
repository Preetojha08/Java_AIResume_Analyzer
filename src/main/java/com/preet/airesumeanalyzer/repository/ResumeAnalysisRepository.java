package com.preet.airesumeanalyzer.repository;

import com.preet.airesumeanalyzer.domain.entity.ResumeAnalysis;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResumeAnalysisRepository extends JpaRepository<ResumeAnalysis, UUID> {
    Optional<ResumeAnalysis> findByResumeId(UUID resumeId);

    void deleteByResumeId(UUID resumeId);
}
