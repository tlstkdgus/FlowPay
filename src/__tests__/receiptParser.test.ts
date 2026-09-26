import { parseDate, parseReceipt, parseTotal } from '../utils/receiptParser';

const SAMPLE = `스타벅스 강남점
사업자번호 123-45-67890
2024.01.15 12:34
아메리카노 2 9,000
카페라떼 1 5,000
공급가액 12,727
부가세 1,273
합계 14,000원
카드승인 14,000`;

describe('parseReceipt', () => {
  it('가맹점·합계·날짜·사업자번호·품목을 추출한다', () => {
    const r = parseReceipt(SAMPLE);
    expect(r.merchant).toBe('스타벅스 강남점');
    expect(r.amount).toBe(14000);
    expect(r.date).toBe('2024-01-15');
    expect(r.businessNumber).toBe('123-45-67890');
    expect(r.items).toEqual([
      { name: '아메리카노', quantity: 2, price: 4500 },
      { name: '카페라떼', quantity: 1, price: 5000 },
    ]);
  });

  it('상호 라벨이 있으면 그 값을 가맹점으로 쓴다', () => {
    expect(parseReceipt('영수증\n상호: 알파문구 역삼점\n합계 25,000').merchant).toBe('알파문구 역삼점');
  });

  it('합계 키워드가 없으면 가장 큰 금액을 쓰되 사업자번호는 무시한다', () => {
    expect(parseTotal(['사업자 123-45-67890', '김밥 3,500', '라면 4,000'])).toBe(4000);
  });

  it('OCR이 0을 O로 읽어도 금액을 보정한다', () => {
    expect(parseTotal(['합계 12,5O0'])).toBe(12500);
  });

  it('다양한 날짜 형식을 인식한다', () => {
    expect(parseDate('2024년 3월 5일')).toBe('2024-03-05');
    expect(parseDate('일시 24-11-02 09:10')).toBe('2024-11-02');
    expect(parseDate('날짜 없음')).toBeUndefined();
  });
});
