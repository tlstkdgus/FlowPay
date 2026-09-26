// 데모용 초기 데이터
// 오늘 기준 최근 6개월 거래를 고정 시드 난수로 생성하므로 새로고침해도 같은 데이터가 만들어집니다.

import { CategoryId, FlowPayState, Invoice, LineItem, PaymentMethodId, Receipt, Transaction } from '../types';
import { DEFAULT_DEPARTMENTS, DEFAULT_PROJECTS } from './constants';
import { toLocalISO } from '../utils/format';
import { splitVat } from '../utils/tax';

export const STATE_VERSION = 2;
export const DEMO_FLOW_ID = 'XK8P2M';

const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

interface Template {
  merchant: string;
  categoryId: CategoryId;
  items: LineItem[];
  hour: [number, number];
}

const TEMPLATES: Template[] = [
  { merchant: '스타벅스 강남점', categoryId: 'meal', items: [{ name: '아메리카노', quantity: 2, price: 4500 }], hour: [8, 16] },
  { merchant: '이디야커피 역삼점', categoryId: 'meal', items: [{ name: '카페라떼', quantity: 3, price: 3900 }], hour: [9, 17] },
  { merchant: '맥도날드 선릉점', categoryId: 'meal', items: [{ name: '빅맥 세트', quantity: 1, price: 8500 }], hour: [11, 14] },
  { merchant: '본죽&비빔밥 역삼점', categoryId: 'meal', items: [{ name: '비빔밥', quantity: 4, price: 9500 }], hour: [11, 13] },
  { merchant: '카카오T 택시', categoryId: 'transport', items: [{ name: '택시 요금', quantity: 1, price: 16800 }], hour: [19, 23] },
  { merchant: '코레일 KTX', categoryId: 'transport', items: [{ name: 'KTX 서울-부산', quantity: 1, price: 59800 }], hour: [7, 10] },
  { merchant: 'GS칼텍스 강남주유소', categoryId: 'transport', items: [{ name: '휘발유', quantity: 1, price: 70000 }], hour: [8, 18] },
  { merchant: '알파문구 온라인몰', categoryId: 'supplies', items: [{ name: 'A4용지', quantity: 2, price: 25000 }], hour: [10, 17] },
  { merchant: 'GS25 본사점', categoryId: 'supplies', items: [{ name: '건전지', quantity: 2, price: 3500 }, { name: '볼펜', quantity: 5, price: 1000 }], hour: [9, 18] },
  { merchant: '다이소 역삼점', categoryId: 'supplies', items: [{ name: '파일 바인더', quantity: 6, price: 2000 }], hour: [12, 18] },
  { merchant: '스파크플러스 회의실', categoryId: 'meeting', items: [{ name: '회의실 대관 2시간', quantity: 1, price: 44000 }], hour: [10, 16] },
  { merchant: '파리바게뜨 테헤란점', categoryId: 'meeting', items: [{ name: '회의 다과 세트', quantity: 1, price: 38000 }], hour: [9, 15] },
  { merchant: '올리브영 강남본점', categoryId: 'welfare', items: [{ name: '생일 선물 세트', quantity: 1, price: 32000 }], hour: [12, 19] },
  { merchant: '온누리약국', categoryId: 'welfare', items: [{ name: '상비약', quantity: 1, price: 18000 }], hour: [9, 18] },
  { merchant: '한우명가 삼성점', categoryId: 'entertainment', items: [{ name: '한우 코스', quantity: 4, price: 55000 }], hour: [18, 21] },
  { merchant: '교보문고 광화문점', categoryId: 'education', items: [{ name: '기술 도서', quantity: 2, price: 32000 }], hour: [12, 19] },
  { merchant: '인프런', categoryId: 'education', items: [{ name: '온라인 강의', quantity: 1, price: 77000 }], hour: [10, 22] },
];

/** 부서별 템플릿 가중치: 부서 특성에 맞는 지출이 더 자주 나오도록 */
const DEPT_WEIGHTS: Record<string, CategoryId[]> = {
  mgmt: ['supplies', 'supplies', 'supplies', 'meal', 'welfare', 'meeting'],
  sales: ['meal', 'meal', 'transport', 'transport', 'entertainment', 'meeting'],
  marketing: ['meal', 'meeting', 'meeting', 'supplies', 'transport', 'education'],
  dev: ['meal', 'meal', 'education', 'education', 'transport', 'supplies'],
  hr: ['welfare', 'welfare', 'meal', 'meeting', 'supplies', 'education'],
};

/** 다른 구성원들의 Flow ID (익명 토큰) */
const MEMBERS: { flowId: string; departmentId: string }[] = [
  { flowId: DEMO_FLOW_ID, departmentId: 'mgmt' },
  { flowId: 'R7QW3N', departmentId: 'mgmt' },
  { flowId: 'B4TZ9H', departmentId: 'sales' },
  { flowId: 'M2VK8C', departmentId: 'sales' },
  { flowId: 'H9JD4P', departmentId: 'sales' },
  { flowId: 'W6NE2Y', departmentId: 'marketing' },
  { flowId: 'T3GA7U', departmentId: 'marketing' },
  { flowId: 'P8SF5K', departmentId: 'dev' },
  { flowId: 'E5CX2R', departmentId: 'dev' },
  { flowId: 'N4YH6B', departmentId: 'hr' },
];

