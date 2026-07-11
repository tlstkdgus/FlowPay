import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  CreditCardIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const Dashboard: React.FC = () => {
  const stats = [
    { name: '이번 달 결제', value: '₩2,450,000', change: '+12%', icon: CreditCardIcon },
    { name: '처리된 거래', value: '156건', change: '+8%', icon: DocumentTextIcon },
    { name: '부서별 분류', value: '8개 부서', change: '100%', icon: UserGroupIcon },
    { name: '예산 대비', value: '78%', change: '+5%', icon: ArrowTrendingUpIcon },
  ];

  const recentPayments = [
    { id: 1, merchant: '스타벅스 강남점', amount: 4500, date: '2024-01-15', flowId: 'XK8P2M', category: '식비' },
    { id: 2, merchant: 'GS25 본사점', amount: 12000, date: '2024-01-15', flowId: 'XK8P2M', category: '업무용품' },
    { id: 3, merchant: '맥도날드', amount: 8500, date: '2024-01-14', flowId: 'XK8P2M', category: '식비' },
    { id: 4, merchant: '올리브영', amount: 32000, date: '2024-01-14', flowId: 'XK8P2M', category: '업무용품' },
  ];

  const features = [
    { title: '결제하기', description: '카드·간편결제', icon: CreditCardIcon, path: '/payment' },
    { title: '영수증', description: '촬영·자동 인식', icon: DocumentTextIcon, path: '/receipt' },
    { title: '분석', description: '지출 현황·트렌드', icon: ChartBarIcon, path: '/analytics' },
    { title: '전표', description: '생성·승인 관리', icon: BuildingOfficeIcon, path: '/invoice' },
  ];

  const budgetUsed = 2450000;
  const budgetLimit = 3000000;
  const budgetPct = Math.round((budgetUsed / budgetLimit) * 100);

  return (
    <div className="px-5 sm:px-8 lg:px-12 py-10 sm:py-16">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <motion.div {...fade} className="mb-10 sm:mb-12">
          <p className="text-sm text-gray-400 mb-1">2024년 1월</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 mb-2">
            안녕하세요, 김대리님
          </h1>
          <p className="text-gray-500">이번 달 지출 현황과 최근 활동을 확인하세요.</p>
        </motion.div>

        {/* 통계 */}
        <motion.div
          {...fade}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6"
        >
          {stats.map((stat) => (
            <div key={stat.name} className="card card-hover p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="icon-container icon-container-muted">
                  <stat.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-success-600">{stat.change}</span>
              </div>
              <p className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.name}</p>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* 최근 결제 */}
          <motion.div {...fade} transition={{ delay: 0.1 }} className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">최근 결제 내역</h2>
              <Link to="/analytics" className="text-sm text-flow-600 hover:text-flow-700 font-medium">
                전체 보기
              </Link>
            </div>
            <div className="space-y-1">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="icon-container icon-container-muted w-10 h-10">
                      <CreditCardIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{payment.merchant}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{payment.date}</span>
                        <span className="badge badge-primary">{payment.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="font-semibold text-gray-900">₩{payment.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 font-mono">{payment.flowId}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 내 카드 현황 */}
          <motion.div {...fade} transition={{ delay: 0.15 }} className="card flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">내 카드</h2>
              <span className="badge badge-primary">관리부</span>
            </div>

            {/* Flow ID */}
            <div className="card-muted p-5 mb-5">
              <p className="text-xs text-gray-400 mb-1.5">Flow ID</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-semibold text-gray-900 tracking-widest">XK8P2M</span>
                <CreditCardIcon className="h-6 w-6 text-gray-300" />
              </div>
            </div>

            {/* 이번 달 사용 */}
            <div className="mb-5">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm text-gray-500">이번 달 사용</span>
                <span className="text-sm text-gray-900">
                  <span className="font-semibold">₩{budgetUsed.toLocaleString()}</span>
                  <span className="text-gray-400"> / ₩{budgetLimit.toLocaleString()}</span>
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${budgetPct}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                한도까지 ₩{(budgetLimit - budgetUsed).toLocaleString()} 남음
              </p>
            </div>

            {/* 상태 */}
            <div className="border-t border-gray-100 pt-4 mt-auto space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">1-Click 결제</span>
                <span className="flex items-center gap-1.5 text-sm text-gray-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-success-500" /> 사용 중
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">자동 분류</span>
                <span className="flex items-center gap-1.5 text-sm text-gray-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-success-500" /> 켜짐
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 기능 링크 */}
        <motion.div {...fade} transition={{ delay: 0.2 }} className="mt-12 sm:mt-16">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 tracking-tight">바로가기</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {features.map((feature) => (
              <Link
                key={feature.title}
                to={feature.path}
                className="card card-hover group flex flex-col"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="icon-container icon-container-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-gray-300 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
