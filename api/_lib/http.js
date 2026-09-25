// Vercel 서버리스 함수와 로컬 개발 서버에서 공통으로 쓰는 HTTP 래퍼
const { ApiError, resolveOrigin } = require('./core');

const MAX_BODY = 64 * 1024;

const send = (res, status, data) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
};

const readBody = async (req) => {
  // Vercel은 JSON 본문을 미리 파싱해 둡니다.
  if (req.body !== undefined) {
    if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};
    if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString('utf8') || '{}');
    return req.body || {};
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new ApiError(413, 'PAYLOAD_TOO_LARGE', '요청이 너무 큽니다.');
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
};

/**
 * @param {(ctx: {body: any, origin: string, rpID: string}) => any} fn
 * @param {{ requireOrigin?: boolean }} opts
 */
const route = (fn, { requireOrigin = true } = {}) => async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'POST만 지원합니다.' });
  try {
    let body;
    try {
      body = await readBody(req);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError(400, 'INVALID_JSON', 'JSON 본문을 해석할 수 없습니다.');
    }
    const origin = req.headers.origin;
    const ctx = requireOrigin ? resolveOrigin(origin) : { origin, rpID: undefined };
    send(res, 200, await fn({ body: body || {}, ...ctx }));
  } catch (e) {
    if (e instanceof ApiError) return send(res, e.status, { error: e.code, message: e.message });
    console.error('[flowpay-api]', e);
    send(res, 500, { error: 'INTERNAL', message: '서버 오류가 발생했습니다.' });
  }
};

module.exports = { route, send };
