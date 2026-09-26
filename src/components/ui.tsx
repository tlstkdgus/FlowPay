import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
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

export const PageHeader: React.FC<{
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ eyebrow, title, description, actions }) => (
  <motion.div {...fade} className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
    <div>
      {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
      <h1 className="page-title">{title}</h1>
      {description && <div className="page-desc max-w-2xl">{description}</div>}
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
        mono ? 'tracking-wide text-flow-700' : tone === 'error' ? 'text-error-600' : tone === 'muted' ? 'text-gray-400' : 'text-gray-900'
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
    <div className="w-16 h-16 rounded-2xl bg-flow-50 flex items-center justify-center mx-auto mb-4">
      <Icon className="h-8 w-8 text-flow-500" />
    </div>
    <p className="text-sm text-gray-400">{message}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

/* ---------------- 상태 표시 ---------------- */

const APPROVAL: Record<ApprovalStatus, { label: string; cls: string }> = {
  pending: { label: '대기중', cls: 'badge-warning' },
  approved: { label: '승인됨', cls: 'badge-success' },
  rejected: { label: '거부됨', cls: 'badge-error' },
};

export const approvalLabel = (s: ApprovalStatus) => APPROVAL[s].label;

export const StatusTag: React.FC<{ status: ApprovalStatus }> = ({ status }) => (
  <span className={`badge ${APPROVAL[status].cls} gap-1 whitespace-nowrap`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current" />
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
    className={`relative inline-flex h-7 w-12 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-flow-500/30 ${
      checked ? 'bg-flow-500' : 'bg-gray-300'
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
  <div className={`flex gap-1 bg-white border border-gray-200/80 rounded-2xl p-1 overflow-x-auto ${className}`}>
    {options.map((o) => (
      <button
        key={o.id}
        type="button"
        onClick={() => onChange(o.id)}
        className={`flex-1 whitespace-nowrap py-2 px-3 rounded-xl text-xs sm:text-sm transition-colors ${
          value === o.id ? 'bg-flow-500 text-white font-semibold' : 'text-gray-500 hover:text-gray-900 font-medium'
        }`}
      >
        {o.name}
        {o.count !== undefined && (
          <span className={`ml-1 ${value === o.id ? 'text-white/80' : 'text-gray-400'}`}>{o.count}</span>
        )}
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
            className={`bg-white w-full ${size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-md'} rounded-t-3xl sm:rounded-3xl shadow-large max-h-[90vh] flex flex-col print:max-h-none print:shadow-none`}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-3 print:hidden">
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
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
  const colors = { success: 'text-flow-400', error: 'text-error-500', info: 'text-sky-400' };

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

/* ---------------- 발표자료 대시보드 요소 ---------------- */

// 제목 안의 핵심어를 민트로 강조 (발표자료의 '모두 자동화', '실시간 대시보드에 반영')
export const Highlight: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-flow-600">{children}</span>
);

/* ------------------------------------------------------------------ */
/* KPI 카드 — 발표자료 12번 대시보드 상단 4개 카드                       */
/* ------------------------------------------------------------------ */

type Tone = 'mint' | 'sky' | 'rose' | 'gray';

const toneClass: Record<Tone, string> = {
  mint: 'bg-flow-100 text-flow-700',
  sky: 'bg-sky-100 text-sky-600',
  rose: 'bg-error-50 text-error-500',
  gray: 'bg-gray-100 text-gray-600',
};

export const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  caption?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone?: Tone;
  to?: string;
}> = ({ label, value, caption, icon: Icon, tone = 'mint', to }) => {
  const body = (
    <>
    <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
      <span className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${toneClass[tone]}`}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="text-[13px] sm:text-sm font-medium text-gray-700 leading-tight">{label}</span>
    </div>
    <p className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight tabular-nums truncate">{value}</p>
    {caption && <p className="text-xs sm:text-[13px] font-medium text-flow-700 mt-1.5">{caption}</p>}
    </>
  );
  return to ? (
    <Link to={to} className="card card-hover block p-4 sm:p-6">
      {body}
    </Link>
  ) : (
    <div className="card p-4 sm:p-6">{body}</div>
  );
};

/** '지난달 대비 N% 증가' 캡션 — invert면 증가를 나쁜 신호(빨강)로 표시 */
export const ChangeCaption: React.FC<{ value: number | null; invert?: boolean; unit?: string; points?: boolean }> = ({
  value,
  invert,
  unit = '지난달 대비',
  points,
}) => {
  if (value === null) return <span className="text-gray-400">{unit} 비교 데이터 없음</span>;
  if (Math.round(value) === 0) return <span className="text-gray-400">{unit} 변동 없음</span>;
  const up = value > 0;
  const good = invert ? !up : up;
  return (
    <span className={good ? 'text-flow-700' : 'text-error-500'}>
      {unit} {Math.abs(value).toFixed(0)}
      {points ? '%p' : '%'} {up ? '증가' : '감소'}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* 부서별 예산 및 지출 현황 — 가로 예산 바                              */
/* ------------------------------------------------------------------ */

export interface BudgetRow {
  name: string;
  spent: number;
  budget: number;
  /** 퍼센트 옆에 붙는 보조 정보 (예: 승인자) */
  note?: string;
}

// 단일 민트 톤으로 소진율을 보여주고, 경고 임계치·초과만 상태색으로 구분한다
// (부서마다 다른 파스텔을 쓰면 색이 '어느 부서인지'가 아니라 순서만 뜻하게 된다)
export const BudgetBars: React.FC<{ rows: BudgetRow[]; alertThreshold?: number }> = ({ rows, alertThreshold = 80 }) => (
  <div className="space-y-5">
    {rows.map((row) => {
      const pct = row.budget ? Math.round((row.spent / row.budget) * 100) : 0;
      const over = pct >= 100;
      const near = !over && pct >= alertThreshold;
      return (
        <div key={row.name}>
          <div className="flex justify-between items-baseline mb-2 gap-3">
            <span className="text-sm font-semibold text-gray-800">{row.name}</span>
            <span className="text-[13px] text-gray-500 tabular-nums whitespace-nowrap">
              <span className="text-gray-800 font-medium">{row.spent.toLocaleString()}</span> 원 / {row.budget.toLocaleString()} 원
            </span>
          </div>
          <div
            className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden"
            role="meter"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${row.name} 예산 ${pct}% 사용`}
          >
            <div
              className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-error-400' : near ? 'bg-warning-400' : 'bg-flow-400'}`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span className={over ? 'text-error-500 font-semibold' : near ? 'text-warning-700 font-semibold' : ''}>
              {pct}% 사용{over ? ' · 예산 초과' : near ? ' · 한도 임박' : ''}
              {row.note && <span className="text-gray-400 font-normal"> · {row.note}</span>}
            </span>
            <span className="tabular-nums">
              {row.spent > row.budget
                ? `${(row.spent - row.budget).toLocaleString()} 원 초과`
                : `${(row.budget - row.spent).toLocaleString()} 원 남음`}
            </span>
          </div>
        </div>
      );
    })}
  </div>
);

