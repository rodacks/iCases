import { NextResponse } from 'next/server';
import { createOrder } from '@/lib/orders';
import { owner, sameOrigin, jsonBody, failure } from '@/lib/server';
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const order = await createOrder(await jsonBody(req), await owner());
    return NextResponse.json({ id: order.id, number: order.number, total: order.total });
  } catch (e) {
    return failure(e);
  }
}
