import { region } from '@/lib/catalog';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import { db } from '@/lib/db';
import { money, models, materials, type Design } from '@/lib/catalog';
import { OrderDesign } from '@/components/order-design';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Tu pedido', robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();
  return (
    <div className="section-width page-space confirmation">
      <div className="success-icon">
        <Check size={30} />
      </div>
      <div className="eyebrow">PEDIDO GUARDADO</div>
      <h1>¡Tu estilo quedó registrado!</h1>
      <p>
        Pedido <strong>{order.number}</strong> ·{' '}
        {new Intl.DateTimeFormat('es-UY', {
          dateStyle: 'medium',
          timeZone: 'America/Montevideo',
        }).format(order.createdAt)}
      </p>
      <div className="notice">
        No se realizó ningún cobro. Este pedido es una demostración y no genera un envío.
      </div>
      <p className="small-note">
        Conservá este enlace privado para consultar el resumen y recuperar tus diseños. Cualquiera
        con el enlace puede verlos.
      </p>
      <div className="confirmation-items">
        {order.items.map((item) => (
          <div className="confirmation-line" key={item.id}>
            <OrderDesign design={JSON.parse(item.snapshot) as Design} designId={item.designId} />
            <div>
              <h2>{item.name}</h2>
              <p>
                {models.find((m) => m.id === item.modelId)?.name} ·{' '}
                {materials.find((m) => m.id === item.materialId)?.name}
              </p>
              <p>
                {item.quantity} × {money(item.unitPrice)}
              </p>
              <strong>{money(item.quantity * item.unitPrice)}</strong>
            </div>
          </div>
        ))}
      </div>
      <div className="confirmation-total">
        <span>Total registrado</span>
        <strong>
          {money(order.total)} {region.currency}
        </strong>
        <small>Importe cobrado: {money(0)}</small>
      </div>
      <Link href="/tienda" className="button">
        Seguir explorando <ArrowRight size={18} />
      </Link>
    </div>
  );
}