/* ------------------------------------------------------------------ */
/* 카테고리별 지출 현황 — 세로 막대 차트 (발표자료 12번 우측)            */
/* ------------------------------------------------------------------ */

export interface CategoryDatum {
  name: string;
  amount: number;
  percentage: number;
  /** 툴팁 보조 정보 (예: 계정과목) */
  sub?: string;
}

export const CategoryChart: React.FC<{ data: CategoryDatum[] }> = ({ data }) => {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.percentage));
  // 눈금이 12.5% 같은 소수가 되지 않도록 10 단위로 끊는다
  const step = max > 50 ? 20 : 10;
  const top = Math.ceil(max / step) * step || step;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => top - i * step);

  return (
    <div>
      <div className="flex gap-2">
        {/* y축 눈금 (%) */}
        <div className="flex flex-col justify-between h-52 text-[11px] text-gray-400 tabular-nums text-right w-7 -my-1.5">
          {ticks.map((t) => (
            <span key={t}>{t}%</span>
          ))}
        </div>

        <div className="relative flex-1 h-52">
          {/* 가로 격자 — 점선, 배경보다 한 톤만 진하게 */}
          {ticks.map((t, i) => (
            <div
              key={t}
              className={`absolute inset-x-0 border-t ${i === ticks.length - 1 ? 'border-gray-300' : 'border-dashed border-gray-200'}`}
              style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
            />
          ))}

          <div className="absolute inset-0 flex items-end justify-around gap-2 sm:gap-4">
            {data.map((d, i) => (
              <div
                key={d.name}
                className="relative h-full flex-1 max-w-14 flex items-end cursor-default"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                {/* 옅은 민트 트랙 — 발표자료의 컬럼 배경 */}
                <div className="absolute inset-0 rounded-t bg-flow-50" />
                <div
                  className={`relative w-full rounded-t transition-all duration-700 ${
                    hover === null || hover === i ? 'bg-flow-400' : 'bg-flow-200'
                  }`}
                  style={{ height: `${(d.percentage / top) * 100}%` }}
                />
                {hover === i && (
                  <div className="absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full z-10 bg-gray-900 text-white rounded-xl px-3 py-2 text-xs whitespace-nowrap shadow-large pointer-events-none">
                    <p className="font-semibold">
                      {d.name}
                      {d.sub && <span className="font-normal text-gray-400"> · {d.sub}</span>}
                    </p>
                    <p className="text-gray-300 tabular-nums">
                      {d.amount.toLocaleString()}원 · {d.percentage}%
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* x축 라벨 */}
      <div className="flex gap-2 mt-2">
        <div className="w-7" />
        <div className="flex-1 flex justify-around gap-2 sm:gap-4">
          {data.map((d) => (
            <span key={d.name} className="flex-1 max-w-14 text-center text-xs text-gray-500 truncate">
              {d.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 전표 테이블 헤더의 민트 알약 — 자동 분류된 열을 강조                  */
/* ------------------------------------------------------------------ */

export const AutoColumnsPill: React.FC<{ labels: string[] }> = ({ labels }) => (
  <th colSpan={labels.length} className="py-2 px-1">
    <div className="flex items-center rounded-full border-2 border-flow-400 bg-flow-50 py-1.5">
      {labels.map((l, i) => (
        <span
          key={l}
          className={`flex-1 text-center text-[13px] font-semibold text-flow-800 whitespace-nowrap px-3 ${
            i > 0 ? 'border-l-2 border-flow-200' : ''
          }`}
        >
          {l}
        </span>
      ))}
    </div>
  </th>
);
