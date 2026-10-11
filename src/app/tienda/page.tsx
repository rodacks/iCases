import { db } from '@/lib/db';
import { Shop } from '@/components/shop';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Explorá la colección' };
export default async function ShopPage() {
  const products = await db.product.findMany();
  return <Shop products={products.map((p) => ({ ...p, models: JSON.parse(p.models) }))} />;
}
