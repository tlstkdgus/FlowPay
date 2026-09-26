import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  QueueListIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid,
  CreditCardIcon as CreditCardSolid,
  DocumentTextIcon as DocumentTextSolid,
  ChartBarIcon as ChartBarSolid,
  BuildingOfficeIcon as BuildingOfficeSolid,
  QueueListIcon as QueueListSolid,
  Cog6ToothIcon as Cog6ToothSolid,
} from '@heroicons/react/24/solid';
import Logo from './Logo';
import { useFlowPay } from '../store/FlowPayContext';
import { departmentName } from '../store/selectors';

const menuItems = [
  { name: '대시보드', short: '홈', icon: HomeIcon, activeIcon: HomeSolid, path: '/', description: '개요', mobile: true },
  { name: '결제하기', short: '결제', icon: CreditCardIcon, activeIcon: CreditCardSolid, path: '/payment', description: 'FlowID 1-Click', mobile: true },
  { name: '영수증', short: '영수증', icon: DocumentTextIcon, activeIcon: DocumentTextSolid, path: '/receipt', description: 'AI OCR 처리', mobile: true },
  { name: '거래 내역', short: '거래', icon: QueueListIcon, activeIcon: QueueListSolid, path: '/transactions', description: '검색·내보내기', mobile: false },
  { name: '분석', short: '분석', icon: ChartBarIcon, activeIcon: ChartBarSolid, path: '/analytics', description: '실시간 분석', mobile: true },
  { name: '전표', short: '전표', icon: BuildingOfficeIcon, activeIcon: BuildingOfficeSolid, path: '/invoice', description: '승인·세무 처리', mobile: true },
  { name: '설정', short: '설정', icon: Cog6ToothIcon, activeIcon: Cog6ToothSolid, path: '/settings', description: 'Flow ID·예산', mobile: true },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { state } = useFlowPay();
  const { profile } = state;
  const pendingCount = state.invoices.filter((i) => i.approvalStatus === 'pending').length;

  return (
    <>
      {/* ===== 데스크톱 사이드바 (고정) ===== */}
      <aside className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200/80 z-40 print:hidden">
        <div className="px-6 pt-7 pb-8">
          <Logo size="md" showText={true} />
        </div>

        <p className="px-6 mb-2 text-xs font-medium text-gray-400">메뉴</p>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = isActive ? item.activeIcon : item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors duration-150 ${
                  isActive ? 'bg-flow-50 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {/* 발표자료 부서 목록의 왼쪽 세로 바 */}
                {isActive && <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-flow-500" />}
                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-flow-600' : ''}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm leading-tight truncate ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</p>
                  <p className="text-xs text-gray-400 leading-tight truncate mt-0.5">{item.description}</p>
                </div>
                {item.path === '/invoice' && pendingCount > 0 && (
                  <span className="badge badge-warning" aria-label={`승인 대기 ${pendingCount}건`}>
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* 사용자 정보 */}
        <div className="p-3">
          <Link to="/settings" className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="w-9 h-9 rounded-full bg-gradient-to-b from-sky-400 to-flow-400 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
              {profile.displayName.charAt(0) || 'F'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{profile.displayName || '익명 사용자'}</p>
              <p className="text-xs text-gray-500 truncate">
                {departmentName(state, profile.departmentId)} · <span className="font-semibold text-flow-700">{profile.flowId}</span>
              </p>
            </div>
          </Link>
        </div>
      </aside>

      {/* ===== 모바일 하단 탭바 ===== */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-xl border-t border-gray-200/80 print:hidden">
        <div className="grid grid-cols-6 max-w-lg mx-auto">
          {menuItems
            .filter((item) => item.mobile)
            .map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = isActive ? item.activeIcon : item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`relative flex flex-col items-center gap-1 py-2.5 transition-colors ${
                    isActive ? 'text-flow-600' : 'text-gray-400'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.short}</span>
                  {item.path === '/invoice' && pendingCount > 0 && (
                    <span className="absolute top-1.5 left-1/2 ml-2 w-2 h-2 rounded-full bg-warning-500" />
                  )}
                </Link>
              );
            })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  );
};

export default Sidebar;
