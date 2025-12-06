import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnalysisSection } from '../components/analysis/AnalysisSection';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { createJobFit, deleteResume, getAnalysis, listJobFits } from '../api/resumeApi';
import { AnalysisResponse, JobFitResponse } from '../types/resume';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import JobFitForm from '../components/jobfit/JobFitForm';

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

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
      createdAt: formatDate(analysis.createdAt),
      analyzedAt: analysis.analyzedAt ? formatDate(analysis.analyzedAt) : null,
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

  const bestJobFit = useMemo(() => {
    if (jobFits.length < 2) return null;
    return jobFits.reduce((best, fit) => (fit.matchScore > best.matchScore ? fit : best), jobFits[0]);
  }, [jobFits]);

  const matchScore = selectedJobFit?.matchScore ?? 0;
  const matchPercent = Math.min(Math.max(matchScore, 0), 100);
  const matchConic = `conic-gradient(from 180deg, #f43f5e ${matchPercent}%, #fde2e2 ${matchPercent}% 100%)`;
  const hasJobFit = jobFits.length > 0;

  const scrollToJd = () => jdFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition"
        >
          <span className="mr-1">←</span> Back
        </button>
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

      <div className="grid gap-3 md:grid-cols-2">
        <motion.div
          className={`rounded-2xl border ${hasJobFit ? 'border-rose-200' : 'border-slate-200'} bg-white p-4 shadow-sm flex items-center gap-3`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <motion.div
            className={`grid h-10 w-10 place-items-center rounded-full text-white ${hasJobFit ? 'bg-rose-500' : 'bg-slate-400'}`}
            animate={hasJobFit ? { scale: [1, 1.06, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            1
          </motion.div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-600">Step 1</p>
            <p className="text-sm font-semibold text-slate-900">Paste Job Description</p>
            <p className="text-xs text-slate-600">Trigger a job-specific match and breakdown.</p>
          </div>
        </motion.div>
        <motion.div
          className={`rounded-2xl border ${hasJobFit ? 'border-rose-400 shadow-md' : 'border-dashed border-slate-200'} bg-white p-4 shadow-sm flex items-center gap-3`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <motion.div
            className={`grid h-10 w-10 place-items-center rounded-full text-white ${hasJobFit ? 'bg-rose-600' : 'bg-slate-300'}`}
            animate={hasJobFit ? { rotate: [0, 4, 0, -4, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            2
          </motion.div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-600">Step 2</p>
            <p className="text-sm font-semibold text-slate-900">Review Job Match</p>
            <p className="text-xs text-slate-600">View the score and refine with suggestions.</p>
          </div>
        </motion.div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-rose-800">{error}</div>
      )}

      {loading && !analysis && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Loading analysis...
        </div>
      )}

      <div>
        {selectedJobFit ? (
          <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-600">Job Match</p>
                <h3 className="text-xl font-semibold text-slate-900">Match for: {selectedJobFit.jobTitle || 'Target role'}</h3>
                <p className="text-sm text-slate-600">Score is based on the pasted job description for this role.</p>
                <p className="text-xs text-slate-500">Analyzed on {formatDate(selectedJobFit.createdAt) || 'pending'}</p>
                {bestJobFit && (
                  <p className="text-xs font-semibold text-rose-600">
                    Best match so far: {bestJobFit.jobTitle || 'Job'} ({Math.round(bestJobFit.matchScore)}/100)
                  </p>
                )}
              </div>
              {jobFits.length > 0 && (
                <div className="flex flex-col gap-1 text-sm text-slate-700">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Job Match</span>
                  <select
                    value={selectedJobFitId ?? ''}
                    onChange={(e) => setSelectedJobFitId(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
                  >
                    {jobFits.map((fit) => (
                      <option key={fit.jobFitId} value={fit.jobFitId}>
                        {fit.jobTitle || 'Job description'} - {formatDate(fit.createdAt)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="grid gap-6 md:grid-cols-[auto,1fr] md:items-center">
              <motion.div
                className="relative mx-auto h-44 w-44 md:mx-0"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="absolute inset-0 rounded-full" style={{ backgroundImage: matchConic }} />
                <div className="absolute inset-2 rounded-full bg-white shadow-sm" />
                <div className="absolute inset-6 grid place-items-center rounded-full bg-gradient-to-br from-rose-500 to-orange-400 text-white shadow-lg">
                  <div className="text-center leading-none">
                    <div className="text-4xl font-black tracking-tight">{matchPercent}</div>
                    <div className="text-xs uppercase text-white/80">Job Match</div>
                  </div>
                </div>
              </motion.div>
              <p className="text-sm text-slate-700">
                This score reflects how well your resume aligns to the pasted JD. Add missing keywords and skills below to improve
                it for this role.
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
            <Button className="mt-4 bg-rose-600 hover:bg-rose-700" variant="danger" onClick={scrollToJd}>
              Go to Job Description
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-slate-900">Resume Summary</h3>
            {timestamps?.createdAt && <span className="text-xs text-gray-500">Updated {timestamps.createdAt}</span>}
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
                  className={`flex w-full items-start justify-between rounded-xl border px-3 py-3 text-left text-sm transition hover:border-rose-200 hover:bg-rose-50/40 ${
                    selectedJobFitId === fit.jobFitId ? 'border-rose-300 bg-rose-50/60' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-slate-900">{fit.jobTitle || 'Job description'}</p>
                    <p className="text-xs text-slate-600">{formatDate(fit.createdAt)}</p>
                  </div>
                  <span className="text-xs font-semibold text-rose-700">{Math.round(fit.matchScore)} / 100</span>
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

      <div ref={jdFormRef} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Add a new Job Match</h3>
          <p className="text-sm text-slate-600">
            Paste another job description to generate a fresh job-specific score and breakdown.
          </p>
        </div>
        <JobFitForm onSubmit={handleCreateJobFit} loading={jobFitLoading} />
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
