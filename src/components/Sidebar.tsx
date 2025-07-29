import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  CreditCardIcon,
  UserIcon,
  SparklesIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import Logo from './Logo';

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const menuItems = [
    { name: '대시보드', icon: HomeIcon, path: '/', description: 'FlowPay 개요' },
    { name: '결제하기', icon: CreditCardIcon, path: '/payment', description: 'FlowPay 결제' },
    { name: '영수증 업로드', icon: DocumentTextIcon, path: '/receipt', description: 'AI OCR 처리' },
    { name: '분석', icon: ChartBarIcon, path: '/analytics', description: '실시간 분석' },
    { name: '전표 생성', icon: BuildingOfficeIcon, path: '/invoice', description: '자동 전표 생성' },
  ];

  const user = {
    name: '김대리',
    department: '관리부',
    flowId: 'XK8P2M'
  };

  return (
    <motion.div
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      className={`bg-white shadow-soft border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } lg:block hidden`}
    >
      <div className="p-4">
        {/* 로고 */}
        <div className="mb-8">
          {isCollapsed ? (
            <div className="flex justify-center">
              <Logo size="sm" showText={false} />
            </div>
          ) : (
            <Logo size="md" showText={true} />
          )}
        </div>

        {/* 사용자 정보 */}
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-gradient-to-r from-flow-50 to-flow-100 rounded-xl border border-flow-200"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-flow-500 to-flow-600 rounded-full flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-600">{user.department}</p>
                <p className="text-xs text-flow-600 font-mono">{user.flowId}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 메뉴 */}
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-flow-500 to-flow-600 text-white shadow-flow-glow'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-xs opacity-75 truncate">{item.description}</p>
                  </motion.div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* 접기 버튼 */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute bottom-4 left-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200"
        >
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
              isCollapsed ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar; 