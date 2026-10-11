import { PrismaClient } from '@prisma/client';
import { categories, materials, models, products } from '../src/lib/catalog';
const db = new PrismaClient();
async function main() {
  for (const name of categories)
    await db.category.upsert({ where: { id: name }, update: { name }, create: { id: name, name } });
  for (const m of models) await db.phoneModel.upsert({ where: { id: m.id }, update: m, create: m });
  for (const m of materials)
    await db.material.upsert({ where: { id: m.id }, update: m, create: m });
  for (const p of products) {
    const data = { ...p, models: JSON.stringify(p.models) };
    await db.product.upsert({ where: { id: p.id }, update: data, create: data });
  }
  console.log('Catálogo inicial actualizado; pedidos y diseños conservados.');
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
