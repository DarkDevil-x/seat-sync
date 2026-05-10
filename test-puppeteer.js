const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  const rootContent = await page.$eval('#root', el => el.innerHTML);
  console.log('Root innerHTML length:', rootContent.length);
  
  await browser.close();
})();
