import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  CreditCardIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PaperClipIcon,
  FingerPrintIcon,
  WalletIcon,
} from '@heroicons/react/24/outline';
import { useFlowPay } from '../store/FlowPayContext';
import { completed, departmentName, inPeriod, myTransactions, needsReceipt, sum } from '../store/selectors';
import { categoryById } from '../data/constants';
import { formatDate, pctChange, periodRange, won } from '../utils/format';
import { fade } from './ui';

const Change: React.FC<{ value: number | null; invert?: boolean }> = ({ value, invert }) => {
  if (value === null) return <span className="text-xs text-gray-400" title="직전 기간 데이터가 없습니다">비교 없음</span>;
  const up = value > 0;
  // 지출 증가는 좋지 않은 신호이므로 invert 옵션으로 색을 뒤집습니다.
  const good = invert ? !up : up;
  return (
    <span className={`text-xs font-medium ${value === 0 ? 'text-gray-400' : good ? 'text-success-600' : 'text-error-600'}`}>
      {up ? '+' : ''}
      {value.toFixed(0)}%
    </span>
  );
};

const Dashboard: React.FC = () => {
  const { state } = useFlowPay();
  const { profile, settings } = state;
  const now = new Date();

  const data = useMemo(() => {
    const { current, previous } = periodRange('month', new Date());
    const mine = completed(myTransactions(state));
    const all = completed(state.transactions);
    const mySpent = sum(inPeriod(mine, current));
    const myPrev = sum(inPeriod(mine, previous));
    const allThisMonth = inPeriod(all, current);
    const allPrevMonth = inPeriod(all, previous);
    const totalBudget = state.departments.reduce((s, d) => s + d.budget, 0);
    const companySpent = sum(allThisMonth);

    const deptAlerts = state.departments
      .map((d) => {
        const spent = sum(allThisMonth.filter((t) => t.departmentId === d.id));
        return { ...d, spent, pct: d.budget ? (spent / d.budget) * 100 : 0 };
      })
      .filter((d) => d.pct >= settings.alertThreshold)
      .sort((a, b) => b.pct - a.pct);

    return {
      mySpent,
      myChange: pctChange(mySpent, myPrev),
      txCount: allThisMonth.length,
      txChange: pctChange(allThisMonth.length, allPrevMonth.length),
      budgetPct: totalBudget ? (companySpent / totalBudget) * 100 : 0,
      pending: state.invoices.filter((i) => i.approvalStatus === 'pending').length,
      missingReceipts: mine.filter(needsReceipt).length,
      recent: myTransactions(state).slice(0, 5),
      deptAlerts,
    };
  }, [state, settings.alertThreshold]);

  const limitPct = Math.min(100, (data.mySpent / profile.monthlyLimit) * 100);

  const stats = [
    { name: '이번 달 내 결제', value: won(data.mySpent), change: <Change value={data.myChange} invert />, icon: CreditCardIcon },
    { name: '전사 처리 거래', value: `${data.txCount}건`, change: <Change value={data.txChange} />, icon: DocumentTextIcon },
    { name: '승인 대기 전표', value: `${data.pending}건`, change: null, icon: ClockIcon, to: '/invoice' },
    { name: '전사 예산 사용', value: `${data.budgetPct.toFixed(0)}%`, change: null, icon: ArrowTrendingUpIcon, to: '/analytics' },
  ];

  const features = [
    { title: '결제하기', description: '1-Click 결제·자동 분류', icon: CreditCardIcon, path: '/payment' },
    { title: '영수증', description: '촬영·자동 인식·거래 매칭', icon: DocumentTextIcon, path: '/receipt' },
    { title: '분석', description: '예산·카테고리·트렌드', icon: ChartBarIcon, path: '/analytics' },
    { title: '전표', description: '승인·국세청 전송', icon: BuildingOfficeIcon, path: '/invoice' },
  ];

  const alerts: { key: string; icon: React.ElementType; tone: string; text: string; to: string; cta: string }[] = [
    ...data.deptAlerts.map((d) => ({
      key: d.id,
      icon: ExclamationTriangleIcon,
      tone: d.pct >= 100 ? 'icon-container-error' : 'icon-container-warning',
      text: `${d.name} 예산 ${d.pct.toFixed(0)}% 사용 (${won(d.spent)} / ${won(d.budget)})`,
      to: '/analytics',
      cta: '분석 보기',
    })),
    ...(data.missingReceipts
      ? [{
          key: 'receipt',
          icon: PaperClipIcon,
          tone: 'icon-container-warning',
          text: `영수증이 첨부되지 않은 내 거래 ${data.missingReceipts}건`,
          to: '/receipt',
          cta: '영수증 첨부',
        }]
      : []),
    ...(!profile.passkey
      ? [{
          key: 'passkey',
          icon: FingerPrintIcon,
          tone: 'icon-container-accent',
          text: '패스키를 등록하면 지문·Face ID로 1-Click 결제할 수 있어요',
          to: '/settings',
          cta: '등록하기',
        }]
      : []),
  ];

  return (
    <div className="px-5 sm:px-8 lg:px-12 py-10 sm:py-16">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <motion.div {...fade} className="mb-10 sm:mb-12">
          <p className="text-sm text-gray-400 mb-1">
            {now.getFullYear()}년 {now.getMonth() + 1}월
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 mb-2">
            안녕하세요, {profile.displayName || '익명 사용자'}님
          </h1>
          <p className="text-gray-500">이번 달 지출 현황과 처리할 일을 확인하세요.</p>
        </motion.div>

        {/* 통계 */}
        <motion.div {...fade} transition={{ delay: 0.05 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {stats.map((stat) => {
            const body = (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="icon-container icon-container-muted">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  {stat.change}
                </div>
                <p className="text-xl sm:text-3xl font-semibold text-gray-900 tracking-tight truncate">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.name}</p>
              </>
            );
            return stat.to ? (
              <Link key={stat.name} to={stat.to} className="card card-hover p-5 sm:p-6 block">
                {body}
              </Link>
            ) : (
              <div key={stat.name} className="card p-5 sm:p-6">
                {body}
              </div>
            );
          })}
        </motion.div>

        {/* 알림 */}
        {alerts.length > 0 && (
          <motion.div {...fade} transition={{ delay: 0.08 }} className="card p-4 sm:p-5 mb-4 sm:mb-6">
            <h2 className="sr-only">처리할 일</h2>
            <ul className="divide-y divide-gray-100">
              {alerts.map((a) => (
                <li key={a.key} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className={`icon-container ${a.tone} w-9 h-9`}>
                    <a.icon className="h-5 w-5" />
                  </div>
                  <p className="flex-1 text-sm text-gray-700 min-w-0">{a.text}</p>
                  <Link to={a.to} className="text-sm text-flow-600 hover:text-flow-700 font-medium whitespace-nowrap">
                    {a.cta}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* 최근 결제 */}
          <motion.div {...fade} transition={{ delay: 0.1 }} className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">내 최근 결제</h2>
              <Link to="/transactions?scope=mine" className="text-sm text-flow-600 hover:text-flow-700 font-medium">
                전체 보기
              </Link>
            </div>
            {data.recent.length === 0 ? (
              <p className="text-sm text-gray-400 py-10 text-center">아직 결제 내역이 없습니다.</p>
            ) : (
              <div className="space-y-1">
                {data.recent.map((t) => (
                  <Link
                    key={t.id}
                    to={`/transactions?id=${t.id}`}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="icon-container icon-container-muted w-10 h-10">
                        <CreditCardIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className={`font-medium truncate ${t.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {t.merchant}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{formatDate(t.date)}</span>
                          <span className="badge badge-primary">{categoryById(t.categoryId).name}</span>
                          {needsReceipt(t) && (
                            <span className="badge badge-warning">영수증 필요</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="font-semibold text-gray-900">{won(t.amount)}</p>
                      <p className="text-xs text-gray-400 font-mono">{t.flowId}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* 내 카드 현황 */}
          <motion.div {...fade} transition={{ delay: 0.15 }} className="card flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">내 Flow ID</h2>
              <span className="badge badge-primary">{departmentName(state, profile.departmentId)}</span>
            </div>

            <div className="card-muted p-5 mb-5">
              <p className="text-xs text-gray-400 mb-1.5">Flow ID · 익명 토큰</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-semibold text-gray-900 tracking-widest">{profile.flowId}</span>
                <WalletIcon className="h-6 w-6 text-gray-300" />
              </div>
            </div>

            <div className="mb-5">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm text-gray-500">이번 달 사용</span>
                <span className="text-sm text-gray-900">
                  <span className="font-semibold">{won(data.mySpent)}</span>
                  <span className="text-gray-400"> / {won(profile.monthlyLimit)}</span>
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${limitPct >= 100 ? 'bg-error-500' : limitPct >= settings.alertThreshold ? 'bg-warning-500' : 'bg-gray-900'}`}
                  style={{ width: `${limitPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                한도까지 {won(Math.max(0, profile.monthlyLimit - data.mySpent))} 남음
              </p>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-auto space-y-3">
              <StatusLine label="1-Click 결제" on={settings.oneClick} onText="사용 중" offText="꺼짐" />
              <StatusLine label="자동 분류" on={settings.autoClassify} onText="켜짐" offText="꺼짐" />
              <StatusLine
                label="패스키"
                on={!!profile.passkey}
                onText={profile.passkey?.simulated ? '등록됨 (데모)' : '등록됨'}
                offText="미등록"
              />
            </div>
          </motion.div>
        </div>

        {/* 기능 링크 */}
        <motion.div {...fade} transition={{ delay: 0.2 }} className="mt-12 sm:mt-16">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 tracking-tight">바로가기</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {features.map((feature) => (
              <Link key={feature.title} to={feature.path} className="card card-hover group flex flex-col">
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

const StatusLine: React.FC<{ label: string; on: boolean; onText: string; offText: string }> = ({ label, on, onText, offText }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="flex items-center gap-1.5 text-sm text-gray-900">
      <span className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-success-500' : 'bg-gray-300'}`} /> {on ? onText : offText}
    </span>
  </div>
);

export default Dashboard;
