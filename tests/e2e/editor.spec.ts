import { test, expect } from '@playwright/test';
import sharp from 'sharp';

test('arrastre real, pellizco táctil, historial y capas', async ({ page, isMobile, context }) => {
  await page.goto('/personalizar');
  await page.getByRole('tab', { name: 'Stickers', exact: true }).click();
  await page.getByRole('button', { name: 'Añadir Estrellas', exact: true }).click();
  const svg = page.locator('.editing-case');
  const before = await page.evaluate(
    () => JSON.parse(localStorage.getItem('icases-draft-v1')!).elements[0],
  );
  await svg.scrollIntoViewIfNeeded();
  const box = (await svg.boundingBox())!;
  const logicalHeight = await svg.evaluate((el) => (el as SVGSVGElement).viewBox.baseVal.height);
  const x = box.x + (before.x * box.width) / 280,
    y = box.y + (before.y * box.height) / logicalHeight;
  if (isMobile) {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ id: 1, x, y }],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ id: 1, x: x + 20, y: y + 20 }],
    });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const moved = await page.evaluate(
      () => JSON.parse(localStorage.getItem('icases-draft-v1')!).elements[0],
    );
    expect(moved.x).toBeGreaterThan(before.x);
    const cx = box.x + (moved.x * box.width) / 280,
      cy = box.y + (moved.y * box.height) / logicalHeight;
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ id: 1, x: cx, y: cy }],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { id: 1, x: cx, y: cy },
        { id: 2, x: cx + 20, y: cy + 20 },
      ],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { id: 1, x: cx - 5, y: cy - 5 },
        { id: 2, x: cx + 30, y: cy + 30 },
      ],
    });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect
      .poll(async () =>
        page.evaluate(() => JSON.parse(localStorage.getItem('icases-draft-v1')!).elements[0].width),
      )
      .toBeGreaterThan(moved.width);
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 30, y + 35, { steps: 5 });
    await page.mouse.up();
    const moved = await page.evaluate(
      () => JSON.parse(localStorage.getItem('icases-draft-v1')!).elements[0],
    );
    expect(moved.x).toBeGreaterThan(before.x);
    expect(moved.y).toBeGreaterThan(before.y);
  }
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Rehacer', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Rehacer', exact: true }).click();
  await page.getByRole('button', { name: 'Duplicar elemento', exact: true }).click();
  await page.getByRole('tab', { name: 'Capas', exact: true }).click();
  await expect(page.locator('.layer-list button')).toHaveCount(2);
  await page.getByRole('button', { name: 'Enviar atrás', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar elemento', exact: true }).click();
  await expect(page.locator('.layer-list button')).toHaveCount(1);
});

test('el PNG de composición excluye cámaras y exterior de la funda', async ({ page }) => {
  await page.goto('/personalizar');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar composición PNG' }).click();
  const file = (await (await download).path())!;
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  expect(info.width).toBe(1120);
  expect(info.height).toBe(Math.floor((12 + (268 * 147.6) / 71.6) * 4));
  const alpha = (x: number, y: number) => data[(y * info.width + x) * 4 + 3];
  expect(alpha(0, 0)).toBe(0);
  expect(alpha(53 * 4, 55 * 4)).toBe(0);
  expect(
    alpha(
      Math.round((21 + (16.5 * 268) / 71.6 + 14) * 4),
      Math.round((21 + (16 * 268) / 71.6) * 4),
    ),
  ).toBe(0);
  expect(alpha(140 * 4, 300 * 4)).toBe(255);
});
