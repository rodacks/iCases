// Run locally with access to the old uploads directory and the destination database.
import { PrismaClient } from '@prisma/client';
import { getStorage, blobStorage } from '../src/lib/storage';
import { AssetNotFoundError } from '../src/lib/errors';
try {
  process.loadEnvFile('.env');
} catch (e) {
  if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
}
const db = new PrismaClient();
async function main() {
  const source = getStorage('local'),
    target = blobStorage(process.env.BLOB_READ_WRITE_TOKEN || '');
  const assets = await db.asset.findMany({ where: { storageProvider: 'local' } });
  for (const asset of assets) {
    const bytes = await source.get(asset.id);
    let existing: Buffer | undefined;
    try {
      existing = await target.get(asset.id);
    } catch (e) {
      if (!(e instanceof AssetNotFoundError)) throw e;
    }
    if (existing && !existing.equals(bytes))
      throw new Error(`El recurso ${asset.id} ya existe con otro contenido; no se sobrescribió.`);
    if (!existing) await target.put(asset.id, bytes);
    await db.asset.update({ where: { id: asset.id }, data: { storageProvider: 'vercel-blob' } });
    console.log('Migrado', asset.id);
  }
  console.log(`${assets.length} recursos migrados; archivos locales conservados.`);
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
