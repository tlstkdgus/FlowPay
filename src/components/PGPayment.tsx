import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  SparklesIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import Logo from './Logo';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  brandColor?: string;
  benefit?: string;
  isFlowPay?: boolean;
}

interface Product {
  name: string;
  capacity: string;
  quantity: number;
  price: number;
}

const workflowSteps = [
  { title: '결제 인증', description: '지문 인증으로 안전한 결제' },
  { title: '자동 분류', description: '부서 및 카테고리 자동 분류' },
  { title: '전표 생성', description: '자동 전표 생성 및 처리' },
  { title: '영수증 처리', description: 'AI OCR로 영수증 자동 인식' },
  { title: '예산 업데이트', description: '실시간 예산 현황 업데이트' },
  { title: '완료', description: '모든 처리가 완료되었습니다' },
];

const PGPayment: React.FC = () => {
  const [step, setStep] = useState<'product' | 'payment' | 'processing' | 'workflow' | 'success' | 'error'>('product');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [activeTab, setActiveTab] = useState('card');
  const [flowId, setFlowId] = useState('XK8P2M');
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const storedFlowId = localStorage.getItem('flowId');
    if (storedFlowId) setFlowId(storedFlowId);
  }, []);

  // 언마운트 시 예약된 타이머 정리 (메모리 누수 / 상태 업데이트 경고 방지)
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const product: Product = {
    name: 'A4용지',
    capacity: '500매',
    quantity: 1,
    price: 45000,
  };

  const paymentMethods: PaymentMethod[] = [
    { id: 'card', name: '신용·체크카드', description: 'VISA, MasterCard, 국내카드' },
    { id: 'virtual', name: '가상계좌', description: '실시간 가상계좌' },
    { id: 'bank', name: '계좌이체', description: '실시간 계좌이체' },
    { id: 'mobile', name: '휴대폰', description: '휴대폰 소액결제' },
  ];

  const simplePayments: PaymentMethod[] = [
    { id: 'flowpay', name: 'FlowPay', description: 'Flow ID 기반 결제', benefit: '1-Click 결제, 자동 분류', isFlowPay: true },
    { id: 'naver', name: '네이버페이', description: '네이버페이', benefit: '5만원 이상 2천원 할인', brandColor: 'bg-[#03C75A]' },
    { id: 'kakao', name: '카카오페이', description: '카카오페이', benefit: '1천원 캐시백', brandColor: 'bg-[#FFCD00]' },
    { id: 'toss', name: '토스페이', description: '토스페이', benefit: '첫 결제 3천원 캐시백', brandColor: 'bg-[#0064FF]' },
  ];

  const handlePayment = () => {
    if (selectedPaymentMethod === 'flowpay') {
      setStep('workflow');
      setCurrentWorkflowStep(0);
      for (let i = 1; i < workflowSteps.length; i++) {
        const t = setTimeout(() => {
          setCurrentWorkflowStep(i);
          if (i === workflowSteps.length - 1) {
            const done = setTimeout(() => setStep('success'), 1500);
            timersRef.current.push(done);
          }
        }, i * 1200);
        timersRef.current.push(t);
      }
    } else {
      setStep('processing');
      const t = setTimeout(() => setStep('success'), 2500);
      timersRef.current.push(t);
    }
  };

  const resetPayment = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setSelectedPaymentMethod('');
    setCurrentWorkflowStep(0);
    setStep('product');
  };

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-4xl border border-gray-200/70 overflow-hidden">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white/85 backdrop-blur-xl border-b border-gray-100 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <Logo size="sm" showText={true} />
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-success-500 rounded-full" />
              <span className="text-xs text-gray-400">안전한 결제</span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'product' && (
            <motion.div
              key="product"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              <h1 className="text-lg font-semibold text-gray-900 mb-4">상품 정보</h1>
              <div className="card-muted p-5 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-medium text-gray-900">{product.name}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{product.capacity}</p>
                    <p className="text-sm text-gray-500">수량 {product.quantity}개</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">₩{product.price.toLocaleString()}</p>
                </div>
              </div>
              <button onClick={() => setStep('payment')} className="btn-primary w-full py-4">
                ₩{product.price.toLocaleString()} 결제하기
              </button>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              <button
                onClick={() => setStep('product')}
                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 mb-4 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span className="text-sm">상품 정보로</span>
              </button>

              <div className="card-muted p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-medium text-gray-900">{product.name}</h2>
                    <p className="text-sm text-gray-500">{product.capacity} × {product.quantity}개</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">₩{product.price.toLocaleString()}</p>
                </div>
              </div>

              {/* 결제 방법 탭 */}
              <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setActiveTab(method.id)}
                    className={`flex-1 py-2 px-2 rounded-xl text-xs font-medium transition-colors ${
                      activeTab === method.id ? 'bg-white text-gray-900 shadow-soft' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {method.name}
                  </button>
                ))}
              </div>

              {/* 간편 결제 */}
              <h3 className="text-sm font-medium text-gray-500 mb-3">간편 결제</h3>
              <div className="grid grid-cols-2 gap-2.5 mb-6">
                {simplePayments.map((payment) => (
                  <button
                    key={payment.id}
                    onClick={() => setSelectedPaymentMethod(payment.id)}
                    className={`flex items-start gap-2.5 p-4 rounded-2xl border text-left transition-all ${
                      selectedPaymentMethod === payment.id
                        ? 'border-flow-500 bg-flow-50/50 ring-1 ring-flow-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {payment.isFlowPay ? (
                      <img src="/LOGO.png" alt="" className="w-5 h-5 object-contain flex-shrink-0 mt-0.5" />
                    ) : (
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${payment.brandColor}`} />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900">{payment.name}</div>
                      {payment.benefit && <div className="text-xs text-gray-400 mt-0.5">{payment.benefit}</div>}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between card-muted py-3 px-4 mb-6">
                <span className="text-sm font-medium text-gray-500">Flow ID</span>
                <span className="font-mono font-semibold text-flow-600">{flowId}</span>
              </div>

              <button
                onClick={handlePayment}
                disabled={!selectedPaymentMethod}
                className="btn-primary w-full py-4 disabled:opacity-30 disabled:pointer-events-none"
              >
                ₩{product.price.toLocaleString()} 결제하기
              </button>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-24 px-6"
            >
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent mx-auto mb-6" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">결제 처리 중</h3>
                <p className="text-sm text-gray-500">PG사와 연동하여 결제를 처리하고 있습니다…</p>
              </div>
            </motion.div>
          )}

          {step === 'workflow' && (
            <motion.div
              key="workflow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              <div className="text-center mb-8">
                <div className="icon-container icon-container-primary mx-auto mb-4">
                  <SparklesIcon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">FlowPay 결제 처리 중</h3>
                <p className="text-sm text-gray-500">안전하고 빠른 결제를 진행하고 있습니다</p>
              </div>

              <div className="space-y-2">
                {workflowSteps.map((wStep, i) => {
                  const isDone = currentWorkflowStep > i || (i === workflowSteps.length - 1 && currentWorkflowStep >= i);
                  const isCurrent = currentWorkflowStep === i;
                  return (
                    <div
                      key={wStep.title}
                      className={`flex items-center gap-3 rounded-2xl p-3.5 transition-colors duration-300 ${
                        isDone || isCurrent ? 'bg-gray-50' : 'bg-transparent'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          isDone ? 'bg-gray-900 text-white' : isCurrent ? 'bg-gray-200' : 'bg-gray-100'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircleSolid className="h-5 w-5" />
                        ) : isCurrent ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent" />
                        ) : (
                          <span className="text-xs text-gray-400">{i + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium ${isDone || isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                          {wStep.title}
                        </h4>
                        <p className="text-xs text-gray-400">{wStep.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>진행률</span>
                  <span>{Math.round(((currentWorkflowStep + 1) / workflowSteps.length) * 100)}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${((currentWorkflowStep + 1) / workflowSteps.length) * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 py-12 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-success-500 text-white flex items-center justify-center mx-auto mb-6">
                <CheckCircleSolid className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">결제 완료</h3>
              <p className="text-sm text-gray-500 mb-8">
                {selectedPaymentMethod === 'flowpay'
                  ? 'FlowPay 워크플로우가 성공적으로 완료되었습니다.'
                  : '결제가 성공적으로 완료되었습니다.'}
              </p>

              <div className="card-muted p-5 mb-8 text-left">
                <div className="space-y-2.5 text-sm">
                  <Row label="상품" value={product.name} />
                  <Row label="결제 금액" value={`₩${product.price.toLocaleString()}`} bold />
                  <Row label="Flow ID" value={flowId} mono />
                  {selectedPaymentMethod === 'flowpay' && (
                    <>
                      <div className="border-t border-gray-200 my-1" />
                      <Row label="부서" value="관리부" />
                      <Row label="카테고리" value="사무용품" />
                      <Row label="예산 사용률" value="45%" />
                    </>
                  )}
                </div>
              </div>

              <button onClick={resetPayment} className="btn-primary w-full py-4">
                새로운 결제
              </button>
            </motion.div>
          )}

          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 py-16 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-error-500 text-white flex items-center justify-center mx-auto mb-6">
                <XMarkIcon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">결제 실패</h3>
              <p className="text-sm text-gray-500 mb-8">결제 처리 중 오류가 발생했습니다.</p>
              <button onClick={() => setStep('payment')} className="btn-primary w-full py-4">
                다시 시도
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string; bold?: boolean; mono?: boolean }> = ({
  label,
  value,
  bold,
  mono,
}) => (
  <div className="flex justify-between">
    <span className="text-gray-500">{label}</span>
    <span className={`${bold ? 'font-semibold' : 'font-medium'} ${mono ? 'font-mono text-flow-600' : 'text-gray-900'}`}>
      {value}
    </span>
  </div>
);

export default PGPayment;
