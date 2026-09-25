import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  CheckBadgeIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, Highlight, StatCard, BudgetBars, CategoryChart, AutoColumnsPill } from './ui';

interface AnalyticsData {
  totalSpent: number;
  totalTransactions: number;
  avgTransaction: number;
  departments: Array<{ name: string; spent: number; budget: number; percentage: number; trend: 'up' | 'down' | 'stable' }>;
  categories: Array<{ name: string; amount: number; percentage: number; trend: 'up' | 'down' | 'stable' }>;
  recentTransactions: Array<{ id: number; merchant: string; amount: number; department: string; flowId: string; date: string; category: string }>;
  monthlyData: Array<{ month: string; spent: number; budget: number }>;
}

const departments = [
  { id: 'all', name: '전체' },
  { id: 'sales', name: '영업팀' },
  { id: 'marketing', name: '마케팅팀' },
  { id: 'development', name: '개발팀' },
  { id: 'hr', name: '인사팀' },
];

const periods = [
  { id: 'week', name: '이번 주' },
  { id: 'month', name: '이번 달' },
  { id: 'quarter', name: '이번 분기' },
  { id: 'year', name: '올해' },
];

const data: AnalyticsData = {
  totalSpent: 2340000,
  totalTransactions: 168,
  avgTransaction: 13929,
  departments: [
    { name: '영업팀', spent: 920000, budget: 1000000, percentage: 92, trend: 'up' },
    { name: '마케팅팀', spent: 680000, budget: 800000, percentage: 85, trend: 'down' },
    { name: '개발팀', spent: 510000, budget: 600000, percentage: 85, trend: 'up' },
    { name: '인사팀', spent: 390000, budget: 500000, percentage: 78, trend: 'stable' },
  ],
  categories: [
    { name: '식비', amount: 1080000, percentage: 46, trend: 'up' },
    { name: '교통비', amount: 440000, percentage: 19, trend: 'down' },
    { name: '업무용품', amount: 360000, percentage: 15, trend: 'up' },
    { name: '회의비', amount: 260000, percentage: 11, trend: 'stable' },
    { name: '기타', amount: 200000, percentage: 9, trend: 'down' },
  ],
  recentTransactions: [
    { id: 1, merchant: '스타벅스 강남점', amount: 4500, department: '영업팀', flowId: 'XK8P2M', date: '2024-01-15', category: '식비' },
    { id: 2, merchant: 'GS25 본사점', amount: 12000, department: '마케팅팀', flowId: 'XK8P2M', date: '2024-01-15', category: '업무용품' },
    { id: 3, merchant: '맥도날드', amount: 8500, department: '개발팀', flowId: 'XK8P2M', date: '2024-01-14', category: '식비' },
    { id: 4, merchant: '올리브영', amount: 32000, department: '인사팀', flowId: 'XK8P2M', date: '2024-01-14', category: '복리후생' },
  ],
  monthlyData: [
    { month: '1월', spent: 1800000, budget: 2000000 },
    { month: '2월', spent: 2100000, budget: 2000000 },
    { month: '3월', spent: 1950000, budget: 2000000 },
    { month: '4월', spent: 2200000, budget: 2000000 },
    { month: '5월', spent: 2050000, budget: 2000000 },
    { month: '6월', spent: 2300000, budget: 2000000 },
  ],
};


const Analytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-flow-500 border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-gray-500">데이터를 불러오는 중…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 sm:px-8 lg:px-12 py-10 sm:py-14">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
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
                실시간 업데이트 중 · 2024.01.15 오후 13:00 기준
              </span>
            }
          />
        </motion.div>

        {/* 필터 — 차트 위 한 줄 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex gap-1 bg-white border border-gray-200/80 rounded-2xl p-1 overflow-x-auto" role="tablist" aria-label="기간">
            {periods.map((p) => (
              <button
                key={p.id}
                role="tab"
                aria-selected={selectedPeriod === p.id}
                onClick={() => setSelectedPeriod(p.id)}
                className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-colors ${
                  selectedPeriod === p.id ? 'bg-flow-500 text-white font-semibold' : 'text-gray-500 hover:text-gray-900 font-medium'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <select
            aria-label="부서"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="input-field sm:w-40 py-2.5"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name === '전체' ? '전체 부서' : d.name}</option>
            ))}
          </select>
        </div>

        {/* 주요 지표 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <StatCard label="총 지출" icon={BanknotesIcon} tone="mint" value={`${data.totalSpent.toLocaleString()} 원`} caption="지난달 대비 12% 증가" />
          <StatCard label="총 거래 건수" icon={DocumentTextIcon} tone="sky" value={`${data.totalTransactions} 건`} caption="지난달 대비 8% 증가" />
          <StatCard label="평균 거래 금액" icon={ArrowTrendingUpIcon} tone="rose" value={`${data.avgTransaction.toLocaleString()} 원`} caption="지난달 대비 5% 증가" />
          <StatCard label="계정 과목 자동 분류율" icon={CheckBadgeIcon} tone="gray" value="98.8%" caption="영수증 확인 필요 1.2%" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="card">
            <h2 className="card-title mb-6">부서별 예산 및 지출 현황</h2>
            <BudgetBars rows={data.departments} />
          </div>

          <div className="card">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="card-title">카테고리별 지출 현황</h2>
              <span className="text-xs text-gray-400">전체 지출 대비 비중</span>
            </div>
            <CategoryChart data={data.categories} />
          </div>
        </div>

        {/* 최근 거래 — 발표자료 전표 테이블 */}
        <div className="card mt-4 sm:mt-6">
          <div className="flex items-start justify-between mb-4 gap-3">
            <div>
              <h2 className="card-title">최근 거래 내역</h2>
              <p className="text-xs text-gray-400 mt-1">계정과목·부서는 결제 시점에 자동 분류됩니다</p>
            </div>
            <button className="inline-flex items-center gap-0.5 text-sm text-gray-500 hover:text-gray-900 font-medium whitespace-nowrap">
              전체 결제 내역 <ChevronRightIcon className="h-4 w-4 text-flow-500" />
            </button>
          </div>
          <div className="overflow-x-auto -mx-6 sm:-mx-7 px-3 sm:px-4">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="table-head">결제일</th>
                  <th className="table-head">가맹점</th>
                  <AutoColumnsPill labels={['계정과목', '부서']} />
                  <th className="table-head">Flow ID</th>
                  <th className="table-head">결제 금액</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell tabular-nums text-gray-500">{t.date.replace(/-/g, '.')}</td>
                    <td className="table-cell font-medium text-gray-900">{t.merchant}</td>
                    <td className="table-cell w-28">{t.category}</td>
                    <td className="table-cell w-28">{t.department}</td>
                    <td className="table-cell tracking-wide text-gray-500">{t.flowId}</td>
                    <td className="table-cell font-semibold text-gray-900 tabular-nums">{t.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 월별 트렌드 */}
        <div className="card mt-4 sm:mt-6">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="card-title">월별 지출 트렌드</h2>
            <span className="text-xs text-gray-400">예산 대비 사용률</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {data.monthlyData.map((month) => {
              const pct = Math.round((month.spent / month.budget) * 100);
              const over = pct > 100;
              return (
                <div key={month.month} className="card-muted p-4 text-center">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">{month.month}</h4>
                  <p className="text-base font-bold text-gray-900 mb-2 tabular-nums">{(month.spent / 10000).toLocaleString()}만</p>
                  <div className="progress-bar mb-1.5 bg-white">
                    <div className={`h-full rounded-full ${over ? 'bg-error-400' : 'bg-flow-400'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                  <p className={`text-xs font-medium ${over ? 'text-error-500' : 'text-gray-400'}`}>
                    {pct}%{over ? ' 초과' : ''}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
