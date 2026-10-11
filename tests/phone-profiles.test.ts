import { test } from 'node:test';
import assert from 'node:assert/strict';
import { phoneProfiles, calibratedGeometry } from '../src/lib/phone-profiles';
import { models, geometry, newDesign } from '../src/lib/catalog';
import { designSchema } from '../src/lib/validation';

test('cada modelo tiene su referencia oficial y proporciones físicas coherentes', () => {
  assert.equal(Object.keys(phoneProfiles).length, models.length);
  for (const m of models) {
    const p = phoneProfiles[m.id],
      g = calibratedGeometry(m.id);
    assert.ok(p.image.startsWith('https://cdsassets.apple.com/'));
    assert.ok(p.specs.startsWith('https://support.apple.com/'));
    assert.ok(Math.abs((g.height - 12) / 268 - p.height / p.width) < 1e-10);
    assert.equal(g.lenses.length, p.pro ? 3 : 2);
    for (const [x, y] of g.lenses) {
      assert.ok(x - g.lensRadius >= 21 && x + g.lensRadius <= 21 + g.cameraWidth);
      assert.ok(y - g.lensRadius >= 21 && y + g.lensRadius <= 21 + g.cameraHeight);
    }
  }
});
test('las generaciones distinguen frontal, controles, puerto y material del marco', () => {
  assert.equal(phoneProfiles['iphone-13-pro'].front, 'notch');
  assert.equal(phoneProfiles['iphone-14-pro'].front, 'island');
  assert.equal(phoneProfiles['iphone-15'].actionButton, false);
  assert.equal(phoneProfiles['iphone-15-pro'].actionButton, true);
  assert.equal(phoneProfiles['iphone-16-plus'].cameraControl, true);
  assert.equal(phoneProfiles['iphone-14-pro'].frame, 'steel');
  assert.equal(phoneProfiles['iphone-15-pro'].frame, 'titanium');
  assert.equal(phoneProfiles['iphone-14'].port, 'lightning');
  assert.equal(phoneProfiles['iphone-15'].port, 'usb-c');
  assert.equal(calibratedGeometry('iphone-16').flashHole, true);
  assert.ok(
    calibratedGeometry('iphone-14-pro').lensRadius > calibratedGeometry('iphone-13-pro').lensRadius,
  );
});
test('diseños históricos conservan coordenadas y los nuevos persisten la plantilla calibrada', () => {
  const legacy = { ...newDesign() };
  delete legacy.templateVersion;
  assert.equal(designSchema.parse(legacy).templateVersion, undefined);
  assert.equal(geometry(legacy.modelId).height, 470);
  const next = newDesign();
  assert.equal(designSchema.parse(next).templateVersion, 2);
  assert.ok(geometry(next.modelId, next.templateVersion).height > 550);
  assert.equal(designSchema.safeParse({ ...next, templateVersion: 3 }).success, false);
});
