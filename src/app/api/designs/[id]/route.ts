import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { owner } from '@/lib/server';
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const design = await db.design.findFirst({ where: { id, owner: await owner() } });
  return design
    ? NextResponse.json({
        id: design.id,
        config: JSON.parse(design.configuration),
        price: design.price,
      })
    : NextResponse.json({ error: 'Diseño no encontrado en este navegador.' }, { status: 404 });
}
