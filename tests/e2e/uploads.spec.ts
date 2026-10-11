import { test, expect } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';

test('archivo original mayor de 4,5 MB se prepara en navegador y persiste reducido', async ({
  page,
}) => {
  await page.goto('/personalizar');
  await page.getByRole('tab', { name: 'Imagen', exact: true }).click();
  const photo = await sharp(randomBytes(1300 * 1300 * 3), {
    raw: { width: 1300, height: 1300, channels: 3 },
  })
    .png({ compressionLevel: 0 })
    .toBuffer();
  expect(photo.length).toBeGreaterThan(4.5 * 1024 * 1024);
  expect(photo.length).toBeLessThan(5 * 1024 * 1024);
  const request = page.waitForRequest(
    (r) => r.url().endsWith('/api/assets') && r.method() === 'POST',
  );
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'grande.png', mimeType: 'image/png', buffer: photo });
  const sent = await request;
  await expect(
    page.getByText('Imagen guardada y lista para editar.', { exact: true }),
  ).toBeVisible();
  const bytes = Number(await sent.headerValue('content-length'));
  expect(bytes).toBeGreaterThan(0);
  expect(bytes).toBeLessThan(3 * 1024 * 1024 + 65536);
  const element = await page.evaluate(
    () => JSON.parse(localStorage.getItem('icases-draft-v1')!).elements[0],
  );
  expect(element.value).toMatch(/^\/api\/assets\//);
  await page.reload();
  const response = await page.request.get(element.value);
  expect(response.status()).toBe(200);
  const metadata = await sharp(await response.body()).metadata();
  expect(metadata.format).toBe('webp');
  expect(metadata.width).toBe(1300);
  expect(metadata.height).toBe(1300);
});

test('fallos de infraestructura no JSON muestran error claro sin alterar el diseño', async ({
  page,
}) => {
  await page.goto('/personalizar');
  await page.getByRole('tab', { name: 'Imagen', exact: true }).click();
  const photo = await sharp({
    create: { width: 30, height: 20, channels: 4, background: '#12345680' },
  })
    .png()
    .toBuffer();
  for (const status of [413, 500]) {
    await page.route('**/api/assets', (route) =>
      route.fulfill({ status, contentType: 'text/plain', body: 'FUNCTION_ERROR' }),
    );
    await page
      .locator('input[type=file]')
      .setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: photo });
    await expect(
      page.getByText(
        status === 413
          ? 'La imagen es demasiado grande para subirla. Probá con una más pequeña.'
          : 'No pudimos guardar la imagen. Intentá de nuevo en unos minutos.',
        { exact: true },
      ),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem('icases-draft-v1')!).elements.length,
      ),
    ).toBe(0);
    await page.unroute('**/api/assets');
  }
});

test('formato falso se rechaza antes de enviar y el servidor valida solicitudes directas', async ({
  page,
}) => {
  await page.goto('/personalizar');
  await page.getByRole('tab', { name: 'Imagen', exact: true }).click();
  let uploads = 0;
  page.on('request', (r) => {
    if (r.url().endsWith('/api/assets') && r.method() === 'POST') uploads++;
  });
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'falsa.png', mimeType: 'image/png', buffer: Buffer.from('<svg/>') });
  await expect(
    page.getByText('El archivo no contiene una imagen PNG, JPG o WebP válida.', { exact: true }),
  ).toBeVisible();
  expect(uploads).toBe(0);
  const invalid = await page.request.post('/api/assets', {
    multipart: {
      file: { name: 'falsa.png', mimeType: 'image/png', buffer: Buffer.from('<svg/>') },
    },
  });
  expect(invalid.status()).toBe(400);
  expect((await invalid.json()).error).toContain('válido');
  expect((await page.request.get('/api/assets/not-an-id')).status()).toBe(404);
});
