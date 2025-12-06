import { useState } from 'react';
import { Button } from '../common/Button';

interface JobFitFormProps {
  onSubmit: (payload: { jobTitle?: string; jobDescription: string }) => Promise<void> | void;
  loading?: boolean;
}

const JobFitForm = ({ onSubmit, loading }: JobFitFormProps) => {
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) return;
    onSubmit({ jobTitle: jobTitle.trim() || undefined, jobDescription: jobDescription.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Check This Resume Against a Job Description</h3>
        <p className="text-sm text-slate-600">
          Paste the JD to see a job-specific match score, matched/missing keywords, and tailored suggestions.
        </p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">Job Title (optional)</label>
        <input
          type="text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
          placeholder="e.g., Frontend Engineer"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">Job Description</label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
          placeholder="Paste the full JD here..."
          rows={6}
          required
        />
      </div>
      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          variant="danger"
          className="bg-rose-600 hover:bg-rose-700"
          loading={loading}
          disabled={!jobDescription.trim()}
        >
          Analyze Job Fit
        </Button>
      </div>
    </form>
  );
};

export default JobFitForm;
