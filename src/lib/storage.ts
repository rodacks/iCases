import path from 'node:path';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import * as blob from '@vercel/blob';
import { AssetNotFoundError, ServiceUnavailableError } from './errors';
export type StorageKind = 'local' | 'vercel-blob';
export interface AssetStorage {
  kind: StorageKind;
  put(id: string, data: Buffer): Promise<void>;
  get(id: string): Promise<Buffer>;
  remove(id: string): Promise<void>;
}
export function assetPath(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    throw new AssetNotFoundError();
  return `assets/${id}.webp`;
}
export function storageKind(env: Record<string, string | undefined> = process.env): StorageKind {
  const kind =
    env.ASSET_STORAGE || (env.VERCEL || env.BLOB_READ_WRITE_TOKEN ? 'vercel-blob' : 'local');
  if (kind !== 'local' && kind !== 'vercel-blob')
    throw new ServiceUnavailableError(
      'El almacenamiento de imágenes no está configurado correctamente.',
    );
  if (env.VERCEL && kind === 'local')
    throw new ServiceUnavailableError(
      'La tienda debe configurar almacenamiento persistente para recibir imágenes.',
    );
  return kind;
}
export function blobStorage(
  token: string,
  driver: Pick<typeof blob, 'put' | 'get' | 'del'> = blob,
): AssetStorage {
  if (!token)
    throw new ServiceUnavailableError(
      'La subida de imágenes no está habilitada. La tienda debe configurar Vercel Blob.',
    );
  return {
    kind: 'vercel-blob',
    async put(id, data) {
      await driver.put(assetPath(id), data, {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: 'image/webp',
        token,
      });
    },
    async get(id) {
      const result = await driver.get(assetPath(id), { access: 'private', token });
      if (!result) throw new AssetNotFoundError();
      if (result.statusCode !== 200) throw new Error('Unexpected Blob response');
      return Buffer.from(await new Response(result.stream).arrayBuffer());
    },
    async remove(id) {
      await driver.del(assetPath(id), { token });
    },
  };
}
export function getStorage(kind: StorageKind = storageKind()): AssetStorage {
  if (kind === 'vercel-blob') return blobStorage(process.env.BLOB_READ_WRITE_TOKEN || '');
  if (kind !== 'local' || process.env.VERCEL)
    throw new ServiceUnavailableError(
      'Esta imagen requiere migrar el almacenamiento local de la tienda.',
    );
  const root = path.resolve(
    /* turbopackIgnore: true */ process.env.UPLOAD_DIR || './storage/uploads',
  );
  const filename = (id: string) => {
    assetPath(id);
    return path.join(root, `${id}.webp`);
  };
  return {
    kind: 'local',
    async put(id, data) {
      const target = filename(id);
      await mkdir(root, { recursive: true });
      await writeFile(target, data, { flag: 'wx' });
    },
    async get(id) {
      try {
        return await readFile(filename(id));
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') throw new AssetNotFoundError();
        throw e;
      }
    },
    async remove(id) {
      await unlink(filename(id));
    },
  };
}
