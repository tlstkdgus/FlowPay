// FlowPay 도메인 모델
// 모든 날짜는 로컬 시간 기준 ISO 문자열(YYYY-MM-DDTHH:mm:ss)로 저장합니다.

export type CategoryId =
  | 'meal'
  | 'transport'
  | 'supplies'
  | 'meeting'
  | 'welfare'
  | 'entertainment'
  | 'education'
  | 'etc';

export interface Category {
  id: CategoryId;
  name: string;
  /** 계정과목 */
  account: string;
  /** 사내 계정코드 */
  accountCode: string;
  keywords: string[];
}

export interface Department {
  id: string;
  name: string;
  /** 월 예산 */
  budget: number;
  /** 전표 승인자 (부서별 자동 배정) */
  approver: string;
}

export interface Project {
  id: string;
  name: string;
  departmentId: string;
  /** 프로젝트 총 예산 */
  budget: number;
  keywords: string[];
  active: boolean;
}

export type PaymentMethodId =
  | 'flowpay'
  | 'card'
  | 'virtual'
  | 'bank'
  | 'mobile'
  | 'naver'
  | 'kakao'
  | 'toss'
  | 'offline';

export interface LineItem {
  name: string;
  quantity: number;
  price: number;
}

export type TransactionStatus = 'completed' | 'cancelled';

export interface Transaction {
  id: string;
  flowId: string;
  merchant: string;
  amount: number;
  date: string;
  departmentId: string;
  projectId?: string;
  categoryId: CategoryId;
  method: PaymentMethodId;
  items: LineItem[];
  status: TransactionStatus;
  /** 결제 시점에 자동 분류되었는지 여부 (수동 수정 시 false) */
  autoClassified: boolean;
  receiptId?: string;
  invoiceId?: string;
  memo?: string;
  /** FlowPay 결제의 인증 기록 */
  authorization?: PaymentAuthorization;
}

export interface Receipt {
  id: string;
  transactionId?: string;
  merchant: string;
  amount: number;
  date: string;
  businessNumber?: string;
  items: LineItem[];
  /** OCR 신뢰도 (0-100). 직접 입력은 undefined */
  confidence?: number;
  rawText?: string;
  /** 축소된 미리보기 이미지 (data URL) */
  thumbnail?: string;
  createdAt: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type TaxStatus = 'not_submitted' | 'submitted' | 'accepted';

export interface Invoice {
  id: string;
  transactionId: string;
  flowId: string;
  merchant: string;
  amount: number;
  supplyAmount: number;
  vat: number;
  date: string;
  departmentId: string;
  projectId?: string;
  categoryId: CategoryId;
  items: LineItem[];
  approvalStatus: ApprovalStatus;
  approver: string;
  approvalDate?: string;
  rejectReason?: string;
  taxStatus: TaxStatus;
  ntsReference?: string;
  submittedAt?: string;
  createdAt: string;
}

/** 서버가 attestation을 검증한 뒤 발급한 패스키 자격 증명 */
export interface Passkey {
  credentialId: string;
  /** 서버 서명 토큰 (공개키·Flow ID·도메인 포함). 결제 인증 시 서버에 제출 */
  certificate: string;
  createdAt: string;
  deviceType?: 'singleDevice' | 'multiDevice';
  backedUp?: boolean;
}

/** 결제 인증 기록 */
export interface PaymentAuthorization {
  /** passkey: 서버가 FIDO2 서명을 검증 / demo: 생체인증·서버 검증 없음 */
  method: 'passkey' | 'demo';
  approvalId?: string;
  verifiedAt?: string;
  /** 서버 서명 키 종류 (demo: 공개 데모 키) */
  keyMode?: 'configured' | 'demo';
  /** 서버가 서명한 결제 승인서 (재검증용) */
  approvalToken?: string;
}

export interface Profile {
  flowId: string;
  previousFlowIds: string[];
  /** 기기에만 저장되는 표시 이름 (서버·전표에는 Flow ID만 기록) */
  displayName: string;
  departmentId: string;
  /** Flow ID 월 사용 한도 */
  monthlyLimit: number;
  passkey?: Passkey;
}

export interface Settings {
  oneClick: boolean;
  autoClassify: boolean;
  autoInvoice: boolean;
  blockOverBudget: boolean;
  /** 예산 경고 임계치 (%) */
  alertThreshold: number;
}

export interface FlowPayState {
  version: number;
  profile: Profile;
  settings: Settings;
  departments: Department[];
  projects: Project[];
  transactions: Transaction[];
  receipts: Receipt[];
  invoices: Invoice[];
  counters: { invoice: number };
}
