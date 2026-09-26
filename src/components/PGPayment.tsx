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
  LockClosedIcon,
  BellAlertIcon,
  UserIcon,
  CubeIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import Logo, { LogoMark, FlowIdChip } from './Logo';
import { Row, useToast } from './ui';
import { useFlowPay } from '../store/FlowPayContext';
import { checkBudget, departmentName, projectName } from '../store/selectors';
import { CATEGORIES, GENERAL_METHODS, MERCHANTS, METHOD_LABELS, SIMPLE_METHODS, categoryById } from '../data/constants';
import { classify } from '../utils/classifier';
import { won } from '../utils/format';
import {
  AuthServerError,
  authorizationLabel,
  authorizePayment,
  hasServerPasskey,
  PasskeyCancelledError,
  PasskeyUnsupportedError,
} from '../utils/passkey';
import { CategoryId, Invoice, LineItem, PaymentAuthorization, PaymentMethodId, Transaction } from '../types';

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
  const [authBusy, setAuthBusy] = useState(false);
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

  const passkey = hasServerPasskey(profile.passkey) ? profile.passkey : undefined;

  const commit = (m: PaymentMethodId, authorization?: PaymentAuthorization) =>
    pay({
      merchant: merchant.name,
      items,
      method: m,
      departmentId: classification.departmentId,
      categoryId: classification.categoryId,
      projectId: classification.projectId,
      autoClassified: isAuto,
      memo: memo.trim() || undefined,
      authorization,
    });

  const runWorkflow = (authorization: PaymentAuthorization) => {
    const r = commit('flowpay', authorization);
    setResult(r);
    setStep('workflow');
    setWorkflowStep(1);
    for (let i = 2; i <= 5; i++) later(() => setWorkflowStep(i), (i - 1) * 650);
    later(() => setStep('success'), 5 * 650);
  };

  // 패스키 인증: 서버가 결제 내용에 묶인 챌린지를 발급하고, 생체인증 서명을 검증해 승인서를 발급
  const authenticate = async () => {
    if (!passkey || authBusy) return;
    setAuthBusy(true);
    try {
      const authorization = await authorizePayment({ flowId: profile.flowId, amount: total, merchant: merchant.name, passkey });
      runWorkflow(authorization);
    } catch (e) {
      if (e instanceof PasskeyUnsupportedError) {
        setErrorMessage('이 기기에서는 등록된 패스키를 사용할 수 없습니다. 설정에서 패스키를 다시 등록해주세요.');
      } else if (e instanceof PasskeyCancelledError) {
        setErrorMessage('생체 인증이 취소되어 결제가 진행되지 않았습니다.');
      } else if (e instanceof AuthServerError) {
        setErrorMessage(`인증 서버가 결제를 승인하지 않았습니다: ${e.message}`);
      } else {
        setErrorMessage('인증 중 알 수 없는 오류가 발생했습니다.');
      }
      setStep('error');
    } finally {
      setAuthBusy(false);
    }
  };

  // 데모 인증: 패스키가 없는 기기에서 시연용. 생체인증·서버 검증 없이 진행하며 거래에 '데모'로 기록
  const authenticateDemo = () => runWorkflow({ method: 'demo' });

  const handlePayment = () => {
    if (!method || blocked || !items.length) return;
    if (method === 'flowpay') {
      setStep('auth');
      // 1-Click: 등록된 패스키가 있으면 인증 창을 바로 띄움
      if (settings.oneClick && passkey) authenticate();
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

  const budgetAfter = result ? checkBudget(state, result.transaction.departmentId, 0) : null;

  const workflowSteps = [
    {
      title: '결제 인증',
      description:
        result?.transaction.authorization?.method === 'passkey'
          ? `서버 서명 검증 완료 · ${result.transaction.authorization.approvalId}`
          : '데모 인증 (서버 검증 없음)',
    },
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
          {step === 'cart' && (
            <motion.div key="cart" {...panel} className="p-6">
              <p className="text-sm font-medium text-gray-400 mb-1">주문</p>
              <h1 className="text-xl font-bold text-gray-900 mb-4">가맹점 선택</h1>
              <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1">
                {MERCHANTS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => selectMerchant(m.id)}
                    className={`flex-shrink-0 text-left px-4 py-2.5 rounded-2xl border-2 transition-all ${
                      merchantId === m.id ? 'border-flow-500 bg-flow-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-bold text-gray-900 whitespace-nowrap">{m.name}</div>
                    <div className="text-xs text-gray-400">{m.description}</div>
                  </button>
                ))}
              </div>

              <h2 className="text-sm font-semibold text-gray-500 mb-3">상품</h2>
              <div className="space-y-2 mb-6">
                {merchant.items.map((it, i) => {
                  const qty = quantities[`${merchant.id}:${i}`] ?? 0;
                  return (
                    <div key={it.name} className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${qty ? 'bg-flow-50' : 'bg-gray-50'}`}>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{it.name}</p>
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
                <span className="text-xl font-bold text-gray-900 tabular-nums">{won(total)}</span>
              </div>
              <button
                onClick={() => setStep('payment')}
                disabled={!items.length}
                className="btn-primary w-full py-4 text-base disabled:bg-gray-200 disabled:text-gray-400 disabled:pointer-events-none"
              >
                {won(total)} 결제하기
              </button>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div key="payment" {...panel} className="p-6">
              <button onClick={() => setStep('cart')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 mb-4 transition-colors">
                <ArrowLeftIcon className="h-4 w-4" />
                <span className="text-sm font-medium">상품 선택으로</span>
              </button>

              <div className="card-muted p-4 mb-6">
                <div className="flex justify-between items-center gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-gray-900 truncate">{merchant.name}</h2>
                    <p className="text-sm text-gray-500 truncate">
                      {items[0]?.name}
                      {items.length > 1 ? ` 외 ${items.length - 1}건` : ` × ${items[0]?.quantity}개`}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-gray-900 flex-shrink-0 tabular-nums">{won(total)}</p>
                </div>
              </div>

              {/* 간편 결제 */}
              <h3 className="text-sm font-semibold text-gray-500 mb-3">간편 결제</h3>
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {SIMPLE_METHODS.map((p) => (
                  <MethodButton key={p.id} selected={method === p.id} onClick={() => setMethod(p.id)} brand={p.id === 'flowpay'}>
                    {p.id === 'flowpay' ? (
                      <LogoMark className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    ) : (
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${p.brandColor}`} />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-900">{p.name}</div>
                      {p.benefit && (
                        <div className={`text-xs mt-0.5 ${p.id === 'flowpay' ? 'text-flow-700 font-medium' : 'text-gray-400'}`}>{p.benefit}</div>
                      )}
                    </div>
                  </MethodButton>
                ))}
              </div>

              {/* 일반 결제 */}
              <h3 className="text-sm font-semibold text-gray-500 mb-3">일반 결제</h3>
              <div className="grid grid-cols-2 gap-2.5 mb-6">
                {GENERAL_METHODS.map((p) => (
                  <MethodButton key={p.id} selected={method === p.id} onClick={() => setMethod(p.id)}>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{p.description}</div>
                    </div>
                  </MethodButton>
                ))}
              </div>

              {/* 자동 분류 */}
              {method && (
                <div className={`rounded-2xl p-4 mb-4 ${isAuto ? 'bg-flow-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-xs font-semibold flex items-center gap-1.5 ${isAuto ? 'text-flow-700' : 'text-gray-500'}`}>
                      {isAuto && <SparklesIcon className="h-4 w-4 text-flow-600" />}
                      {isAuto ? '자동 분류' : '분류'}
                    </h3>
                    <button
                      onClick={() => setEditClass((v) => !v)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 font-semibold"
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
                <span className="text-sm font-medium text-gray-500">내 Flow ID</span>
                <span className="font-bold tracking-wide text-flow-700">{profile.flowId}</span>
              </div>

              {method && method !== 'flowpay' && (
                <p className="text-xs text-gray-400 mb-3 text-center">일반 결제는 영수증을 첨부하면 전표가 생성됩니다.</p>
              )}

              <button
                onClick={handlePayment}
                disabled={!method || blocked}
                className="btn-primary w-full py-4 text-base disabled:bg-gray-200 disabled:text-gray-400 disabled:pointer-events-none"
              >
                {method === 'flowpay' && passkey && settings.oneClick ? (
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
            <motion.div key="auth" {...panel} className="p-6 py-10 text-center">
              <div className="rounded-3xl border border-gray-200 shadow-medium px-6 py-8 mb-4">
                <div className="flex items-center justify-center gap-6 mb-6 text-gray-700">
                  {authBusy ? (
                    <div className="h-14 flex items-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-flow-500 border-t-transparent" />
                    </div>
                  ) : (
                    <>
                      <FingerPrintIcon className="h-14 w-14" strokeWidth={1.2} />
                      <FaceIdIcon className="h-14 w-14" />
                    </>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 leading-snug mb-2">
                  {passkey ? (
                    <>
                      FlowPay로
                      <br />
                      {won(total)}을 결제하시겠습니까?
                    </>
                  ) : (
                    'FlowPay 인증키를 등록하시겠습니까?'
                  )}
                </h3>
                <p className="text-sm text-gray-500 mb-7">
                  {passkey
                    ? authBusy
                      ? '인증 창에서 지문 또는 Face ID로 승인하세요. 서명은 서버에서 검증됩니다.'
                      : '기기 내 생체 인증으로 결제가 진행됩니다.'
                    : '등록된 패스키가 없습니다. 설정에서 등록하거나 데모 인증으로 진행하세요.'}
                </p>
                {passkey ? (
                  <button onClick={authenticate} disabled={authBusy} className="btn-primary w-full py-3.5 text-base disabled:opacity-40">
                    {authBusy ? '인증 중…' : '인증하기'}
                  </button>
                ) : (
                  <Link to="/settings" className="btn-primary w-full py-3.5 text-base">
                    <FingerPrintIcon className="h-5 w-5 mr-1.5" /> 패스키 등록하러 가기
                  </Link>
                )}
              </div>
              <button onClick={() => setStep('payment')} disabled={authBusy} className="btn-secondary w-full py-3.5 disabled:opacity-40">
                다른 결제수단 선택
              </button>
              <button onClick={authenticateDemo} disabled={authBusy} className="block w-full text-sm text-gray-500 hover:text-gray-900 mt-5 disabled:opacity-40">
                데모 인증으로 진행 <span className="text-gray-400">(생체인증·서버 검증 없음)</span>
              </button>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div key="processing" {...panel} className="flex items-center justify-center py-24 px-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-9 w-9 border-[3px] border-flow-500 border-t-transparent mx-auto mb-6" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">결제 처리 중</h3>
                <p className="text-sm text-gray-500">
                  {method && METHOD_LABELS[method as PaymentMethodId]}(으)로 PG사와 연동하여 결제를 처리하고 있습니다…
                </p>
              </div>
            </motion.div>
          )}

          {step === 'workflow' && (
            <motion.div key="workflow" {...panel} className="p-6">
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
                <h3 className="text-lg font-bold text-gray-900 mb-1">가명 토큰으로 결제 기록 중</h3>
                <p className="text-sm text-gray-500 mb-3">개인정보 대신 Flow ID로 결제부터 회계 처리까지 연결합니다</p>
                <FlowIdChip flowId={result?.transaction.flowId ?? profile.flowId} className="max-w-full" />
              </div>

              <div className="space-y-1.5">
                {workflowSteps.map((w, i) => {
                  const isDone = workflowStep > i || (i === workflowSteps.length - 1 && workflowStep >= i);
                  const isCurrent = workflowStep === i && !isDone;
                  return (
                    <div
                      key={w.title}
                      className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 transition-colors duration-300 ${isCurrent ? 'bg-flow-50' : ''}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors ${
                          isDone
                            ? 'bg-flow-500 text-white'
                            : isCurrent
                            ? 'bg-white border-2 border-flow-500 text-flow-600'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {isDone ? <CheckIcon className="h-4 w-4" /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-semibold ${isDone || isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>{w.title}</h4>
                        <p className="text-xs text-gray-400 truncate">{isDone ? w.description : ''}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>진행률</span>
                  <span className="font-semibold text-flow-700 tabular-nums">{Math.round(((workflowStep + 1) / workflowSteps.length) * 100)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${((workflowStep + 1) / workflowSteps.length) * 100}%` }} />
                </div>
              </div>
            </motion.div>
          )}

          {step === 'success' && result && (
            <motion.div key="success" {...panel} className="p-6 py-8">
              {/* 발표자료 10번 ③ 자동 기록 카드 */}
              <div className="rounded-3xl border border-gray-200 shadow-medium p-5">
                <BellAlertIcon className="h-7 w-7 text-flow-500 mb-3" />
                <h3 className="text-xl font-bold text-gray-900 pb-3 mb-4 border-b-2 border-gray-200">결제 완료</h3>
                <div className="space-y-3 text-sm">
                  <ReceiptRow
                    icon={UserIcon}
                    tone="mint"
                    label="결제인"
                    value={`${profile.displayName || '익명 사용자'} · ${departmentName(state, result.transaction.departmentId)}`}
                  />
                  <ReceiptRow
                    icon={CubeIcon}
                    tone="sky"
                    label="품목 정보"
                    value={`${result.transaction.merchant} · ${result.transaction.items[0]?.name ?? ''}${
                      result.transaction.items.length > 1 ? ` 외 ${result.transaction.items.length - 1}건` : ''
                    }`}
                  />
                </div>
                <div className="flex items-baseline justify-end gap-2 mt-4">
                  <span className="text-xs text-gray-400">
                    남은 예산{' '}
                    <span className="tabular-nums">
                      {won(Math.max(0, budgetAfter!.departmentBudget - budgetAfter!.departmentSpent))}
                    </span>
                  </span>
                  <span className="text-2xl font-bold text-gray-900 tabular-nums">{won(result.transaction.amount)}</span>
                </div>
              </div>

              <div className="relative flex justify-center -my-3 z-10">
                <span className="w-9 h-9 rounded-full bg-gray-800 text-white flex items-center justify-center ring-4 ring-white">
                  <LinkIcon className="h-4 w-4" />
                </span>
              </div>
              <FlowIdChip flowId={result.transaction.flowId} className="w-full justify-center py-3 rounded-2xl" />

              <p className="text-sm text-gray-500 text-center mt-5 mb-4">
                {result.invoice
                  ? '거래 기록과 전표 생성까지 완료되었습니다.'
                  : result.transaction.method === 'flowpay'
                  ? '거래가 기록되었습니다. 전표는 전표 메뉴에서 생성할 수 있습니다.'
                  : '결제가 완료되었습니다. 영수증을 첨부하면 전표가 생성됩니다.'}
              </p>

              <div className="rounded-2xl bg-flow-50 p-4 mb-6 text-sm space-y-2.5">
                <p className="text-xs font-semibold text-flow-700">자동 처리 결과</p>
                <Row label="결제 수단" value={METHOD_LABELS[result.transaction.method]} />
                {result.transaction.authorization && (
                  <Row
                    label="결제 인증"
                    value={authorizationLabel(result.transaction.authorization)}
                    tone={result.transaction.authorization.method === 'demo' ? 'muted' : 'default'}
                  />
                )}
                {result.transaction.authorization?.approvalId && (
                  <Row label="승인 번호" value={result.transaction.authorization.approvalId} />
                )}
                <Row
                  label="계정과목"
                  value={`${categoryById(result.transaction.categoryId).account} (${categoryById(result.transaction.categoryId).name})`}
                />
                <Row label="프로젝트" value={projectName(state, result.transaction.projectId)} />
                <Row label="부서 예산 사용률" value={`${budgetAfter!.departmentPct.toFixed(0)}%`} />
                {result.invoice && <Row label="전표" value={`${result.invoice.id} (승인자 ${result.invoice.approver})`} />}
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
                  className="btn-primary w-full py-4 text-base"
                >
                  새로운 결제
                </button>
              </div>
            </motion.div>
          )}

          {step === 'error' && (
            <motion.div key="error" {...panel} className="p-6 py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-error-50 text-error-500 flex items-center justify-center mx-auto mb-6">
                <XMarkIcon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">결제 실패</h3>
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

const MethodButton: React.FC<{ selected: boolean; onClick: () => void; children: React.ReactNode; brand?: boolean }> = ({
  selected,
  onClick,
  children,
  brand,
}) => (
  <button
    onClick={onClick}
    aria-pressed={selected}
    className={`relative flex items-start gap-2.5 p-4 pr-8 rounded-2xl border-2 text-left transition-all ${
      selected
        ? 'border-flow-500 bg-flow-50'
        : brand
        ? 'border-flow-200 hover:border-flow-300'
        : 'border-gray-200 hover:border-gray-300'
    }`}
  >
    {children}
    {selected && (
      <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-flow-500 text-white flex items-center justify-center">
        <CheckIcon className="h-3 w-3" />
      </span>
    )}
  </button>
);

// Face ID 모양 아이콘 — 발표자료 인증 카드의 지문·얼굴 아이콘 쌍
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
    <span className="flex items-center gap-2 text-gray-500 flex-shrink-0">
      <span className={`w-6 h-6 rounded-md flex items-center justify-center ${tone === 'mint' ? 'bg-flow-100 text-flow-700' : 'bg-sky-100 text-sky-600'}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      {label}
    </span>
    <span className="font-semibold text-gray-900 text-right min-w-0 truncate">{value}</span>
  </div>
);

export default PGPayment;
