// POST /api/payments/authorize — 결제 서명(assertion) 검증 후 결제 승인서 발급
const { route } = require('../_lib/http');
const { paymentAuthorize } = require('../_lib/core');

module.exports = route(paymentAuthorize);
