import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnalysisSection } from '../components/analysis/AnalysisSection';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { createJobFit, deleteResume, getAnalysis, listJobFits } from '../api/resumeApi';
import { AnalysisResponse, JobFitResponse } from '../types/resume';
import { useToast } from '../context/ToastContext';
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
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/">
          <Button variant="ghost">&lt;- Back</Button>
        </Link>
        {resumeId && <div className="pill">Resume ID: {resumeId}</div>}
        {analysis?.status && <div className="pill">Status: {analysis.status}</div>}
        <div className="flex-1" />
        <motion.button
          className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          onClick={() => setConfirmingDelete(true)}
          whileHover={{ scale: 1.02 }}
        >
          Delete Resume
        </motion.button>
      </div>

      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Resume ATS Analyzer</h1>
        <p className="max-w-3xl text-sm text-slate-700 sm:text-base">
          Job Match first. Paste a JD to generate a job-specific score, then dive into strengths, gaps, and suggestions.
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

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2">
          {selectedJobFit ? (
            <div className="rounded-2xl border border-primary-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
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
                <div className="relative mx-auto h-44 w-44 md:mx-0">
                  <div className="absolute inset-0 rounded-full" style={{ backgroundImage: matchConic }} />
                  <div className="absolute inset-2 rounded-full bg-white shadow-sm" />
                  <div className="absolute inset-6 grid place-items-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg">
                    <div className="text-center leading-none">
                      <div className="text-4xl font-black tracking-tight">{matchPercent}</div>
                      <div className="text-xs uppercase text-white/80">Job Match</div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-700">
                  This score reflects how well your resume aligns to the pasted JD. Add missing keywords and skills below to
                  improve it for this role.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">No job match yet</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Paste a job description to create a job-specific match score and tailored breakdown.
                  </p>
                </div>
              </div>
              <Button className="mt-4" variant="primary" onClick={scrollToJd}>
                Go to Job Description
              </Button>
            </div>
          )}
        </div>

        <div ref={jdFormRef}>
          <JobFitForm onSubmit={handleCreateJobFit} loading={jobFitLoading} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Resume Summary</h3>
            {timestamps && (
              <p className="text-xs text-slate-500 text-right">
                Updated {timestamps.createdAt}
                {timestamps.analyzedAt ? ` - Analyzed ${timestamps.analyzedAt}` : ''}
              </p>
            )}
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            {analysis?.summary || analysis?.shortSummary || 'Additional details will appear here when more data is available.'}
          </p>
        </div>

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
      </div>

      {(analysis?.strengths?.length || analysis?.weaknesses?.length) && (
        <div className="grid gap-4 md:grid-cols-2">
          {analysis?.strengths && analysis.strengths.length > 0 && (
            <AnalysisSection title="Strengths" items={analysis.strengths} tone="positive" />
          )}
          {analysis?.weaknesses && analysis.weaknesses.length > 0 && (
            <AnalysisSection title="Weaknesses" items={analysis.weaknesses} tone="warning" />
          )}
        </div>
      )}

      {selectedJobFit && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Job Match Breakdown</h3>
            <p className="text-xs text-slate-500">Based on the pasted JD</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {selectedJobFit.requiredTechnicalSkills.length > 0 && (
              <AnalysisSection title="Required Technical Skills" items={selectedJobFit.requiredTechnicalSkills} />
            )}
            {selectedJobFit.requiredSoftSkills.length > 0 && (
              <AnalysisSection title="Required Soft Skills" items={selectedJobFit.requiredSoftSkills} />
            )}
            {selectedJobFit.niceToHaveSkills.length > 0 && (
              <AnalysisSection title="Nice-to-have Skills" items={selectedJobFit.niceToHaveSkills} />
            )}
            {selectedJobFit.matchedKeywords.length > 0 && (
              <AnalysisSection title="Matched Keywords" items={selectedJobFit.matchedKeywords} tone="positive" />
            )}
            {selectedJobFit.missingRequiredKeywords.length > 0 && (
              <AnalysisSection title="Missing Required Keywords" items={selectedJobFit.missingRequiredKeywords} tone="warning" />
            )}
            {selectedJobFit.missingNiceToHaveKeywords.length > 0 && (
              <AnalysisSection
                title="Missing Nice-to-have Keywords"
                items={selectedJobFit.missingNiceToHaveKeywords}
                tone="warning"
              />
            )}
          </div>
          {selectedJobFit.requiredTechnicalSkills.length === 0 &&
            selectedJobFit.requiredSoftSkills.length === 0 &&
            selectedJobFit.niceToHaveSkills.length === 0 &&
            selectedJobFit.matchedKeywords.length === 0 &&
            selectedJobFit.missingRequiredKeywords.length === 0 &&
            selectedJobFit.missingNiceToHaveKeywords.length === 0 && (
              <p className="text-sm text-slate-600">Additional details will appear here when more data is available.</p>
            )}
        </div>
      )}

      {selectedJobFit && selectedJobFit.tailoredSuggestions.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Suggestions for this job</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {selectedJobFit.tailoredSuggestions.map((s, idx) => (
              <motion.li key={idx} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
                - {s}
              </motion.li>
            ))}
          </ul>
        </div>
      )}

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
