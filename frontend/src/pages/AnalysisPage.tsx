import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnalysisSection } from '../components/analysis/AnalysisSection';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { createJobFit, deleteResume, getAnalysis, listJobFits } from '../api/resumeApi';
import { AnalysisResponse, JobFitResponse } from '../types/resume';
import { useToast } from '../context/ToastContext';
import { SkillTags } from '../components/analysis/SkillTags';
import { RolesChips } from '../components/analysis/RolesChips';
import { motion } from 'framer-motion';
import JobFitForm from '../components/jobfit/JobFitForm';

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '';

const AnalysisPage = () => {
  const { resumeId } = useParams<{ resumeId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const jdFormRef = useRef<HTMLDivElement | null>(null);

  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [jobFits, setJobFits] = useState<JobFitResponse[]>([]);
  const [selectedJobFitId, setSelectedJobFitId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [jobFitLoading, setJobFitLoading] = useState(false);

  useEffect(() => {
    if (!resumeId) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [analysisResult, jobFitList] = await Promise.all([
          getAnalysis(resumeId),
          listJobFits(resumeId).catch(() => []),
        ]);
        setAnalysis(analysisResult);
        setJobFits(jobFitList);
        if (jobFitList.length > 0) {
          const preferred = searchParams.get('jobFitId');
          if (preferred && jobFitList.some((j) => j.jobFitId === preferred)) {
            setSelectedJobFitId(preferred);
          } else {
            setSelectedJobFitId(jobFitList[0].jobFitId);
          }
        }
      } catch (err: any) {
        const message =
          err?.status === 401 || err?.status === 403
            ? 'Unauthorized. Check X-API-KEY in frontend/.env.local.'
            : err?.message ?? 'Could not load analysis.';
        setError(message);
        addToast(message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [resumeId, addToast, searchParams]);

  const timestamps = useMemo(() => {
    if (!analysis) return null;
    return {
      createdAt: formatDateTime(analysis.createdAt),
      analyzedAt: analysis.analyzedAt ? formatDateTime(analysis.analyzedAt) : null,
    };
  }, [analysis]);

  const handleDelete = async () => {
    if (!resumeId) return;
    setDeleting(true);
    try {
      await deleteResume(resumeId);
      addToast('Resume deleted successfully.', 'success');
      navigate('/');
    } catch (err: any) {
      const message = err?.message ?? 'Failed to delete resume.';
      addToast(message, 'error');
      setDeleting(false);
    }
  };

  const handleCreateJobFit = async (payload: { jobTitle?: string; jobDescription: string }) => {
    if (!resumeId) return;
    setJobFitLoading(true);
    try {
      const created = await createJobFit(resumeId, payload);
      setJobFits((prev) => [created, ...prev]);
      setSelectedJobFitId(created.jobFitId);
      addToast('Job fit analysis created.', 'success');
    } catch (err: any) {
      const message =
        err?.status === 401 || err?.status === 403
          ? 'Unauthorized. Check X-API-KEY in frontend/.env.local.'
          : err?.message ?? 'Failed to create job fit analysis.';
      addToast(message, 'error');
    } finally {
      setJobFitLoading(false);
    }
  };

  const selectedJobFit = useMemo(
    () => jobFits.find((j) => j.jobFitId === selectedJobFitId),
    [jobFits, selectedJobFitId],
  );

  const matchScore = selectedJobFit?.matchScore ?? 0;
  const matchPercent = Math.min(Math.max(matchScore, 0), 100);
  const matchConic = `conic-gradient(from 180deg, #6366f1 ${matchPercent}%, #e2e8f0 ${matchPercent}% 100%)`;

  const scrollToJd = () => jdFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <main className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/">
          <Button variant="ghost">&lt;- Back</Button>
        </Link>
        {resumeId && <div className="pill">Resume ID: {resumeId}</div>}
        {analysis?.status && <div className="pill">Status: {analysis.status}</div>}
        <div className="flex-1" />
        <Button variant="secondary" size="md">
          Live preview
        </Button>
        <motion.button
          className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          onClick={() => setConfirmingDelete(true)}
          whileHover={{ scale: 1.02 }}
        >
          Delete Resume
        </motion.button>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Resume ATS Analyzer</h1>
        <p className="max-w-3xl text-sm text-slate-700 sm:text-base">
          See how your resume matches this job, plus skills and suggestions. Paste a JD to generate a job-specific match score.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-rose-800">{error}</div>
      )}

      {loading && !analysis && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Loading analysis...
        </div>
      )}

      {selectedJobFit ? (
        <div className="rounded-2xl border border-primary-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-600">Job Match</p>
              <h3 className="text-xl font-semibold text-slate-900">
                Match for: {selectedJobFit.jobTitle || 'Target role'}
              </h3>
              <p className="text-sm text-slate-600">Score is based on the pasted job description for this role.</p>
              <p className="text-xs text-slate-500">
                Analyzed on {formatDateTime(selectedJobFit.createdAt) || 'pending'}
              </p>
            </div>
            {jobFits.length > 0 && (
              <div className="flex flex-col gap-1 text-sm text-slate-700">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Job Match</span>
                <select
                  value={selectedJobFitId ?? ''}
                  onChange={(e) => setSelectedJobFitId(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                  {jobFits.map((fit) => (
                    <option key={fit.jobFitId} value={fit.jobFitId}>
                      {fit.jobTitle || 'Job description'} - {formatDateTime(fit.createdAt)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="grid gap-6 md:grid-cols-[auto,1fr] md:items-center">
            <div className="relative mx-auto h-40 w-40 md:mx-0">
              <div className="absolute inset-0 rounded-full" style={{ backgroundImage: matchConic }} />
              <div className="absolute inset-2 rounded-full bg-white shadow-sm" />
              <div className="absolute inset-5 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg grid place-items-center">
                <div className="text-center leading-none">
                  <div className="text-4xl font-black tracking-tight">{matchPercent}</div>
                  <div className="text-xs uppercase text-white/80">Job Match</div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-700">
                This score reflects how well your resume aligns to the pasted JD. Add missing keywords and skills below to improve
                it for this role.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">No job description linked yet.</h3>
          <p className="mt-2 text-sm text-slate-600">
            Paste a job description to create a job-specific match score and tailored breakdown.
          </p>
          <Button className="mt-4" variant="primary" onClick={scrollToJd}>
            Paste a Job Description to analyze this resume
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Resume Summary</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {analysis?.summary || analysis?.shortSummary || 'Summary will appear once analysis is ready.'}
                </p>
              </div>
              {timestamps && (
                <p className="text-xs text-slate-500 text-right">
                  Updated {timestamps.createdAt}
                  {timestamps.analyzedAt ? ` - Analyzed ${timestamps.analyzedAt}` : ''}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <AnalysisSection title="Strengths" items={analysis?.strengths} tone="positive" />
            <AnalysisSection title="Weaknesses" items={analysis?.weaknesses} tone="warning" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SkillTags title="Technical Skills" items={analysis?.technicalSkills} tone="primary" />
            <SkillTags title="Soft Skills" items={analysis?.softSkills} tone="accent" tooltip="Collaboration & communication" />
            <RolesChips roles={analysis?.suggestedRoles} />
          </div>

          {selectedJobFit && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Job Match Breakdown</h3>
                <p className="text-xs text-slate-500">Based on the pasted JD</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <SkillTags title="Required Technical Skills" items={selectedJobFit.requiredTechnicalSkills} tone="primary" />
                <SkillTags title="Required Soft Skills" items={selectedJobFit.requiredSoftSkills} tone="accent" />
                <SkillTags title="Nice-to-have Skills" items={selectedJobFit.niceToHaveSkills} tone="primary" tooltip="Bonus skills" />
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnalysisSection title="Matched Keywords" items={selectedJobFit.matchedKeywords} tone="positive" />
                <AnalysisSection title="Missing Required Keywords" items={selectedJobFit.missingRequiredKeywords} tone="warning" />
                <AnalysisSection
                  title="Missing Nice-to-have Keywords"
                  items={selectedJobFit.missingNiceToHaveKeywords}
                  tone="warning"
                />
              </div>
              <AnalysisSection title="Suggestions for this job">
                <ul className="mt-2 space-y-2 text-sm text-slate-700">
                  {selectedJobFit.tailoredSuggestions.length === 0 && (
                    <li className="text-slate-500">No suggestions yet.</li>
                  )}
                  {selectedJobFit.tailoredSuggestions.map((s, idx) => (
                    <motion.li key={idx} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
                      - {s}
                    </motion.li>
                  ))}
                </ul>
              </AnalysisSection>
            </div>
          )}
        </div>

        <div className="space-y-4 lg:col-span-1" ref={jdFormRef}>
          <JobFitForm onSubmit={handleCreateJobFit} loading={jobFitLoading} />

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-900">Existing Job Matches</h4>
              {jobFits.length > 1 && <span className="text-xs text-slate-500">{jobFits.length} versions</span>}
            </div>
            {jobFits.length === 0 && <p className="text-sm text-slate-600">No job fit analyses yet.</p>}
            {jobFits.length > 0 && (
              <div className="space-y-2">
                {jobFits.map((fit) => (
                  <button
                    key={fit.jobFitId}
                    onClick={() => setSelectedJobFitId(fit.jobFitId)}
                    className={`flex w-full items-start justify-between rounded-xl border px-3 py-3 text-left text-sm transition hover:border-primary-200 hover:bg-primary-50/40 ${
                      selectedJobFitId === fit.jobFitId ? 'border-primary-300 bg-primary-50/60' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{fit.jobTitle || 'Job description'}</p>
                      <p className="text-xs text-slate-600">{formatDateTime(fit.createdAt)}</p>
                    </div>
                    <span className="text-xs font-semibold text-primary-700">{Math.round(fit.matchScore)} / 100</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Files stay on your machine; analysis runs on your backend.</p>
            <p className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
              AI Model: Google Gemini 2.5 Pro
            </p>
          </div>
        </div>
      </div>

      <Modal
        open={confirmingDelete}
        title="Delete this resume?"
        description="This will remove the uploaded PDF and its analysis permanently."
        confirmTone="danger"
        confirmLabel="Delete"
        onClose={() => setConfirmingDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </main>
  );
};

export default AnalysisPage;
