import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { blobStorage, storageKind, assetPath } from '../src/lib/storage';
import { processImage } from '../src/lib/process-image';
import { imageLimits, hasImageSignature } from '../src/lib/image-limits';
import { AssetNotFoundError } from '../src/lib/errors';

test('Vercel nunca selecciona disco local y falla explícitamente sin token', () => {
  assert.equal(storageKind({ VERCEL: '1' }), 'vercel-blob');
  assert.equal(storageKind({ BLOB_READ_WRITE_TOKEN: 'configured' }), 'vercel-blob');
  assert.equal(storageKind({}), 'local');
  assert.throws(() => storageKind({ VERCEL: '1', ASSET_STORAGE: 'local' }), /persistente/);
  assert.throws(() => blobStorage(''), /configurar Vercel Blob/);
  assert.throws(() => assetPath('../../secrets'), AssetNotFoundError);
});
test('Blob privado conserva el recurso entre instancias sin usar disco ni URL del cliente', async () => {
  const objects = new Map<string, Buffer>(),
    calls: string[] = [];
  const driver = {
    async put(path: string, body: unknown, options: Record<string, unknown>) {
      assert.equal(options.access, 'private');
      assert.equal(options.allowOverwrite, false);
      assert.equal(options.addRandomSuffix, false);
      assert.equal(options.contentType, 'image/webp');
      assert.equal(options.token, 'test-token');
      objects.set(path, Buffer.from(body as Buffer));
      calls.push('put');
      return {};
    },
    async get(path: string, options: Record<string, unknown>) {
      assert.equal(options.access, 'private');
      assert.equal(options.token, 'test-token');
      const data = objects.get(path);
      return data ? { statusCode: 200, stream: new Response(new Uint8Array(data)).body } : null;
    },
    async del(path: string) {
      objects.delete(path);
      calls.push('del');
    },
  } as unknown as NonNullable<Parameters<typeof blobStorage>[1]>;
  const id = crypto.randomUUID(),
    data = Buffer.from('image bytes');
  await blobStorage('test-token', driver).put(id, data);
  assert.deepEqual(await blobStorage('test-token', driver).get(id), data);
  await blobStorage('test-token', driver).remove(id);
  await assert.rejects(() => blobStorage('test-token', driver).get(id), AssetNotFoundError);
  assert.deepEqual(calls, ['put', 'del']);
});
test('normalización PNG, JPEG y WebP preserva proporción y limita dimensiones', async () => {
  for (const format of ['png', 'jpeg', 'webp'] as const) {
    const input = await sharp({
      create: { width: 2500, height: 1000, channels: 4, background: '#12345680' },
    })
      [format]()
      .toBuffer();
    assert.equal(hasImageSignature(input), true);
    const result = await processImage(input, format === 'jpeg' ? 'image/jpeg' : `image/${format}`);
    assert.equal(result.info.width, 2048);
    assert.equal(result.info.height, 819);
    const metadata = await sharp(result.data).metadata();
    assert.equal(metadata.format, 'webp');
    assert.equal(metadata.exif, undefined);
    assert.ok(result.data.length <= imageLimits.uploadBytes);
    if (format !== 'jpeg') assert.equal(metadata.hasAlpha, true);
  }
});
test('archivos falsos, vacíos, grandes y bombas de píxeles son rechazados', async () => {
  await assert.rejects(() => processImage(Buffer.from('<svg/>'), 'image/png'), /válido/);
  await assert.rejects(() => processImage(Buffer.alloc(0), 'image/png'), /3 MB/);
  await assert.rejects(
    () => processImage(Buffer.alloc(imageLimits.uploadBytes + 1), 'image/png'),
    /3 MB/,
  );
  await assert.rejects(() => processImage(Buffer.from('abc'), 'image/gif'), /PNG/);
  const bomb = await sharp({
    create: { width: 6000, height: 5000, channels: 3, background: 'white' },
  })
    .png()
    .toBuffer();
  await assert.rejects(() => processImage(bomb, 'image/png'), /25 megapíxeles/);
  assert.equal(hasImageSignature(Buffer.from('GIF89a')), false);
});
