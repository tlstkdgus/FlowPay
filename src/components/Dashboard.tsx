import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  CreditCardIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  SparklesIcon,
  RocketLaunchIcon,
  BuildingOfficeIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const stats = [
    { 
      name: '이번 달 결제', 
      value: '₩2,450,000', 
      change: '+12%', 
      icon: CreditCardIcon,
      gradient: 'from-flow-500 to-flow-600',
      bgGradient: 'from-flow-50 to-flow-100'
    },
    { 
      name: '처리된 거래', 
      value: '156건', 
      change: '+8%', 
      icon: DocumentTextIcon,
      gradient: 'from-success-500 to-success-600',
      bgGradient: 'from-success-50 to-success-100'
    },
    { 
      name: '부서별 분류', 
      value: '8개 부서', 
      change: '100%', 
      icon: UserGroupIcon,
      gradient: 'from-warning-500 to-warning-600',
      bgGradient: 'from-warning-50 to-warning-100'
    },
    { 
      name: '예산 대비', 
      value: '78%', 
      change: '+5%', 
      icon: ArrowTrendingUpIcon,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100'
    },
  ];

  const recentPayments = [
    { id: 1, merchant: '스타벅스 강남점', amount: 4500, date: '2024-01-15', flowId: 'XK8P2M', category: '식비' },
    { id: 2, merchant: 'GS25 본사점', amount: 12000, date: '2024-01-15', flowId: 'XK8P2M', category: '업무용품' },
    { id: 3, merchant: '맥도날드', amount: 8500, date: '2024-01-14', flowId: 'XK8P2M', category: '식비' },
    { id: 4, merchant: '올리브영', amount: 32000, date: '2024-01-14', flowId: 'XK8P2M', category: '업무용품' },
  ];

  const features = [
    {
      title: '결제하기',
      description: 'FlowPay와 일반 결제 방식 모두 지원',
      icon: CreditCardIcon,
      path: '/payment',
      color: 'flow'
    },
    {
      title: '영수증 업로드',
      description: 'AI OCR로 영수증 자동 인식 및 분류',
      icon: DocumentTextIcon,
      path: '/receipt',
      color: 'success'
    },
    {
      title: '실시간 분석',
      description: '부서별 지출 현황과 트렌드 분석',
      icon: ChartBarIcon,
      path: '/analytics',
      color: 'warning'
    },
    {
      title: '전표 생성',
      description: '자동 전표 생성 및 승인 워크플로우',
      icon: BuildingOfficeIcon,
      path: '/invoice',
      color: 'purple'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'flow':
        return 'from-flow-500 to-flow-600 bg-flow-50 border-flow-200';
      case 'success':
        return 'from-success-500 to-success-600 bg-success-50 border-success-200';
      case 'warning':
        return 'from-warning-500 to-warning-600 bg-warning-50 border-warning-200';
      case 'purple':
        return 'from-purple-500 to-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'from-flow-500 to-flow-600 bg-flow-50 border-flow-200';
    }
  };

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="icon-container icon-container-primary animate-flow-float">
              <SparklesIcon className="h-6 w-6" />
            </div>
            <span className="badge badge-primary">NEW</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-gradient mb-4">
            FlowPay 대시보드
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            무기명 법인카드의 혁신적인 결제 관리 시스템으로 
            <span className="text-gradient font-semibold"> 완전 자동화된 회계 처리</span>를 경험하세요
          </p>
        </motion.div>

        {/* 통계 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 sm:mb-12"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`card-gradient bg-gradient-to-br ${stat.bgGradient} border-0`}
            >
              <div className="flex items-center">
                <div className={`icon-container bg-gradient-to-br ${stat.gradient} shadow-glow`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 truncate">{stat.name}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-success-600 font-semibold">{stat.change}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 최근 결제 내역 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.01 }}
            className="card-glass"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="icon-container icon-container-primary">
                  <CreditCardIcon className="h-6 w-6" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">최근 결제 내역</h2>
              </div>
            </div>
            
            <div className="space-y-4">
              {recentPayments.map((payment, index) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-medium transition-all duration-300"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="icon-container bg-gradient-to-br from-flow-500 to-flow-600">
                      <CreditCardIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate">{payment.merchant}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">{payment.date}</span>
                        <span className="badge badge-primary text-xs">{payment.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="font-bold text-gray-900 text-lg">₩{payment.amount.toLocaleString()}</p>
                    <p className="text-xs text-flow-600 font-mono">{payment.flowId}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Flow ID 시스템 정보 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.01 }}
            className="card-glass"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="icon-container icon-container-success">
                <RocketLaunchIcon className="h-6 w-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Flow ID 시스템</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="icon-container icon-container-success">
                  <UserGroupIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">익명성 보장</h3>
                  <p className="text-gray-600 leading-relaxed">
                    개인정보 없이 랜덤 토큰으로 사용자를 식별하여 
                    <span className="font-semibold text-success-600"> 개인정보보호법을 완벽히 준수</span>합니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="icon-container icon-container-primary">
                  <CreditCardIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">1-Click 결제</h3>
                  <p className="text-gray-600 leading-relaxed">
                    FIDO2 패스키를 통해 지문이나 Face ID로 
                    <span className="font-semibold text-flow-600"> 즉시 결제가 가능</span>합니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="icon-container icon-container-warning">
                  <ChartBarIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">자동 분류</h3>
                  <p className="text-gray-600 leading-relaxed">
                    결제 시 자동으로 부서와 프로젝트가 분류되어 
                    <span className="font-semibold text-warning-600"> 회계 처리가 자동화</span>됩니다.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 기능 링크 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 sm:mt-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">모든 기능 체험하기</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <Link
                  to={feature.path}
                  className={`block p-6 rounded-2xl border transition-all duration-300 hover:shadow-large ${getColorClasses(feature.color)}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`icon-container bg-gradient-to-br ${getColorClasses(feature.color).split(' ')[0]} ${getColorClasses(feature.color).split(' ')[1]}`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard; 