import { JobFitResponse } from '../../types/resume';
import { AnalysisSection } from '../analysis/AnalysisSection';
import { SkillTags } from '../analysis/SkillTags';
import { motion } from 'framer-motion';

interface JobFitResultProps {
  jobFit: JobFitResponse;
}

const JobFitResult = ({ jobFit }: JobFitResultProps) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <SkillTags title="Required Technical Skills" items={jobFit.requiredTechnicalSkills} tone="primary" />
        <SkillTags title="Required Soft Skills" items={jobFit.requiredSoftSkills} tone="accent" />
        <SkillTags title="Nice-to-have Skills" items={jobFit.niceToHaveSkills} tone="primary" tooltip="Plus or bonus skills" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <AnalysisSection title="Matched Keywords" items={jobFit.matchedKeywords} tone="positive" />
        <AnalysisSection title="Missing Required Keywords" items={jobFit.missingRequiredKeywords} tone="warning" />
        <AnalysisSection title="Missing Nice-to-have Keywords" items={jobFit.missingNiceToHaveKeywords} tone="warning" />
      </div>
      <AnalysisSection title="Suggestions for this job">
        <ul className="mt-2 space-y-2 text-sm text-slate-700">
          {jobFit.tailoredSuggestions.map((s, idx) => (
            <motion.li key={idx} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
              - {s}
            </motion.li>
          ))}
        </ul>
      </AnalysisSection>
    </div>
  );
};

export default JobFitResult;
