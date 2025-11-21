package com.preet.airesumeanalyzer.repository;

import com.preet.airesumeanalyzer.domain.entity.Resume;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResumeRepository extends JpaRepository<Resume, UUID> {
}

