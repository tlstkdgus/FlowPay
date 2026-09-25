import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ChartBarIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  FingerPrintIcon,
  BriefcaseIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useFlowPay } from '../store/FlowPayContext';
import { completed, inPeriod, myFlowIds, sum } from '../store/selectors';
import { CATEGORIES, categoryById } from '../data/constants';
import {
  PERIODS,
  PeriodId,
  formatDate,
  monthKey,
  pctChange,
  periodRange,
  rangeInMonths,
  won,
  wonShort,
} from '../utils/format';
import { downloadFile, toCsv } from '../utils/csv';
import { Page, PageHeader, Segmented, fade } from './ui';
import { Transaction } from '../types';

type Scope = 'all' | 'mine';

const Analytics: React.FC = () => {
  const { state } = useFlowPay();
  const [period, setPeriod] = useState<PeriodId>('month');
  const [departmentId, setDepartmentId] = useState('all');
  const [scope, setScope] = useState<Scope>('all');

  const mine = useMemo(() => new Set(myFlowIds(state)), [state]);

  // 기간과 무관한 기본 필터 (부서·범위)
  const base = useMemo(
    () =>
      completed(state.transactions).filter(
        (t) => (departmentId === 'all' || t.departmentId === departmentId) && (scope === 'all' || mine.has(t.flowId))
      ),
    [state.transactions, departmentId, scope, mine]
  );

  const { current, previous } = useMemo(() => periodRange(period), [period]);
  const txs = useMemo(() => inPeriod(base, current), [base, current]);
  const prevTxs = useMemo(() => inPeriod(base, previous), [base, previous]);

  const total = sum(txs);
  const prevTotal = sum(prevTxs);
  const avg = txs.length ? total / txs.length : 0;
  const prevAvg = prevTxs.length ? prevTotal / prevTxs.length : 0;
  const autoRate = txs.length ? (txs.filter((t) => t.autoClassified).length / txs.length) * 100 : 0;
  const prevAutoRate = prevTxs.length ? (prevTxs.filter((t) => t.autoClassified).length / prevTxs.length) * 100 : 0;
  const months = rangeInMonths(period);

  const metrics = [
    { label: '총 지출', value: won(total), change: pctChange(total, prevTotal), invert: true, icon: CurrencyDollarIcon },
    { label: '거래 건수', value: `${txs.length}건`, change: pctChange(txs.length, prevTxs.length), icon: DocumentTextIcon },
    { label: '평균 거래 금액', value: won(avg), change: pctChange(avg, prevAvg), invert: true, icon: ArrowTrendingUpIcon },
    { label: '자동 분류율', value: `${autoRate.toFixed(0)}%`, change: autoRate - prevAutoRate, points: true, icon: CheckCircleIcon },
  ];

  const deptRows = state.departments
    .filter((d) => departmentId === 'all' || d.id === departmentId)
    .map((d) => {
      const spent = sum(txs.filter((t) => t.departmentId === d.id));
      const budget = d.budget * months;
      return { ...d, spent, budget, pct: budget ? (spent / budget) * 100 : 0, change: pctChange(spent, sum(prevTxs.filter((t) => t.departmentId === d.id))) };
    });

  const categoryRows = CATEGORIES.map((c) => ({ ...c, amount: sum(txs.filter((t) => t.categoryId === c.id)) }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const maxCategory = categoryRows[0]?.amount ?? 0;

  const projectRows = state.projects
    .filter((p) => departmentId === 'all' || p.departmentId === departmentId)
    .map((p) => {
      const spent = sum(completed(state.transactions).filter((t) => t.projectId === p.id));
      return { ...p, spent, pct: p.budget ? (spent / p.budget) * 100 : 0, periodSpent: sum(txs.filter((t) => t.projectId === p.id)) };
    });

  // 월별 트렌드 (최근 6개월, 기간 필터와 무관)
  const now = new Date();
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = monthKey(d);
    const spent = sum(base.filter((t) => t.date.startsWith(key)));
    const budget =
      scope === 'mine'
        ? state.profile.monthlyLimit
        : state.departments.filter((dep) => departmentId === 'all' || dep.id === departmentId).reduce((s, dep) => s + dep.budget, 0);
    return { key, label: `${d.getMonth() + 1}월`, spent, budget, current: i === 5 };
  });

  const flowIdRanking = Object.entries(
    txs.reduce<Record<string, number>>((acc, t) => ({ ...acc, [t.flowId]: (acc[t.flowId] ?? 0) + t.amount }), {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topMerchants = Object.entries(
    txs.reduce<Record<string, { amount: number; count: number }>>((acc, t) => {
      const prev = acc[t.merchant] ?? { amount: 0, count: 0 };
      return { ...acc, [t.merchant]: { amount: prev.amount + t.amount, count: prev.count + 1 } };
    }, {})
  )
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 5);

  const exportCsv = () => {
    const dept = (id: string) => state.departments.find((d) => d.id === id)?.name ?? '';
    const csv = toCsv(
      ['거래번호', '일시', 'Flow ID', '가맹점', '금액', '부서', '카테고리', '계정과목', '프로젝트'],
      txs.map((t: Transaction) => [
        t.id,
        t.date.replace('T', ' '),
        t.flowId,
        t.merchant,
        t.amount,
        dept(t.departmentId),
        categoryById(t.categoryId).name,
        categoryById(t.categoryId).account,
        state.projects.find((p) => p.id === t.projectId)?.name ?? '',
      ])
    );
    const periodName = PERIODS.find((p) => p.id === period)?.name ?? period;
    downloadFile(`FlowPay_분석_${periodName}.csv`, csv);
  };

  const txLink = `/transactions?period=${period}${departmentId !== 'all' ? `&dept=${departmentId}` : ''}${scope === 'mine' ? '&scope=mine' : ''}`;

  return (
    <Page>
      <PageHeader
        title="회계 분석"
        description={
          <span className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-1.5 h-1.5 bg-success-500 rounded-full" />
            결제·영수증 데이터가 즉시 반영됩니다
          </span>
        }
        actions={
          <button onClick={exportCsv} disabled={!txs.length} className="btn-secondary text-sm py-2.5 px-4 disabled:opacity-40">
            <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" /> CSV 내보내기
          </button>
        }
      />

      {/* 필터 — 한 줄 */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <Segmented
          className="lg:flex-1"
          options={PERIODS}
          value={period}
          onChange={(id) => setPeriod(id as PeriodId)}
        />
        <div className="flex gap-3">
          <select
            aria-label="부서"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="input-field py-2.5 flex-1 lg:w-36"
          >
            <option value="all">전체 부서</option>
            {state.departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <Segmented
            options={[
              { id: 'all', name: '전사' },
              { id: 'mine', name: '내 Flow ID' },
            ]}
            value={scope}
            onChange={(id) => setScope(id as Scope)}
          />
        </div>
      </div>

      {/* 주요 지표 */}
      <motion.div {...fade} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {metrics.map((m) => (
          <div key={m.label} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="icon-container icon-container-muted w-10 h-10">
                <m.icon className="h-5 w-5" />
              </div>
              <ChangeBadge value={m.change} invert={m.invert} points={m.points} />
            </div>
            <p className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight truncate">{m.value}</p>
            <p className="text-sm text-gray-500 mt-1">{m.label}</p>
          </div>
        ))}
      </motion.div>

      {/* 월별 트렌드 */}
      <div className="card mb-4 sm:mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">월별 지출 트렌드</h2>
          <span className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-4 border-t-2 border-dashed border-gray-400" />
            {scope === 'mine' ? '월 한도' : '월 예산'}
          </span>
        </div>
        <MonthlyChart data={monthly} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 부서별 예산 */}
        <div className="card">
          <CardTitle icon={BuildingOfficeIcon} title="부서별 예산 사용" />
          <div className="space-y-5">
            {deptRows.map((d) => (
              <div key={d.id}>
                <div className="flex justify-between items-center mb-2 gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-900">{d.name}</span>
                    {d.pct >= 100 && <ExclamationTriangleIcon className="h-4 w-4 text-error-600" aria-label="예산 초과" />}
                  </div>
                  <span className="text-xs text-gray-500 text-right">
                    {won(d.spent)} / {won(d.budget)}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      d.pct >= 100 ? 'bg-error-500' : d.pct >= state.settings.alertThreshold ? 'bg-warning-500' : 'bg-gray-900'
                    }`}
                    style={{ width: `${Math.min(100, d.pct)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                  <span>
                    {d.pct.toFixed(0)}% 사용 · 승인자 {d.approver}
                  </span>
                  <span>{d.budget >= d.spent ? `${won(d.budget - d.spent)} 남음` : `${won(d.spent - d.budget)} 초과`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 카테고리별 */}
        <div className="card">
          <CardTitle icon={ChartBarIcon} title="카테고리별 지출" />
          {categoryRows.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">해당 기간에 지출이 없습니다.</p>
          ) : (
            <div className="space-y-3.5">
              {categoryRows.map((c) => (
                <div key={c.id} className="group" title={`${c.name} · ${c.account} ${won(c.amount)}`}>
                  <div className="flex items-baseline justify-between mb-1.5 gap-3">
                    <span className="text-sm font-medium text-gray-900">
                      {c.name} <span className="text-xs text-gray-400 font-normal">{c.account}</span>
                    </span>
                    <span className="text-sm text-gray-900">
                      <span className="text-xs text-gray-400 mr-2">{((c.amount / total) * 100).toFixed(0)}%</span>
                      <span className="font-semibold">{won(c.amount)}</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-flow-600 group-hover:bg-flow-700 transition-colors"
                      style={{ width: `${(c.amount / maxCategory) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 프로젝트 */}
        <div className="card">
          <CardTitle icon={BriefcaseIcon} title="프로젝트 예산 (누적)" />
          <div className="space-y-4">
            {projectRows.map((p) => (
              <div key={p.id}>
                <div className="flex justify-between items-center mb-2 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">
                      {state.departments.find((d) => d.id === p.departmentId)?.name} · 이번 기간 {won(p.periodSpent)}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">{p.pct.toFixed(0)}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`h-full rounded-full ${p.pct >= 100 ? 'bg-error-500' : 'bg-gray-900'}`}
                    style={{ width: `${Math.min(100, p.pct)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  {won(p.spent)} / {won(p.budget)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Flow ID 순위 + 가맹점 */}
        <div className="card">
          <CardTitle icon={FingerPrintIcon} title="Flow ID별 지출" />
          <p className="text-xs text-gray-400 -mt-3 mb-4">개인정보 없이 익명 토큰 단위로만 집계합니다.</p>
          <ol className="space-y-2 mb-8">
            {flowIdRanking.map(([flowId, amount], i) => (
              <li key={flowId} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${mine.has(flowId) ? 'bg-flow-50' : 'bg-gray-50'}`}>
                <span className="text-xs text-gray-400 w-4 tabular-nums">{i + 1}</span>
                <span className="font-mono text-sm font-semibold text-gray-900 flex-1">
                  {flowId}
                  {mine.has(flowId) && <span className="ml-2 badge badge-accent font-sans">나</span>}
                </span>
                <span className="text-sm font-semibold text-gray-900">{won(amount)}</span>
              </li>
            ))}
            {!flowIdRanking.length && <li className="text-sm text-gray-400">데이터 없음</li>}
          </ol>

          <h3 className="text-sm font-medium text-gray-900 mb-3">자주 쓴 가맹점</h3>
          <ul className="space-y-2">
            {topMerchants.map(([name, v]) => (
              <li key={name} className="flex justify-between text-sm gap-3">
                <span className="text-gray-700 truncate">{name}</span>
                <span className="text-gray-900 flex-shrink-0">
                  <span className="text-xs text-gray-400 mr-2">{v.count}건</span>
                  {won(v.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 최근 거래 */}
      <div className="card mt-4 sm:mt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">최근 거래 내역</h2>
          <Link to={txLink} className="text-sm text-flow-600 hover:text-flow-700 font-medium">
            전체 보기 ({txs.length})
          </Link>
        </div>
        <div className="overflow-x-auto -mx-6 sm:mx-0">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 sm:px-0 py-3 text-left text-xs font-medium text-gray-400">가맹점</th>
                <th className="py-3 text-left text-xs font-medium text-gray-400">금액</th>
                <th className="hidden sm:table-cell py-3 text-left text-xs font-medium text-gray-400 pl-6">부서</th>
                <th className="hidden md:table-cell py-3 text-left text-xs font-medium text-gray-400 pl-6">계정과목</th>
                <th className="hidden lg:table-cell py-3 text-left text-xs font-medium text-gray-400 pl-6">Flow ID</th>
                <th className="py-3 text-left text-xs font-medium text-gray-400 pl-6 pr-6 sm:pr-0">날짜</th>
              </tr>
            </thead>
            <tbody>
              {txs.slice(0, 8).map((t) => (
                <tr key={t.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-6 sm:px-0 py-3.5 text-sm font-medium text-gray-900">
                    <Link to={`/transactions?id=${t.id}`} className="block truncate max-w-28 sm:max-w-none hover:text-flow-600">
                      {t.merchant}
                    </Link>
                  </td>
                  <td className="py-3.5 text-sm text-gray-900 whitespace-nowrap">{won(t.amount)}</td>
                  <td className="hidden sm:table-cell py-3.5 text-sm text-gray-500 pl-6">
                    {state.departments.find((d) => d.id === t.departmentId)?.name}
                  </td>
                  <td className="hidden md:table-cell py-3.5 text-sm text-gray-500 pl-6">{categoryById(t.categoryId).account}</td>
                  <td className="hidden lg:table-cell py-3.5 text-sm text-flow-600 font-mono pl-6">{t.flowId}</td>
                  <td className="py-3.5 text-sm text-gray-500 pl-6 pr-6 sm:pr-0 whitespace-nowrap">{formatDate(t.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!txs.length && <p className="text-sm text-gray-400 py-10 text-center">해당 기간에 거래가 없습니다.</p>}
        </div>
      </div>
    </Page>
  );
};

const CardTitle: React.FC<{ icon: React.ElementType; title: string }> = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2.5 mb-6">
    <div className="icon-container icon-container-muted w-9 h-9">
      <Icon className="h-5 w-5" />
    </div>
    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
  </div>
);

const ChangeBadge: React.FC<{ value: number | null; invert?: boolean; points?: boolean }> = ({ value, invert, points }) => {
  if (value === null) return <span className="text-xs text-gray-400" title="직전 기간 데이터가 없습니다">비교 없음</span>;
  if (Math.abs(value) < 0.5) return <span className="text-xs text-gray-400">변동 없음</span>;
  const up = value > 0;
  const good = invert ? !up : up;
  return (
    <span className={`text-xs font-medium ${good ? 'text-success-600' : 'text-error-600'}`} title="직전 동일 기간 대비">
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(0)}
      {points ? '%p' : '%'}
    </span>
  );
};

interface MonthPoint {
  key: string;
  label: string;
  spent: number;
  budget: number;
  current: boolean;
}

/** 단일 계열 막대 차트 + 예산 기준선. 막대에 마우스를 올리면 상세 툴팁을 표시합니다. */
const MonthlyChart: React.FC<{ data: MonthPoint[] }> = ({ data }) => {
  const [hover, setHover] = useState<number | null>(null);
  const budget = data[data.length - 1]?.budget ?? 0;
  const rawMax = Math.max(budget, ...data.map((d) => d.spent), 1);
  // 눈금이 깔끔하도록 최댓값을 올림
  const step = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const max = Math.ceil((rawMax * 1.1) / step) * step;
  const ticks = [0, max / 2, max];

  return (
    <div>
      <div className="relative h-56 pl-14">
        {/* 눈금 */}
        {ticks.map((t) => (
          <div key={t} className="absolute left-14 right-0 border-t border-gray-100" style={{ bottom: `${(t / max) * 100}%` }}>
            <span className="absolute -left-14 -translate-y-1/2 text-[11px] text-gray-400 w-12 text-right tabular-nums whitespace-nowrap">{wonShort(t)}</span>
          </div>
        ))}
        {/* 예산 기준선 */}
        {budget > 0 && (
          <div
            className="absolute left-14 right-0 border-t-2 border-dashed border-gray-400 pointer-events-none z-10"
            style={{ bottom: `${(budget / max) * 100}%` }}
          />
        )}
        <div className="absolute inset-0 left-14 flex items-end gap-2 sm:gap-4">
          {data.map((d, i) => {
            const over = d.budget > 0 && d.spent > d.budget;
            return (
              <div
                key={d.key}
                className="relative flex-1 h-full flex items-end justify-center cursor-default"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${d.label} ${won(d.spent)}`}
              >
                <div
                  className={`w-full max-w-[44px] rounded-t transition-colors ${
                    over ? 'bg-warning-500' : d.current ? 'bg-flow-600' : hover === i ? 'bg-gray-700' : 'bg-gray-900'
                  }`}
                  style={{ height: `${(d.spent / max) * 100}%`, minHeight: d.spent ? 2 : 0 }}
                />
                {hover === i && (
                  <div className="absolute bottom-full mb-2 z-20 bg-gray-900 text-white text-xs rounded-xl px-3 py-2 whitespace-nowrap shadow-large pointer-events-none">
                    <p className="font-semibold mb-0.5">{d.key.replace('-', '년 ')}월</p>
                    <p>지출 {won(d.spent)}</p>
                    {d.budget > 0 && (
                      <p className="text-gray-300">
                        예산 대비 {((d.spent / d.budget) * 100).toFixed(0)}%{over ? ' · 초과' : ''}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex gap-2 sm:gap-4 pl-14 mt-2">
        {data.map((d) => (
          <div key={d.key} className="flex-1 text-center">
            <p className={`text-xs ${d.current ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{d.label}</p>
            <p className="text-[11px] text-gray-500 tabular-nums">{wonShort(d.spent)}</p>
            {d.budget > 0 && d.spent > d.budget && <p className="text-[10px] text-warning-700 font-medium">초과</p>}
          </div>
        ))}
      </div>
      {/* 스크린리더용 표 */}
      <table className="sr-only">
        <caption>월별 지출</caption>
        <thead>
          <tr>
            <th>월</th>
            <th>지출</th>
            <th>예산</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <td>{d.label}</td>
              <td>{won(d.spent)}</td>
              <td>{won(d.budget)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Analytics;
