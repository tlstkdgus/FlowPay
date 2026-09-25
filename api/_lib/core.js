// FlowPay 인증 서버 핵심 로직 (FIDO2 / WebAuthn)
//
// 무상태(stateless) 설계: Vercel 서버리스 인스턴스는 메모리를 공유하지 않으므로
// 챌린지와 등록된 공개키를 서버 HMAC으로 서명한 토큰에 담아 클라이언트에 맡깁니다.
// 클라이언트가 토큰을 변조하면 서명 검증에서 거부됩니다.
//
// - 등록: 챌린지 발급 → 인증기 attestation 검증 → 공개키를 담은 "자격 증명서"(서명 토큰) 발급
// - 결제: 결제 내용(Flow ID·금액·가맹점)을 해시해 챌린지를 만들고(동적 연결),
//         인증기 서명(assertion)을 자격 증명서의 공개키로 검증한 뒤 결제 승인서를 발급
//
// 파일 이름이 _ 로 시작하는 폴더는 Vercel이 API 경로로 노출하지 않습니다.

const crypto = require('crypto');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

const CHALLENGE_TTL_MS = 2 * 60 * 1000;
const MAX_AMOUNT = 100000000;
// 공개된 데모 키. FLOWPAY_SECRET이 없을 때만 사용하며 /api/health 가 keyMode: 'demo' 로 알립니다.
const DEMO_SECRET = 'flowpay-public-demo-key::set-FLOWPAY_SECRET-in-production';

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const keyConfig = () => {
  const secret = process.env.FLOWPAY_SECRET;
  return secret && secret.length >= 32 ? { secret, mode: 'configured' } : { secret: DEMO_SECRET, mode: 'demo' };
};

const b64url = (buf) => Buffer.from(buf).toString('base64url');
const fromB64url = (s) => new Uint8Array(Buffer.from(s, 'base64url'));

const hmac = (data) => crypto.createHmac('sha256', keyConfig().secret).update(data).digest();

/** payload를 서명한 토큰: base64url(JSON).base64url(HMAC) */
const signToken = (payload) => {
  const body = b64url(JSON.stringify(payload));
  return `${body}.${b64url(hmac(body))}`;
};

const verifyToken = (token, type) => {
  if (typeof token !== 'string' || !token.includes('.')) throw new ApiError(400, 'INVALID_TOKEN', '토큰 형식이 올바르지 않습니다.');
  const [body, sig] = token.split('.');
  const expected = hmac(body);
  const given = Buffer.from(sig || '', 'base64url');
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    throw new ApiError(401, 'INVALID_SIGNATURE', '서버 서명이 일치하지 않습니다. 토큰이 변조되었거나 서버 키가 바뀌었습니다.');
  }
  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    throw new ApiError(400, 'INVALID_TOKEN', '토큰을 해석할 수 없습니다.');
  }
  if (payload.t !== type) throw new ApiError(400, 'INVALID_TOKEN', '토큰 용도가 올바르지 않습니다.');
  if (payload.exp && Date.now() > payload.exp) throw new ApiError(401, 'EXPIRED', '인증 요청이 만료되었습니다. 다시 시도해주세요.');
  return payload;
};

/* ---------------- 출처(origin) 검증 ---------------- */