const METHODS: PaymentMethodId[] = ['flowpay', 'flowpay', 'flowpay', 'flowpay', 'offline', 'card', 'naver', 'kakao'];

export const createSeedState = (now: Date = new Date()): FlowPayState => {
  const rand = mulberry32(20240115);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

  const transactions: Transaction[] = [];
  const receipts: Receipt[] = [];
  const invoices: Invoice[] = [];
  let invoiceSeq = 0;

  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const departments = DEFAULT_DEPARTMENTS;

  for (let day = new Date(start); day <= now; day.setDate(day.getDate() + 1)) {
    const weekday = day.getDay();
    if (weekday === 0 || weekday === 6) continue;
    const count = 2 + Math.floor(rand() * 3);
    for (let n = 0; n < count; n++) {
      const member = pick(MEMBERS);
      const categoryId = pick(DEPT_WEIGHTS[member.departmentId]);
      const template = pick(TEMPLATES.filter((t) => t.categoryId === categoryId));
      const hour = template.hour[0] + Math.floor(rand() * (template.hour[1] - template.hour[0] + 1));
      const date = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, Math.floor(rand() * 60));
      if (date > now) continue;

      // 금액에 ±30% 변동
      const factor = 0.7 + rand() * 0.6;
      const items = template.items.map((i) => ({ ...i, price: Math.round((i.price * factor) / 100) * 100 }));
      const amount = items.reduce((s, i) => s + i.price * i.quantity, 0);
      const method = pick(METHODS);
      const project = DEFAULT_PROJECTS.find((p) => p.departmentId === member.departmentId);
      const idx = transactions.length + 1;
      const tx: Transaction = {
        id: `TX-${String(idx).padStart(5, '0')}`,
        flowId: member.flowId,
        merchant: template.merchant,
        amount,
        date: toLocalISO(date),
        departmentId: member.departmentId,
        projectId: rand() < 0.8 ? project?.id : undefined,
        categoryId,
        method,
        items,
        status: rand() < 0.02 ? 'cancelled' : 'completed',
        autoClassified: method === 'flowpay' || rand() < 0.6,
      };

      const ageDays = (now.getTime() - date.getTime()) / 86400000;

      // 영수증: 오래된 거래는 대부분 첨부, 최근 거래 일부는 미첨부
      if (tx.status === 'completed' && (ageDays > 10 ? rand() < 0.95 : rand() < 0.6)) {
        const r: Receipt = {
          id: `RC-${String(idx).padStart(5, '0')}`,
          transactionId: tx.id,
          merchant: tx.merchant,
          amount,
          date: tx.date.slice(0, 10),
          items,
          confidence: 85 + Math.round(rand() * 140) / 10,
          createdAt: tx.date,
        };
        receipts.push(r);
        tx.receiptId = r.id;
      }

      // 전표: FlowPay 결제 또는 영수증이 있는 거래
      if (tx.status === 'completed' && (tx.method === 'flowpay' || tx.receiptId)) {
        invoiceSeq += 1;
        const dept = departments.find((d) => d.id === tx.departmentId)!;
        const old = ageDays > 7;
        const approvalStatus = old ? (rand() < 0.96 ? 'approved' : 'rejected') : rand() < 0.5 ? 'approved' : 'pending';
        const approvalDate = new Date(date.getTime() + 86400000 * (1 + Math.floor(rand() * 2)));
        const inv: Invoice = {
          id: `INV-${date.getFullYear()}-${String(invoiceSeq).padStart(4, '0')}`,
          transactionId: tx.id,
          flowId: tx.flowId,
          merchant: tx.merchant,
          amount,
          ...splitVat(amount),
          date: tx.date,
          departmentId: tx.departmentId,
          projectId: tx.projectId,
          categoryId,
          items,
          approvalStatus,
          approver: dept.approver,
          approvalDate: approvalStatus === 'pending' ? undefined : toLocalISO(approvalDate > now ? now : approvalDate),
          rejectReason: approvalStatus === 'rejected' ? pick(['증빙 불충분', '예산 항목 불일치', '업무 관련성 확인 필요']) : undefined,
          taxStatus: approvalStatus === 'approved' && ageDays > 14 ? 'accepted' : 'not_submitted',
          createdAt: tx.date,
        };
        if (inv.taxStatus === 'accepted') {
          inv.ntsReference = `NTS-${inv.id.slice(4)}`;
          inv.submittedAt = inv.approvalDate;
        }
        invoices.push(inv);
        tx.invoiceId = inv.id;
      }

      transactions.push(tx);
    }
  }

  return {
    version: STATE_VERSION,
    profile: {
      flowId: DEMO_FLOW_ID,
      previousFlowIds: [],
      displayName: '김대리',
      departmentId: 'mgmt',
      monthlyLimit: 500000,
    },
    settings: {
      oneClick: true,
      autoClassify: true,
      autoInvoice: true,
      blockOverBudget: true,
      alertThreshold: 80,
    },
    departments: DEFAULT_DEPARTMENTS.map((d) => ({ ...d })),
    projects: DEFAULT_PROJECTS.map((p) => ({ ...p, keywords: [...p.keywords] })),
    // 최신순 정렬
    transactions: transactions.reverse(),
    receipts: receipts.reverse(),
    invoices: invoices.reverse(),
    counters: { invoice: invoiceSeq },
  };
};
