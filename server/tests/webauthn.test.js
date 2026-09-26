// 인증 서버 테스트 — 소프트웨어 인증기(P-256)로 실제 attestation/assertion을 만들어 검증합니다.
// 실행: npm run test:api
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const core = require('../../api/_lib/core');
const { route } = require('../../api/_lib/http');

const ORIGIN = 'http://localhost:3000';
const ctx = core.resolveOrigin(ORIGIN);

/* ---------- 최소 CBOR 인코더 ---------- */
const head = (major, n) => {
  if (n < 24) return Buffer.from([(major << 5) | n]);
  if (n < 256) return Buffer.from([(major << 5) | 24, n]);
  const b = Buffer.alloc(3);
  b[0] = (major << 5) | 25;
  b.writeUInt16BE(n, 1);
  return b;
};
const cbor = (v) => {
  if (typeof v === 'number') return v >= 0 ? head(0, v) : head(1, -1 - v);
  if (typeof v === 'string') return Buffer.concat([head(3, Buffer.byteLength(v)), Buffer.from(v)]);
  if (Buffer.isBuffer(v)) return Buffer.concat([head(2, v.length), v]);
  if (v instanceof Map) return Buffer.concat([head(5, v.size), ...[...v].flatMap(([k, val]) => [cbor(k), cbor(val)])]);
  throw new Error('unsupported');
};

const b64u = (b) => Buffer.from(b).toString('base64url');
const sha256 = (b) => crypto.createHash('sha256').update(b).digest();

/** 소프트웨어 인증기 */
const makeAuthenticator = ({ userVerified = true } = {}) => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const jwk = publicKey.export({ format: 'jwk' });
  const credId = crypto.randomBytes(16);
  const cose = cbor(new Map([[1, 2], [3, -7], [-1, 1], [-2, Buffer.from(jwk.x, 'base64url')], [-3, Buffer.from(jwk.y, 'base64url')]]));
  let counter = 0;
  const flags = (extra) => 0x01 | (userVerified ? 0x04 : 0) | extra;

  return {
    credId: b64u(credId),
    register(options, origin = ORIGIN) {
      const clientData = Buffer.from(JSON.stringify({ type: 'webauthn.create', challenge: options.challenge, origin, crossOrigin: false }));
      const len = Buffer.alloc(2);
      len.writeUInt16BE(credId.length);
      const authData = Buffer.concat([sha256(options.rp.id), Buffer.from([flags(0x40)]), Buffer.alloc(4), Buffer.alloc(16), len, credId, cose]);
      const attestationObject = cbor(new Map([['fmt', 'none'], ['attStmt', new Map()], ['authData', authData]]));
      return {
        id: b64u(credId),
        rawId: b64u(credId),
        type: 'public-key',
        response: { clientDataJSON: b64u(clientData), attestationObject: b64u(attestationObject), transports: ['internal'] },
        clientExtensionResults: {},
      };
    },
    sign(options, origin = ORIGIN) {
      counter += 1;
      const clientData = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge: options.challenge, origin, crossOrigin: false }));
      const c = Buffer.alloc(4);
      c.writeUInt32BE(counter);
      const authData = Buffer.concat([sha256(options.rpId), Buffer.from([flags(0)]), c]);
      const signature = crypto.sign('sha256', Buffer.concat([authData, sha256(clientData)]), privateKey);
      return {
        id: b64u(credId),
        rawId: b64u(credId),
        type: 'public-key',
        response: { clientDataJSON: b64u(clientData), authenticatorData: b64u(authData), signature: b64u(signature) },
        clientExtensionResults: {},
      };
    },
  };
};

const register = async (authn, flowId = 'XK8P2M') => {
  const { options, token } = await core.registrationOptions({ body: { flowId }, ...ctx });
  return core.registrationVerify({ body: { token, response: authn.register(options) }, ...ctx });
};

const PAYMENT = { flowId: 'XK8P2M', amount: 93000, merchant: '알파문구 온라인몰' };

test('패스키 등록 → 결제 인증 → 승인서 발급 전체 흐름', async () => {
  const authn = makeAuthenticator();
  const reg = await register(authn);
  assert.equal(reg.credentialId, authn.credId);
  assert.ok(reg.certificate.includes('.'));

  const { options, token } = await core.paymentOptions({ body: { ...PAYMENT, certificate: reg.certificate }, ...ctx });
  assert.equal(options.userVerification, 'required');
  assert.deepEqual(options.allowCredentials.map((c) => c.id), [authn.credId]);

  const { approval, approvalToken } = await core.paymentAuthorize({
    body: { token, certificate: reg.certificate, response: authn.sign(options) },
    ...ctx,
  });
  assert.match(approval.approvalId, /^AP-[0-9A-F]{12}$/);
  assert.equal(approval.amount, 93000);
  assert.equal(approval.merchant, '알파문구 온라인몰');
  assert.equal(approval.userVerified, true);

  const checked = core.approvalVerify({ body: { approvalToken } });
  assert.equal(checked.approval.approvalId, approval.approvalId);
});

test('챌린지는 결제 내용에서 파생된다 (금액이 다르면 챌린지도 다름)', () => {
  const a = core._internal.paymentChallenge({ nonce: 'n', ...PAYMENT });
  const b = core._internal.paymentChallenge({ nonce: 'n', ...PAYMENT, amount: 1 });
  assert.notDeepEqual(a, b);
});

