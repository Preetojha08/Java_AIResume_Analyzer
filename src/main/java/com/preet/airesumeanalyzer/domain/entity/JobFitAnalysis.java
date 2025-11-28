package com.preet.airesumeanalyzer.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "job_fit_analyses")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobFitAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    @Column(name = "job_title")
    private String jobTitle;

    @Column(name = "job_description_text", columnDefinition = "text", nullable = false)
    private String jobDescriptionText;

    @Column(name = "match_score", nullable = false)
    private Integer matchScore;

    @Column(name = "required_technical_skills", columnDefinition = "text")
    private String requiredTechnicalSkillsJson;

    @Column(name = "required_soft_skills", columnDefinition = "text")
    private String requiredSoftSkillsJson;

    @Column(name = "nice_to_have_skills", columnDefinition = "text")
    private String niceToHaveSkillsJson;

    @Column(name = "matched_keywords", columnDefinition = "text")
    private String matchedKeywordsJson;

    @Column(name = "missing_required_keywords", columnDefinition = "text")
    private String missingRequiredKeywordsJson;

    @Column(name = "missing_nice_to_have_keywords", columnDefinition = "text")
    private String missingNiceToHaveKeywordsJson;

    @Column(name = "tailored_suggestions", columnDefinition = "text")
    private String tailoredSuggestionsJson;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
