/*
 * README용 화면 캡처 스크립트.
 * 사용법:
 *   1) npm run build && npx serve -s build -l 5050   (별도 터미널에서 실행)
 *   2) npm i -D puppeteer-core
 *   3) node scripts/shoot.js
 * 시스템에 설치된 Chrome을 재사용하며 docs/screenshots/*.png 를 생성합니다.
 */
const puppeteer = require('puppeteer-core');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5050';
const OUT = 'docs/screenshots';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const desktop = [
  { name: 'dashboard', path: '/' },
  { name: 'analytics', path: '/analytics' },
  { name: 'invoice', path: '/invoice' },
  { name: 'receipt', path: '/receipt' },
];

const mobile = [
  { name: 'dashboard-mobile', path: '/' },
  { name: 'payment-mobile', path: '/payment', action: 'gotoPayStep' },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--force-device-scale-factor=2', '--hide-scrollbars'],
  });

  for (const s of desktop) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto(BASE + s.path, { waitUntil: 'networkidle0' });
    await page.addStyleTag({ content: '.fixed.z-50{display:none !important}' });
    await sleep(1600);
    await page.screenshot({ path: `${OUT}/${s.name}.png`, fullPage: true });
    console.log('saved', s.name);
    await page.close();
  }

  for (const s of mobile) {
    const page = await browser.newPage();
    await page.setViewport({ width: 402, height: 850, deviceScaleFactor: 2, isMobile: true });
    await page.goto(BASE + s.path, { waitUntil: 'networkidle0' });
    await page.addStyleTag({ content: '.fixed.z-50{display:none !important}' });
    await sleep(1200);
    if (s.action === 'gotoPayStep') {
      // 상품 → 결제수단 선택 단계로 진행 후 첫 수단 선택
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('결제하기'));
        if (btn) btn.click();
      });
      await sleep(900);
      await page.evaluate(() => {
        const opt = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('네이버페이'));
        if (opt) opt.click();
      });
      await sleep(700);
    }
    await page.screenshot({ path: `${OUT}/${s.name}.png`, fullPage: true });
    console.log('saved', s.name);
    await page.close();
  }

  await browser.close();
  console.log('done');
})();
