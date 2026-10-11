import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET() {
  const products = await db.product.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(products.map((p) => ({ ...p, models: JSON.parse(p.models) })));
}
