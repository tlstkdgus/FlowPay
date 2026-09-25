// Flow ID: 개인정보 없이 사용자를 식별하는 익명 토큰
// 혼동하기 쉬운 문자(0/O, 1/I/L)를 제외한 32자 알파벳에서 6자리를 무작위로 생성합니다.

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const randomBytes = (n: number): Uint8Array => {
  const bytes = new Uint8Array(n);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < n; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
};

export const generateFlowId = (exclude: string[] = []): string => {
  for (;;) {
    const id = Array.from(randomBytes(6), (b) => ALPHABET[b % ALPHABET.length]).join('');
    if (!exclude.includes(id)) return id;
  }
};

export const isValidFlowId = (id: string): boolean => /^[A-Z2-9]{6}$/.test(id);

/** 레코드 ID용 짧은 난수 접미사 */
export const shortId = (len = 6): string =>
  Array.from(randomBytes(len), (b) => ALPHABET[b % ALPHABET.length]).join('');
