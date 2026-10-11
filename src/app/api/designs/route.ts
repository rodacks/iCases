import { PublicError } from '@/lib/errors';
import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { designSchema } from '@/lib/validation';
import { customPrice } from '@/lib/catalog';
import { owner, sameOrigin, jsonBody, failure } from '@/lib/server';
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const session = await owner();
    const config = designSchema.parse(await jsonBody(req));
    for (const el of config.elements.filter((e) => e.type === 'image')) {
      if (!(await db.asset.findFirst({ where: { id: el.value.split('/').pop(), owner: session } })))
        throw new PublicError('Una imagen no está disponible. Subila nuevamente.');
    }
    const price = customPrice(config.modelId, config.materialId);
    const design = await db.design.create({
      data: { id: randomUUID(), owner: session, configuration: JSON.stringify(config), price },
    });
    return NextResponse.json({ id: design.id, price, config });
  } catch (e) {
    return failure(e);
  }
}
