import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  ArrowLeftIcon,
  FingerPrintIcon,
  BellAlertIcon,
  UserIcon,
  CubeIcon,
  LinkIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import Logo, { LogoMark, FlowIdChip } from './Logo';

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
  { title: '결제 인증', description: '생체 인증으로 안전한 결제' },
  { title: '가명 토큰 발급', description: '개인정보 대신 Flow ID 토큰 연결' },
  { title: '자동 분류', description: '부서·계정과목 자동 분류' },
  { title: '전표 생성', description: '자동 전표 생성 및 처리' },
  { title: '예산 업데이트', description: '실시간 예산 현황 반영' },
  { title: '완료', description: '모든 처리가 완료되었습니다' },
];

// 발표자료 10번: FL1T(Flow ID Temp prefix) - 생성 시 타임스탬프 - 랜덤 문자열
const issueTempToken = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `FL1T-${Date.now()}-${rand}`;
};

const PGPayment: React.FC = () => {
  const [step, setStep] = useState<'product' | 'payment' | 'auth' | 'processing' | 'workflow' | 'success' | 'error'>('product');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [activeTab, setActiveTab] = useState('card');
  const [flowId, setFlowId] = useState('XK8P2M');
  const [tempToken, setTempToken] = useState('');
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

  const remainingBudget = 1532500;

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
      // FlowPay는 생체 인증 확인을 먼저 거친다 (발표자료 10번 ① FlowID 1click)
      setStep('auth');
    } else {
      setStep('processing');
      const t = setTimeout(() => setStep('success'), 2500);
      timersRef.current.push(t);
    }
  };

  const runFlowPayWorkflow = () => {
    setTempToken(issueTempToken());
    setStep('workflow');
    setCurrentWorkflowStep(0);
    for (let i = 1; i < workflowSteps.length; i++) {
      const t = setTimeout(() => {
        setCurrentWorkflowStep(i);
        if (i === workflowSteps.length - 1) {
          const done = setTimeout(() => setStep('success'), 1200);
          timersRef.current.push(done);
        }
      }, i * 1000);
      timersRef.current.push(t);
    }
  };

  const resetPayment = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setSelectedPaymentMethod('');
    setCurrentWorkflowStep(0);
    setTempToken('');
    setStep('product');
  };

  const isFlowPay = selectedPaymentMethod === 'flowpay';
  const progress = Math.round(((currentWorkflowStep + 1) / workflowSteps.length) * 100);

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-medium">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <Logo size="sm" showText={true} />
            <div className="flex items-center gap-1.5 text-gray-400">
              <LockClosedIcon className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">안전한 결제</span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'product' && (
            <motion.div key="product" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
              <p className="text-sm font-medium text-gray-400 mb-1">주문 상품</p>
              <h1 className="text-xl font-bold text-gray-900 mb-5">상품 정보</h1>
              <div className="card-muted p-5 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-semibold text-gray-900">{product.name}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{product.capacity}</p>
                    <p className="text-sm text-gray-500">수량 {product.quantity}개</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900 tabular-nums">{product.price.toLocaleString()} 원</p>
                </div>
              </div>
              <button onClick={() => setStep('payment')} className="btn-primary w-full py-4 text-base">
                {product.price.toLocaleString()} 원 결제하기
              </button>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
              <button
                onClick={() => setStep('product')}
                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 mb-4 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span className="text-sm font-medium">상품 정보로</span>
              </button>

              <div className="card-muted p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-semibold text-gray-900">{product.name}</h2>
                    <p className="text-sm text-gray-500">{product.capacity} × {product.quantity}개</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900 tabular-nums">{product.price.toLocaleString()} 원</p>
                </div>
              </div>

              {/* 결제 방법 탭 */}
              <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setActiveTab(method.id)}
                    className={`flex-1 py-2 px-1 rounded-xl text-xs whitespace-nowrap transition-colors ${
                      activeTab === method.id ? 'bg-white text-gray-900 font-bold shadow-soft' : 'text-gray-500 font-medium hover:text-gray-900'
                    }`}
                  >
                    {method.name}
                  </button>
                ))}
              </div>

              {/* 간편 결제 */}
              <h3 className="text-sm font-semibold text-gray-500 mb-3">간편 결제</h3>
              <div className="grid grid-cols-2 gap-2.5 mb-6">
                {simplePayments.map((payment) => {
                  const selected = selectedPaymentMethod === payment.id;
                  return (
                    <button
                      key={payment.id}
                      onClick={() => setSelectedPaymentMethod(payment.id)}
                      className={`relative flex items-start gap-2.5 p-4 rounded-2xl border-2 text-left transition-all ${
                        selected
                          ? 'border-flow-500 bg-flow-50'
                          : payment.isFlowPay
                          ? 'border-flow-200 hover:border-flow-300'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {payment.isFlowPay ? (
                        <LogoMark className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      ) : (
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${payment.brandColor}`} />
                      )}
                      <div className="min-w-0 pr-4">
                        <div className="text-sm font-bold text-gray-900">{payment.name}</div>
                        {payment.benefit && (
                          <div className={`text-xs mt-0.5 ${payment.isFlowPay ? 'text-flow-700 font-medium' : 'text-gray-400'}`}>
                            {payment.benefit}
                          </div>
                        )}
                      </div>
                      {selected && (
                        <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-flow-500 text-white flex items-center justify-center">
                          <CheckIcon className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-gray-50 py-3 px-4 mb-6">
                <span className="text-sm font-medium text-gray-500">내 Flow ID</span>
                <span className="font-bold tracking-wide text-flow-700">{flowId}</span>
              </div>

              <button
                onClick={handlePayment}
                disabled={!selectedPaymentMethod}
                className="btn-primary w-full py-4 text-base disabled:bg-gray-200 disabled:text-gray-400 disabled:pointer-events-none"
              >
                {isFlowPay ? 'FlowID 1-Click 결제' : `${product.price.toLocaleString()} 원 결제하기`}
              </button>
            </motion.div>
          )}

          {/* ① FlowID 1click — 생체 인증 */}
          {step === 'auth' && (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 py-10">
              <div className="rounded-3xl border border-gray-200 shadow-medium px-6 py-8 text-center">
                <div className="flex items-center justify-center gap-6 mb-6 text-gray-700">
                  <FingerPrintIcon className="h-14 w-14" strokeWidth={1.2} />
                  <FaceIdIcon className="h-14 w-14" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 leading-snug mb-2">
                  FlowPay로
                  <br />
                  {product.price.toLocaleString()} 원을 결제하시겠습니까?
                </h3>
                <p className="text-sm text-gray-500 mb-7">기기 내 생체 인증으로 결제가 진행됩니다.</p>
                <button onClick={runFlowPayWorkflow} className="btn-primary w-full py-3.5 text-base">
                  인증하기
                </button>
              </div>
              <button
                onClick={() => setStep('payment')}
                className="w-full mt-4 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
              >
                다른 결제수단 선택
              </button>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center py-24 px-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-9 w-9 border-[3px] border-flow-500 border-t-transparent mx-auto mb-6" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">결제 처리 중</h3>
                <p className="text-sm text-gray-500">PG사와 연동하여 결제를 처리하고 있습니다…</p>
              </div>
            </motion.div>
          )}

          {/* ② 가명 토큰 발급 → 자동 처리 */}
          {step === 'workflow' && (
            <motion.div key="workflow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
              <div className="text-center mb-7">
                <motion.div
                  initial={{ scale: 0.8, rotateY: 90 }}
                  animate={{ scale: 1, rotateY: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 16 }}
                  className="w-20 h-20 rounded-full mx-auto mb-4 bg-gradient-to-b from-flow-300 to-flow-500 shadow-mint flex items-center justify-center border-b-4 border-flow-600"
                >
                  <div className="w-14 h-14 rounded-full bg-white/25 flex items-center justify-center">
                    <LogoMark className="w-9 h-9 [&_path]:stroke-white" />
                  </div>
                </motion.div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">가명 토큰 발급</h3>
                <FlowIdChip flowId={tempToken} className="max-w-full" />
              </div>

              <div className="space-y-1.5">
                {workflowSteps.map((wStep, i) => {
                  const isDone = currentWorkflowStep > i || (i === workflowSteps.length - 1 && currentWorkflowStep >= i);
                  const isCurrent = currentWorkflowStep === i && !isDone;
                  return (
                    <div
                      key={wStep.title}
                      className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 transition-colors duration-300 ${
                        isCurrent ? 'bg-flow-50' : 'bg-transparent'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors ${
                          isDone ? 'bg-flow-500 text-white' : isCurrent ? 'bg-white border-2 border-flow-500 text-flow-600' : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {isDone ? <CheckIcon className="h-4 w-4" /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-semibold ${isDone || isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>{wStep.title}</h4>
                        <p className="text-xs text-gray-400">{wStep.description}</p>
                      </div>
                      {isCurrent && <div className="animate-spin rounded-full h-4 w-4 border-2 border-flow-500 border-t-transparent" />}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>진행률</span>
                  <span className="font-semibold text-flow-700 tabular-nums">{progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </motion.div>
          )}

          {/* ③ 자동 기록 — 결제 완료 카드 */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 py-8">
              <div className="rounded-3xl border border-gray-200 shadow-medium p-5">
                <BellAlertIcon className="h-7 w-7 text-flow-500 mb-3" />
                <h3 className="text-xl font-bold text-gray-900 pb-3 mb-4 border-b-2 border-gray-200">결제 완료</h3>
                <div className="space-y-3 text-sm">
                  <ReceiptRow icon={UserIcon} tone="mint" label="결제인" value="김대리 · 관리부" />
                  <ReceiptRow icon={CubeIcon} tone="sky" label="품목 정보" value={`${product.name} ${product.capacity}`} />
                </div>
                <div className="flex items-baseline justify-end gap-2 mt-4">
                  {isFlowPay && (
                    <span className="text-xs text-gray-400">
                      남은 예산 <span className="tabular-nums">{(remainingBudget - product.price).toLocaleString()}원</span>
                    </span>
                  )}
                  <span className="text-2xl font-bold text-gray-900 tabular-nums">{product.price.toLocaleString()} 원</span>
                </div>
              </div>

              {isFlowPay ? (
                <>
                  <div className="relative flex justify-center -my-3 z-10">
                    <span className="w-9 h-9 rounded-full bg-gray-800 text-white flex items-center justify-center ring-4 ring-white">
                      <LinkIcon className="h-4 w-4" />
                    </span>
                  </div>
                  <FlowIdChip flowId={tempToken} className="w-full justify-center py-3 rounded-2xl" />
                  <div className="mt-5 rounded-2xl bg-flow-50 p-4 text-sm space-y-2">
                    <p className="text-xs font-semibold text-flow-700 mb-1">자동 처리 결과</p>
                    <Row label="부서" value="관리부" />
                    <Row label="계정과목" value="소모품비" />
                    <Row label="전표" value="자동 생성 완료" />
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center mt-5">결제가 성공적으로 완료되었습니다.</p>
              )}

              <button onClick={resetPayment} className="btn-primary w-full py-4 text-base mt-6">
                새로운 결제
              </button>
            </motion.div>
          )}

          {step === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-error-50 text-error-500 flex items-center justify-center mx-auto mb-6">
                <XMarkIcon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">결제 실패</h3>
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

// Face ID 모양 아이콘 — 모서리 브래킷 + 얼굴
const FaceIdIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" className={className} aria-hidden="true">
    <path d="M6 15V10a4 4 0 0 1 4-4h5M33 6h5a4 4 0 0 1 4 4v5M42 33v5a4 4 0 0 1-4 4h-5M15 42h-5a4 4 0 0 1-4-4v-5" />
    <path d="M17 18v3M31 18v3M24 19v7h-2M18.5 31.5c3.2 2.4 7.8 2.4 11 0" />
  </svg>
);

const ReceiptRow: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  tone: 'mint' | 'sky';
  label: string;
  value: string;
}> = ({ icon: Icon, tone, label, value }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="flex items-center gap-2 text-gray-500">
      <span
        className={`w-6 h-6 rounded-md flex items-center justify-center ${
          tone === 'mint' ? 'bg-flow-100 text-flow-700' : 'bg-sky-100 text-sky-600'
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      {label}
    </span>
    <span className="font-semibold text-gray-900 text-right">{value}</span>
  </div>
);

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-gray-500">{label}</span>
    <span className="font-semibold text-gray-900">{value}</span>
  </div>
);

export default PGPayment;
