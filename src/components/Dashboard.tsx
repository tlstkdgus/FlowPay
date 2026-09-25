import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  CreditCardIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ChevronRightIcon,
  BanknotesIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { LogoMark } from './Logo';
import { PageHeader, Highlight, StatCard } from './ui';

const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const Dashboard: React.FC = () => {
  const budgetUsed = 2450000;
  const budgetLimit = 3000000;
  const budgetPct = Math.round((budgetUsed / budgetLimit) * 100);

  const recentPayments = [
    { id: 1, merchant: '스타벅스 강남점', amount: 4500, date: '2024-01-15', flowId: 'XK8P2M', category: '식비' },
    { id: 2, merchant: 'GS25 본사점', amount: 12000, date: '2024-01-15', flowId: 'XK8P2M', category: '업무용품' },
    { id: 3, merchant: '맥도날드', amount: 8500, date: '2024-01-14', flowId: 'XK8P2M', category: '식비' },
    { id: 4, merchant: '올리브영', amount: 32000, date: '2024-01-14', flowId: 'XK8P2M', category: '업무용품' },
  ];

  const features = [
    { title: '결제하기', description: 'FlowID 1-Click 결제', icon: CreditCardIcon, path: '/payment' },
    { title: '영수증', description: 'AI 영수증 수집·인식', icon: DocumentTextIcon, path: '/receipt' },
    { title: '분석', description: '실시간 예산·지출 현황', icon: ChartBarIcon, path: '/analytics' },
    { title: '전표', description: '자동 전표·승인 관리', icon: BuildingOfficeIcon, path: '/invoice' },
  ];

  return (
    <div className="px-5 sm:px-8 lg:px-12 py-10 sm:py-14">
      <div className="max-w-6xl mx-auto">
        <motion.div {...fade}>
          <PageHeader
            eyebrow="2024년 1월 · 관리부"
            title="안녕하세요, 김대리님"
            description={
              <>
                모든 결제 데이터는 <Highlight>실시간 대시보드에 반영</Highlight>됩니다.
              </>
            }
          />
        </motion.div>

        {/* KPI — 발표자료 대시보드 상단 카드 */}
        <motion.div
          {...fade}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6"
        >
          <StatCard
            label="총 지출 및 예산 소진율"
            icon={BanknotesIcon}
            tone="mint"
            value={`${budgetUsed.toLocaleString()} 원`}
            caption={`예산 ${budgetLimit.toLocaleString()} 원 중 ${budgetPct}% 소진`}
          />
          <StatCard label="처리된 거래" icon={CreditCardIcon} tone="sky" value="156 건" caption="지난달 대비 8% 증가" />
          <StatCard label="부서별 분류" icon={UserGroupIcon} tone="rose" value="8개 부서" caption="Flow ID 100% 매칭" />
          <StatCard label="계정 과목 자동 분류율" icon={CheckBadgeIcon} tone="gray" value="98.8%" caption="영수증 확인 필요 1.2%" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          {/* 최근 결제 */}
          <motion.div {...fade} transition={{ delay: 0.1 }} className="card lg:col-span-3">
            <div className="flex items-center justify-between mb-5">
              <h2 className="card-title">최근 결제 내역</h2>
              <Link
                to="/analytics"
                className="inline-flex items-center gap-0.5 text-sm text-gray-500 hover:text-gray-900 font-medium"
              >
                전체 결제 내역 <ChevronRightIcon className="h-4 w-4 text-flow-500" />
              </Link>
            </div>
            <div>
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="icon-container icon-container-accent w-10 h-10 rounded-xl">
                      <CreditCardIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{payment.merchant}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 tabular-nums">{payment.date}</span>
                        <span className="badge badge-primary">{payment.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="font-bold text-gray-900 tabular-nums">{payment.amount.toLocaleString()} 원</p>
                    <p className="text-xs text-gray-400 tracking-wide">{payment.flowId}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 내 카드 */}
          <motion.div {...fade} transition={{ delay: 0.15 }} className="card lg:col-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h2 className="card-title">내 카드</h2>
              <span className="badge badge-accent">관리부</span>
            </div>

            {/* 무기명 법인카드 + Flow ID — 로고 그라디언트(블루→민트) */}
            <div className="relative overflow-hidden rounded-2xl p-5 mb-6 text-white bg-gradient-to-br from-sky-400 via-[#3cc9d6] to-flow-400 shadow-mint">
              <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-white/10" />
              <div className="absolute -right-2 bottom-[-3.5rem] w-32 h-32 rounded-full bg-white/10" />
              <div className="relative flex items-center justify-between mb-8">
                <span className="text-sm font-semibold text-white/90">무기명 법인카드</span>
                <div className="w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center">
                  <LogoMark className="w-6 h-6" />
                </div>
              </div>
              <p className="relative text-xs text-white/80 mb-1">Flow ID</p>
              <p className="relative text-2xl font-bold tracking-[0.2em]">XK8P2M</p>
            </div>

            <div className="mb-5">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm text-gray-500">이번 달 사용</span>
                <span className="text-sm text-gray-900 tabular-nums">
                  <span className="font-bold">{budgetUsed.toLocaleString()}</span>
                  <span className="text-gray-400"> / {budgetLimit.toLocaleString()} 원</span>
                </span>
              </div>
              <div className="progress-bar h-2.5">
                <div className="progress-fill" style={{ width: `${budgetPct}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                남은 예산 <span className="font-semibold text-flow-700">{(budgetLimit - budgetUsed).toLocaleString()} 원</span>
              </p>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-auto space-y-3">
              <StatusRow label="1-Click 결제" value="사용 중" />
              <StatusRow label="계정 과목 자동 분류" value="켜짐" />
            </div>
          </motion.div>
        </div>

        {/* 바로가기 */}
        <motion.div {...fade} transition={{ delay: 0.2 }} className="mt-12 sm:mt-14">
          <h2 className="text-xl font-bold text-gray-900 mb-5 tracking-tight">바로가기</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {features.map((feature) => (
              <Link key={feature.title} to={feature.path} className="card card-hover group flex flex-col p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="icon-container icon-container-accent group-hover:bg-flow-500 group-hover:text-white">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-gray-300 group-hover:text-flow-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const StatusRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="flex items-center gap-1.5 text-sm font-semibold text-flow-700">
      <span className="w-1.5 h-1.5 rounded-full bg-flow-500" /> {value}
    </span>
  </div>
);

export default Dashboard;
