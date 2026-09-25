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
  { name: '결제하기', icon: CreditCardIcon, activeIcon: CreditCardSolid, path: '/payment', description: 'FlowID 1-Click' },
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
      <aside className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200/80 z-40">
        <div className="px-6 pt-7 pb-8">
          <Logo size="md" showText={true} />
        </div>

        <p className="px-6 mb-2 text-xs font-medium text-gray-400">메뉴</p>
        <nav className="flex-1 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = isActive ? item.activeIcon : item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors duration-150 ${
                  isActive
                    ? 'bg-flow-50 text-gray-900'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {/* 발표자료 부서 목록의 왼쪽 세로 바 */}
                {isActive && <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-flow-500" />}
                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-flow-600' : ''}`} />
                <div className="min-w-0">
                  <p className={`text-sm leading-tight truncate ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</p>
                  <p className="text-xs text-gray-400 leading-tight truncate mt-0.5">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* 사용자 정보 */}
        <div className="p-3">
          <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-gray-50">
            <div className="w-9 h-9 rounded-full bg-gradient-to-b from-sky-400 to-flow-400 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {user.department} · <span className="font-semibold text-flow-700">{user.flowId}</span>
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== 모바일 하단 탭바 ===== */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-xl border-t border-gray-200/80">
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
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
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
