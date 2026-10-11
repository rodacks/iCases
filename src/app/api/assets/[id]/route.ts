import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { db } from '@/lib/db';
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const asset = await db.asset.findUnique({ where: { id } });
    if (!asset) return new NextResponse(null, { status: 404 });
    const data = await storage.get(id);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'private, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
