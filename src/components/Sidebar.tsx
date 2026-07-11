import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid,
  CreditCardIcon as CreditCardSolid,
  DocumentTextIcon as DocumentTextSolid,
  ChartBarIcon as ChartBarSolid,
  BuildingOfficeIcon as BuildingOfficeSolid,
} from '@heroicons/react/24/solid';
import Logo from './Logo';

const menuItems = [
  { name: '대시보드', icon: HomeIcon, activeIcon: HomeSolid, path: '/', description: '개요' },
  { name: '결제하기', icon: CreditCardIcon, activeIcon: CreditCardSolid, path: '/payment', description: 'FlowPay 결제' },
  { name: '영수증', icon: DocumentTextIcon, activeIcon: DocumentTextSolid, path: '/receipt', description: 'AI OCR 처리' },
  { name: '분석', icon: ChartBarIcon, activeIcon: ChartBarSolid, path: '/analytics', description: '실시간 분석' },
  { name: '전표', icon: BuildingOfficeIcon, activeIcon: BuildingOfficeSolid, path: '/invoice', description: '자동 전표' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();

  const user = {
    name: '김대리',
    department: '관리부',
    flowId: 'XK8P2M',
  };

  return (
    <>
      {/* ===== 데스크톱 사이드바 (고정) ===== */}
      <aside className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200/70 z-40">
        <div className="px-6 pt-7 pb-6">
          <Logo size="md" showText={true} />
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = isActive ? item.activeIcon : item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors duration-150 ${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight truncate">{item.name}</p>
                  <p className="text-xs text-gray-400 leading-tight truncate">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* 사용자 정보 */}
        <div className="p-3">
          <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-gray-50">
            <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {user.department} · <span className="font-mono text-flow-600">{user.flowId}</span>
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== 모바일 하단 탭바 ===== */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/85 backdrop-blur-xl border-t border-gray-200/70">
        <div className="grid grid-cols-5 max-w-md mx-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = isActive ? item.activeIcon : item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center gap-1 py-2.5 transition-colors ${
                  isActive ? 'text-flow-600' : 'text-gray-400'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-[10px] font-medium">{item.name}</span>
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
