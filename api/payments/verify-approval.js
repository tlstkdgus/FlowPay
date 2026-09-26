// POST /api/payments/verify-approval — 결제 승인서가 서버가 발급한 것인지 확인
const { route } = require('../_lib/http');
const { approvalVerify } = require('../_lib/core');

module.exports = route(approvalVerify, { requireOrigin: false });
