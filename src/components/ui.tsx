import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ApprovalStatus, TaxStatus } from '../types';

/* ---------------- 페이지 레이아웃 ---------------- */

export const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export const Page: React.FC<{ children: React.ReactNode; wide?: boolean }> = ({ children, wide = true }) => (
  <div className="px-5 sm:px-8 lg:px-12 py-10 sm:py-14">
    <div className={`${wide ? 'max-w-6xl' : 'max-w-3xl'} mx-auto`}>{children}</div>
  </div>
);

export const PageHeader: React.FC<{ title: string; description?: React.ReactNode; actions?: React.ReactNode }> = ({
  title,
  description,
  actions,
}) => (
  <motion.div {...fade} className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
    <div>
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 mb-2">{title}</h1>
      {description && <div className="text-gray-500 max-w-2xl leading-relaxed">{description}</div>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </motion.div>
);

export const Row: React.FC<{
  label: string;
  value: React.ReactNode;
  bold?: boolean;
  mono?: boolean;
  tone?: 'default' | 'error' | 'muted';
}> = ({ label, value, bold, mono, tone = 'default' }) => (
  <div className="flex justify-between gap-4">
    <span className="text-gray-500 flex-shrink-0">{label}</span>
    <span
      className={`text-right min-w-0 break-words ${bold ? 'font-semibold' : 'font-medium'} ${
        mono ? 'font-mono text-flow-600' : tone === 'error' ? 'text-error-600' : tone === 'muted' ? 'text-gray-400' : 'text-gray-900'
      }`}
    >
      {value}
    </span>
  </div>
);

export const EmptyState: React.FC<{ icon: React.ElementType; message: string; action?: React.ReactNode }> = ({
  icon: Icon,
  message,
  action,
}) => (
  <div className="text-center py-14">
    <Icon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
    <p className="text-sm text-gray-400">{message}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

/* ---------------- 상태 표시 ---------------- */

const APPROVAL: Record<ApprovalStatus, { label: string; dot: string }> = {
  pending: { label: '대기중', dot: 'bg-warning-500' },
  approved: { label: '승인됨', dot: 'bg-success-500' },
  rejected: { label: '거부됨', dot: 'bg-error-500' },
};

export const approvalLabel = (s: ApprovalStatus) => APPROVAL[s].label;

export const StatusTag: React.FC<{ status: ApprovalStatus }> = ({ status }) => (
  <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 whitespace-nowrap">
    <span className={`w-1.5 h-1.5 rounded-full ${APPROVAL[status].dot}`} />
    {APPROVAL[status].label}
  </span>
);

const TAX: Record<TaxStatus, { label: string; cls: string }> = {
  not_submitted: { label: '미전송', cls: 'badge-primary' },
  submitted: { label: '전송 중', cls: 'badge-warning' },
  accepted: { label: '국세청 접수', cls: 'badge-success' },
};

export const taxLabel = (s: TaxStatus) => TAX[s].label;

export const TaxTag: React.FC<{ status: TaxStatus }> = ({ status }) => (
  <span className={`badge ${TAX[status].cls} whitespace-nowrap`}>{TAX[status].label}</span>
);

/* ---------------- 입력 ---------------- */

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({
  checked,
  onChange,
  label,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-7 w-12 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-flow-600/30 ${
      checked ? 'bg-success-500' : 'bg-gray-300'
    }`}
  >
    <span
      className={`inline-block h-6 w-6 mt-0.5 rounded-full bg-white shadow-soft transform transition-transform duration-200 ${
        checked ? 'translate-x-[22px]' : 'translate-x-0.5'
      }`}
    />
  </button>
);

export const Segmented: React.FC<{
  options: { id: string; name: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}> = ({ options, value, onChange, className = '' }) => (
  <div className={`flex gap-1 bg-gray-100 rounded-2xl p-1 overflow-x-auto ${className}`}>
    {options.map((o) => (
      <button
        key={o.id}
        type="button"
        onClick={() => onChange(o.id)}
        className={`flex-1 whitespace-nowrap py-2 px-3 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
          value === o.id ? 'bg-white text-gray-900 shadow-soft' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        {o.name}
        {o.count !== undefined && <span className="ml-1 text-gray-400">{o.count}</span>}
      </button>
    ))}
  </div>
);

export const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <label className="block">
    <span className="block text-sm text-gray-500 mb-1.5">{label}</span>
    {children}
    {hint && <span className="block text-xs text-gray-400 mt-1">{hint}</span>}
  </label>
);

/* ---------------- 모달 ---------------- */

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg';
}> = ({ open, onClose, title, children, footer, size = 'md' }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 print:static print:bg-transparent print:backdrop-blur-none"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={`bg-white w-full ${size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-md'} rounded-t-4xl sm:rounded-4xl max-h-[90vh] flex flex-col print:max-h-none print:shadow-none`}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-3 print:hidden">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <button onClick={onClose} aria-label="닫기" className="p-1.5 -mr-1.5 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 pb-6 overflow-y-auto">{children}</div>
            {footer && (
              <div className="px-6 py-4 border-t border-gray-100 flex gap-2 print:hidden pb-[max(1rem,env(safe-area-inset-bottom))]">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ---------------- 토스트 ---------------- */

type ToastTone = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => {});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const show = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = ++seq.current;
    setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  const icons = { success: CheckCircleIcon, error: ExclamationTriangleIcon, info: InformationCircleIcon };
  const colors = { success: 'text-success-500', error: 'text-error-500', info: 'text-flow-400' };

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="fixed z-[70] top-4 inset-x-4 sm:inset-x-auto sm:right-6 flex flex-col items-center sm:items-end gap-2 pointer-events-none print:hidden"
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = icons[t.tone];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="pointer-events-auto flex items-center gap-2.5 bg-gray-900 text-white text-sm rounded-2xl px-4 py-3 shadow-large max-w-sm"
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${colors[t.tone]}`} />
                <span>{t.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