const allowedOrigins = () => {
  const list = new Set(['https://flowpay.vercel.app']);
  (process.env.FLOWPAY_ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((o) => list.add(o));
  // Vercel 시스템 환경 변수: 배포 URL, 브랜치 미리보기 URL, 프로덕션 URL
  ['VERCEL_URL', 'VERCEL_BRANCH_URL', 'VERCEL_PROJECT_PRODUCTION_URL'].forEach((k) => {
    if (process.env[k]) list.add(`https://${process.env[k]}`);
  });
  return list;
};

const isLocalDev = (origin) => !process.env.VERCEL && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

/** 요청 Origin이 허용 목록에 있으면 { origin, rpID } 반환. rpID는 origin의 호스트명 */
const resolveOrigin = (origin) => {
  if (!origin) throw new ApiError(403, 'ORIGIN_REQUIRED', 'Origin 헤더가 필요합니다.');
  if (!allowedOrigins().has(origin) && !isLocalDev(origin)) {
    throw new ApiError(403, 'ORIGIN_NOT_ALLOWED', `허용되지 않은 출처입니다: ${origin}`);
  }
  return { origin, rpID: new URL(origin).hostname };
};

/* ---------------- 입력 검증 ---------------- */

const FLOW_ID_RE = /^[A-Z2-9]{6}$/;

const requireFlowId = (flowId) => {
  if (!FLOW_ID_RE.test(flowId || '')) throw new ApiError(400, 'INVALID_FLOW_ID', 'Flow ID 형식이 올바르지 않습니다.');
  return flowId;
};

const requirePayment = ({ amount, merchant }) => {
  if (!Number.isInteger(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    throw new ApiError(400, 'INVALID_AMOUNT', '결제 금액이 올바르지 않습니다.');
  }
  if (typeof merchant !== 'string' || !merchant.trim() || merchant.length > 100) {
    throw new ApiError(400, 'INVALID_MERCHANT', '가맹점 정보가 올바르지 않습니다.');
  }
  return { amount, merchant: merchant.trim() };
};

/** 결제 내용을 해시한 챌린지 — 인증기의 서명이 곧 이 결제 내용에 대한 동의가 됩니다. */
const paymentChallenge = ({ nonce, flowId, amount, merchant }) =>
  crypto.createHash('sha256').update(JSON.stringify(['flowpay-payment', nonce, flowId, amount, merchant])).digest();

// 인스턴스 내 재사용 방지 (무상태 설계라 인스턴스 간에는 만료 시간으로 제한)
const usedNonces = new Map();
const consumeNonce = (nonce, exp) => {
  const now = Date.now();
  for (const [n, e] of usedNonces) if (e < now) usedNonces.delete(n);
  if (usedNonces.has(nonce)) throw new ApiError(409, 'REPLAYED', '이미 사용된 결제 인증 요청입니다.');
  usedNonces.set(nonce, exp);
};

/* ---------------- 엔드포인트 로직 ---------------- */

const health = ({ origin }) => {
  let originAllowed = false;
  try {
    resolveOrigin(origin);
    originAllowed = true;
  } catch {
    /* 표시용 */
  }
  return { ok: true, keyMode: keyConfig().mode, originAllowed };
};

const registrationOptions = async ({ body, origin, rpID }) => {
  const flowId = requireFlowId(body.flowId);
  const options = await generateRegistrationOptions({
    rpName: 'FlowPay',
    rpID,
    // 개인정보 대신 Flow ID만 인증기에 저장
    userName: flowId,
    userDisplayName: `Flow ID ${flowId}`,
    attestationType: 'none',
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' },
    supportedAlgorithmIDs: [-7, -257],
    timeout: 60000,
  });
  const token = signToken({ t: 'reg', ch: options.challenge, flowId, rpID, origin, exp: Date.now() + CHALLENGE_TTL_MS });
  return { options, token };
};

const registrationVerify = async ({ body, origin, rpID }) => {
  const reg = verifyToken(body.token, 'reg');
  if (reg.origin !== origin || reg.rpID !== rpID) throw new ApiError(400, 'ORIGIN_MISMATCH', '등록을 시작한 출처와 다릅니다.');

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge: reg.ch,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
  } catch (e) {
    throw new ApiError(400, 'VERIFICATION_FAILED', `패스키 등록 검증 실패: ${e.message}`);
  }
  if (!verification.verified) throw new ApiError(400, 'VERIFICATION_FAILED', '패스키 등록을 검증하지 못했습니다.');

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  const createdAt = new Date().toISOString();
  const certificate = signToken({
    t: 'cred',
    id: credential.id,
    pk: b64url(credential.publicKey),
    transports: credential.transports || [],
    flowId: reg.flowId,
    rpID,
    iat: Date.now(),
  });
  return {
    credentialId: credential.id,
    certificate,
    createdAt,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
  };
};

const paymentOptions = async ({ body, origin, rpID }) => {
  const flowId = requireFlowId(body.flowId);
  const { amount, merchant } = requirePayment(body);
  const cred = verifyToken(body.certificate, 'cred');
  if (cred.flowId !== flowId) throw new ApiError(403, 'FLOW_ID_MISMATCH', '패스키가 현재 Flow ID에 등록된 것이 아닙니다.');
  if (cred.rpID !== rpID) throw new ApiError(403, 'RP_MISMATCH', '다른 도메인에서 등록된 패스키입니다. 이 도메인에서 다시 등록해주세요.');

  const nonce = b64url(crypto.randomBytes(16));
  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: [{ id: cred.id, transports: cred.transports }],
    challenge: paymentChallenge({ nonce, flowId, amount, merchant }),
    userVerification: 'required',
    timeout: 60000,
  });
  const token = signToken({
    t: 'pay',
    ch: options.challenge,
    nonce,
    flowId,
    amount,
    merchant,
    credId: cred.id,
    rpID,
    origin,
    exp: Date.now() + CHALLENGE_TTL_MS,
  });
  return { options, token };
};

