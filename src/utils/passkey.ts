// FIDO2 패스키 (WebAuthn)
// 지원 환경(HTTPS + 플랫폼 인증기)에서는 실제 지문/Face ID 인증을 사용하고,
// 미지원 환경에서는 데모용 시뮬레이션으로 대체할 수 있도록 오류를 구분해 던집니다.
// 서버가 없는 데모이므로 챌린지는 클라이언트에서 생성하며, 서명 검증은 생략합니다.

import { shortId } from './flowId';

export class PasskeyUnsupportedError extends Error {}
export class PasskeyCancelledError extends Error {}

const randomChallenge = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes;
};

const toBase64Url = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...Array.from(new Uint8Array(buf))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromBase64Url = (s: string) => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

export const isPasskeySupported = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !window.isSecureContext || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};

const wrapError = (e: unknown): never => {
  if (e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'AbortError')) {
    throw new PasskeyCancelledError('인증이 취소되었거나 시간이 초과되었습니다.');
  }
  if (e instanceof DOMException && (e.name === 'NotSupportedError' || e.name === 'SecurityError')) {
    throw new PasskeyUnsupportedError('이 환경에서는 패스키를 사용할 수 없습니다.');
  }
  throw e;
};

/** 패스키 등록. 사용자 정보에는 Flow ID만 담아 개인정보를 남기지 않습니다. */
export const registerPasskey = async (flowId: string): Promise<string> => {
  if (!(await isPasskeySupported())) throw new PasskeyUnsupportedError('이 기기는 패스키를 지원하지 않습니다.');
  const userId = new TextEncoder().encode(`flowpay-${flowId}-${shortId(8)}`);
  try {
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: randomChallenge(),
        rp: { name: 'FlowPay' },
        user: { id: userId, name: flowId, displayName: `Flow ID ${flowId}` },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null;
    if (!cred) throw new PasskeyCancelledError('패스키 등록이 취소되었습니다.');
    return toBase64Url(cred.rawId);
  } catch (e) {
    return wrapError(e);
  }
};

/** 결제 승인용 패스키 인증 */
export const authenticatePasskey = async (credentialId: string): Promise<void> => {
  if (!(await isPasskeySupported())) throw new PasskeyUnsupportedError('이 기기는 패스키를 지원하지 않습니다.');
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomChallenge(),
        allowCredentials: [{ type: 'public-key', id: fromBase64Url(credentialId) }],
        userVerification: 'required',
        timeout: 60000,
      },
    });
    if (!assertion) throw new PasskeyCancelledError('인증이 취소되었습니다.');
  } catch (e) {
    wrapError(e);
  }
};

export const simulatedCredentialId = () => `demo-${shortId(12)}`;
