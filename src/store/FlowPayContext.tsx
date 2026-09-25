import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ApprovalStatus,
  CategoryId,
  Department,
  FlowPayState,
  Invoice,
  LineItem,
  PaymentMethodId,
  Profile,
  Receipt,
  Settings,
  Transaction,
} from '../types';
import { createSeedState, STATE_VERSION } from '../data/seed';
import { Action, buildInvoice, reducer } from './reducer';
import { toLocalISO } from '../utils/format';
import { generateFlowId, shortId } from '../utils/flowId';

export const STORAGE_KEY = 'flowpay:state';

const loadState = (): FlowPayState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FlowPayState;
      if (parsed.version === STATE_VERSION) return parsed;
    }
  } catch {
    // 손상된 데이터는 무시하고 초기 데이터로 시작
  }
  return createSeedState();
};

const saveState = (state: FlowPayState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 저장 공간 초과 시 영수증 미리보기 이미지를 제거하고 다시 시도
    try {
      const slim = { ...state, receipts: state.receipts.map(({ thumbnail, ...r }) => r) };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    } catch {
      /* 저장 불가 환경 (사생활 보호 모드 등) */
    }
  }
};

export interface PayInput {
  merchant: string;
  items: LineItem[];
  method: PaymentMethodId;
  departmentId: string;
  categoryId: CategoryId;
  projectId?: string;
  autoClassified: boolean;
  memo?: string;
}

export interface ReceiptInput {
  merchant: string;
  amount: number;
  date: string;
  businessNumber?: string;
  items: LineItem[];
  confidence?: number;
  rawText?: string;
  thumbnail?: string;
  /** 기존 거래에 연결 */
  linkTransactionId?: string;
  /** 새 거래로 등록할 때의 분류 */
  departmentId: string;
  categoryId: CategoryId;
  projectId?: string;
}

interface FlowPayContextValue {
  state: FlowPayState;
  pay: (input: PayInput) => { transaction: Transaction; invoice?: Invoice };
  saveReceipt: (input: ReceiptInput) => { receipt: Receipt; transaction: Transaction };
  createInvoices: (transactionIds: string[]) => Invoice[];
  setApproval: (ids: string[], status: ApprovalStatus, reason?: string) => void;
  submitTax: (ids: string[]) => void;
  updateTransaction: (
    id: string,
    patch: Partial<Pick<Transaction, 'departmentId' | 'categoryId' | 'projectId' | 'memo'>>
  ) => void;
  cancelTransaction: (id: string) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  reissueFlowId: () => string;
  updateSettings: (patch: Partial<Settings>) => void;
  updateDepartment: (id: string, patch: Partial<Omit<Department, 'id'>>) => void;
  resetDemo: () => void;
}

const FlowPayContext = createContext<FlowPayContextValue | null>(null);

