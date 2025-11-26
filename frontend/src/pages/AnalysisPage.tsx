import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnalysisSection } from '../components/analysis/AnalysisSection';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ScoreCard } from '../components/score/ScoreCard';
import { deleteResume, getAnalysis, getScore } from '../api/resumeApi';
import { AnalysisResponse, ScoreResponse } from '../types/resume';
import { useToast } from '../context/ToastContext';
import { SkillTags } from '../components/analysis/SkillTags';
import { RolesChips } from '../components/analysis/RolesChips';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const AnalysisPage = () => {
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [score, setScore] = useState<ScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!resumeId) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [analysisResult, scoreResult] = await Promise.all([getAnalysis(resumeId), getScore(resumeId).catch(() => null)]);
        setAnalysis(analysisResult);
        if (scoreResult) setScore(scoreResult);
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
  }, [resumeId, addToast]);

  const timestamps = useMemo(() => {
    if (!analysis) return null;
    return {
      createdAt: new Date(analysis.createdAt).toLocaleString(),
      analyzedAt: analysis.analyzedAt ? new Date(analysis.analyzedAt).toLocaleString() : null,
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

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/">
          <Button variant="ghost">← Back</Button>
        </Link>
        <div className="pill">Resume ID: {resumeId}</div>
        {analysis?.status && <div className="pill">Status: {analysis.status}</div>}
        <div className="flex-1" />
      </div>

      <motion.button
        className="fixed bottom-6 right-6 z-40 rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-floating transition hover:-translate-y-0.5 hover:shadow-xl"
        onClick={() => setConfirmingDelete(true)}
        whileHover={{ scale: 1.02 }}
      >
        Delete Resume
      </motion.button>

      {error && (
        <div className="glass-card rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-rose-800">
          {error}
        </div>
      )}

      {loading && !analysis && (
        <div className="glass-card rounded-2xl border border-primary-100 bg-white/70 p-4 text-sm text-slate-600">
          Loading analysis...
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <ScoreCard
            hero
            score={analysis?.atsScore ?? score?.atsScore}
            shortSummary={analysis?.shortSummary ?? score?.shortSummary}
            createdAt={score?.createdAt ?? analysis?.createdAt}
            loading={loading}
          />
        </div>
        <div className="lg:col-span-4 space-y-4">
          <SkillTags title="Technical Skills" items={analysis?.technicalSkills} tone="primary" />
          <SkillTags title="Soft Skills" items={analysis?.softSkills} tone="accent" tooltip="Collaboration & communication" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <AnalysisSection title="Strengths" items={analysis?.strengths} tone="positive" />
        </div>
        <div className="lg:col-span-6">
          <AnalysisSection title="Weaknesses" items={analysis?.weaknesses} tone="warning" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <RolesChips roles={analysis?.suggestedRoles} />
        </div>
        <div className="lg:col-span-4">
          <AnalysisSection
            title="Missing Keywords"
            items={analysis?.missingKeywords}
            tone="warning"
            hint="Add these to boost your score"
          >
            <div className="mt-2 flex items-center gap-2 text-xs text-amber-700">
              <ExclamationTriangleIcon className="h-4 w-4" />
              Including these terms increases ATS matching confidence.
            </div>
          </AnalysisSection>
        </div>
      </div>

      {analysis && (
        <motion.div
          className="glass-card rounded-2xl p-6 shadow-subtle"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold text-slate-900">Summary</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{analysis.summary}</p>
          {timestamps && (
            <p className="mt-3 text-xs text-slate-500">
              Created {timestamps.createdAt}
              {timestamps.analyzedAt ? ` • Analyzed ${timestamps.analyzedAt}` : ''}
            </p>
          )}
        </motion.div>
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
