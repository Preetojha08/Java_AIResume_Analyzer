import { useState } from 'react';
import { UploadCard } from '../components/upload/UploadCard';
import { uploadResume } from '../api/resumeApi';
import { UploadResponse } from '../types/resume';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { ShieldCheckIcon, LockClosedIcon, SparklesIcon } from '@heroicons/react/24/outline';

const UploadPage = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const { addToast } = useToast();

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const response = await uploadResume(file);
      setResult(response);
      addToast('Resume uploaded successfully. Analysis may take a few seconds.', 'success');
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

  return (
    <main className="grid gap-6 lg:grid-cols-3 lg:gap-8">
      <div className="lg:col-span-2">
        <UploadCard onUpload={handleUpload} loading={uploading} error={error} result={result} />
      </div>
      <aside className="space-y-4">
        <motion.div
          className="glass-card rounded-2xl p-5 shadow-subtle"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <h3 className="text-lg font-semibold text-slate-900">What you get</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>• ATS score with strengths and weaknesses</li>
            <li>• Technical and soft skill extraction</li>
            <li>• Suggested roles and missing keywords</li>
            <li>• Executive summaries powered by Gemini</li>
          </ul>
        </motion.div>
        <motion.div
          className="glass-card rounded-2xl p-5 shadow-subtle"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-[0.2em]">Secure by default</h4>
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
              Create <code className="font-mono">frontend/.env.local</code> with <code className="font-mono">VITE_API_BASE_URL</code>{' '}
              and <code className="font-mono">VITE_API_KEY</code>. Then run <code className="font-mono">npm install</code> and{' '}
              <code className="font-mono">npm run dev</code>.
            </p>
          </div>
        </motion.div>
      </aside>
    </main>
  );
};

export default UploadPage;
