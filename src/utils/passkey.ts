// FIDO2 패스키 클라이언트
// 챌린지 발급과 서명 검증은 인증 서버(/api)가 담당하고, 브라우저는 WebAuthn 의식만 수행합니다.
//   등록: /api/webauthn/register-options → navigator.credentials.create → /api/webauthn/register-verify
//   결제: /api/payments/options → navigator.credentials.get → /api/payments/authorize

import { browserSupportsWebAuthn, startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { Passkey, PaymentAuthorization } from '../types';

export class PasskeyUnsupportedError extends Error {}
export class PasskeyCancelledError extends Error {}
export class AuthServerError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export interface ServerStatus {
  ok: boolean;
  keyMode: 'configured' | 'demo';
  originAllowed: boolean;
}

const post = async <T,>(path: string, body: unknown): Promise<T> => {
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthServerError('NETWORK', '인증 서버에 연결할 수 없습니다.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    throw new AuthServerError(data?.error ?? `HTTP_${res.status}`, data?.message ?? `인증 서버 오류 (${res.status})`);
  }
  return data as T;
};

/** 브라우저 WebAuthn 오류를 사용자에게 보여줄 오류로 변환 */
const mapCeremonyError = (e: unknown): never => {
  const err = e as { name?: string; code?: string; cause?: { name?: string } };
  const name = err?.cause?.name ?? err?.name;
  if (name === 'NotAllowedError' || name === 'AbortError' || err?.code === 'ERROR_CEREMONY_ABORTED') {
    throw new PasskeyCancelledError('생체 인증이 취소되었거나 시간이 초과되었습니다.');
  }
  if (name === 'NotSupportedError' || name === 'SecurityError' || err?.code === 'ERROR_INVALID_DOMAIN') {
    throw new PasskeyUnsupportedError('이 환경에서는 패스키를 사용할 수 없습니다.');
  }
  if (name === 'InvalidStateError') {
    throw new PasskeyCancelledError('이 기기에 이미 등록된 패스키입니다.');
  }
  throw e;
};

export const isPasskeySupported = (): boolean =>
  typeof window !== 'undefined' && window.isSecureContext && browserSupportsWebAuthn();

/** 서버에서 발급받은 패스키인지 (이전 버전의 로컬 전용 패스키는 제외) */
export const hasServerPasskey = (passkey?: Partial<Passkey>): passkey is Passkey => !!passkey?.certificate;

export const getServerStatus = async (): Promise<ServerStatus | null> => {
  try {
    return await post<ServerStatus>('/api/health', {});
  } catch {
    return null;
  }
};

/** 패스키 등록: 서버가 attestation을 검증하고 자격 증명서를 발급합니다. */
export const registerPasskey = async (flowId: string): Promise<Passkey> => {
  if (!isPasskeySupported()) throw new PasskeyUnsupportedError('이 브라우저는 패스키를 지원하지 않습니다 (HTTPS 필요).');
  const { options, token } = await post<{ options: any; token: string }>('/api/webauthn/register-options', { flowId });
  const response = await startRegistration({ optionsJSON: options }).catch(mapCeremonyError);
  return post<Passkey>('/api/webauthn/register-verify', { token, response });
};

/** 결제 인증: 결제 내용에 묶인 챌린지에 서명하고, 서버 검증을 통과하면 승인서를 받습니다. */
export const authorizePayment = async (params: {
  flowId: string;
  amount: number;
  merchant: string;
  passkey: Passkey;
}): Promise<PaymentAuthorization> => {
  if (!isPasskeySupported()) throw new PasskeyUnsupportedError('이 브라우저는 패스키를 지원하지 않습니다 (HTTPS 필요).');
  const { options, token } = await post<{ options: any; token: string }>('/api/payments/options', {
    flowId: params.flowId,
    amount: params.amount,
    merchant: params.merchant,
    certificate: params.passkey.certificate,
  });
  const response = await startAuthentication({ optionsJSON: options }).catch(mapCeremonyError);
  const { approval, approvalToken } = await post<{
    approval: { approvalId: string; verifiedAt: string; keyMode: 'configured' | 'demo' };
    approvalToken: string;
  }>('/api/payments/authorize', { token, certificate: params.passkey.certificate, response });
  return {
    method: 'passkey',
    approvalId: approval.approvalId,
    verifiedAt: approval.verifiedAt,
    keyMode: approval.keyMode,
    approvalToken,
  };
};

/** 저장된 결제 승인서를 서버에 재검증 */
export const verifyApproval = async (approvalToken: string): Promise<boolean> => {
  try {
    const { valid } = await post<{ valid: boolean }>('/api/payments/verify-approval', { approvalToken });
    return valid;
  } catch {
    return false;
  }
};

export const authorizationLabel = (a?: PaymentAuthorization): string | undefined => {
  if (!a) return undefined;
  if (a.method === 'demo') return '데모 인증 (생체인증·서버 검증 없음)';
  return `패스키 · 서버 검증${a.keyMode === 'demo' ? ' (데모 키)' : ''}`;
};
