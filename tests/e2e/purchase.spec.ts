import { test, expect, type Page } from '@playwright/test';
import sharp from 'sharp';
async function checkout(page: Page) {
  await page.goto('/checkout');
  await page.getByLabel('Nombre', { exact: true }).fill('María');
  await page.getByLabel('Apellido', { exact: true }).fill('Prueba');
  await page.getByLabel('Correo electrónico').fill('maria@example.com');
  await page.getByLabel('Teléfono').fill('099123456');
  await page.getByLabel('Departamento').selectOption('Montevideo');
  await page.getByLabel('Ciudad', { exact: true }).fill('Montevideo');
  await page.getByLabel('Dirección', { exact: true }).fill('Calle de prueba 123');
  await page.getByRole('button', { name: 'Confirmar pedido de demostración' }).click();
  await expect(page).toHaveURL(/\/pedido\/[0-9a-f-]+/);
  await expect(page.getByText('No se realizó ningún cobro.', { exact: false })).toBeVisible();
}
test('A: imagen persistida, transformaciones, PNG, carrito y pedido personalizado', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Diseñar mi funda', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Guardar diseño' })).toBeEnabled();
  await page.getByLabel('Modelo de iPhone', { exact: true }).selectOption('iphone-16-pro-max');
  await page.getByLabel('Material', { exact: true }).selectOption('matte');
  await page.getByRole('button', { name: 'Color #c7bee8', exact: true }).click();
  await page.getByRole('button', { name: 'Lunares', exact: true }).click();
  await page.getByRole('tab', { name: 'Stickers', exact: true }).click();
  await page.getByRole('button', { name: 'Añadir Corazones', exact: true }).click();
  await page.getByRole('tab', { name: 'Imagen', exact: true }).click();
  const photo = await sharp({
    create: { width: 320, height: 200, channels: 3, background: '#739dcc' },
  })
    .png()
    .toBuffer();
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'prueba.png', mimeType: 'image/png', buffer: photo });
  await expect(page.getByText('Imagen guardada y lista para editar.')).toBeVisible();
  await page.getByLabel('Posición X del elemento').fill('155');
  await page.getByLabel('Posición Y del elemento').fill('320');
  await page.getByLabel('Tamaño del elemento').fill('145');
  await page.getByLabel('Rotación del elemento').fill('32');
  await page.getByRole('tab', { name: 'Texto', exact: true }).click();
  await page.getByLabel('Tu texto', { exact: true }).fill('Hecha por mí');
  await page.getByRole('button', { name: 'Añadir texto', exact: true }).click();
  await page.getByLabel('Tipografía', { exact: true }).selectOption('Georgia');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar composición PNG' }).click();
  expect((await download).suggestedFilename()).toBe('icases-composicion.png');
  await page.getByRole('button', { name: 'Agregar al carrito', exact: true }).click();
  await expect(
    page.getByText('¡Tu creación ya está en el carrito!', { exact: false }),
  ).toBeVisible();
  const before = await page.evaluate(
    () => JSON.parse(localStorage.getItem('icases-cart-v1')!).state.items[0],
  );
  expect(before.design.elements).toHaveLength(3);
  expect(before.design.elements[1]).toMatchObject({ x: 155, y: 320, width: 145, rotation: 32 });
  await page.goto('/carrito');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Tu creación · Funda personalizada' }),
  ).toBeVisible();
  await checkout(page);
  await expect(page.getByRole('link', { name: 'Recuperar diseño' })).toBeVisible();
  await page.reload();
  await page.getByRole('link', { name: 'Recuperar diseño' }).click();
  await expect(page.getByText('Diseño recuperado. Podés seguir creando.')).toBeVisible();
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('icases-draft-v1')!));
  expect(restored).toEqual(before.design);
  const image = await page.request.get(restored.elements[1].value);
  expect(image.status()).toBe(200);
  expect(image.headers()['content-type']).toBe('image/webp');
  await page.goto('/carrito');
  await expect(page.getByText('Tu carrito está vacío.', { exact: false })).toBeVisible();
});
test('B: filtrar colección, elegir modelo, cambiar cantidad y comprar', async ({ page }) => {
  await page.goto('/tienda');
  await page.getByRole('button', { name: 'Minimal', exact: true }).click();
  await page.getByRole('textbox', { name: 'Buscar productos' }).fill('Sage');
  await page.getByRole('combobox', { name: 'Filtrar por modelo' }).selectOption('iphone-15');
  await expect(page.getByText('1 diseños', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: /Sage Studio/ }).click();
  await expect(page.getByRole('button', { name: 'Agregar al carrito' })).toBeDisabled();
  await page.getByLabel('Tu modelo de iPhone').selectOption('iphone-15');
  await page.getByRole('button', { name: 'Agregar al carrito' }).click();
  await page.goto('/carrito');
  await page.getByRole('button', { name: 'Aumentar cantidad de Sage Studio' }).click();
  await expect(page.getByLabel('Cantidad', { exact: true })).toHaveText('2');
  await page.reload();
  await expect(page.getByLabel('Cantidad', { exact: true })).toHaveText('2');
  await checkout(page);
  await expect(page.getByText('2 ×', { exact: false })).toBeVisible();
});
test('servidor rechaza archivos falsos y recalcula precios con idempotencia', async ({
  request,
}) => {
  const bad = await request.post('/api/assets', {
    multipart: {
      file: { name: 'bad.png', mimeType: 'image/png', buffer: Buffer.from('not an image') },
    },
  });
  expect(bad.status()).toBe(400);
  const payload = {
    requestId: crypto.randomUUID(),
    customer: {
      firstName: 'Ana',
      lastName: 'Prueba',
      email: 'ana@example.com',
      phone: '099123456',
      department: 'Montevideo',
      city: 'Montevideo',
      address: 'Prueba 123',
      notes: '',
    },
    items: [
      { kind: 'product', productId: 'sage', modelId: 'iphone-16-pro', quantity: 2, unitPrice: 1 },
    ],
    total: 1,
  };
  const response = await request.post('/api/orders', { data: payload });
  expect(response.ok()).toBeTruthy();
  const order = await response.json();
  expect(order.total).toBe(2380);
  const repeat = await request.post('/api/orders', { data: payload });
  expect((await repeat.json()).id).toBe(order.id);
  const invalid = await request.post('/api/orders', {
    data: {
      ...payload,
      requestId: crypto.randomUUID(),
      items: [{ ...payload.items[0], quantity: 0 }],
    },
  });
  expect(invalid.status()).toBe(400);
});
test('checkout conserva carrito cuando falla el guardado', async ({ page }) => {
  await page.goto('/tienda/sage');
  await page.getByLabel('Tu modelo de iPhone').selectOption('iphone-16');
  await page.getByRole('button', { name: 'Agregar al carrito' }).click();
  await page.route('**/api/orders', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Error de prueba' }),
    }),
  );
  await page.goto('/checkout');
  await page.getByLabel('Nombre', { exact: true }).fill('Ana');
  await page.getByLabel('Apellido', { exact: true }).fill('Prueba');
  await page.getByLabel('Correo electrónico').fill('ana@example.com');
  await page.getByLabel('Teléfono').fill('099123456');
  await page.getByLabel('Departamento').selectOption('Montevideo');
  await page.getByLabel('Ciudad', { exact: true }).fill('Montevideo');
  await page.getByLabel('Dirección', { exact: true }).fill('Prueba 123');
  await page.getByRole('button', { name: 'Confirmar pedido de demostración' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Tu carrito se conserva' })).toContainText(
    'Tu carrito se conserva',
  );
  await page.goto('/carrito');
  await expect(page.getByRole('heading', { name: 'Sage Studio' })).toBeVisible();
});
