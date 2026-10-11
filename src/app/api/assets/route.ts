import { PublicError } from '@/lib/errors';
import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { getStorage } from '@/lib/storage';
import { owner, sameOrigin, failure, limitedBody } from '@/lib/server';
import { processImage } from '@/lib/process-image';
import { imageLimits } from '@/lib/image-limits';
export const runtime = 'nodejs';
export const maxDuration = 30;
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    if (!req.headers.get('content-type')?.startsWith('multipart/form-data'))
      throw new PublicError('Seleccioná una imagen desde el editor.');
    const form = await new Response(await limitedBody(req, imageLimits.requestBytes), {
      headers: { 'Content-Type': req.headers.get('content-type')! },
    })
      .formData()
      .catch(() => {
        throw new PublicError('No pudimos leer el archivo. Volvé a seleccionarlo.');
      });
    const file = form.get('file');
    if (!(file instanceof File)) throw new PublicError('Seleccioná una imagen PNG, JPG o WebP.');
    const { data, info } = await processImage(Buffer.from(await file.arrayBuffer()), file.type);
    const storage = getStorage();
    const session = await owner();
    // Check database availability before creating a potentially orphaned blob.
    await db.$queryRaw`SELECT 1`;
    const id = randomUUID();
    await storage.put(id, data);
    try {
      await db.asset.create({
        data: {
          id,
          owner: session,
          mime: 'image/webp',
          width: info.width,
          height: info.height,
          storageProvider: storage.kind,
        },
      });
    } catch (e) {
      try {
        await storage.remove(id);
      } catch {
        console.error('Asset cleanup failed', id);
      }
      throw e;
    }
    return NextResponse.json({ url: `/api/assets/${id}`, width: info.width, height: info.height });
  } catch (e) {
    return failure(e);
  }
}
