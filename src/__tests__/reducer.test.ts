import { buildInvoice, reducer } from '../store/reducer';
import { checkBudget, receiptCandidates } from '../store/selectors';
import { createSeedState } from '../data/seed';
import { Transaction } from '../types';
import { splitVat } from '../utils/tax';

const NOW = new Date(2024, 5, 20, 10, 0, 0);

const tx = (over: Partial<Transaction> = {}): Transaction => ({
  id: 'TX-TEST',
  flowId: 'XK8P2M',
  merchant: '테스트 상점',
  amount: 11000,
  date: '2024-06-20T10:00:00',
  departmentId: 'mgmt',
  categoryId: 'supplies',
  method: 'card',
  items: [{ name: '볼펜', quantity: 1, price: 11000 }],
  status: 'completed',
  autoClassified: true,
  ...over,
});

describe('seed', () => {
  it('결정적으로 생성되며 거래·전표가 서로 연결된다', () => {
    const a = createSeedState(NOW);
    const b = createSeedState(NOW);
    expect(a.transactions.length).toBe(b.transactions.length);
    expect(a.transactions.length).toBeGreaterThan(100);
    for (const inv of a.invoices) {
      expect(a.transactions.find((t) => t.id === inv.transactionId)?.invoiceId).toBe(inv.id);
    }
  });
});

describe('reducer', () => {
  const base = createSeedState(NOW);

  it('부가세를 10%로 분리한다', () => {
    expect(splitVat(11000)).toEqual({ supplyAmount: 10000, vat: 1000 });
    const { supplyAmount, vat } = splitVat(14000);
    expect(supplyAmount + vat).toBe(14000);
  });

  it('전표 승인자는 부서별로 자동 배정된다', () => {
    const inv = buildInvoice(base, tx({ departmentId: 'dev' }), 999, '2024-06-20T10:00:00');
    expect(inv.approver).toBe('박팀장');
    expect(inv.id).toBe('INV-2024-0999');
  });

  it('거래 추가 시 전표와 연결하고 카운터를 올린다', () => {
    const inv = buildInvoice(base, tx(), base.counters.invoice + 1, '2024-06-20T10:00:00');
    const next = reducer(base, { type: 'ADD_TRANSACTION', transaction: tx(), invoice: inv });
    expect(next.transactions[0].invoiceId).toBe(inv.id);
    expect(next.counters.invoice).toBe(base.counters.invoice + 1);
  });

  it('승인·국세청 전송은 올바른 상태에서만 적용된다', () => {
    const inv = buildInvoice(base, tx(), 5000, '2024-06-20T10:00:00');
    let s = reducer(base, { type: 'ADD_TRANSACTION', transaction: tx(), invoice: inv });
    // 승인 전 전송 불가
    s = reducer(s, { type: 'SUBMIT_TAX', ids: [inv.id], at: 'x' });
    expect(s.invoices[0].taxStatus).toBe('not_submitted');
    s = reducer(s, { type: 'SET_APPROVAL', ids: [inv.id], status: 'approved', at: '2024-06-21T09:00:00' });
    s = reducer(s, { type: 'SUBMIT_TAX', ids: [inv.id], at: 'x' });
    s = reducer(s, { type: 'ACCEPT_TAX', ids: [inv.id] });
    expect(s.invoices[0]).toMatchObject({ approvalStatus: 'approved', taxStatus: 'accepted', ntsReference: 'NTS-2024-5000' });
    // 이미 결재된 전표는 다시 반려되지 않음
    s = reducer(s, { type: 'SET_APPROVAL', ids: [inv.id], status: 'rejected', at: 'y' });
    expect(s.invoices[0].approvalStatus).toBe('approved');
  });

  it('분류 수정은 결재 대기 전표에 반영되고 승인자도 바뀐다', () => {
    const inv = buildInvoice(base, tx(), 5001, '2024-06-20T10:00:00');
    let s = reducer(base, { type: 'ADD_TRANSACTION', transaction: tx(), invoice: inv });
    s = reducer(s, { type: 'UPDATE_TRANSACTION', id: 'TX-TEST', patch: { departmentId: 'sales', categoryId: 'meal' } });
    expect(s.transactions[0]).toMatchObject({ departmentId: 'sales', autoClassified: false });
    expect(s.invoices[0]).toMatchObject({ departmentId: 'sales', categoryId: 'meal', approver: '김과장' });
  });

  it('결제 취소 시 미전송 전표는 반려 처리된다', () => {
    const inv = buildInvoice(base, tx(), 5002, '2024-06-20T10:00:00');
    let s = reducer(base, { type: 'ADD_TRANSACTION', transaction: tx(), invoice: inv });
    s = reducer(s, { type: 'CANCEL_TRANSACTION', id: 'TX-TEST', at: 'z' });
    expect(s.transactions[0].status).toBe('cancelled');
    expect(s.invoices[0]).toMatchObject({ approvalStatus: 'rejected', rejectReason: '결제 취소' });
  });

  it('Flow ID 재발급 시 이전 ID를 보관하고 패스키를 해제한다', () => {
    const withKey = reducer(base, {
      type: 'UPDATE_PROFILE',
      patch: { passkey: { credentialId: 'x', certificate: 'c', createdAt: 'y' } },
    });
    const s = reducer(withKey, { type: 'REISSUE_FLOW_ID', flowId: 'ABCDEF' });
    expect(s.profile).toMatchObject({ flowId: 'ABCDEF', previousFlowIds: ['XK8P2M'], passkey: undefined });
  });

  it('영수증 저장 시 기존 거래에 연결하고 매칭 후보에서 빠진다', () => {
    let s = reducer(base, { type: 'ADD_TRANSACTION', transaction: tx({ amount: 12345 }) });
    expect(receiptCandidates(s, 12345, '2024-06-21').map((t) => t.id)).toContain('TX-TEST');
    s = reducer(s, {
      type: 'SAVE_RECEIPT',
      receipt: { id: 'RC-T', transactionId: 'TX-TEST', merchant: '테스트', amount: 12345, date: '2024-06-20', items: [], createdAt: 'x' },
    });
    expect(s.transactions[0].receiptId).toBe('RC-T');
    expect(receiptCandidates(s, 12345, '2024-06-21').map((t) => t.id)).not.toContain('TX-TEST');
  });

  it('예산 검사는 부서 예산과 개인 한도 초과를 판단한다', () => {
    const b = checkBudget(base, 'mgmt', 100000000, NOW);
    expect(b.overDepartment).toBe(true);
    expect(b.overPersonal).toBe(true);
    expect(checkBudget(base, 'mgmt', 0, NOW).overPersonal).toBe(false);
  });
});
