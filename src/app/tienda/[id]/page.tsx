import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { ProductDetail } from '@/components/product-detail';
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id } });
  if (!product) notFound();
  return <ProductDetail product={{ ...product, models: JSON.parse(product.models) }} />;
}
