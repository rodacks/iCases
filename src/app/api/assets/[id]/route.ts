import { NextResponse } from 'next/server';
import { getStorage, assetPath, type StorageKind } from '@/lib/storage';
import { db } from '@/lib/db';
import { AssetNotFoundError } from '@/lib/errors';
import { failure } from '@/lib/server';
export const runtime = 'nodejs';
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    assetPath(id);
    const asset = await db.asset.findUnique({ where: { id } });
    if (!asset) return new NextResponse(null, { status: 404 });
    const data = await getStorage(asset.storageProvider as StorageKind).get(id);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'private, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (e) {
    if (e instanceof AssetNotFoundError) return new NextResponse(null, { status: 404 });
    return failure(e);
  }
}
