import { FlowPayState, Transaction } from '../types';
import { DateRange, inRange, isSameMonth } from '../utils/format';

export const completed = (txs: Transaction[]) => txs.filter((t) => t.status === 'completed');

export const sum = (txs: Transaction[]) => txs.reduce((s, t) => s + t.amount, 0);

/** 현재 Flow ID와 재발급 전 Flow ID 모두 '내 거래'로 봅니다. */
export const myFlowIds = (state: FlowPayState) => [state.profile.flowId, ...state.profile.previousFlowIds];

export const myTransactions = (state: FlowPayState) => {
  const ids = new Set(myFlowIds(state));
  return state.transactions.filter((t) => ids.has(t.flowId));
};

export const inPeriod = (txs: Transaction[], range: DateRange) => txs.filter((t) => inRange(t.date, range));

export const monthSpentByDepartment = (state: FlowPayState, departmentId: string, ref = new Date()) =>
  sum(completed(state.transactions).filter((t) => t.departmentId === departmentId && isSameMonth(t.date, ref)));

export const myMonthSpent = (state: FlowPayState, ref = new Date()) =>
  sum(completed(myTransactions(state)).filter((t) => isSameMonth(t.date, ref)));

export const projectSpent = (state: FlowPayState, projectId: string) =>
  sum(completed(state.transactions).filter((t) => t.projectId === projectId));

export interface BudgetCheck {
  departmentSpent: number;
  departmentBudget: number;
  departmentAfter: number;
  departmentPct: number;
  personalSpent: number;
  personalLimit: number;
  personalAfter: number;
  overDepartment: boolean;
  overPersonal: boolean;
  nearDepartment: boolean;
}

/** 결제 전 부서 예산·개인 한도 검사 */
export const checkBudget = (state: FlowPayState, departmentId: string, amount: number, ref = new Date()): BudgetCheck => {
  const dept = state.departments.find((d) => d.id === departmentId);
  const departmentBudget = dept?.budget ?? 0;
  const departmentSpent = monthSpentByDepartment(state, departmentId, ref);
  const personalSpent = myMonthSpent(state, ref);
  const departmentAfter = departmentSpent + amount;
  const personalAfter = personalSpent + amount;
  const departmentPct = departmentBudget ? (departmentAfter / departmentBudget) * 100 : 0;
  return {
    departmentSpent,
    departmentBudget,
    departmentAfter,
    departmentPct,
    personalSpent,
    personalLimit: state.profile.monthlyLimit,
    personalAfter,
    overDepartment: departmentBudget > 0 && departmentAfter > departmentBudget,
    overPersonal: personalAfter > state.profile.monthlyLimit,
    nearDepartment: departmentPct >= state.settings.alertThreshold,
  };
};

export const departmentName = (state: FlowPayState, id?: string) =>
  state.departments.find((d) => d.id === id)?.name ?? '미지정';

export const projectName = (state: FlowPayState, id?: string) =>
  state.projects.find((p) => p.id === id)?.name ?? '없음';

/** 영수증 매칭 후보: 금액이 같고(±1%), 날짜가 3일 이내이며 영수증이 없는 거래 */
export const receiptCandidates = (state: FlowPayState, amount: number, date?: string): Transaction[] => {
  if (!amount) return [];
  const target = date ? new Date(`${date}T12:00:00`).getTime() : Date.now();
  return completed(state.transactions)
    .filter((t) => !t.receiptId)
    .filter((t) => Math.abs(t.amount - amount) <= Math.max(10, amount * 0.01))
    .filter((t) => Math.abs(new Date(`${t.date.slice(0, 10)}T12:00:00`).getTime() - target) <= 3 * 86400000)
    .slice(0, 5);
};

/** FlowPay 결제는 PG 전자영수증이 자동 수집되므로, 그 외 결제만 영수증 첨부가 필요합니다. */
export const needsReceipt = (t: Transaction) => t.status === 'completed' && !t.receiptId && t.method !== 'flowpay';
