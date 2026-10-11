import { PublicError } from '@/lib/errors';
import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';
import { owner, sameOrigin, failure, limitedBody } from '@/lib/server';
export const runtime = 'nodejs';
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const session = await owner();
    if (Number(req.headers.get('content-length') || 0) > 6 * 1024 * 1024)
      throw new PublicError('El archivo supera el límite de 5 MB.');
    const form = await new Response(await limitedBody(req, 6 * 1024 * 1024), {
      headers: { 'Content-Type': req.headers.get('content-type') || '' },
    }).formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size > 5 * 1024 * 1024 || file.size === 0)
      throw new PublicError('Seleccioná una imagen de hasta 5 MB.');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
      throw new PublicError('Usá una imagen PNG, JPG o WebP.');
    const input = Buffer.from(await file.arrayBuffer());
    const pipeline = sharp(input, { limitInputPixels: 25_000_000, animated: false });
    const meta = await pipeline.metadata().catch(() => {
      throw new PublicError('El archivo no contiene una imagen PNG, JPG o WebP válida.');
    });
    if (!['png', 'jpeg', 'webp'].includes(meta.format || ''))
      throw new PublicError('El contenido del archivo no es una imagen compatible.');
    const { data, info } = await pipeline
      .rotate()
      .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90 })
      .toBuffer({ resolveWithObject: true });
    const id = randomUUID();
    await storage.put(id, data);
    try {
      await db.asset.create({
        data: { id, owner: session, mime: 'image/webp', width: info.width, height: info.height },
      });
    } catch (e) {
      await storage.remove(id);
      throw e;
    }
    return NextResponse.json({ url: `/api/assets/${id}`, width: info.width, height: info.height });
  } catch (e) {
    return failure(e);
  }
}
