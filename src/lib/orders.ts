import { PublicError } from '@/lib/errors';
import { randomUUID } from 'node:crypto';
import { db } from './db';
import { demoPaymentProvider } from './payments';
import { checkoutSchema, designSchema } from './validation';
import { customPrice, productPrice, productDesign, type Product } from './catalog';
export async function createOrder(input: unknown, owner: string) {
  const data = checkoutSchema.parse(input);
  const existing = await db.order.findUnique({
    where: { requestId: data.requestId },
    include: { items: true },
  });
  if (existing) {
    if (existing.owner !== owner) throw new PublicError('Solicitud inválida');
    return existing;
  }
  const items = await Promise.all(
    data.items.map(async (line) => {
      if (line.kind === 'custom') {
        const saved = await db.design.findFirst({ where: { id: line.designId, owner } });
        if (!saved)
          throw new PublicError(
            'No encontramos tu diseño guardado. Volvé a guardarlo desde el editor.',
          );
        const config = designSchema.parse(JSON.parse(saved.configuration));
        if (config.modelId !== line.modelId)
          throw new PublicError('El modelo del diseño no coincide');
        return {
          kind: 'custom',
          designId: saved.id,
          name: 'Tu creación · Funda personalizada',
          modelId: config.modelId,
          materialId: config.materialId,
          quantity: line.quantity,
          unitPrice: customPrice(config.modelId, config.materialId),
          snapshot: JSON.stringify(config),
        };
      }
      const saved = await db.product.findUnique({ where: { id: line.productId } });
      if (!saved || !saved.available) throw new PublicError('Este producto ya no está disponible');
      const product: Product = { ...saved, models: JSON.parse(saved.models) };
      return {
        kind: 'product',
        productId: product.id,
        name: product.name,
        modelId: line.modelId,
        materialId: product.materialId,
        quantity: line.quantity,
        unitPrice: productPrice(product, line.modelId),
        snapshot: JSON.stringify(productDesign(product, line.modelId)),
      };
    }),
  );
  const id = randomUUID();
  const payment = demoPaymentProvider.prepare();
  try {
    return await db.order.create({
      data: {
        id,
        number: `IC-${id.slice(0, 8).toUpperCase()}`,
        requestId: data.requestId,
        owner,
        customer: JSON.stringify(data.customer),
        paymentStatus: payment.status,
        total: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
        items: { create: items },
      },
      include: { items: true },
    });
  } catch (error) {
    const retry = await db.order.findUnique({
      where: { requestId: data.requestId },
      include: { items: true },
    });
    if (retry?.owner === owner) return retry;
    throw error;
  }
}
