import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  DocumentTextIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  CalendarIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  totalSpent: number;
  totalTransactions: number;
  avgTransaction: number;
  departments: Array<{
    name: string;
    spent: number;
    budget: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  categories: Array<{
    name: string;
    amount: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  recentTransactions: Array<{
    id: number;
    merchant: string;
    amount: number;
    department: string;
    flowId: string;
    date: string;
    category: string;
  }>;
  monthlyData: Array<{
    month: string;
    spent: number;
    budget: number;
  }>;
}

const Analytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

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

  // 실시간 데이터 시뮬레이션
  useEffect(() => {
    const generateMockData = (): AnalyticsData => {
      const baseAmount = Math.random() * 500000 + 2000000;
      const baseTransactions = Math.floor(Math.random() * 50) + 150;
      
      return {
        totalSpent: Math.floor(baseAmount),
        totalTransactions: baseTransactions,
        avgTransaction: Math.floor(baseAmount / baseTransactions),
        departments: [
          { 
            name: '영업팀', 
            spent: Math.floor(Math.random() * 200000) + 800000, 
            budget: 1000000, 
            percentage: Math.floor(Math.random() * 20) + 75,
            trend: Math.random() > 0.5 ? 'up' : 'down'
          },
          { 
            name: '마케팅팀', 
            spent: Math.floor(Math.random() * 150000) + 600000, 
            budget: 800000, 
            percentage: Math.floor(Math.random() * 20) + 70,
            trend: Math.random() > 0.5 ? 'up' : 'down'
          },
          { 
            name: '개발팀', 
            spent: Math.floor(Math.random() * 100000) + 500000, 
            budget: 600000, 
            percentage: Math.floor(Math.random() * 20) + 80,
            trend: Math.random() > 0.5 ? 'up' : 'down'
          },
          { 
            name: '인사팀', 
            spent: Math.floor(Math.random() * 100000) + 350000, 
            budget: 500000, 
            percentage: Math.floor(Math.random() * 20) + 70,
            trend: Math.random() > 0.5 ? 'up' : 'down'
          },
        ],
        categories: [
          { 
            name: '식비', 
            amount: Math.floor(Math.random() * 200000) + 1000000, 
            percentage: Math.floor(Math.random() * 10) + 45,
            trend: Math.random() > 0.5 ? 'up' : 'down'
          },
          { 
            name: '교통비', 
            amount: Math.floor(Math.random() * 100000) + 400000, 
            percentage: Math.floor(Math.random() * 10) + 15,
            trend: Math.random() > 0.5 ? 'up' : 'down'
          },
          { 
            name: '업무용품', 
            amount: Math.floor(Math.random() * 100000) + 300000, 
            percentage: Math.floor(Math.random() * 10) + 12,
            trend: Math.random() > 0.5 ? 'up' : 'down'
          },
          { 
            name: '회의비', 
            amount: Math.floor(Math.random() * 100000) + 200000, 
            percentage: Math.floor(Math.random() * 10) + 8,
            trend: Math.random() > 0.5 ? 'up' : 'down'
          },
          { 
            name: '기타', 
            amount: Math.floor(Math.random() * 100000) + 150000, 
            percentage: Math.floor(Math.random() * 10) + 5,
            trend: Math.random() > 0.5 ? 'up' : 'down'
          },
        ],
        recentTransactions: [
          { 
            id: 1, 
            merchant: '스타벅스 강남점', 
            amount: Math.floor(Math.random() * 5000) + 3000, 
            department: '영업팀', 
            flowId: 'XK8P2M', 
            date: '2024-01-15',
            category: '식비'
          },
          { 
            id: 2, 
            merchant: 'GS25 본사점', 
            amount: Math.floor(Math.random() * 10000) + 8000, 
            department: '마케팅팀', 
            flowId: 'XK8P2M', 
            date: '2024-01-15',
            category: '업무용품'
          },
          { 
            id: 3, 
            merchant: '맥도날드', 
            amount: Math.floor(Math.random() * 5000) + 6000, 
            department: '개발팀', 
            flowId: 'XK8P2M', 
            date: '2024-01-14',
            category: '식비'
          },
          { 
            id: 4, 
            merchant: '올리브영', 
            amount: Math.floor(Math.random() * 20000) + 25000, 
            department: '인사팀', 
            flowId: 'XK8P2M', 
            date: '2024-01-14',
            category: '복리후생'
          },
        ],
        monthlyData: [
          { month: '1월', spent: 1800000, budget: 2000000 },
          { month: '2월', spent: 2100000, budget: 2000000 },
          { month: '3월', spent: 1950000, budget: 2000000 },
          { month: '4월', spent: 2200000, budget: 2000000 },
          { month: '5월', spent: 2050000, budget: 2000000 },
          { month: '6월', spent: 2300000, budget: 2000000 },
        ]
      };
    };

    // 초기 데이터 로드
    setAnalyticsData(generateMockData());
    setIsLoading(false);

    // 실시간 데이터 업데이트 (30초마다)
    const interval = setInterval(() => {
      setAnalyticsData(generateMockData());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-success-600" />;
      case 'down':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-error-600 transform rotate-180" />;
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-success-600';
      case 'down':
        return 'text-error-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading || !analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-flow-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="icon-container icon-container-primary">
              <ChartBarIcon className="h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">실시간 회계 분석</h1>
          </div>
          <p className="text-gray-600">Flow ID 기반 자동 분류로 정확한 회계 처리를 제공합니다</p>
        </motion.div>

        {/* 실시간 업데이트 표시 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 flex items-center space-x-2 text-sm text-flow-600"
        >
          <div className="w-2 h-2 bg-flow-500 rounded-full animate-pulse"></div>
          <span>실시간 업데이트 중</span>
          <ClockIcon className="h-4 w-4" />
        </motion.div>

        {/* 필터 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4 w-full sm:w-auto">
              <label className="text-sm font-medium text-gray-700">기간:</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="input-field w-full sm:w-32"
              >
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-4 w-full sm:w-auto">
              <label className="text-sm font-medium text-gray-700">부서:</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="input-field w-full sm:w-32"
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* 주요 지표 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-flow-100 rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="h-5 w-5 text-flow-600" />
                </div>
              </div>
              <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">총 지출</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">₩{analyticsData.totalSpent.toLocaleString()}</p>
                <div className="flex items-center space-x-1">
                  <span className="text-xs sm:text-sm text-success-600">+12%</span>
                  <ArrowTrendingUpIcon className="h-3 w-3 text-success-600" />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">총 거래 건수</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{analyticsData.totalTransactions}건</p>
                <div className="flex items-center space-x-1">
                  <span className="text-xs sm:text-sm text-success-600">+8%</span>
                  <ArrowTrendingUpIcon className="h-3 w-3 text-success-600" />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">평균 거래 금액</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">₩{analyticsData.avgTransaction.toLocaleString()}</p>
                <div className="flex items-center space-x-1">
                  <span className="text-xs sm:text-sm text-success-600">+5%</span>
                  <ArrowTrendingUpIcon className="h-3 w-3 text-success-600" />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">자동 분류율</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">98%</p>
                <div className="flex items-center space-x-1">
                  <span className="text-xs sm:text-sm text-success-600">+2%</span>
                  <ArrowTrendingUpIcon className="h-3 w-3 text-success-600" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* 부서별 지출 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">부서별 지출 현황</h2>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {analyticsData.departments.map((dept) => (
                <div key={dept.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{dept.name}</span>
                      {getTrendIcon(dept.trend)}
                    </div>
                    <span className="text-xs sm:text-sm text-gray-600">
                      ₩{dept.spent.toLocaleString()} / ₩{dept.budget.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        dept.percentage > 90 ? 'bg-error-500' : 
                        dept.percentage > 80 ? 'bg-warning-500' : 'bg-success-500'
                      }`}
                      style={{ width: `${dept.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{dept.percentage}% 사용</span>
                    <span>₩{(dept.budget - dept.spent).toLocaleString()} 남음</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 카테고리별 지출 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">카테고리별 지출</h2>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {analyticsData.categories.map((category) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-3 h-3 bg-flow-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm font-medium text-gray-900 truncate">{category.name}</span>
                    {getTrendIcon(category.trend)}
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                    <span className="text-xs sm:text-sm text-gray-600">{category.percentage}%</span>
                    <span className="text-sm font-semibold text-gray-900">₩{category.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* 최근 거래 내역 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 sm:mt-8 card"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">최근 거래 내역</h2>
            <button className="text-flow-600 hover:text-flow-700 text-sm font-medium">
              전체 보기
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가맹점
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    금액
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    부서
                  </th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Flow ID
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    날짜
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="truncate max-w-24 sm:max-w-none">{transaction.merchant}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₩{transaction.amount.toLocaleString()}
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.department}
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-flow-600">
                      {transaction.flowId}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* 월별 트렌드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 sm:mt-8 card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-6">월별 지출 트렌드</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {analyticsData.monthlyData.map((month) => (
              <div key={month.month} className="text-center p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">{month.month}</h4>
                <p className="text-lg font-bold text-gray-900 mb-1">₩{(month.spent / 1000000).toFixed(1)}M</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-gradient-to-r from-flow-500 to-flow-600 h-2 rounded-full"
                    style={{ width: `${(month.spent / month.budget) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600">
                  {Math.round((month.spent / month.budget) * 100)}% 사용
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 회계 자동화 정보 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 sm:mt-8 card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-6">실시간 회계 전표 자동 생성</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">즉시 전표 생성</h4>
              <p className="text-xs sm:text-sm text-gray-600">
                결제 즉시 Flow ID 기반으로 전표가 자동 생성됩니다
              </p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">자동 분류</h4>
              <p className="text-xs sm:text-sm text-gray-600">
                부서와 프로젝트가 자동으로 분류되어 회계 처리가 간소화됩니다
              </p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">국세청 연동</h4>
              <p className="text-xs sm:text-sm text-gray-600">
                국세청, 홈택스 API와 완전 연동하여 세무 처리가 자동화됩니다
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics; 