import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ChartBarIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  CheckBadgeIcon,
  ArrowDownTrayIcon,
  FingerPrintIcon,
  BriefcaseIcon,
  ChevronRightIcon,
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
import { Page, PageHeader, Segmented, fade, Highlight, StatCard, ChangeCaption, BudgetBars, CategoryChart, AutoColumnsPill } from './ui';
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

  // 발표자료 대시보드 KPI 순서·아이콘 톤(민트·블루·레드·그레이)을 따른다
  const metrics = [
    { label: '총 지출', value: won(total), change: pctChange(total, prevTotal), invert: true, icon: BanknotesIcon, tone: 'mint' as const },
    { label: '총 거래 건수', value: `${txs.length} 건`, change: pctChange(txs.length, prevTxs.length), icon: DocumentTextIcon, tone: 'sky' as const },
    { label: '평균 거래 금액', value: won(avg), change: pctChange(avg, prevAvg), invert: true, icon: ArrowTrendingUpIcon, tone: 'rose' as const },
    { label: '계정과목 자동 분류율', value: `${autoRate.toFixed(0)}%`, change: autoRate - prevAutoRate, points: true, icon: CheckBadgeIcon, tone: 'gray' as const },
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
        eyebrow="Analytics"
        title={
          <>
            <Highlight>실시간</Highlight> 회계 분석
          </>
        }
        description={
          <span className="inline-flex items-center gap-2 text-sm">
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-flow-400 animate-ping opacity-60" />
              <span className="relative w-2 h-2 rounded-full bg-flow-500" />
            </span>
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
          <StatCard
            key={m.label}
            label={m.label}
            icon={m.icon}
            tone={m.tone}
            value={m.value}
            caption={<ChangeCaption value={m.change} invert={m.invert} points={m.points} unit="직전 기간 대비" />}
          />
        ))}
      </motion.div>

      {/* 월별 트렌드 */}
      <div className="card mb-4 sm:mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
          <h2 className="card-title">월별 지출 트렌드</h2>
          <span className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-4 border-t-2 border-dashed border-error-400" />
            {scope === 'mine' ? '월 한도' : '월 예산'}
          </span>
        </div>
        <MonthlyChart data={monthly} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 부서별 예산 */}
        <div className="card">
          <CardTitle icon={BuildingOfficeIcon} title="부서별 예산 및 지출 현황" />
          <BudgetBars
            alertThreshold={state.settings.alertThreshold}
            rows={deptRows.map((d) => ({ name: d.name, spent: d.spent, budget: Math.round(d.budget), note: `승인자 ${d.approver}` }))}
          />
        </div>

        {/* 카테고리별 */}
        <div className="card">
          <CardTitle icon={ChartBarIcon} title="카테고리별 지출 현황" hint="전체 지출 대비 비중" />
          {categoryRows.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">해당 기간에 지출이 없습니다.</p>
          ) : (
            <CategoryChart
              data={categoryRows.map((c) => ({
                name: c.name,
                sub: c.account,
                amount: c.amount,
                percentage: Math.round((c.amount / total) * 100),
              }))}
            />
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
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">
                      {state.departments.find((d) => d.id === p.departmentId)?.name} · 이번 기간 {won(p.periodSpent)}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">{p.pct.toFixed(0)}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`h-full rounded-full ${p.pct >= 100 ? 'bg-error-400' : 'bg-flow-400'}`}
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
                <span className="text-sm font-bold tracking-wide text-gray-900 flex-1">
                  {flowId}
                  {mine.has(flowId) && <span className="ml-2 badge badge-accent tracking-normal">나</span>}
                </span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums">{won(amount)}</span>
              </li>
            ))}
            {!flowIdRanking.length && <li className="text-sm text-gray-400">데이터 없음</li>}
          </ol>

          <h3 className="text-xs font-semibold text-gray-400 mb-3">자주 쓴 가맹점</h3>
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
        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            <h2 className="card-title">최근 거래 내역</h2>
            <p className="text-xs text-gray-400 mt-1">계정과목·부서는 결제 시점에 자동 분류됩니다</p>
          </div>
          <Link
            to={txLink}
            className="inline-flex items-center gap-0.5 text-sm text-gray-500 hover:text-gray-900 font-medium whitespace-nowrap"
          >
            전체 결제 내역 {txs.length} <ChevronRightIcon className="h-4 w-4 text-flow-500" />
          </Link>
        </div>
        <div className="overflow-x-auto -mx-6 sm:-mx-7 px-3 sm:px-4">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="table-head">결제일</th>
                <th className="table-head">가맹점</th>
                <AutoColumnsPill labels={['계정과목', '부서']} />
                <th className="table-head hidden lg:table-cell">Flow ID</th>
                <th className="table-head">결제 금액</th>
              </tr>
            </thead>
            <tbody>
              {txs.slice(0, 8).map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell tabular-nums text-gray-500">{formatDate(t.date).replace(/-/g, '.')}</td>
                  <td className="table-cell font-medium text-gray-900">
                    <Link to={`/transactions?id=${t.id}`} className="block truncate max-w-32 sm:max-w-none mx-auto hover:text-flow-600">
                      {t.merchant}
                    </Link>
                  </td>
                  <td className="table-cell w-28">{categoryById(t.categoryId).account}</td>
                  <td className="table-cell w-28">{state.departments.find((d) => d.id === t.departmentId)?.name}</td>
                  <td className="table-cell hidden lg:table-cell tracking-wide text-gray-500">{t.flowId}</td>
                  <td className="table-cell font-semibold text-gray-900 tabular-nums">{t.amount.toLocaleString('ko-KR')}</td>
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

const CardTitle: React.FC<{ icon: React.ElementType; title: string; hint?: string }> = ({ icon: Icon, title, hint }) => (
  <div className="flex items-center gap-2.5 mb-6">
    <div className="icon-container icon-container-accent w-9 h-9 rounded-xl">
      <Icon className="h-5 w-5" />
    </div>
    <h2 className="card-title flex-1">{title}</h2>
    {hint && <span className="text-xs text-gray-400">{hint}</span>}
  </div>
);

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
          <div
            key={t}
            className={`absolute left-14 right-0 border-t ${t === 0 ? 'border-gray-300' : 'border-dashed border-gray-200'}`}
            style={{ bottom: `${(t / max) * 100}%` }}
          >
            <span className="absolute -left-14 -translate-y-1/2 text-[11px] text-gray-400 w-12 text-right tabular-nums whitespace-nowrap">{wonShort(t)}</span>
          </div>
        ))}
        {/* 예산 기준선 */}
        {budget > 0 && (
          <div
            className="absolute left-14 right-0 border-t-2 border-dashed border-error-400 pointer-events-none z-10"
            style={{ bottom: `${(budget / max) * 100}%` }}
          />
        )}
        <div className="absolute inset-0 left-14 flex items-end gap-2 sm:gap-4">
          {data.map((d, i) => {
            const over = d.budget > 0 && d.spent > d.budget;
            return (
              <div
                key={d.key}
                className="relative flex-1 h-full flex items-end justify-center cursor-default outline-none"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${d.label} ${won(d.spent)}`}
              >
                <div className="absolute bottom-0 w-full max-w-[44px] h-full rounded-t bg-flow-50" />
                <div
                  className={`relative w-full max-w-[44px] rounded-t transition-colors ${
                    over ? 'bg-warning-400' : hover === i || d.current ? 'bg-flow-500' : 'bg-flow-300'
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
            <p className={`text-xs ${d.current ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>{d.label}</p>
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
