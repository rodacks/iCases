import { chromium, devices } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
await mkdir('test-results/visual', { recursive: true });
const browser = await chromium.launch();
for (const [name, options] of [
  ['desktop', { viewport: { width: 1440, height: 1000 } }],
  ['mobile', { ...devices['iPhone 13'] }],
]) {
  const page = await browser.newPage(options);
  page.on('pageerror', (e) => console.error('BROWSER ERROR', e.message));
  for (const [label, route] of [
    ['home', '/'],
    ['editor', '/personalizar'],
    ['shop', '/tienda'],
  ]) {
    await page.goto(`http://127.0.0.1:3000${route}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: `test-results/visual/${name}-${label}.png`,
      fullPage: label === 'home',
    });
    console.log(
      name,
      label,
      await page.title(),
      await page
        .locator('body')
        .evaluate((el) => ({ width: el.scrollWidth, viewport: window.innerWidth })),
    );
  }
  await page.close();
}
await browser.close();
