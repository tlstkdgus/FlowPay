// POST /api/webauthn/register-verify — attestation 검증 후 자격 증명서 발급
const { route } = require('../_lib/http');
const { registrationVerify } = require('../_lib/core');

module.exports = route(registrationVerify);
