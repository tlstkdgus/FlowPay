import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

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

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <ArrowTrendingUpIcon className="h-3.5 w-3.5 text-success-600" />;
    if (trend === 'down') return <ArrowTrendingUpIcon className="h-3.5 w-3.5 text-error-600 rotate-180" />;
    return <span className="w-3.5 h-0.5 bg-gray-300 rounded-full" />;
  };

  const metrics = [
    { label: '총 지출', value: `₩${data.totalSpent.toLocaleString()}`, change: '+12%', icon: CurrencyDollarIcon },
    { label: '총 거래 건수', value: `${data.totalTransactions}건`, change: '+8%', icon: DocumentTextIcon },
    { label: '평균 거래 금액', value: `₩${data.avgTransaction.toLocaleString()}`, change: '+5%', icon: ArrowTrendingUpIcon },
    { label: '자동 분류율', value: '98%', change: '+2%', icon: CheckCircleIcon },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-900 border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-gray-500">데이터를 불러오는 중…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 sm:px-8 lg:px-12 py-10 sm:py-14">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 mb-2">회계 분석</h1>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-1.5 h-1.5 bg-success-500 rounded-full" />
            <span>실시간 업데이트 중</span>
            <ClockIcon className="h-4 w-4" />
          </div>
        </motion.div>

        {/* 필터 */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 whitespace-nowrap">기간</label>
            <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="input-field w-full sm:w-36">
              {periods.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 whitespace-nowrap">부서</label>
            <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="input-field w-full sm:w-36">
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 주요 지표 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {metrics.map((m) => (
            <div key={m.label} className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="icon-container icon-container-muted w-10 h-10">
                  <m.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-success-600">{m.change}</span>
              </div>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">{m.value}</p>
              <p className="text-sm text-gray-500 mt-1">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* 부서별 지출 */}
          <div className="card">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="icon-container icon-container-muted w-9 h-9">
                <BuildingOfficeIcon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">부서별 지출 현황</h2>
            </div>
            <div className="space-y-5">
              {data.departments.map((dept) => (
                <div key={dept.name}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-gray-900">{dept.name}</span>
                      {getTrendIcon(dept.trend)}
                    </div>
                    <span className="text-xs text-gray-500">
                      ₩{dept.spent.toLocaleString()} / ₩{dept.budget.toLocaleString()}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`h-full rounded-full ${
                        dept.percentage > 90 ? 'bg-error-500' : dept.percentage > 80 ? 'bg-warning-500' : 'bg-gray-900'
                      }`}
                      style={{ width: `${dept.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                    <span>{dept.percentage}% 사용</span>
                    <span>₩{(dept.budget - dept.spent).toLocaleString()} 남음</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 카테고리별 지출 */}
          <div className="card">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="icon-container icon-container-muted w-9 h-9">
                <ChartBarIcon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">카테고리별 지출</h2>
            </div>
            <div className="space-y-4">
              {data.categories.map((category) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="w-2 h-2 bg-flow-500 rounded-full flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900 truncate">{category.name}</span>
                    {getTrendIcon(category.trend)}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-400">{category.percentage}%</span>
                    <span className="text-sm font-semibold text-gray-900">₩{category.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 최근 거래 */}
        <div className="card mt-4 sm:mt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">최근 거래 내역</h2>
            <button className="text-sm text-flow-600 hover:text-flow-700 font-medium">전체 보기</button>
          </div>
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 sm:px-0 py-3 text-left text-xs font-medium text-gray-400">가맹점</th>
                  <th className="py-3 text-left text-xs font-medium text-gray-400">금액</th>
                  <th className="hidden sm:table-cell py-3 text-left text-xs font-medium text-gray-400 pl-6">부서</th>
                  <th className="hidden lg:table-cell py-3 text-left text-xs font-medium text-gray-400 pl-6">Flow ID</th>
                  <th className="py-3 text-left text-xs font-medium text-gray-400 pl-6">날짜</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-6 sm:px-0 py-3.5 text-sm font-medium text-gray-900">
                      <div className="truncate max-w-28 sm:max-w-none">{t.merchant}</div>
                    </td>
                    <td className="py-3.5 text-sm text-gray-900 whitespace-nowrap">₩{t.amount.toLocaleString()}</td>
                    <td className="hidden sm:table-cell py-3.5 text-sm text-gray-500 pl-6">{t.department}</td>
                    <td className="hidden lg:table-cell py-3.5 text-sm text-flow-600 font-mono pl-6">{t.flowId}</td>
                    <td className="py-3.5 text-sm text-gray-500 pl-6 whitespace-nowrap">{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 월별 트렌드 */}
        <div className="card mt-4 sm:mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">월별 지출 트렌드</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {data.monthlyData.map((month) => (
              <div key={month.month} className="card-muted p-4 text-center">
                <h4 className="text-sm font-medium text-gray-500 mb-2">{month.month}</h4>
                <p className="text-base font-semibold text-gray-900 mb-2">₩{(month.spent / 1000000).toFixed(1)}M</p>
                <div className="progress-bar mb-1.5">
                  <div className="h-full bg-gray-900 rounded-full" style={{ width: `${(month.spent / month.budget) * 100}%` }} />
                </div>
                <p className="text-xs text-gray-400">{Math.round((month.spent / month.budget) * 100)}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
