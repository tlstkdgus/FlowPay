import { Category, CategoryId, Department, PaymentMethodId, Project } from '../types';

export const CATEGORIES: Category[] = [
  {
    id: 'meal',
    name: '식비',
    account: '복리후생비',
    accountCode: '811',
    keywords: ['스타벅스', '카페', '커피', '이디야', '투썸', '메가커피', '빽다방', '맥도날드', '버거', '롯데리아', '김밥', '식당', '분식', '국밥', '도시락', '베이커리', '파리바게뜨', '뚜레쥬르', '배달의민족', '요기요', '쿠팡이츠', '아메리카노', '라떼', '세트', '점심', '저녁', '샌드위치', '서브웨이'],
  },
  {
    id: 'transport',
    name: '교통비',
    account: '여비교통비',
    accountCode: '812',
    keywords: ['택시', '카카오t', '카카오 t', '우티', '코레일', 'ktx', 'srt', '고속버스', '주유', '주차', '하이패스', '톨게이트', 'gs칼텍스', 's-oil', 'sk에너지', '현대오일뱅크', '티머니', '항공', '대한항공', '아시아나'],
  },
  {
    id: 'supplies',
    name: '업무용품',
    account: '소모품비',
    accountCode: '830',
    keywords: ['오피스', '문구', '알파', '다이소', 'a4', '용지', '토너', '잉크', '볼펜', '펜', '노트', '파일', '포스트잇', '마우스', '키보드', '케이블', '충전기', '하이마트', '전자랜드', '쿠팡', '11번가', 'gs25', 'cu', '세븐일레븐', '이마트24', '편의점'],
  },
  {
    id: 'meeting',
    name: '회의비',
    account: '회의비',
    accountCode: '849',
    keywords: ['회의', '미팅', '다과', '회의실', '스페이스', '스파크플러스', '패스트파이브', '위워크', '케이터링'],
  },
  {
    id: 'welfare',
    name: '복리후생',
    account: '복리후생비',
    accountCode: '811',
    keywords: ['올리브영', '약국', '병원', '헬스', '피트니스', '선물', '꽃', '경조', '생일', '간식', '영화', 'cgv', '메가박스'],
  },
  {
    id: 'entertainment',
    name: '접대비',
    account: '기업업무추진비',
    accountCode: '813',
    keywords: ['한우', '횟집', '일식', '오마카세', '와인', '호텔', '레스토랑', '고깃집', '접대', '골프'],
  },
  {
    id: 'education',
    name: '도서·교육',
    account: '도서인쇄비',
    accountCode: '826',
    keywords: ['교보문고', '영풍문고', '예스24', '알라딘', '서점', '도서', '책', '인프런', '패스트캠퍼스', '유데미', '강의', '세미나', '컨퍼런스', '인쇄', '킨코스'],
  },
  {
    id: 'etc',
    name: '기타',
    account: '잡비',
    accountCode: '890',
    keywords: [],
  },
];

export const categoryById = (id: CategoryId | string): Category =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];

export const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'mgmt', name: '관리부', budget: 500000, approver: '이부장' },
  { id: 'sales', name: '영업팀', budget: 1500000, approver: '김과장' },
  { id: 'marketing', name: '마케팅팀', budget: 600000, approver: '최팀장' },
  { id: 'dev', name: '개발팀', budget: 600000, approver: '박팀장' },
  { id: 'hr', name: '인사팀', budget: 300000, approver: '정차장' },
];

export const DEFAULT_PROJECTS: Project[] = [
  { id: 'p-ops', name: '사무환경 개선', departmentId: 'mgmt', budget: 5000000, keywords: ['용지', '토너', '의자', '사무'], active: true },
  { id: 'p-client', name: '신규 고객사 발굴', departmentId: 'sales', budget: 12000000, keywords: ['고객', '미팅', '접대', '출장'], active: true },
  { id: 'p-launch', name: '하반기 캠페인', departmentId: 'marketing', budget: 9000000, keywords: ['캠페인', '촬영', '인쇄', '행사'], active: true },
  { id: 'p-app', name: 'FlowPay 앱 고도화', departmentId: 'dev', budget: 6000000, keywords: ['서버', '개발', '강의', '컨퍼런스', '야근'], active: true },
  { id: 'p-recruit', name: '상반기 채용', departmentId: 'hr', budget: 4000000, keywords: ['면접', '채용', '입사', '온보딩'], active: true },
];

export interface PaymentMethodInfo {
  id: PaymentMethodId;
  name: string;
  description: string;
  benefit?: string;
  brandColor?: string;
}

export const GENERAL_METHODS: PaymentMethodInfo[] = [
  { id: 'card', name: '신용·체크카드', description: '무기명 법인카드 등록 결제' },
  { id: 'virtual', name: '가상계좌', description: '입금 확인 후 결제 완료' },
  { id: 'bank', name: '계좌이체', description: '법인 계좌 실시간 이체' },
  { id: 'mobile', name: '휴대폰', description: '휴대폰 소액결제' },
];

export const SIMPLE_METHODS: PaymentMethodInfo[] = [
  { id: 'flowpay', name: 'FlowPay', description: 'Flow ID 기반 결제', benefit: '1-Click · 자동 분류 · 자동 전표' },
  { id: 'naver', name: '네이버페이', description: '네이버페이', benefit: '5만원 이상 2천원 할인', brandColor: 'bg-[#03C75A]' },
  { id: 'kakao', name: '카카오페이', description: '카카오페이', benefit: '1천원 캐시백', brandColor: 'bg-[#FFCD00]' },
  { id: 'toss', name: '토스페이', description: '토스페이', benefit: '첫 결제 3천원 캐시백', brandColor: 'bg-[#0064FF]' },
];

export const METHOD_LABELS: Record<PaymentMethodId, string> = {
  flowpay: 'FlowPay',
  card: '신용·체크카드',
  virtual: '가상계좌',
  bank: '계좌이체',
  mobile: '휴대폰',
  naver: '네이버페이',
  kakao: '카카오페이',
  toss: '토스페이',
  offline: '오프라인 카드',
};

export interface CatalogItem {
  name: string;
  spec: string;
  price: number;
}

export interface Merchant {
  id: string;
  name: string;
  description: string;
  items: CatalogItem[];
}

/** 결제 데모용 제휴 가맹점 */
export const MERCHANTS: Merchant[] = [
  {
    id: 'office',
    name: '알파문구 온라인몰',
    description: '사무용품',
    items: [
      { name: 'A4용지', spec: '2,500매 1박스', price: 25000 },
      { name: '레이저 토너', spec: '검정 1개', price: 68000 },
      { name: '볼펜 세트', spec: '12자루', price: 9600 },
      { name: '포스트잇', spec: '10패드', price: 12000 },
    ],
  },
  {
    id: 'cafe',
    name: '스타벅스 역삼점',
    description: '카페 · 회의 다과',
    items: [
      { name: '아메리카노', spec: 'Tall', price: 4700 },
      { name: '카페 라떼', spec: 'Tall', price: 5200 },
      { name: '샌드위치', spec: '햄&치즈', price: 6900 },
    ],
  },
  {
    id: 'taxi',
    name: '카카오T 택시',
    description: '업무 이동',
    items: [{ name: '택시 요금', spec: '역삼 → 여의도', price: 18400 }],
  },
  {
    id: 'book',
    name: '교보문고 광화문점',
    description: '도서 · 교육',
    items: [
      { name: '클린 아키텍처', spec: '도서', price: 29000 },
      { name: '데이터 중심 애플리케이션 설계', spec: '도서', price: 36000 },
    ],
  },
];
