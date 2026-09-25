import React, { useState } from 'react';

/* ------------------------------------------------------------------ */
/* 페이지 헤더 — 발표자료 슬라이드 제목 패턴                             */
/* ------------------------------------------------------------------ */

export const PageHeader: React.FC<{
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  right?: React.ReactNode;
}> = ({ eyebrow, title, description, right }) => (
  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
    <div>
      <p className="page-eyebrow">{eyebrow}</p>
      <h1 className="page-title">{title}</h1>
      {description && <p className="page-desc">{description}</p>}
    </div>
    {right}
  </div>
);

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
}> = ({ label, value, caption, icon: Icon, tone = 'mint' }) => (
  <div className="card p-4 sm:p-6">
    <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
      <span className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${toneClass[tone]}`}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="text-[13px] sm:text-sm font-medium text-gray-700 leading-tight">{label}</span>
    </div>
    <p className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight tabular-nums">{value}</p>
    {caption && <p className="text-xs sm:text-[13px] font-medium text-flow-700 mt-1.5">{caption}</p>}
  </div>
);

/* ------------------------------------------------------------------ */
/* 부서별 예산 및 지출 현황 — 가로 예산 바                              */
/* ------------------------------------------------------------------ */

export interface BudgetRow {
  name: string;
  spent: number;
  budget: number;
}

// 단일 민트 톤으로 소진율을 보여주고, 한도 임박만 상태색으로 구분한다
// (부서마다 다른 파스텔을 쓰면 색이 '어느 부서인지'가 아니라 순서만 뜻하게 된다)
const budgetFill = (pct: number) => {
  if (pct >= 90) return 'bg-error-400';
  if (pct >= 80) return 'bg-warning-400';
  return 'bg-flow-400';
};

export const BudgetBars: React.FC<{ rows: BudgetRow[] }> = ({ rows }) => (
  <div className="space-y-5">
    {rows.map((row) => {
      const pct = Math.min(100, Math.round((row.spent / row.budget) * 100));
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
            <div className={`h-full rounded-full transition-all duration-700 ${budgetFill(pct)}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span className={pct >= 90 ? 'text-error-500 font-semibold' : ''}>
              {pct}% 사용{pct >= 90 ? ' · 한도 임박' : ''}
            </span>
            <span className="tabular-nums">{(row.budget - row.spent).toLocaleString()} 원 남음</span>
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
                    <p className="font-semibold">{d.name}</p>
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
