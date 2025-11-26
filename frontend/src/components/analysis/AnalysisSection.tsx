import clsx from 'clsx';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AnalysisSectionProps {
  title: string;
  items?: string[];
  tone?: 'default' | 'warning' | 'positive';
  children?: ReactNode;
  hint?: string;
}

export const AnalysisSection = ({ title, items, tone = 'default', children, hint }: AnalysisSectionProps) => {
  const pillClass =
    tone === 'warning'
      ? 'tag-warning'
      : tone === 'positive'
        ? 'bg-emerald-50 text-emerald-700 shadow-subtle'
        : 'bg-slate-100 text-slate-800 shadow-subtle';

  return (
    <motion.div
      className="glass-card rounded-2xl p-5 shadow-subtle"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
      {items && items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <motion.span
              key={item}
              className={clsx('tag', pillClass, tone === 'warning' && 'tag-warning flex items-center gap-1')}
              whileHover={{ scale: 1.03, translateY: -2 }}
            >
              {tone === 'warning' && '⚠️'} {item}
            </motion.span>
          ))}
        </div>
      )}
      {(!items || items.length === 0) && !children && (
        <p className="mt-2 text-sm text-slate-500">Nothing to show yet.</p>
      )}
      {children && <div className="mt-3 text-sm leading-relaxed text-slate-700">{children}</div>}
    </motion.div>
  );
};
