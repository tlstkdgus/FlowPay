// POST /api/health — 인증 서버 상태 (키 모드, 현재 출처 허용 여부)
const { route } = require('./_lib/http');
const { health } = require('./_lib/core');

module.exports = route(({ origin }) => health({ origin }), { requireOrigin: false });
