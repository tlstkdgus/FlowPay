import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  XMarkIcon,
  SparklesIcon,
  ArrowLeftIcon,
  MinusIcon,
  PlusIcon,
  FingerPrintIcon,
  ExclamationTriangleIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import Logo from './Logo';
import { Row, useToast } from './ui';
import { useFlowPay } from '../store/FlowPayContext';
import { checkBudget, departmentName, projectName } from '../store/selectors';
import { CATEGORIES, GENERAL_METHODS, MERCHANTS, METHOD_LABELS, SIMPLE_METHODS, categoryById } from '../data/constants';
import { classify } from '../utils/classifier';
import { won } from '../utils/format';
import { authenticatePasskey, PasskeyCancelledError, PasskeyUnsupportedError } from '../utils/passkey';
import { CategoryId, Invoice, LineItem, PaymentMethodId, Transaction } from '../types';

type Step = 'cart' | 'payment' | 'auth' | 'processing' | 'workflow' | 'success' | 'error';

interface ClassOverride {
  departmentId: string;
  categoryId: CategoryId;
  projectId?: string;
}

const panel = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

const PGPayment: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { state, pay } = useFlowPay();
  const { profile, settings } = state;

  const [step, setStep] = useState<Step>('cart');
  const [merchantId, setMerchantId] = useState(MERCHANTS[0].id);
  const [quantities, setQuantities] = useState<Record<string, number>>({ [`${MERCHANTS[0].id}:0`]: 1 });
  const [method, setMethod] = useState<PaymentMethodId | ''>('');
  const [override, setOverride] = useState<ClassOverride | null>(null);
  const [editClass, setEditClass] = useState(false);
  const [memo, setMemo] = useState('');
  const [workflowStep, setWorkflowStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<{ transaction: Transaction; invoice?: Invoice } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const merchant = MERCHANTS.find((m) => m.id === merchantId)!;
  const items: LineItem[] = merchant.items
    .map((it, i) => ({ name: it.name, quantity: quantities[`${merchant.id}:${i}`] ?? 0, price: it.price }))
    .filter((it) => it.quantity > 0);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  // 자동 분류 (결제 시각·가맹점·상품·메모 기반)
  const auto = useMemo(
    () =>
      classify(
        { merchant: merchant.name, items, memo, amount: total, date: new Date(), departmentId: profile.departmentId },
        state.projects
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [merchant.name, JSON.stringify(items), memo, total, profile.departmentId, state.projects]
  );
  const classification: ClassOverride = override ?? {
    departmentId: auto.departmentId,
    categoryId: auto.categoryId,
    projectId: auto.projectId,
  };
  const isAuto = !override && settings.autoClassify;
  const budget = checkBudget(state, classification.departmentId, total);
  const blocked = budget.overPersonal || (settings.blockOverBudget && budget.overDepartment);

  const changeQty = (index: number, delta: number) => {
    const key = `${merchant.id}:${index}`;
    setQuantities((q) => ({ ...q, [key]: Math.max(0, Math.min(99, (q[key] ?? 0) + delta)) }));
  };

  const selectMerchant = (id: string) => {
    setMerchantId(id);
    setOverride(null);
    setQuantities((q) => (Object.keys(q).some((k) => k.startsWith(`${id}:`) && q[k] > 0) ? q : { ...q, [`${id}:0`]: 1 }));
  };

  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  const commit = (m: PaymentMethodId) =>
    pay({
      merchant: merchant.name,
      items,
      method: m,
      departmentId: classification.departmentId,
      categoryId: classification.categoryId,
      projectId: classification.projectId,
      autoClassified: isAuto,
      memo: memo.trim() || undefined,
    });

  const runWorkflow = () => {
    const r = commit('flowpay');
    setResult(r);
    setStep('workflow');
    setWorkflowStep(1);
    for (let i = 2; i <= 5; i++) later(() => setWorkflowStep(i), (i - 1) * 650);
    later(() => setStep('success'), 5 * 650);
  };

  const authenticate = async () => {
    try {
      if (profile.passkey && !profile.passkey.simulated) {
        await authenticatePasskey(profile.passkey.credentialId);
      } else {
        // 데모 인증 (WebAuthn 미지원 환경 또는 데모 패스키)
        await new Promise((r) => later(() => r(undefined), 900));
      }
      runWorkflow();
    } catch (e) {
      if (e instanceof PasskeyUnsupportedError) {
        setErrorMessage('이 기기에서는 등록된 패스키를 사용할 수 없습니다. 설정에서 패스키를 다시 등록해주세요.');
      } else if (e instanceof PasskeyCancelledError) {
        setErrorMessage('생체 인증이 취소되어 결제가 진행되지 않았습니다.');
      } else {
        setErrorMessage('인증 중 알 수 없는 오류가 발생했습니다.');
      }
      setStep('error');
    }
  };

  const handlePayment = () => {
    if (!method || blocked || !items.length) return;
    if (method === 'flowpay') {
      setStep('auth');
      // 1-Click: 등록된 패스키가 있으면 인증 창을 바로 띄움
      if (settings.oneClick && profile.passkey) authenticate();
      return;
    }
    setStep('processing');
    later(() => {
      setResult(commit(method));
      setStep('success');
    }, 1500);
  };

  const resetPayment = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setMethod('');
    setOverride(null);
    setEditClass(false);
    setMemo('');
    setWorkflowStep(0);
    setResult(null);
    setStep('cart');
  };

  const workflowSteps = [
    { title: '결제 인증', description: profile.passkey ? '패스키 생체 인증 완료' : '데모 인증 완료' },
    {
      title: '자동 분류',
      description: `${departmentName(state, classification.departmentId)} · ${categoryById(classification.categoryId).name}`,
    },
    { title: '거래 기록', description: result ? `${result.transaction.id} · Flow ID ${result.transaction.flowId}` : '' },
    {
      title: '전표 생성',
      description: result?.invoice
        ? `${result.invoice.id} · 승인자 ${result.invoice.approver}`
        : '자동 전표 생성이 꺼져 있어 건너뜀',
    },
    {
      title: '예산 업데이트',
      // 거래가 이미 기록된 뒤이므로 추가 금액 0으로 계산
      description: `${departmentName(state, classification.departmentId)} 예산 ${checkBudget(state, classification.departmentId, 0).departmentPct.toFixed(0)}% 사용`,
    },
    { title: '완료', description: '모든 처리가 완료되었습니다' },
  ];

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
          {step === 'cart' && (
            <motion.div key="cart" {...panel} className="p-6">
              <h1 className="text-lg font-semibold text-gray-900 mb-4">가맹점 선택</h1>
              <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1">
                {MERCHANTS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => selectMerchant(m.id)}
                    className={`flex-shrink-0 text-left px-4 py-2.5 rounded-2xl border transition-all ${
                      merchantId === m.id ? 'border-flow-500 bg-flow-50/50 ring-1 ring-flow-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900 whitespace-nowrap">{m.name}</div>
                    <div className="text-xs text-gray-400">{m.description}</div>
                  </button>
                ))}
              </div>

              <h2 className="text-sm font-medium text-gray-500 mb-3">상품</h2>
              <div className="space-y-2 mb-6">
                {merchant.items.map((it, i) => {
                  const qty = quantities[`${merchant.id}:${i}`] ?? 0;
                  return (
                    <div key={it.name} className={`flex items-center justify-between p-4 rounded-2xl ${qty ? 'bg-gray-100' : 'bg-gray-50'}`}>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{it.name}</p>
                        <p className="text-sm text-gray-500">
                          {it.spec} · {won(it.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => changeQty(i, -1)}
                          disabled={!qty}
                          aria-label={`${it.name} 수량 감소`}
                          className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center disabled:opacity-30"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums">{qty}</span>
                        <button
                          onClick={() => changeQty(i, 1)}
                          aria-label={`${it.name} 수량 증가`}
                          className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-baseline mb-4">
                <span className="text-sm text-gray-500">합계 ({items.reduce((s, i) => s + i.quantity, 0)}개)</span>
                <span className="text-xl font-semibold text-gray-900">{won(total)}</span>
              </div>
              <button onClick={() => setStep('payment')} disabled={!items.length} className="btn-primary w-full py-4 disabled:opacity-30 disabled:pointer-events-none">
                {won(total)} 결제하기
              </button>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div key="payment" {...panel} className="p-6">
              <button onClick={() => setStep('cart')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 mb-4 transition-colors">
                <ArrowLeftIcon className="h-4 w-4" />
                <span className="text-sm">상품 선택으로</span>
              </button>

              <div className="card-muted p-4 mb-6">
                <div className="flex justify-between items-center gap-3">
                  <div className="min-w-0">
                    <h2 className="font-medium text-gray-900 truncate">{merchant.name}</h2>
                    <p className="text-sm text-gray-500 truncate">
                      {items[0]?.name}
                      {items.length > 1 ? ` 외 ${items.length - 1}건` : ` × ${items[0]?.quantity}개`}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 flex-shrink-0">{won(total)}</p>
                </div>
              </div>

              {/* 간편 결제 */}
              <h3 className="text-sm font-medium text-gray-500 mb-3">간편 결제</h3>
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {SIMPLE_METHODS.map((p) => (
                  <MethodButton key={p.id} selected={method === p.id} onClick={() => setMethod(p.id)}>
                    {p.id === 'flowpay' ? (
                      <img src="/LOGO.png" alt="" className="w-5 h-5 object-contain flex-shrink-0 mt-0.5" />
                    ) : (
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${p.brandColor}`} />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900">{p.name}</div>
                      {p.benefit && <div className="text-xs text-gray-400 mt-0.5">{p.benefit}</div>}
                    </div>
                  </MethodButton>
                ))}
              </div>

              {/* 일반 결제 */}
              <h3 className="text-sm font-medium text-gray-500 mb-3">일반 결제</h3>
              <div className="grid grid-cols-2 gap-2.5 mb-6">
                {GENERAL_METHODS.map((p) => (
                  <MethodButton key={p.id} selected={method === p.id} onClick={() => setMethod(p.id)}>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{p.description}</div>
                    </div>
                  </MethodButton>
                ))}
              </div>

              {/* 자동 분류 */}
              {method && (
                <div className="card-muted p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                      {isAuto && <SparklesIcon className="h-4 w-4 text-flow-600" />}
                      {isAuto ? '자동 분류' : '분류'}
                    </h3>
                    <button
                      onClick={() => setEditClass((v) => !v)}
                      className="flex items-center gap-1 text-xs text-flow-600 font-medium"
                    >
                      <AdjustmentsHorizontalIcon className="h-4 w-4" /> {editClass ? '완료' : '변경'}
                    </button>
                  </div>
                  {editClass || !settings.autoClassify ? (
                    <div className="space-y-2">
                      <select
                        aria-label="부서"
                        className="input-field bg-white py-2.5"
                        value={classification.departmentId}
                        onChange={(e) => setOverride({ ...classification, departmentId: e.target.value })}
                      >
                        {state.departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      <select
                        aria-label="카테고리"
                        className="input-field bg-white py-2.5"
                        value={classification.categoryId}
                        onChange={(e) => setOverride({ ...classification, categoryId: e.target.value as CategoryId })}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} ({c.account})</option>
                        ))}
                      </select>
                      <select
                        aria-label="프로젝트"
                        className="input-field bg-white py-2.5"
                        value={classification.projectId ?? ''}
                        onChange={(e) => setOverride({ ...classification, projectId: e.target.value || undefined })}
                      >
                        <option value="">프로젝트 없음</option>
                        {state.projects.filter((p) => p.active).map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <input
                        className="input-field bg-white py-2.5"
                        placeholder="메모 (선택) — 예: 고객 미팅"
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <Row label="부서" value={departmentName(state, classification.departmentId)} />
                      <Row
                        label="카테고리"
                        value={`${categoryById(classification.categoryId).name} · ${categoryById(classification.categoryId).account}`}
                      />
                      <Row label="프로젝트" value={projectName(state, classification.projectId)} />
                      {isAuto && <p className="text-xs text-gray-400 pt-1">근거: {auto.reason} · 신뢰도 {auto.confidence}%</p>}
                    </div>
                  )}
                </div>
              )}

              {/* 예산 확인 */}
              {method && (
                <div className={`rounded-2xl p-4 mb-4 ${blocked ? 'bg-error-50' : budget.nearDepartment ? 'bg-warning-50' : 'bg-gray-50'}`}>
                  <div className="space-y-2 text-sm">
                    <Row
                      label={`${departmentName(state, classification.departmentId)} 월 예산`}
                      value={`${budget.departmentPct.toFixed(0)}% (${won(budget.departmentAfter)} / ${won(budget.departmentBudget)})`}
                    />
                    <Row label="내 월 한도" value={`${won(budget.personalAfter)} / ${won(budget.personalLimit)}`} />
                  </div>
                  {(blocked || budget.overDepartment || budget.nearDepartment) && (
                    <p className={`flex items-start gap-1.5 text-xs mt-3 ${blocked ? 'text-error-700' : 'text-warning-700'}`}>
                      <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                      {budget.overPersonal
                        ? 'Flow ID 월 한도를 초과하여 결제할 수 없습니다.'
                        : budget.overDepartment
                        ? settings.blockOverBudget
                          ? '부서 월 예산을 초과하여 결제가 차단되었습니다. 설정에서 정책을 변경할 수 있습니다.'
                          : '부서 월 예산을 초과합니다. 전표 승인 시 검토가 필요합니다.'
                        : `부서 예산 사용률이 ${settings.alertThreshold}%를 넘습니다.`}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between card-muted py-3 px-4 mb-6">
                <span className="text-sm font-medium text-gray-500">Flow ID</span>
                <span className="font-mono font-semibold text-flow-600">{profile.flowId}</span>
              </div>

              {method && method !== 'flowpay' && (
                <p className="text-xs text-gray-400 mb-3 text-center">일반 결제는 영수증을 첨부하면 전표가 생성됩니다.</p>
              )}

              <button
                onClick={handlePayment}
                disabled={!method || blocked}
                className="btn-primary w-full py-4 disabled:opacity-30 disabled:pointer-events-none"
              >
                {method === 'flowpay' && profile.passkey && settings.oneClick ? (
                  <>
                    <FingerPrintIcon className="h-5 w-5 mr-1.5" /> {won(total)} 1-Click 결제
                  </>
                ) : (
                  `${won(total)} 결제하기`
                )}
              </button>
            </motion.div>
          )}

          {step === 'auth' && (
            <motion.div key="auth" {...panel} className="p-6 py-14 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <FingerPrintIcon className="h-10 w-10 text-gray-900" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">생체 인증</h3>
              <p className="text-sm text-gray-500 mb-8">
                {profile.passkey
                  ? profile.passkey.simulated
                    ? '데모 패스키로 인증합니다.'
                    : '지문 또는 Face ID로 결제를 승인하세요.'
                  : '등록된 패스키가 없어 데모 인증으로 진행합니다.'}
              </p>
              <button onClick={authenticate} className="btn-primary w-full py-4 mb-2">
                {won(total)} 인증하기
              </button>
              <button onClick={() => setStep('payment')} className="btn-secondary w-full py-4">
                취소
              </button>
              {!profile.passkey && (
                <Link to="/settings" className="block text-sm text-flow-600 font-medium mt-5">
                  패스키 등록하러 가기
                </Link>
              )}
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div key="processing" {...panel} className="flex items-center justify-center py-24 px-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent mx-auto mb-6" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">결제 처리 중</h3>
                <p className="text-sm text-gray-500">
                  {method && METHOD_LABELS[method as PaymentMethodId]}(으)로 PG사와 연동하여 결제를 처리하고 있습니다…
                </p>
              </div>
            </motion.div>
          )}

          {step === 'workflow' && (
            <motion.div key="workflow" {...panel} className="p-6">
              <div className="text-center mb-8">
                <div className="icon-container icon-container-primary mx-auto mb-4">
                  <SparklesIcon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">FlowPay 결제 처리 중</h3>
                <p className="text-sm text-gray-500">결제부터 회계 처리까지 자동으로 진행합니다</p>
              </div>

              <div className="space-y-2">
                {workflowSteps.map((w, i) => {
                  const isDone = workflowStep > i || (i === workflowSteps.length - 1 && workflowStep >= i);
                  const isCurrent = workflowStep === i && !isDone;
                  return (
                    <div
                      key={w.title}
                      className={`flex items-center gap-3 rounded-2xl p-3.5 transition-colors duration-300 ${isDone || isCurrent ? 'bg-gray-50' : ''}`}
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
                        <h4 className={`text-sm font-medium ${isDone || isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>{w.title}</h4>
                        <p className="text-xs text-gray-400 truncate">{isDone ? w.description : ''}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>진행률</span>
                  <span>{Math.round(((workflowStep + 1) / workflowSteps.length) * 100)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${((workflowStep + 1) / workflowSteps.length) * 100}%` }} />
                </div>
              </div>
            </motion.div>
          )}

          {step === 'success' && result && (
            <motion.div key="success" {...panel} className="p-6 py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-success-500 text-white flex items-center justify-center mx-auto mb-6">
                <CheckCircleSolid className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">결제 완료</h3>
              <p className="text-sm text-gray-500 mb-8">
                {result.invoice
                  ? '거래 기록과 전표 생성까지 완료되었습니다.'
                  : result.transaction.method === 'flowpay'
                  ? '거래가 기록되었습니다. 전표는 전표 메뉴에서 생성할 수 있습니다.'
                  : '결제가 완료되었습니다. 영수증을 첨부하면 전표가 생성됩니다.'}
              </p>

              <div className="card-muted p-5 mb-8 text-left">
                <div className="space-y-2.5 text-sm">
                  <Row label="가맹점" value={result.transaction.merchant} />
                  <Row label="결제 금액" value={won(result.transaction.amount)} bold />
                  <Row label="결제 수단" value={METHOD_LABELS[result.transaction.method]} />
                  <Row label="Flow ID" value={result.transaction.flowId} mono />
                  <div className="border-t border-gray-200 my-1" />
                  <Row label="부서" value={departmentName(state, result.transaction.departmentId)} />
                  <Row
                    label="계정과목"
                    value={`${categoryById(result.transaction.categoryId).account} (${categoryById(result.transaction.categoryId).name})`}
                  />
                  <Row label="프로젝트" value={projectName(state, result.transaction.projectId)} />
                  <Row label="부서 예산 사용률" value={`${checkBudget(state, result.transaction.departmentId, 0).departmentPct.toFixed(0)}%`} />
                  {result.invoice && <Row label="전표" value={`${result.invoice.id} (승인자 ${result.invoice.approver})`} />}
                </div>
              </div>

              <div className="space-y-2">
                {result.invoice ? (
                  <button onClick={() => navigate(`/invoice?id=${result.invoice!.id}`)} className="btn-secondary w-full py-4">
                    전표 보기
                  </button>
                ) : result.transaction.method !== 'flowpay' ? (
                  <button onClick={() => navigate(`/receipt?tx=${result.transaction.id}`)} className="btn-secondary w-full py-4">
                    영수증 첨부하기
                  </button>
                ) : null}
                <button
                  onClick={() => {
                    resetPayment();
                    toast('새 결제를 시작합니다', 'info');
                  }}
                  className="btn-primary w-full py-4"
                >
                  새로운 결제
                </button>
              </div>
            </motion.div>
          )}

          {step === 'error' && (
            <motion.div key="error" {...panel} className="p-6 py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-error-500 text-white flex items-center justify-center mx-auto mb-6">
                <XMarkIcon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">결제 실패</h3>
              <p className="text-sm text-gray-500 mb-8">{errorMessage || '결제 처리 중 오류가 발생했습니다.'}</p>
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

const MethodButton: React.FC<{ selected: boolean; onClick: () => void; children: React.ReactNode }> = ({
  selected,
  onClick,
  children,
}) => (
  <button
    onClick={onClick}
    aria-pressed={selected}
    className={`flex items-start gap-2.5 p-4 rounded-2xl border text-left transition-all ${
      selected ? 'border-flow-500 bg-flow-50/50 ring-1 ring-flow-500' : 'border-gray-200 hover:border-gray-300'
    }`}
  >
    {children}
  </button>
);

export default PGPayment;
