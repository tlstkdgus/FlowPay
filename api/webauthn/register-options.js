// POST /api/webauthn/register-options — 패스키 등록 챌린지 발급
const { route } = require('../_lib/http');
const { registrationOptions } = require('../_lib/core');

module.exports = route(registrationOptions);