const paymentAuthorize = async ({ body, origin, rpID }) => {
  const pay = verifyToken(body.token, 'pay');
  const cred = verifyToken(body.certificate, 'cred');
  if (pay.origin !== origin || pay.rpID !== rpID) throw new ApiError(400, 'ORIGIN_MISMATCH', '결제를 시작한 출처와 다릅니다.');
  if (pay.credId !== cred.id || body.response?.id !== cred.id) {
    throw new ApiError(400, 'CREDENTIAL_MISMATCH', '결제 요청과 다른 패스키로 서명되었습니다.');
  }
  // 챌린지가 결제 내용에서 파생되었는지 재확인 (토큰 서명으로도 보장되지만 명시적으로 검증)
  if (b64url(paymentChallenge(pay)) !== pay.ch) throw new ApiError(400, 'CHALLENGE_MISMATCH', '결제 내용이 일치하지 않습니다.');

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body.response,
      expectedChallenge: pay.ch,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: { id: cred.id, publicKey: fromB64url(cred.pk), counter: 0, transports: cred.transports },
      requireUserVerification: true,
    });
  } catch (e) {
    throw new ApiError(400, 'VERIFICATION_FAILED', `결제 인증 검증 실패: ${e.message}`);
  }
  if (!verification.verified) throw new ApiError(400, 'VERIFICATION_FAILED', '결제 서명을 검증하지 못했습니다.');
  consumeNonce(pay.nonce, pay.exp);

  const approval = {
    approvalId: `AP-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    flowId: pay.flowId,
    amount: pay.amount,
    merchant: pay.merchant,
    credentialId: cred.id,
    userVerified: verification.authenticationInfo.userVerified,
    verifiedAt: new Date().toISOString(),
    keyMode: keyConfig().mode,
  };
  return { approval, approvalToken: signToken({ t: 'approval', ...approval }) };
};

/** 결제 승인서 검증 — 전표 등에서 승인 기록이 서버가 발급한 것인지 확인 */
const approvalVerify = ({ body }) => {
  const a = verifyToken(body.approvalToken, 'approval');
  const { t, ...approval } = a;
  return { valid: true, approval };
};

module.exports = {
  ApiError,
  resolveOrigin,
  health,
  registrationOptions,
  registrationVerify,
  paymentOptions,
  paymentAuthorize,
  approvalVerify,
  // 테스트용
  _internal: { signToken, verifyToken, paymentChallenge, keyConfig },
};
