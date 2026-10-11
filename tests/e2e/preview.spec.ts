import { test, expect } from '@playwright/test';
import { models } from '../../src/lib/catalog';

test('los 16 modelos renderizan en 3D y responden al giro', async ({
  page,
  isMobile,
  context,
}, info) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/tienda/lilac');
  const preview = page.locator('.case-preview'),
    canvas = page.locator('.three-viewport canvas');
  let previous = '';
  for (const model of models) {
    await page.getByLabel('Tu modelo de iPhone').selectOption(model.id);
    await expect(preview).toHaveAttribute('data-preview-status', 'ready');
    await expect
      .poll(
        async () =>
          JSON.parse((await preview.getAttribute('data-rendered-config')) || '{}').modelId,
      )
      .toBe(model.id);
    const screenshot = await canvas.screenshot({ path: info.outputPath(`${model.id}.png`) });
    expect(screenshot.toString('base64')).not.toBe(previous);
    previous = screenshot.toString('base64');
    await expect(
      page.getByRole('button', { name: 'Agregar al carrito', exact: true }),
    ).toBeEnabled();
  }
  await canvas.scrollIntoViewIfNeeded();
  const before = await canvas.screenshot();
  if (isMobile) {
    const cdp = await context.newCDPSession(page),
      b = (await canvas.boundingBox())!;
    const x = b.x + b.width / 2,
      y = b.y + b.height / 2;
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ id: 1, x, y }],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ id: 1, x: x + 70, y }],
    });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else await page.getByRole('button', { name: 'Girar funda a la derecha' }).click();
  expect((await canvas.screenshot()).equals(before)).toBe(false);
  const icon = await page
    .getByRole('button', { name: 'Restablecer vista 3D' })
    .locator('svg')
    .boundingBox();
  expect(icon!.width).toBeLessThan(30);
  expect(errors).toEqual([]);
});

test('el 3D actualiza el diseño y conserva elementos al volver a editar', async ({ page }) => {
  await page.goto('/personalizar');
  await page.getByRole('tab', { name: 'Stickers', exact: true }).click();
  await page.getByRole('button', { name: 'Añadir Corazones', exact: true }).click();
  await page.getByRole('button', { name: 'Vista 3D', exact: true }).click();
  const preview = page.locator('.case-preview');
  await expect(preview).toHaveAttribute('data-preview-status', 'ready');
  await page.getByRole('tab', { name: 'Base', exact: true }).click();
  await page.getByRole('button', { name: 'Color #c7bee8', exact: true }).click();
  await page.getByLabel('Material', { exact: true }).selectOption('gloss');
  await expect
    .poll(
      async () =>
        JSON.parse((await preview.getAttribute('data-rendered-config')) || '{}').materialId,
    )
    .toBe('gloss');
  const rendered = JSON.parse((await preview.getAttribute('data-rendered-config'))!);
  expect(rendered.color).toBe('#c7bee8');
  expect(rendered.elements).toHaveLength(1);
  await page.getByRole('button', { name: 'Editar 2D', exact: true }).click();
  await expect(page.locator('.editing-case [data-element]')).toHaveCount(1);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('icases-draft-v1')!))).toEqual(
    rendered,
  );
});

test('sin WebGL se conserva la vista 2D y la compra', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.includes('webgl')) return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto('/tienda/lilac');
  await expect(page.locator('.case-preview')).toHaveAttribute('data-preview-status', 'fallback');
  await expect(page.locator('.preview-fallback')).toBeVisible();
  await page.getByLabel('Tu modelo de iPhone').selectOption('iphone-13-mini');
  await expect(page.getByRole('button', { name: 'Agregar al carrito', exact: true })).toBeEnabled();
});
