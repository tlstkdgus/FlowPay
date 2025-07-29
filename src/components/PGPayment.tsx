import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCardIcon, 
  CheckCircleIcon,
  XMarkIcon,
  SparklesIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
  FingerPrintIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Logo from './Logo';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'bank' | 'mobile' | 'virtual' | 'simple';
  icon: string;
  description: string;
  benefit?: string;
  isFlowPay?: boolean;
}

interface Product {
  name: string;
  capacity: string;
  quantity: number;
  price: number;
}

const PGPayment: React.FC = () => {
  const [step, setStep] = useState<'product' | 'payment' | 'processing' | 'workflow' | 'success' | 'error'>('product');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [activeTab, setActiveTab] = useState('card');
  const [flowId, setFlowId] = useState('');
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState(0);

  useEffect(() => {
    const storedFlowId = localStorage.getItem('flowId');
    if (storedFlowId) {
      setFlowId(storedFlowId);
    }
  }, []);

  const product: Product = {
    name: 'A4용지',
    capacity: '500매',
    quantity: 1,
    price: 45000
  };

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      name: '신용·체크카드',
      type: 'card',
      icon: '💳',
      description: 'VISA, MasterCard, 국내카드'
    },
    {
      id: 'virtual',
      name: '가상계좌',
      type: 'virtual',
      icon: '🏦',
      description: '실시간 가상계좌'
    },
    {
      id: 'bank',
      name: '계좌이체',
      type: 'bank',
      icon: '🏦',
      description: '실시간 계좌이체'
    },
    {
      id: 'mobile',
      name: '휴대폰',
      type: 'mobile',
      icon: '📱',
      description: '휴대폰 소액결제'
    }
  ];

  const simplePayments: PaymentMethod[] = [
    {
      id: 'flowpay',
      name: 'FlowPay',
      type: 'simple',
      icon: '🔄',
      description: 'Flow ID 기반 결제',
      benefit: '1-Click 결제, 자동 분류',
      isFlowPay: true
    },
    {
      id: 'naver',
      name: 'N Pay',
      type: 'simple',
      icon: '🟢',
      description: '네이버페이',
      benefit: '5만원 이상 결제시 2천원 할인'
    },
    {
      id: 'kakao',
      name: 'pay',
      type: 'simple',
      icon: '🟡',
      description: '카카오페이',
      benefit: '1천원 캐시백'
    },
    {
      id: 'toss',
      name: 'toss pay',
      type: 'simple',
      icon: '🔵',
      description: '토스페이',
      benefit: '첫 결제 3천원 캐시백'
    }
  ];

  const handlePayment = async () => {
    if (selectedPaymentMethod === 'flowpay') {
      // FlowPay 결제 시 워크플로우 실행
      setStep('workflow');
      setCurrentWorkflowStep(0);
      
      // 각 단계를 순차적으로 실행
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          setCurrentWorkflowStep(i);
          if (i === 5) {
            setTimeout(() => {
              setStep('success');
            }, 3000);
          }
        }, i * 3000);
      }
    } else {
      // 일반 결제
      setStep('processing');
      setTimeout(() => {
        setStep('success');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo size="sm" showText={true} />
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-flow-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">안전한 결제</span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'product' && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="p-6"
            >
              {/* 상품 정보 */}
              <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900 mb-4">상품 정보</h1>
                <div className="bg-gradient-to-br from-flow-50 to-flow-100 rounded-xl p-4 border border-flow-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h2 className="font-semibold text-gray-900">{product.name}</h2>
                      <p className="text-sm text-gray-600">{product.capacity}</p>
                      <p className="text-sm text-gray-600">수량 {product.quantity}개</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">₩{product.price.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <motion.button
                onClick={() => setStep('payment')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full btn-primary text-lg py-4"
              >
                ₩{product.price.toLocaleString()} 결제하기
              </motion.button>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="p-6"
            >
              {/* 뒤로가기 버튼 */}
              <button
                onClick={() => setStep('product')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span className="text-sm">상품 정보로</span>
              </button>

              {/* 상단 상품 요약 */}
              <div className="bg-gradient-to-br from-flow-50 to-flow-100 rounded-xl p-4 mb-6 border border-flow-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-semibold text-gray-900">{product.name}</h2>
                    <p className="text-sm text-gray-600">{product.capacity} × {product.quantity}개</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">₩{product.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* 결제 방법 탭 */}
              <div className="mb-6">
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setActiveTab(method.id)}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        activeTab === method.id
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {method.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 간편 결제 */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">간편 결제</h3>
                <div className="grid grid-cols-2 gap-3">
                  {simplePayments.map((payment) => (
                    <motion.button
                      key={payment.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedPaymentMethod(payment.id)}
                      className={`relative p-3 rounded-lg border-2 transition-all ${
                        selectedPaymentMethod === payment.id
                          ? 'border-flow-500 bg-flow-50 shadow-flow-glow'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        {payment.isFlowPay ? (
                          <div className="w-8 h-8 mx-auto mb-2">
                            <img
                              src="/LOGO.png"
                              alt="FlowPay"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="text-2xl mb-1">{payment.icon}</div>
                        )}
                        <div className="text-xs font-medium text-gray-900">{payment.name}</div>
                        {payment.benefit && (
                          <div className="text-xs text-gray-500 mt-1">{payment.benefit}</div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Flow ID 표시 */}
              <div className="mt-6 bg-gradient-to-r from-flow-50 to-flow-100 rounded-xl p-4 border border-flow-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Flow ID</span>
                  <span className="font-mono font-bold text-flow-600">{flowId}</span>
                </div>
              </div>

              <motion.button
                onClick={handlePayment}
                disabled={!selectedPaymentMethod}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full btn-primary text-lg py-4 mt-6"
              >
                ₩{product.price.toLocaleString()} 결제하기
              </motion.button>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center justify-center min-h-screen p-6"
            >
              <div className="text-center">
                <div className="icon-container icon-container-primary mx-auto mb-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">결제 처리 중</h3>
                <p className="text-gray-600">PG사와 연동하여 결제를 처리하고 있습니다...</p>
              </div>
            </motion.div>
          )}

          {step === 'workflow' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-6"
            >
              <div className="text-center mb-8">
                <div className="icon-container icon-container-primary mx-auto mb-4 animate-pulse">
                  <SparklesIcon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">FlowPay 결제 처리 중</h3>
                <p className="text-gray-600">안전하고 빠른 결제를 진행하고 있습니다...</p>
              </div>

              {/* 진행 상황 표시 */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-flow-50 to-flow-100 rounded-xl p-4 border border-flow-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-flow-500 rounded-full flex items-center justify-center">
                      <FingerPrintIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">결제 인증</h4>
                      <p className="text-sm text-gray-600">지문 인증으로 안전한 결제</p>
                    </div>
                    <div className="w-6 h-6 bg-success-500 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>

                <div className={`rounded-xl p-4 border transition-all duration-500 ${
                  currentWorkflowStep >= 1 
                    ? 'bg-gradient-to-r from-flow-50 to-flow-100 border-flow-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentWorkflowStep >= 1 ? 'bg-flow-500' : 'bg-gray-300'
                    }`}>
                      {currentWorkflowStep >= 1 ? (
                        <CheckCircleIcon className="h-5 w-5 text-white" />
                      ) : (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">자동 분류</h4>
                      <p className="text-sm text-gray-600">부서 및 카테고리 자동 분류</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      currentWorkflowStep >= 1 ? 'bg-success-500' : 'bg-gray-300'
                    }`}>
                      {currentWorkflowStep >= 1 ? (
                        <CheckCircleIcon className="h-4 w-4 text-white" />
                      ) : (
                        <span className="text-white text-xs">1</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`rounded-xl p-4 border transition-all duration-500 ${
                  currentWorkflowStep >= 2 
                    ? 'bg-gradient-to-r from-flow-50 to-flow-100 border-flow-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentWorkflowStep >= 2 ? 'bg-flow-500' : 'bg-gray-300'
                    }`}>
                      {currentWorkflowStep >= 2 ? (
                        <CheckCircleIcon className="h-5 w-5 text-white" />
                      ) : (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">전표 생성</h4>
                      <p className="text-sm text-gray-600">자동 전표 생성 및 처리</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      currentWorkflowStep >= 2 ? 'bg-success-500' : 'bg-gray-300'
                    }`}>
                      {currentWorkflowStep >= 2 ? (
                        <CheckCircleIcon className="h-4 w-4 text-white" />
                      ) : (
                        <span className="text-white text-xs">2</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`rounded-xl p-4 border transition-all duration-500 ${
                  currentWorkflowStep >= 3 
                    ? 'bg-gradient-to-r from-flow-50 to-flow-100 border-flow-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentWorkflowStep >= 3 ? 'bg-flow-500' : 'bg-gray-300'
                    }`}>
                      {currentWorkflowStep >= 3 ? (
                        <CheckCircleIcon className="h-5 w-5 text-white" />
                      ) : (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">영수증 처리</h4>
                      <p className="text-sm text-gray-600">AI OCR로 영수증 자동 인식</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      currentWorkflowStep >= 3 ? 'bg-success-500' : 'bg-gray-300'
                    }`}>
                      {currentWorkflowStep >= 3 ? (
                        <CheckCircleIcon className="h-4 w-4 text-white" />
                      ) : (
                        <span className="text-white text-xs">3</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`rounded-xl p-4 border transition-all duration-500 ${
                  currentWorkflowStep >= 4 
                    ? 'bg-gradient-to-r from-flow-50 to-flow-100 border-flow-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentWorkflowStep >= 4 ? 'bg-flow-500' : 'bg-gray-300'
                    }`}>
                      {currentWorkflowStep >= 4 ? (
                        <CheckCircleIcon className="h-5 w-5 text-white" />
                      ) : (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">예산 업데이트</h4>
                      <p className="text-sm text-gray-600">실시간 예산 현황 업데이트</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      currentWorkflowStep >= 4 ? 'bg-success-500' : 'bg-gray-300'
                    }`}>
                      {currentWorkflowStep >= 4 ? (
                        <CheckCircleIcon className="h-4 w-4 text-white" />
                      ) : (
                        <span className="text-white text-xs">4</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`rounded-xl p-4 border transition-all duration-500 ${
                  currentWorkflowStep >= 5 
                    ? 'bg-gradient-to-r from-success-50 to-success-100 border-success-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentWorkflowStep >= 5 ? 'bg-success-500' : 'bg-gray-300'
                    }`}>
                      {currentWorkflowStep >= 5 ? (
                        <CheckBadgeIcon className="h-5 w-5 text-white" />
                      ) : (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">완료</h4>
                      <p className="text-sm text-gray-600">모든 처리가 완료되었습니다</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      currentWorkflowStep >= 5 ? 'bg-success-500' : 'bg-gray-300'
                    }`}>
                      {currentWorkflowStep >= 5 ? (
                        <CheckCircleIcon className="h-4 w-4 text-white" />
                      ) : (
                        <span className="text-white text-xs">5</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 진행률 표시 */}
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>진행률</span>
                  <span>{Math.round(((currentWorkflowStep + 1) / 6) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-flow-500 to-flow-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((currentWorkflowStep + 1) / 6) * 100}%` }}
                  ></div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center justify-center min-h-screen p-6"
            >
              <div className="text-center">
                <div className="icon-container icon-container-success mx-auto mb-6 animate-bounce-in">
                  <CheckCircleIcon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">결제 완료!</h3>
                <p className="text-gray-600 mb-6">
                  {selectedPaymentMethod === 'flowpay' 
                    ? 'FlowPay 워크플로우가 성공적으로 완료되었습니다.'
                    : '결제가 성공적으로 완료되었습니다.'
                  }
                </p>

                <div className="bg-gradient-to-r from-success-50 to-success-100 rounded-xl p-6 border border-success-200 mb-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">상품:</span>
                      <span className="font-semibold">{product.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">결제 금액:</span>
                      <span className="font-bold">₩{product.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Flow ID:</span>
                      <span className="font-mono font-bold text-flow-600">{flowId}</span>
                    </div>
                    {selectedPaymentMethod === 'flowpay' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">부서:</span>
                          <span className="font-bold">관리부</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">카테고리:</span>
                          <span className="font-bold">사무용품</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">예산 사용률:</span>
                          <span className="font-bold text-warning-600">45%</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setStep('product')}
                  className="btn-success"
                >
                  새로운 결제
                </button>
              </div>
            </motion.div>
          )}

          {step === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center justify-center min-h-screen p-6"
            >
              <div className="text-center">
                <div className="icon-container icon-container-error mx-auto mb-6">
                  <XMarkIcon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">결제 실패</h3>
                <p className="text-gray-600 mb-6">결제 처리 중 오류가 발생했습니다.</p>
                
                <button
                  onClick={() => setStep('payment')}
                  className="btn-error"
                >
                  다시 시도
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PGPayment; 