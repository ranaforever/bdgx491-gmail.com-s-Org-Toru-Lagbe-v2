import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

interface AlertProps {
  type?: 'success' | 'warning' | 'error' | 'info';
  message: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type = 'info', message, onClose }) => {
  const styles = {
    success: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60',
    warning: 'bg-amber-950/40 text-amber-300 border-amber-800/60',
    error: 'bg-rose-950/40 text-rose-300 border-rose-800/60',
    info: 'bg-teal-950/40 text-teal-300 border-teal-800/60',
  };

  const icons = {
    success: CheckCircle2,
    warning: AlertCircle,
    error: AlertCircle,
    info: Info,
  };

  const Icon = icons[type];

  return (
    <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 ${styles[type]}`}>
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 shrink-0" />
        <span>{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="hover:opacity-80 p-0.5 rounded">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