export const FlowPayProvider: React.FC<{ children: React.ReactNode; initialState?: FlowPayState }> = ({
  children,
  initialState,
}) => {
  const [state, setState] = useState<FlowPayState>(() => initialState ?? loadState());
  // 같은 이벤트 루프에서 연속으로 호출해도 최신 상태를 기준으로 계산하도록 ref로 동기 관리
  const stateRef = useRef(state);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const dispatch = useCallback((action: Action) => {
    stateRef.current = reducer(stateRef.current, action);
    setState(stateRef.current);
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  // 다른 탭에서 변경된 내용 동기화
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const next = JSON.parse(e.newValue) as FlowPayState;
        if (next.version === STATE_VERSION) {
          stateRef.current = next;
          setState(next);
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('storage', onStorage);
    const pending = timers.current;
    return () => {
      window.removeEventListener('storage', onStorage);
      pending.forEach(clearTimeout);
    };
  }, []);

  const nextInvoices = useCallback((txs: Transaction[], nowISO: string): Invoice[] => {
    let seq = stateRef.current.counters.invoice;
    return txs.map((tx) => buildInvoice(stateRef.current, tx, ++seq, nowISO));
  }, []);

  const pay = useCallback(
    (input: PayInput) => {
      const s = stateRef.current;
      const now = toLocalISO(new Date());
      const transaction: Transaction = {
        id: `TX-${shortId(8)}`,
        flowId: s.profile.flowId,
        merchant: input.merchant,
        amount: input.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        date: now,
        departmentId: input.departmentId,
        projectId: input.projectId,
        categoryId: input.categoryId,
        method: input.method,
        items: input.items,
        status: 'completed',
        autoClassified: input.autoClassified,
        memo: input.memo,
      };
      // FlowPay 결제는 자동 전표 생성 (설정에서 끌 수 있음). 일반 결제는 영수증 첨부 후 전표 생성.
      const invoice =
        input.method === 'flowpay' && s.settings.autoInvoice ? nextInvoices([transaction], now)[0] : undefined;
      dispatch({ type: 'ADD_TRANSACTION', transaction, invoice });
      return { transaction: invoice ? { ...transaction, invoiceId: invoice.id } : transaction, invoice };
    },
    [dispatch, nextInvoices]
  );

  const saveReceipt = useCallback(
    (input: ReceiptInput) => {
      const s = stateRef.current;
      const now = toLocalISO(new Date());
      const receiptId = `RC-${shortId(8)}`;
      const existing = input.linkTransactionId
        ? s.transactions.find((t) => t.id === input.linkTransactionId)
        : undefined;

      // 연결할 거래가 없으면 무기명 카드 오프라인 결제로 새 거래를 등록
      const created: Transaction | undefined = existing
        ? undefined
        : {
            id: `TX-${shortId(8)}`,
            flowId: s.profile.flowId,
            merchant: input.merchant,
            amount: input.amount,
            date: `${input.date}T${now.slice(11)}`,
            departmentId: input.departmentId,
            projectId: input.projectId,
            categoryId: input.categoryId,
            method: 'offline',
            items: input.items.length ? input.items : [{ name: input.merchant, quantity: 1, price: input.amount }],
            status: 'completed',
            autoClassified: s.settings.autoClassify,
          };
      const transaction = (existing ?? created)!;
      const receipt: Receipt = {
        id: receiptId,
        transactionId: transaction.id,
        merchant: input.merchant,
        amount: input.amount,
        date: input.date,
        businessNumber: input.businessNumber,
        items: input.items,
        confidence: input.confidence,
        rawText: input.rawText,
        thumbnail: input.thumbnail,
        createdAt: now,
      };
      dispatch({ type: 'SAVE_RECEIPT', receipt, transaction: created });
      return { receipt, transaction: { ...transaction, receiptId } };
    },
    [dispatch]
  );

  const createInvoices = useCallback(
    (transactionIds: string[]) => {
      const s = stateRef.current;
      const txs = s.transactions.filter((t) => transactionIds.includes(t.id) && !t.invoiceId && t.status === 'completed');
      const invoices = nextInvoices(txs, toLocalISO(new Date()));
      dispatch({ type: 'ADD_INVOICES', invoices });
      return invoices;
    },
    [dispatch, nextInvoices]
  );

  const setApproval = useCallback(
    (ids: string[], status: ApprovalStatus, reason?: string) =>
      dispatch({ type: 'SET_APPROVAL', ids, status, reason, at: toLocalISO(new Date()) }),
    [dispatch]
  );

  // 국세청(홈택스) 전송 시뮬레이션: 전송 → 1.5초 후 접수 완료
  const submitTax = useCallback(
    (ids: string[]) => {
      dispatch({ type: 'SUBMIT_TAX', ids, at: toLocalISO(new Date()) });
      timers.current.push(setTimeout(() => dispatch({ type: 'ACCEPT_TAX', ids }), 1500));
    },
    [dispatch]
  );

  const value = useMemo<FlowPayContextValue>(
    () => ({
      state,
      pay,
      saveReceipt,
      createInvoices,
      setApproval,
      submitTax,
      updateTransaction: (id, patch) => dispatch({ type: 'UPDATE_TRANSACTION', id, patch }),
      cancelTransaction: (id) => dispatch({ type: 'CANCEL_TRANSACTION', id, at: toLocalISO(new Date()) }),
      updateProfile: (patch) => dispatch({ type: 'UPDATE_PROFILE', patch }),
      reissueFlowId: () => {
        const p = stateRef.current.profile;
        const flowId = generateFlowId([p.flowId, ...p.previousFlowIds]);
        dispatch({ type: 'REISSUE_FLOW_ID', flowId });
        return flowId;
      },
      updateSettings: (patch) => dispatch({ type: 'UPDATE_SETTINGS', patch }),
      updateDepartment: (id, patch) => dispatch({ type: 'UPDATE_DEPARTMENT', id, patch }),
      resetDemo: () => dispatch({ type: 'REPLACE', state: createSeedState() }),
    }),
    [state, pay, saveReceipt, createInvoices, setApproval, submitTax, dispatch]
  );

  return <FlowPayContext.Provider value={value}>{children}</FlowPayContext.Provider>;
};

export const useFlowPay = (): FlowPayContextValue => {
  const ctx = useContext(FlowPayContext);
  if (!ctx) throw new Error('useFlowPay must be used within FlowPayProvider');
  return ctx;
};