test('결제 토큰의 금액을 변조하면 거부된다', async () => {
  const authn = makeAuthenticator();
  const reg = await register(authn);
  const { options, token } = await core.paymentOptions({ body: { ...PAYMENT, certificate: reg.certificate }, ...ctx });
  const [body, sig] = token.split('.');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
  const forged = `${b64u(JSON.stringify({ ...payload, amount: 1 }))}.${sig}`;
  await assert.rejects(
    core.paymentAuthorize({ body: { token: forged, certificate: reg.certificate, response: authn.sign(options) }, ...ctx }),
    { code: 'INVALID_SIGNATURE' }
  );
});

test('다른 키로 서명한 assertion은 거부된다', async () => {
  const authn = makeAuthenticator();
  const reg = await register(authn);
  const { options, token } = await core.paymentOptions({ body: { ...PAYMENT, certificate: reg.certificate }, ...ctx });
  const forged = authn.sign(options);
  const other = makeAuthenticator().sign(options);
  forged.response.signature = other.response.signature;
  await assert.rejects(
    core.paymentAuthorize({ body: { token, certificate: reg.certificate, response: forged }, ...ctx }),
    { code: 'VERIFICATION_FAILED' }
  );
});

test('사용자 검증(생체인증) 없이 만든 assertion은 거부된다', async () => {
  const good = makeAuthenticator();
  const reg = await register(good);
  const { options, token } = await core.paymentOptions({ body: { ...PAYMENT, certificate: reg.certificate }, ...ctx });
  // 같은 키로 서명하되 UV 플래그만 끔
  const res = good.sign(options);
  const authData = Buffer.from(res.response.authenticatorData, 'base64url');
  authData[32] &= ~0x04;
  res.response.authenticatorData = b64u(authData);
  await assert.rejects(
    core.paymentAuthorize({ body: { token, certificate: reg.certificate, response: res }, ...ctx }),
    { code: 'VERIFICATION_FAILED' }
  );
});

test('같은 결제 인증을 재사용하면 거부된다', async () => {
  const authn = makeAuthenticator();
  const reg = await register(authn);
  const { options, token } = await core.paymentOptions({ body: { ...PAYMENT, certificate: reg.certificate }, ...ctx });
  const response = authn.sign(options);
  await core.paymentAuthorize({ body: { token, certificate: reg.certificate, response }, ...ctx });
  await assert.rejects(core.paymentAuthorize({ body: { token, certificate: reg.certificate, response }, ...ctx }), { code: 'REPLAYED' });
});

test('다른 Flow ID로는 결제 인증을 시작할 수 없다', async () => {
  const reg = await register(makeAuthenticator());
  await assert.rejects(
    core.paymentOptions({ body: { ...PAYMENT, flowId: 'ABCDEF', certificate: reg.certificate }, ...ctx }),
    { code: 'FLOW_ID_MISMATCH' }
  );
});

test('만료된 토큰은 거부된다', () => {
  const token = core._internal.signToken({ t: 'pay', exp: Date.now() - 1 });
  assert.throws(() => core._internal.verifyToken(token, 'pay'), { code: 'EXPIRED' });
});

test('입력값 검증', async () => {
  const reg = await register(makeAuthenticator());
  await assert.rejects(core.registrationOptions({ body: { flowId: 'bad' }, ...ctx }), { code: 'INVALID_FLOW_ID' });
  await assert.rejects(
    core.paymentOptions({ body: { ...PAYMENT, amount: -5, certificate: reg.certificate }, ...ctx }),
    { code: 'INVALID_AMOUNT' }
  );
});

test('허용되지 않은 출처는 거부된다', () => {
  assert.throws(() => core.resolveOrigin('https://evil.example.com'), { code: 'ORIGIN_NOT_ALLOWED' });
  assert.throws(() => core.resolveOrigin(undefined), { code: 'ORIGIN_REQUIRED' });
  assert.equal(core.resolveOrigin('http://localhost:3000').rpID, 'localhost');
});

test('HTTP 래퍼: 메서드·출처·JSON 오류 처리', async () => {
  const handler = route(core.registrationOptions);
  const call = (method, headers, body) =>
    new Promise((resolve) => {
      const res = {
        headers: {},
        setHeader(k, v) {
          this.headers[k] = v;
        },
        end(data) {
          resolve({ status: this.statusCode, body: JSON.parse(data) });
        },
      };
      handler({ method, headers, body }, res);
    });
  assert.equal((await call('GET', {}, undefined)).status, 405);
  assert.equal((await call('POST', { origin: 'https://evil.example.com' }, { flowId: 'XK8P2M' })).status, 403);
  assert.equal((await call('POST', { origin: ORIGIN }, '{bad json')).status, 400);
  const ok = await call('POST', { origin: ORIGIN }, { flowId: 'XK8P2M' });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.options.rp.id, 'localhost');
});

test('FLOWPAY_SECRET이 없으면 데모 키 모드로 알린다', () => {
  const prev = process.env.FLOWPAY_SECRET;
  delete process.env.FLOWPAY_SECRET;
  assert.equal(core.health({ origin: ORIGIN }).keyMode, 'demo');
  process.env.FLOWPAY_SECRET = 'x'.repeat(40);
  assert.equal(core.health({ origin: ORIGIN }).keyMode, 'configured');
  if (prev === undefined) delete process.env.FLOWPAY_SECRET;
  else process.env.FLOWPAY_SECRET = prev;
});
