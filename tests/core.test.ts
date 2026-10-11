import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  customPrice,
  productPrice,
  products,
  models,
  materials,
  newDesign,
  geometry,
} from '../src/lib/catalog';
import { designSchema, customerSchema, checkoutSchema } from '../src/lib/validation';
test('precio personalizado consistente para todos los modelos y materiales', () => {
  for (const m of models)
    for (const material of materials)
      assert.equal(customPrice(m.id, material.id), material.price + m.extra + 200);
  assert.throws(() => customPrice('fake', 'silicone'));
});
test('productos rechazan modelos incompatibles', () => {
  assert.equal(productPrice(products[0], 'iphone-16-pro-max'), products[0].price + 150);
  assert.throws(() => productPrice({ ...products[0], models: [] }, 'iphone-16'));
});
test('diseño serializa sin perder transformaciones ni recursos', () => {
  const design = {
    ...newDesign(),
    elements: [
      {
        id: crypto.randomUUID(),
        type: 'image' as const,
        value: `/api/assets/${crypto.randomUUID()}`,
        x: 140,
        y: 260,
        width: 140,
        height: 100,
        rotation: 38,
        color: '#ffffff',
        font: 'Arial',
      },
    ],
  };
  assert.deepEqual(designSchema.parse(JSON.parse(JSON.stringify(design))), design);
  assert.equal(designSchema.safeParse({ ...design, color: 'url(javascript:bad)' }).success, false);
  assert.equal(
    designSchema.safeParse({
      ...design,
      elements: [{ ...design.elements[0], value: 'file:///photo.png' }],
    }).success,
    false,
  );
});
test('validación de compras bloquea cantidades, datos y modelos inválidos', () => {
  assert.equal(customerSchema.safeParse({ email: 'incorrecto' }).success, false);
  assert.equal(
    checkoutSchema.safeParse({
      requestId: crypto.randomUUID(),
      items: [{ kind: 'product', productId: 'sage', modelId: 'iphone-16', quantity: -1 }],
      customer: {},
    }).success,
    false,
  );
});
test('plantillas distinguen cámaras y proporciones', () => {
  assert.notEqual(geometry('iphone-13-mini').height, geometry('iphone-16-pro-max').height);
  assert.equal(geometry('iphone-16-pro').pro, true);
  assert.equal(geometry('iphone-16').vertical, true);
});
