'use client';
import { region } from '@/lib/catalog';
import Link from 'next/link';
import { Minus, Plus, Trash2, ArrowRight, ArrowLeft, LockKeyhole } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { models, materials, money } from '@/lib/catalog';
import { CaseArt } from './case-art';
import { Empty, useMounted } from './ui';
export function CartPage() {
  const { items, quantity, remove } = useCart();
  const mounted = useMounted();
  if (!mounted) return <div className="empty">Recuperando tu carrito…</div>;
  if (!items.length)
    return (
      <Empty
        title="Hay espacio para tu próxima idea."
        text="Tu carrito está vacío. Encontrá tu diseño favorito o creá uno desde cero."
      />
    );
  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  return (
    <div className="section-width page-space">
      <div className="eyebrow">CASI TUYAS</div>
      <h1 className="page-title">Tu carrito.</h1>
      <div className="commerce-layout">
        <div className="cart-list">
          {items.map((item) => (
            <article key={item.key} className="cart-line">
              <div className="cart-thumbnail">
                <CaseArt design={item.design} />
              </div>
              <div className="cart-info">
                <h2>{item.name}</h2>
                <p>
                  {models.find((m) => m.id === item.modelId)?.name} ·{' '}
                  {materials.find((m) => m.id === item.materialId)?.name}
                </p>
                <span>{money(item.unitPrice)} / unidad</span>
                {item.kind === 'custom' && (
                  <Link className="text-link" href={`/personalizar?design=${item.designId}`}>
                    Editar una copia del diseño
                  </Link>
                )}
                <div className="quantity">
                  <button
                    disabled={item.quantity <= 1}
                    aria-label={`Reducir cantidad de ${item.name}`}
                    onClick={() => quantity(item.key, item.quantity - 1)}
                  >
                    <Minus size={15} />
                  </button>
                  <span aria-label="Cantidad">{item.quantity}</span>
                  <button
                    disabled={item.quantity >= 20}
                    aria-label={`Aumentar cantidad de ${item.name}`}
                    onClick={() => quantity(item.key, item.quantity + 1)}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
              <div className="cart-line-end">
                <strong>{money(item.unitPrice * item.quantity)}</strong>
                <button
                  className="icon-button"
                  aria-label={`Eliminar ${item.name}`}
                  onClick={() => {
                    if (
                      item.kind !== 'custom' ||
                      confirm(
                        '¿Quitar esta funda del carrito? El diseño seguirá guardado en el servidor.',
                      )
                    )
                      remove(item.key);
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </article>
          ))}
          <Link href="/tienda" className="text-link">
            <ArrowLeft size={16} /> Seguir explorando
          </Link>
        </div>
        <aside className="order-summary">
          <h2>Un resumen de tu estilo.</h2>
          <p>
            <span>Subtotal</span>
            <strong>{money(total)}</strong>
          </p>
          <p>
            <span>Envío de demostración</span>
            <strong>Sin costo</strong>
          </p>
          <p className="total">
            <span>Total {region.currency}</span>
            <strong>{money(total)}</strong>
          </p>
          <Link href="/checkout" className="button full">
            Continuar al checkout <ArrowRight size={18} />
          </Link>
          <div className="small-note">
            <LockKeyhole size={15} /> No te pediremos datos de tarjeta. Es una demo sin cobros.
          </div>
        </aside>
      </div>
    </div>
  );
}
