import { useRef, useState } from 'react';
import { DocumentArrowUpIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Button } from '../common/Button';
import { UploadResponse } from '../../types/resume';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface UploadCardProps {
  onUpload: (file: File) => Promise<void> | void;
  loading: boolean;
  error?: string | null;
  result?: UploadResponse | null;
}

const ACCEPTED_TYPES = ['application/pdf'];

export const UploadCard = ({ onUpload, loading, error, result }: UploadCardProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const onFile = (file?: File) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
      setLocalError('Please upload a PDF file.');
      return;
    }
    setLocalError(null);
    onUpload(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    onFile(file);
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="relative grid gap-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gradient-to-br from-primary-500 to-accent-500 p-3 text-white shadow-floating">
            <DocumentArrowUpIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Upload your resume</h2>
            <p className="text-sm text-slate-600">PDF only. We handle everything else securely.</p>
          </div>
        </div>

        <motion.div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragging(false);
          }}
          onDrop={handleDrop}
          className={`group relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition ${
            dragging ? 'border-primary-400 bg-primary-50/40' : 'border-slate-200 bg-white'
          }`}
          animate={{ scale: dragging ? 1.01 : 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/10 to-accent-500/10 opacity-0 blur-2xl transition group-hover:opacity-100" />
          <p className="text-sm font-semibold text-slate-700">Drag & drop your PDF here</p>
          <p className="text-xs text-slate-500">or</p>
          <Button variant="primary" size="lg" onClick={() => inputRef.current?.click()} loading={loading}>
            Browse Files
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <p className="text-xs text-slate-500">Maximum 10MB. Only PDF is accepted.</p>
          <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary-500/30 to-accent-500/30 opacity-0 blur-3xl transition group-hover:opacity-60" />
        </motion.div>

        {(localError || error) && <p className="text-sm text-rose-600">{localError || error}</p>}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-primary-100 bg-gradient-to-r from-primary-50/80 to-accent-50/80 p-4 text-sm text-primary-800 shadow-subtle"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="pill bg-primary-600 text-white shadow-subtle">Uploaded</span>
              <span className="font-semibold">Resume ID:</span>
              <span className="font-mono text-xs">{result.resumeId}</span>
              <span className="font-semibold">Status:</span>
              <span className="pill">{result.status}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Link to={`/analysis/${result.resumeId}`} className="inline-flex">
                <Button variant="primary" size="md" className="!px-4 !py-2">
                  View Full Analysis
                </Button>
              </Link>
              <p className="text-xs text-primary-700">
                Uploaded at {result.uploadedAt ?? result.timestamp ?? new Date().toISOString()}
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-xs text-white">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold">
            <ShieldCheckIcon className="h-4 w-4" />
            Secure by default
          </div>
          <p className="text-slate-200">
            Files stay local to the backend under <code className="font-mono text-[11px]">./uploads/resumes</code>. Gemini powers
            the analysis through your API key.
          </p>
          <div className="flex items-center gap-2 text-indigo-200">
            <SparklesIcon className="h-4 w-4" />
            Uses Google Gemini 2.5 Pro
          </div>
        </div>
      </div>
    </motion.div>
  );
};
