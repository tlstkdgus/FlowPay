import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  CreditCardIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PaperClipIcon,
  FingerPrintIcon,
  BanknotesIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';
import { useFlowPay } from '../store/FlowPayContext';
import { completed, departmentName, inPeriod, myTransactions, needsReceipt, sum } from '../store/selectors';
import { categoryById } from '../data/constants';
import { formatDate, pctChange, periodRange, won } from '../utils/format';
import { fade, Highlight, StatCard, ChangeCaption } from './ui';
import { LogoMark } from './Logo';
import { hasServerPasskey } from '../utils/passkey';

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
  const limitTone = limitPct >= 100 ? 'bg-error-400' : limitPct >= settings.alertThreshold ? 'bg-warning-400' : 'bg-flow-500';

  const features = [
    { title: '결제하기', description: 'FlowID 1-Click 결제', icon: CreditCardIcon, path: '/payment' },
    { title: '영수증', description: 'AI 영수증 수집·거래 매칭', icon: DocumentTextIcon, path: '/receipt' },
    { title: '분석', description: '실시간 예산·지출 현황', icon: ChartBarIcon, path: '/analytics' },
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
    ...(!hasServerPasskey(profile.passkey)
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
    <div className="px-5 sm:px-8 lg:px-12 py-10 sm:py-14">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 — 발표자료 제목 패턴 */}
        <motion.div {...fade} className="mb-8">
          <p className="page-eyebrow">
            {now.getFullYear()}년 {now.getMonth() + 1}월 · {departmentName(state, profile.departmentId)}
          </p>
          <h1 className="page-title">안녕하세요, {profile.displayName || '익명 사용자'}님</h1>
          <p className="page-desc">
            모든 결제 데이터는 <Highlight>실시간 대시보드에 반영</Highlight>됩니다.
          </p>
        </motion.div>

        {/* KPI — 발표자료 대시보드 상단 카드 */}
        <motion.div {...fade} transition={{ delay: 0.05 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <StatCard
            label="이번 달 내 결제"
            icon={BanknotesIcon}
            tone="mint"
            value={won(data.mySpent)}
            caption={<ChangeCaption value={data.myChange} invert />}
          />
          <StatCard
            label="전사 처리 거래"
            icon={CreditCardIcon}
            tone="sky"
            value={`${data.txCount} 건`}
            caption={<ChangeCaption value={data.txChange} />}
          />
          <StatCard
            label="승인 대기 전표"
            icon={ClockIcon}
            tone="rose"
            value={`${data.pending} 건`}
            caption={data.pending ? '전표 화면에서 승인하기' : '모두 처리됨'}
            to="/invoice"
          />
          <StatCard
            label="전사 예산 소진율"
            icon={ChartPieIcon}
            tone="gray"
            value={`${data.budgetPct.toFixed(0)}%`}
            caption={<span className={data.budgetPct >= 100 ? 'text-error-500' : ''}>부서별 현황 보기</span>}
            to="/analytics"
          />
        </motion.div>

        {/* 처리할 일 */}
        {alerts.length > 0 && (
          <motion.div {...fade} transition={{ delay: 0.08 }} className="card p-4 sm:p-5 mb-4 sm:mb-6">
            <h2 className="sr-only">처리할 일</h2>
            <ul className="divide-y divide-gray-100">
              {alerts.map((a) => (
                <li key={a.key} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className={`icon-container ${a.tone} w-9 h-9 rounded-xl`}>
                    <a.icon className="h-5 w-5" />
                  </div>
                  <p className="flex-1 text-sm text-gray-700 min-w-0">{a.text}</p>
                  <Link
                    to={a.to}
                    className="inline-flex items-center gap-0.5 text-sm text-gray-500 hover:text-gray-900 font-medium whitespace-nowrap"
                  >
                    {a.cta} <ChevronRightIcon className="h-4 w-4 text-flow-500" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          {/* 내 최근 결제 */}
          <motion.div {...fade} transition={{ delay: 0.1 }} className="card lg:col-span-3">
            <div className="flex items-center justify-between mb-5">
              <h2 className="card-title">내 최근 결제</h2>
              <Link
                to="/transactions?scope=mine"
                className="inline-flex items-center gap-0.5 text-sm text-gray-500 hover:text-gray-900 font-medium"
              >
                전체 결제 내역 <ChevronRightIcon className="h-4 w-4 text-flow-500" />
              </Link>
            </div>
            {data.recent.length === 0 ? (
              <p className="text-sm text-gray-400 py-10 text-center">아직 결제 내역이 없습니다.</p>
            ) : (
              <div>
                {data.recent.map((t) => (
                  <Link
                    key={t.id}
                    to={`/transactions?id=${t.id}`}
                    className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="icon-container icon-container-accent w-10 h-10 rounded-xl">
                        <CreditCardIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className={`font-semibold truncate ${t.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {t.merchant}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400 tabular-nums">{formatDate(t.date)}</span>
                          <span className="badge badge-primary">{categoryById(t.categoryId).name}</span>
                          {needsReceipt(t) && <span className="badge badge-warning">영수증 필요</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="font-bold text-gray-900 tabular-nums">{won(t.amount)}</p>
                      <p className="text-xs text-gray-400 tracking-wide">{t.flowId}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* 내 Flow ID */}
          <motion.div {...fade} transition={{ delay: 0.15 }} className="card lg:col-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h2 className="card-title">내 Flow ID</h2>
              <span className="badge badge-accent">{departmentName(state, profile.departmentId)}</span>
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
              <p className="relative text-xs text-white/80 mb-1">Flow ID · 익명 토큰</p>
              <p className="relative text-2xl font-bold tracking-[0.2em]">{profile.flowId}</p>
            </div>

            <div className="mb-5">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm text-gray-500">이번 달 사용</span>
                <span className="text-sm text-gray-900 tabular-nums">
                  <span className="font-bold">{won(data.mySpent)}</span>
                  <span className="text-gray-400"> / {won(profile.monthlyLimit)}</span>
                </span>
              </div>
              <div className="progress-bar h-2.5">
                <div className={`h-full rounded-full transition-all duration-500 ${limitTone}`} style={{ width: `${limitPct}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                한도까지 <span className="font-semibold text-flow-700">{won(Math.max(0, profile.monthlyLimit - data.mySpent))}</span> 남음
              </p>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-auto space-y-3">
              <StatusLine label="1-Click 결제" on={settings.oneClick} onText="사용 중" offText="꺼짐" />
              <StatusLine label="계정과목 자동 분류" on={settings.autoClassify} onText="켜짐" offText="꺼짐" />
              <StatusLine label="패스키" on={hasServerPasskey(profile.passkey)} onText="서버 검증 등록됨" offText="미등록" />
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

const StatusLine: React.FC<{ label: string; on: boolean; onText: string; offText: string }> = ({ label, on, onText, offText }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-500">{label}</span>
    <span className={`flex items-center gap-1.5 text-sm font-semibold ${on ? 'text-flow-700' : 'text-gray-400'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-flow-500' : 'bg-gray-300'}`} /> {on ? onText : offText}
    </span>
  </div>
);

export default Dashboard;
