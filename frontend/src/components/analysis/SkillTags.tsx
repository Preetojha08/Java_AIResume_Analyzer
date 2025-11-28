import clsx from 'clsx';
import { motion } from 'framer-motion';

interface SkillTagsProps {
  title: string;
  items?: string[];
  tone?: 'primary' | 'warning' | 'accent';
  tooltip?: string;
}

export const SkillTags = ({ title, items = [], tone = 'primary', tooltip }: SkillTagsProps) => {
  const toneClass =
    tone === 'warning'
      ? 'bg-amber-50 text-amber-700 border border-amber-100'
      : tone === 'accent'
        ? 'bg-gradient-to-r from-primary-50 to-accent-50 text-primary-800 border border-primary-100'
        : 'bg-white text-slate-800 border border-slate-100';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="text-lg font-semibold text-slate-900">{title}</div>
        {tooltip && <span className="text-xs text-slate-500">{tooltip}</span>}
      </div>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Nothing to show yet.</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <motion.span
              key={item}
              className={clsx(
                'inline-flex items-center rounded-full px-3 py-2 text-sm font-medium shadow-subtle transition',
                toneClass,
              )}
              whileHover={{ translateY: -3, scale: 1.02 }}
            >
              {tone === 'warning' && '!'} {item}
            </motion.span>
          ))}
        </div>
      )}
    </div>
  );
};
