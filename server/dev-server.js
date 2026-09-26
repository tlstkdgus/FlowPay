// 로컬 개발 서버: /api/* 요청을 Vercel 함수와 같은 핸들러로 처리합니다.
//   npm run api            → API만 실행 (CRA 개발 서버가 package.json의 proxy로 연결)
//   npm run serve          → 빌드 결과(build/)와 API를 함께 제공 (배포 환경과 동일한 구성)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 4000;
const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const serveStatic = process.argv.includes('--static');

const ROUTES = {
  '/api/health': 'api/health.js',
  '/api/webauthn/register-options': 'api/webauthn/register-options.js',
  '/api/webauthn/register-verify': 'api/webauthn/register-verify.js',
  '/api/payments/options': 'api/payments/options.js',
  '/api/payments/authorize': 'api/payments/authorize.js',
  '/api/payments/verify-approval': 'api/payments/verify-approval.js',
};

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);

  if (pathname.startsWith('/api/')) {
    const file = ROUTES[pathname.replace(/\/$/, '')];
    if (!file) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'NOT_FOUND' }));
    }
    return require(path.join(ROOT, file))(req, res);
  }

  if (!serveStatic) {
    res.writeHead(404);
    return res.end('API 서버입니다. 앱은 npm start 로 실행하세요.');
  }

  // 정적 파일 + SPA 대체 경로
  let file = path.join(BUILD, pathname);
  if (!file.startsWith(BUILD) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(BUILD, 'index.html');
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  const mode = process.env.FLOWPAY_SECRET && process.env.FLOWPAY_SECRET.length >= 32 ? '운영 키' : '데모 키';
  console.log(`FlowPay ${serveStatic ? '앱+API' : 'API'} 서버: http://localhost:${PORT} (서명 키: ${mode})`);
});
