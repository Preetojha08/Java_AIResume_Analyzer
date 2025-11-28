import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCard } from '../components/upload/UploadCard';
import { createJobFit, uploadResume } from '../api/resumeApi';
import { UploadResponse } from '../types/resume';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { ShieldCheckIcon, LockClosedIcon, SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const JD_STORAGE_KEY = 'ai-resume-jd';

const UploadPage = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [jdTitle, setJdTitle] = useState('');
  const [jdDescription, setJdDescription] = useState('');
  const [stepReady, setStepReady] = useState(false);
  const [skipJobFit, setSkipJobFit] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem(JD_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { title?: string; description?: string };
      if (parsed.title) setJdTitle(parsed.title);
      if (parsed.description) {
        setJdDescription(parsed.description);
        setStepReady(true);
      }
    } catch {
      localStorage.removeItem(JD_STORAGE_KEY);
    }
  }, []);

  const jdPayload = useMemo(
    () => ({
      jobTitle: jdTitle.trim() || undefined,
      jobDescription: jdDescription.trim(),
    }),
    [jdDescription, jdTitle],
  );

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const uploadRes = await uploadResume(file);
      setResult(uploadRes);
      let jobFitId = '';
      if (!skipJobFit && jdDescription.trim()) {
        try {
          const jobFitRes = await createJobFit(uploadRes.resumeId, jdPayload);
          jobFitId = jobFitRes.jobFitId;
          addToast('Job fit created for this JD.', 'success');
        } catch (err: any) {
          const msg =
            err?.status === 401 || err?.status === 403
              ? 'Unauthorized. Check X-API-KEY in frontend/.env.local.'
              : err?.message ?? 'Job fit creation failed.';
          addToast(msg, 'error');
        }
      }
      addToast('Resume uploaded successfully. Analysis may take a few seconds.', 'success');
      const qp = jobFitId ? `?jobFitId=${jobFitId}` : '';
      navigate(`/analysis/${uploadRes.resumeId}${qp}`);
    } catch (err: any) {
      const message =
        err?.status === 401 || err?.status === 403
          ? 'Unauthorized. Check X-API-KEY in frontend/.env.local.'
          : err?.message ?? 'Upload failed.';
      setError(message);
      addToast(message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const markStepComplete = () => {
    if (!jdDescription.trim()) {
      addToast('Paste the job description or choose Skip.', 'error');
      return;
    }
    localStorage.setItem(
      JD_STORAGE_KEY,
      JSON.stringify({ title: jdTitle.trim(), description: jdDescription.trim() }),
    );
    setStepReady(true);
    setSkipJobFit(false);
    addToast('Job description saved. Continue by uploading your resume.', 'success');
  };

  const handleSkip = () => {
    setSkipJobFit(true);
    setStepReady(true);
    localStorage.removeItem(JD_STORAGE_KEY);
    addToast('Skipping JD. We will only analyze the resume.', 'info');
  };

  const uploadUnlocked = stepReady;

  return (
    <main className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-600">AI Resume Analyzer</p>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Resume ATS Analyzer</h1>
        <p className="max-w-3xl text-sm text-slate-700 sm:text-base">
          Follow the two-step flow: paste the job description first, then upload your resume. We will create a job-specific match
          score and send you straight to the analysis.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          className="rounded-2xl border border-primary-200 bg-white p-6 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-600">Step 1</p>
              <h2 className="text-xl font-semibold text-slate-900">Paste Job Description</h2>
              <p className="text-sm text-slate-600">
                We will judge your resume against this specific role before generating the match score.
              </p>
            </div>
            <ArrowRightIcon className="hidden h-6 w-6 text-primary-500 sm:block" />
          </div>
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">Job Title (optional)</label>
              <input
                type="text"
                value={jdTitle}
                onChange={(e) => setJdTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                placeholder="e.g., Frontend Engineer"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">Job Description (required for job match)</label>
              <textarea
                value={jdDescription}
                onChange={(e) => setJdDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                placeholder="Paste the full JD here..."
                rows={8}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={markStepComplete}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                Next: Upload Resume
              </button>
              <button type="button" onClick={handleSkip} className="text-sm font-semibold text-primary-700 hover:underline">
                Skip - Just analyze my resume
              </button>
              {stepReady && !skipJobFit && (
                <span className="text-xs text-emerald-700">Saved locally. We will create a job fit automatically.</span>
              )}
              {skipJobFit && <span className="text-xs text-slate-600">Job description skipped for this upload.</span>}
            </div>
          </div>
        </motion.div>

        <motion.div
          className={`relative rounded-2xl border bg-white p-6 shadow-sm transition ${
            uploadUnlocked ? 'border-slate-200' : 'border-dashed border-slate-200'
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Step 2</p>
              <h2 className="text-xl font-semibold text-slate-900">Upload Your Resume</h2>
              <p className="text-sm text-slate-600">
                Drag in a PDF or browse files. We will run the JD-based match instantly after upload.
              </p>
            </div>
          </div>
          <div className={`mt-4 ${!uploadUnlocked ? 'opacity-60' : ''}`}>
            {!uploadUnlocked && (
              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600">
                Complete Step 1 or choose Skip to unlock resume upload.
              </div>
            )}
            <div className="relative">
              {!uploadUnlocked && <div className="absolute inset-0 z-10 rounded-2xl bg-white/60 backdrop-blur-[1px]" />}
              <UploadCard onUpload={handleUpload} loading={uploading} error={error} result={result} />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Why JD first?</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>- Extract JD-required skills before scoring</li>
            <li>- Compute job match score (0-100) vs this JD</li>
            <li>- See matched vs missing keywords</li>
            <li>- Get tailored resume edits for this role</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">Secure by default</h4>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="h-4 w-4 text-emerald-500" /> Files live in <code className="font-mono text-xs">./uploads/resumes</code> on your backend.
            </div>
            <div className="flex items-center gap-2">
              <LockClosedIcon className="h-4 w-4 text-primary-500" /> Authenticated via <code className="font-mono text-xs">X-API-KEY</code>.
            </div>
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-4 w-4 text-accent-500" /> AI model: <span className="font-semibold">Google Gemini 2.5 Pro</span>.
            </div>
          </div>
          <div className="mt-3 rounded-xl bg-slate-900 px-4 py-3 text-xs text-white">
            <div className="flex items-center gap-2 font-semibold text-emerald-300">Dev quickstart</div>
            <p className="mt-2 text-slate-100">
              Create <code className="font-mono">frontend/.env.local</code> with <code className="font-mono">VITE_API_BASE_URL</code> and{' '}
              <code className="font-mono">VITE_API_KEY</code>. Then run <code className="font-mono">npm install</code> and{' '}
              <code className="font-mono">npm run dev</code>.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default UploadPage;
