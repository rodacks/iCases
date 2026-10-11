'use client';
import { region } from '@/lib/catalog';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { departments, money } from '@/lib/catalog';
import { customerSchema } from '@/lib/validation';
import { Empty, Notice, useMounted } from './ui';
export function Checkout() {
  const { items, clear } = useCart(),
    mounted = useMounted(),
    router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [fields, setFields] = useState<Record<string, string[] | undefined>>({});
  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = new FormData(e.currentTarget),
      customer = Object.fromEntries(form);
    const checked = customerSchema.safeParse(customer);
    if (!checked.success) {
      setFields(checked.error.flatten().fieldErrors);
      setError('Revisá los campos indicados.');
      return;
    }
    setBusy(true);
    setError('');
    setFields({});
    try {
      const fingerprint = JSON.stringify({
        items: items.map((i) => ({ key: i.key, quantity: i.quantity })),
        customer: checked.data,
      });
      const old = JSON.parse(sessionStorage.getItem('icases-checkout-request') || 'null');
      const requestId = old?.fingerprint === fingerprint ? old.requestId : crypto.randomUUID();
      sessionStorage.setItem('icases-checkout-request', JSON.stringify({ fingerprint, requestId }));
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          customer: checked.data,
          items: items.map(({ kind, productId, designId, modelId, quantity }) => ({
            kind,
            productId,
            designId,
            modelId,
            quantity,
          })),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      localStorage.setItem('icases-last-order', result.id);
      clear();
      sessionStorage.removeItem('icases-checkout-request');
      router.push(`/pedido/${result.id}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No pudimos guardar el pedido. Tu carrito sigue intacto.',
      );
      setBusy(false);
    }
  }
  if (!mounted) return <div className="empty">Preparando tu pedido…</div>;
  if (!items.length && !busy)
    return (
      <Empty title="Primero, elegí tu funda." text="Agregá un diseño al carrito para continuar." />
    );
  return (
    <div className="section-width page-space">
      <div className="eyebrow">EL ÚLTIMO PASO</div>
      <h1 className="page-title">Hagámoslo tuyo.</h1>
      <Notice>
        <ShieldCheck size={20} /> Checkout de demostración: se guardará un pedido local. No se
        realiza ningún cobro ni envío.
      </Notice>
      <form onSubmit={submit} className="commerce-layout">
        <div className="checkout-form">
          <h2>Tus datos</h2>
          <p className="small-note">
            Todos los campos son obligatorios, excepto observaciones. Podés usar datos ficticios
            para probar.
          </p>
          <div className="two-fields">
            {[
              ['firstName', 'Nombre', 'given-name', 'text'],
              ['lastName', 'Apellido', 'family-name', 'text'],
              ['email', 'Correo electrónico', 'email', 'email'],
              ['phone', 'Teléfono', 'tel', 'tel'],
            ].map(([name, label, auto, type]) => (
              <label className="field" key={name}>
                {label}
                <input
                  name={name}
                  type={type}
                  autoComplete={auto}
                  required
                  maxLength={name === 'email' ? 150 : 80}
                  minLength={name === 'phone' ? 8 : 2}
                  aria-invalid={!!fields[name]}
                />
                {fields[name] && (
                  <small className="field-error">Ingresá un {label.toLowerCase()} válido.</small>
                )}
              </label>
            ))}
          </div>
          <h2>Dirección de entrega</h2>
          <div className="two-fields">
            <label className="field">
              Departamento
              <select name="department" autoComplete="address-level1" required defaultValue="">
                <option value="" disabled>
                  Seleccioná tu departamento
                </option>
                {departments.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Ciudad
              <input
                name="city"
                autoComplete="address-level2"
                required
                minLength={2}
                maxLength={100}
              />
            </label>
          </div>
          <label className="field">
            Dirección
            <input
              name="address"
              autoComplete="street-address"
              required
              minLength={5}
              maxLength={220}
              placeholder="Calle, número y apartamento"
            />
          </label>
          <label className="field">
            Observaciones <span className="muted">(opcional)</span>
            <textarea
              name="notes"
              rows={3}
              maxLength={1000}
              placeholder="¿Hay algo que debamos saber?"
            />
          </label>
          {error && <Notice error>{error} Tu carrito se conserva.</Notice>}
        </div>
        <aside className="order-summary">
          <h2>Tu pedido</h2>
          {items.map((i) => (
            <p key={i.key}>
              <span>
                {i.name}
                <small> × {i.quantity}</small>
              </span>
              <strong>{money(i.unitPrice * i.quantity)}</strong>
            </p>
          ))}
          <p>
            <span>Envío demo</span>
            <strong>Sin costo</strong>
          </p>
          <p className="total">
            <span>Total {region.currency}</span>
            <strong>{money(total)}</strong>
          </p>
          <p className="small-note">El servidor verificará los precios al confirmar.</p>
          <button className="button full" disabled={busy} type="submit">
            {busy ? 'Guardando pedido…' : 'Confirmar pedido de demostración'}
            {!busy && <ArrowRight size={18} />}
          </button>
          <p className="small-note">Sin pagos reales. Sin datos bancarios.</p>
        </aside>
      </form>
    </div>
  );
}
