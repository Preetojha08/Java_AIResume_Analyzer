package com.preet.airesumeanalyzer.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
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
@Table(name = "resume_analyses")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    @Column(name = "ats_score", nullable = false)
    private int atsScore;

    @Lob
    @Column(name = "skills_technical", nullable = false, columnDefinition = "text")
    private String skillsTechnical;

    @Lob
    @Column(name = "skills_soft", nullable = false, columnDefinition = "text")
    private String skillsSoft;

    @Lob
    @Column(name = "strengths", columnDefinition = "text")
    private String strengths;

    @Lob
    @Column(name = "weaknesses", columnDefinition = "text")
    private String weaknesses;

    @Lob
    @Column(name = "suggested_roles", columnDefinition = "text")
    private String suggestedRoles;

    @Lob
    @Column(name = "missing_keywords", columnDefinition = "text")
    private String missingKeywords;

    @Lob
    @Column(name = "summary", columnDefinition = "text")
    private String summary;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
