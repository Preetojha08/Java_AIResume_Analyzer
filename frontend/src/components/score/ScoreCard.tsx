import { SparklesIcon } from '@heroicons/react/24/outline';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';

interface ScoreCardProps {
  score?: number;
  shortSummary?: string;
  createdAt?: string;
  compact?: boolean;
  loading?: boolean;
  hero?: boolean;
}

export const ScoreCard = ({
  score,
  shortSummary,
  createdAt,
  compact = false,
  loading = false,
  hero = false,
}: ScoreCardProps) => {
  const value = useMotionValue(0);
  const rounded = useTransform(value, (latest) => Math.round(latest));

  useEffect(() => {
    if (!loading && typeof score === 'number') {
      const controls = animate(value, score, { duration: 0.8, ease: 'easeOut' });
      return controls.stop;
    }
    value.set(0);
  }, [score, loading, value]);

  const percentage = Math.min(Math.max(score ?? 0, 0), 100);
  const conic = `conic-gradient(from 180deg, rgba(99,102,241,0.9) ${percentage}%, rgba(226,232,240,0.35) ${percentage}% 100%)`;
  const circleSize = hero ? 'h-48 w-48' : 'h-32 w-32';
  const innerPadding = hero ? 'px-8 py-7 text-4xl' : 'px-6 py-5 text-3xl';

  return (
    <motion.div
      className={`glass-card relative overflow-hidden rounded-2xl p-6 shadow-floating ${
        hero ? 'flex flex-col gap-6 lg:p-8' : 'flex flex-col gap-4'
      }`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-primary-200/40 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-24 w-24 rounded-full bg-accent-200/50 blur-3xl" />
      </div>
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary-700">ATS Score</p>
          <h3 className="text-xl font-semibold text-slate-900">Overall alignment</h3>
        </div>
        <div className="rounded-full bg-white/70 p-2 shadow-sm">
          <SparklesIcon className="h-5 w-5 text-primary-600" />
        </div>
      </div>
      <div className={`relative flex items-center gap-6 ${hero ? 'lg:gap-10' : ''} flex-col lg:flex-row`}>
        <div className={`relative grid ${circleSize} place-items-center`}>
          <div className="absolute inset-0 rounded-full" style={{ backgroundImage: conic }} />
          <div className="absolute inset-2 rounded-full bg-white shadow-subtle" />
          <div
            className={`relative grid place-items-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-xl ${innerPadding}`}
          >
            <motion.div className="font-black tracking-tight leading-none">{loading ? '...' : rounded}</motion.div>
            <div className="text-xs uppercase tracking-wide text-white/80">/100</div>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-base font-semibold text-slate-900">Overall alignment</p>
          <p className="text-sm text-slate-700 leading-relaxed">
            {loading
              ? 'Fetching score...'
              : shortSummary || 'We will summarize your ATS alignment once the analysis is ready.'}
          </p>
          {createdAt && !compact && (
            <p className="text-xs text-slate-500">Updated {new Date(createdAt).toLocaleString()}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
