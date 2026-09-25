// POST /api/payments/options — 결제 내용에 묶인 인증 챌린지 발급
const { route } = require('../_lib/http');
const { paymentOptions } = require('../_lib/core');

module.exports = route(paymentOptions);
