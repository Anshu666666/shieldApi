import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useTelemetry();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => {
        const iconMap = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
          warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
          error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
          info: <Info className="w-4 h-4 text-sky-400 shrink-0" />
        };

        const borderMap = {
          success: 'border-emerald-800/80 bg-emerald-950/90',
          warning: 'border-amber-800/80 bg-amber-950/90',
          error: 'border-rose-800/80 bg-rose-950/90',
          info: 'border-sky-800/80 bg-sky-950/90'
        };

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3 rounded-lg border shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 duration-200 ${borderMap[t.type]}`}
          >
            <div className="mt-0.5">{iconMap[t.type]}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-textPrimary">{t.title}</div>
              <div className="text-[11px] text-textSecondary mt-0.5 leading-relaxed">{t.message}</div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-textSecondary hover:text-textPrimary p-0.5 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
