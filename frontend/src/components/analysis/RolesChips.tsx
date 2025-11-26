import { motion } from 'framer-motion';

interface RolesChipsProps {
  roles?: string[];
}

export const RolesChips = ({ roles = [] }: RolesChipsProps) => {
  return (
    <div className="glass-card rounded-2xl p-5 shadow-subtle">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-900">Suggested Roles</h3>
        <p className="text-xs text-slate-500">Best fit matches</p>
      </div>
      {roles.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Nothing to show yet.</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {roles.map((role) => (
            <motion.span
              key={role}
              className="inline-flex items-center rounded-full bg-gradient-to-r from-primary-500/90 to-accent-500/90 px-3 py-2 text-sm font-semibold text-white shadow-floating transition"
              whileHover={{ translateY: -2, scale: 1.02 }}
            >
              {role}
            </motion.span>
          ))}
        </div>
      )}
    </div>
  );
};
