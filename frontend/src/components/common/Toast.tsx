import { XMarkIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../context/ToastContext';

const toneStyles: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-900 border border-emerald-200',
  error: 'bg-rose-50 text-rose-900 border border-rose-200',
  info: 'bg-slate-900 text-white border border-slate-800',
};

export const Toaster = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-3 sm:right-6 sm:bottom-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-card ${toneStyles[toast.tone] ?? toneStyles.info}`}
        >
          <div className="flex-1 text-sm font-medium">{toast.message}</div>
          <button
            type="button"
            className="rounded-full p-1 hover:bg-black/5"
            onClick={() => removeToast(toast.id)}
          >
            <XMarkIcon className={`h-5 w-5 ${toast.tone === 'info' ? 'text-white' : 'text-slate-600'}`} />
          </button>
        </div>
      ))}
    </div>
  );
};
