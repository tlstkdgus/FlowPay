// 표시·날짜 관련 공통 유틸

export const won = (n: number): string => `₩${Math.round(n).toLocaleString('ko-KR')}`;

/** 금액을 만 원 단위로 축약 (차트 라벨 등) */
export const wonShort = (n: number): string => {
  if (Math.abs(n) >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (Math.abs(n) >= 10000) return `${Math.round(n / 10000).toLocaleString('ko-KR')}만`;
  return n.toLocaleString('ko-KR');
};

const pad = (n: number) => String(n).padStart(2, '0');

/** Date → 로컬 시간 기준 ISO 문자열 (타임존 표기 없음) */
export const toLocalISO = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

export const toDateKey = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** 로컬 ISO 문자열 → Date (타임존 없는 문자열을 로컬 시간으로 해석) */
export const parseLocal = (s: string): Date => {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return new Date(s);
  return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));
};

export const formatDate = (s: string): string => s.slice(0, 10);

export const formatDateTime = (s: string): string => `${s.slice(0, 10)} ${s.slice(11, 16)}`;

export const monthKey = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export const isSameMonth = (s: string, ref: Date): boolean => s.slice(0, 7) === monthKey(ref);

export type PeriodId = 'week' | 'month' | 'lastMonth' | 'quarter' | 'year';

export const PERIODS: { id: PeriodId; name: string }[] = [
  { id: 'week', name: '최근 7일' },
  { id: 'month', name: '이번 달' },
  { id: 'lastMonth', name: '지난 달' },
  { id: 'quarter', name: '이번 분기' },
  { id: 'year', name: '올해' },
];

export interface DateRange {
  start: Date;
  end: Date;
}

/** 기간의 [start, end) 범위와 같은 길이의 직전 기간 */
export const periodRange = (period: PeriodId, now: Date = new Date()): { current: DateRange; previous: DateRange } => {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (period) {
    case 'week': {
      const end = new Date(y, m, now.getDate() + 1);
      const start = new Date(y, m, now.getDate() - 6);
      return { current: { start, end }, previous: { start: new Date(y, m, now.getDate() - 13), end: start } };
    }
    case 'lastMonth':
      return {
        current: { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) },
        previous: { start: new Date(y, m - 2, 1), end: new Date(y, m - 1, 1) },
      };
    case 'quarter': {
      const q = Math.floor(m / 3) * 3;
      return {
        current: { start: new Date(y, q, 1), end: new Date(y, q + 3, 1) },
        previous: { start: new Date(y, q - 3, 1), end: new Date(y, q, 1) },
      };
    }
    case 'year':
      return {
        current: { start: new Date(y, 0, 1), end: new Date(y + 1, 0, 1) },
        previous: { start: new Date(y - 1, 0, 1), end: new Date(y, 0, 1) },
      };
    case 'month':
    default:
      return {
        current: { start: new Date(y, m, 1), end: new Date(y, m + 1, 1) },
        previous: { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) },
      };
  }
};

export const inRange = (s: string, r: DateRange): boolean => {
  const t = parseLocal(s).getTime();
  return t >= r.start.getTime() && t < r.end.getTime();
};

/** 기간 길이를 월 단위로 환산 (월 예산 비례 계산용) */
export const rangeInMonths = (period: PeriodId): number => {
  switch (period) {
    case 'week':
      return 7 / 30;
    case 'quarter':
      return 3;
    case 'year':
      return 12;
    default:
      return 1;
  }
};

export const pctChange = (current: number, previous: number): number | null => {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
};
