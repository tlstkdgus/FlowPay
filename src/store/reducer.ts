// 순수 상태 전이 함수. 컨텍스트와 분리해 단위 테스트가 가능하도록 합니다.

import {
  ApprovalStatus,
  Department,
  FlowPayState,
  Invoice,
  Profile,
  Receipt,
  Settings,
  Transaction,
} from '../types';
import { splitVat } from '../utils/tax';

export type Action =
  | { type: 'ADD_TRANSACTION'; transaction: Transaction; invoice?: Invoice }
  | { type: 'SAVE_RECEIPT'; receipt: Receipt; transaction?: Transaction }
  | { type: 'ADD_INVOICES'; invoices: Invoice[] }
  | { type: 'SET_APPROVAL'; ids: string[]; status: ApprovalStatus; reason?: string; at: string }
  | { type: 'SUBMIT_TAX'; ids: string[]; at: string }
  | { type: 'ACCEPT_TAX'; ids: string[] }
  | { type: 'UPDATE_TRANSACTION'; id: string; patch: Partial<Pick<Transaction, 'departmentId' | 'categoryId' | 'projectId' | 'memo'>> }
  | { type: 'CANCEL_TRANSACTION'; id: string; at: string }
  | { type: 'UPDATE_PROFILE'; patch: Partial<Profile> }
  | { type: 'REISSUE_FLOW_ID'; flowId: string }
  | { type: 'UPDATE_SETTINGS'; patch: Partial<Settings> }
  | { type: 'UPDATE_DEPARTMENT'; id: string; patch: Partial<Omit<Department, 'id'>> }
  | { type: 'REPLACE'; state: FlowPayState };

/** 거래로부터 전표를 만듭니다. 승인자는 부서별로 자동 배정됩니다. */
export const buildInvoice = (state: FlowPayState, tx: Transaction, seq: number, nowISO: string): Invoice => {
  const dept = state.departments.find((d) => d.id === tx.departmentId);
  return {
    id: `INV-${nowISO.slice(0, 4)}-${String(seq).padStart(4, '0')}`,
    transactionId: tx.id,
    flowId: tx.flowId,
    merchant: tx.merchant,
    amount: tx.amount,
    ...splitVat(tx.amount),
    date: tx.date,
    departmentId: tx.departmentId,
    projectId: tx.projectId,
    categoryId: tx.categoryId,
    items: tx.items,
    approvalStatus: 'pending',
    approver: dept?.approver ?? '미지정',
    taxStatus: 'not_submitted',
    createdAt: nowISO,
  };
};

const invoiceSeq = (id: string) => parseInt(id.split('-').pop() ?? '0', 10) || 0;

export const reducer = (state: FlowPayState, action: Action): FlowPayState => {
  switch (action.type) {
    case 'ADD_TRANSACTION': {
      const tx = action.invoice ? { ...action.transaction, invoiceId: action.invoice.id } : action.transaction;
      return {
        ...state,
        transactions: [tx, ...state.transactions],
        invoices: action.invoice ? [action.invoice, ...state.invoices] : state.invoices,
        counters: action.invoice
          ? { invoice: Math.max(state.counters.invoice, invoiceSeq(action.invoice.id)) }
          : state.counters,
      };
    }

    case 'SAVE_RECEIPT': {
      const { receipt, transaction } = action;
      let transactions = state.transactions;
      if (transaction) {
        transactions = [{ ...transaction, receiptId: receipt.id }, ...transactions];
      } else if (receipt.transactionId) {
        transactions = transactions.map((t) => (t.id === receipt.transactionId ? { ...t, receiptId: receipt.id } : t));
      }
      return { ...state, transactions, receipts: [receipt, ...state.receipts] };
    }

    case 'ADD_INVOICES': {
      if (!action.invoices.length) return state;
      const byTx = new Map(action.invoices.map((i) => [i.transactionId, i.id]));
      return {
        ...state,
        invoices: [...action.invoices, ...state.invoices],
        transactions: state.transactions.map((t) => (byTx.has(t.id) ? { ...t, invoiceId: byTx.get(t.id) } : t)),
        counters: { invoice: Math.max(state.counters.invoice, ...action.invoices.map((i) => invoiceSeq(i.id))) },
      };
    }

    case 'SET_APPROVAL': {
      const ids = new Set(action.ids);
      return {
        ...state,
        invoices: state.invoices.map((inv) =>
          ids.has(inv.id) && inv.approvalStatus === 'pending'
            ? {
                ...inv,
                approvalStatus: action.status,
                approvalDate: action.at,
                rejectReason: action.status === 'rejected' ? action.reason || '사유 미기재' : undefined,
              }
            : inv
        ),
      };
    }

    case 'SUBMIT_TAX': {
      const ids = new Set(action.ids);
      return {
        ...state,
        invoices: state.invoices.map((inv) =>
          ids.has(inv.id) && inv.approvalStatus === 'approved' && inv.taxStatus === 'not_submitted'
            ? { ...inv, taxStatus: 'submitted', submittedAt: action.at }
            : inv
        ),
      };
    }

    case 'ACCEPT_TAX': {
      const ids = new Set(action.ids);
      return {
        ...state,
        invoices: state.invoices.map((inv) =>
          ids.has(inv.id) && inv.taxStatus === 'submitted'
            ? { ...inv, taxStatus: 'accepted', ntsReference: `NTS-${inv.id.slice(4)}` }
            : inv
        ),
      };
    }

    case 'UPDATE_TRANSACTION': {
      const tx = state.transactions.find((t) => t.id === action.id);
      if (!tx) return state;
      const updated: Transaction = { ...tx, ...action.patch, autoClassified: false };
      const dept = state.departments.find((d) => d.id === updated.departmentId);
      return {
        ...state,
        transactions: state.transactions.map((t) => (t.id === action.id ? updated : t)),
        // 결재 전인 전표만 분류 변경을 반영
        invoices: state.invoices.map((inv) =>
          inv.transactionId === action.id && inv.approvalStatus === 'pending'
            ? {
                ...inv,
                departmentId: updated.departmentId,
                categoryId: updated.categoryId,
                projectId: updated.projectId,
                approver: dept?.approver ?? inv.approver,
              }
            : inv
        ),
      };
    }

    case 'CANCEL_TRANSACTION': {
      return {
        ...state,
        transactions: state.transactions.map((t) => (t.id === action.id ? { ...t, status: 'cancelled' } : t)),
        invoices: state.invoices.map((inv) =>
          inv.transactionId === action.id && inv.taxStatus === 'not_submitted'
            ? { ...inv, approvalStatus: 'rejected', approvalDate: action.at, rejectReason: '결제 취소' }
            : inv
        ),
      };
    }

    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.patch } };

    case 'REISSUE_FLOW_ID':
      // 재발급 시 기존 패스키는 이전 Flow ID에 묶여 있으므로 해제합니다.
      return {
        ...state,
        profile: {
          ...state.profile,
          flowId: action.flowId,
          previousFlowIds: [state.profile.flowId, ...state.profile.previousFlowIds].slice(0, 10),
          passkey: undefined,
        },
      };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case 'UPDATE_DEPARTMENT': {
      const departments = state.departments.map((d) => (d.id === action.id ? { ...d, ...action.patch } : d));
      const approver = action.patch.approver;
      return {
        ...state,
        departments,
        invoices: approver
          ? state.invoices.map((inv) =>
              inv.departmentId === action.id && inv.approvalStatus === 'pending' ? { ...inv, approver } : inv
            )
          : state.invoices,
      };
    }

    case 'REPLACE':
      return action.state;

    default:
      return state;
  }
};
