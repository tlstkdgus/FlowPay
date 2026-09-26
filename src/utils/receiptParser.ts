// 영수증 OCR 텍스트 파서
// Tesseract가 뽑은 원문에서 가맹점·합계·날짜·사업자번호·품목을 추출합니다.

import { LineItem } from '../types';

export interface ParsedReceipt {
  merchant: string;
  amount: number;
  date?: string;
  businessNumber?: string;
  items: LineItem[];
}

const TOTAL_KEYWORDS = /(합\s*계|총\s*액|총\s*금\s*액|받을\s*금액|결제\s*금액|승인\s*금액|청구\s*금액|판매\s*총액|total)/i;
const SKIP_KEYWORDS = /(합\s*계|총\s*액|금\s*액|부가세|부\s*가\s*세|과세|면세|공급가|카드|승인|현금|거스름|받을|결제|사업자|대표|전화|tel|주소|번호|일시|영수증|포인트|할인|수량|단가|품목|상품명|total)/i;
const MERCHANT_LABEL = /(상호|가맹점명?|매장명|점포명)\s*[:：]?\s*(.+)/;

/** OCR이 흔히 헷갈리는 문자를 숫자 문맥에서 보정 */
const fixDigits = (s: string) =>
  s.replace(/(\d)[oO](?=[\d,])/g, (_, d) => `${d}0`).replace(/(\d)[lI|](?=\d)/g, (_, d) => `${d}1`);

const AMOUNT_RE = /(\d{1,3}(?:[,.]\d{3})+|\d{3,9})(?!\d)\s*원?/g;

const toNumber = (s: string) => parseInt(s.replace(/[^\d]/g, ''), 10);

const amountsIn = (line: string): number[] =>
  Array.from(fixDigits(line).matchAll(AMOUNT_RE), (m) => toNumber(m[1])).filter((n) => n >= 100);

const pad = (n: number) => String(n).padStart(2, '0');

export const parseDate = (text: string): string | undefined => {
  const t = fixDigits(text);
  const full = t.match(/(20\d{2})\s*[-./년]\s*(\d{1,2})\s*[-./월]\s*(\d{1,2})/);
  if (full) {
    const [y, m, d] = [+full[1], +full[2], +full[3]];
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return `${y}-${pad(m)}-${pad(d)}`;
  }
  const short = t.match(/(?:^|\D)(\d{2})[-./](\d{2})[-./](\d{2})(?!\d)/);
  if (short) {
    const [y, m, d] = [2000 + +short[1], +short[2], +short[3]];
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return `${y}-${pad(m)}-${pad(d)}`;
  }
  return undefined;
};

export const parseBusinessNumber = (text: string): string | undefined => {
  const m = fixDigits(text).match(/(\d{3})\s*-\s*(\d{2})\s*-\s*(\d{5})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : undefined;
};

export const parseTotal = (lines: string[]): number => {
  // 합계 키워드가 있는 줄(또는 바로 다음 줄)의 금액을 우선 사용. 여러 개면 마지막 합계가 최종 결제액.
  let total = 0;
  lines.forEach((line, i) => {
    if (!TOTAL_KEYWORDS.test(line) || /부가세|공급가/.test(line)) return;
    const found = amountsIn(line);
    const candidates = found.length ? found : amountsIn(lines[i + 1] ?? '');
    if (candidates.length) total = Math.max(...candidates);
  });
  if (total) return total;
  // 키워드가 없으면 가장 큰 금액을 합계로 추정 (사업자번호·전화번호 제외)
  const all = lines
    .filter((l) => !/사업자|전화|tel|\d{3}-\d{2}-\d{5}|\d{2,4}-\d{3,4}-\d{4}/i.test(l))
    .flatMap(amountsIn)
    .filter((n) => n < 100000000);
  return all.length ? Math.max(...all) : 0;
};

export const parseMerchant = (lines: string[]): string => {
  for (const line of lines) {
    const m = line.match(MERCHANT_LABEL);
    if (m && m[2].trim()) return m[2].trim();
  }
  const candidate = lines.find((l) => /[가-힣A-Za-z]{2,}/.test(l) && !SKIP_KEYWORDS.test(l) && amountsIn(l).length === 0);
  return candidate?.trim() || '알 수 없는 가맹점';
};

export const parseItems = (lines: string[]): LineItem[] => {
  const items: LineItem[] = [];
  for (const raw of lines) {
    if (SKIP_KEYWORDS.test(raw)) continue;
    const line = fixDigits(raw).trim();
    // "상품명 수량 금액" 또는 "상품명 단가 수량 금액"
    const withQty = line.match(/^(.*?[가-힣A-Za-z].*?)\s+(?:([\d,]{3,})\s+)?(\d{1,3})\s+([\d,]{3,})\s*원?$/);
    if (withQty) {
      const quantity = parseInt(withQty[3], 10);
      const total = toNumber(withQty[4]);
      if (quantity > 0 && total > 0) {
        items.push({ name: withQty[1].trim(), quantity, price: Math.round(total / quantity) });
        continue;
      }
    }
    // "상품명 금액"
    const simple = line.match(/^(.*?[가-힣A-Za-z].*?)\s+([\d,]{3,})\s*원?$/);
    if (simple) {
      const price = toNumber(simple[2]);
      if (price >= 100) items.push({ name: simple[1].trim(), quantity: 1, price });
    }
  }
  return items.slice(0, 20);
};

export const parseReceipt = (text: string): ParsedReceipt => {
  const lines = text
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const items = parseItems(lines);
  let amount = parseTotal(lines);
  if (!amount && items.length) amount = items.reduce((s, i) => s + i.price * i.quantity, 0);
  return {
    merchant: parseMerchant(lines),
    amount,
    date: parseDate(text),
    businessNumber: parseBusinessNumber(text),
    items,
  };
};
