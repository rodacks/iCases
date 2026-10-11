'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  ShoppingBag,
  Menu,
  X,
  Check,
  Package,
  Paintbrush,
  ShieldCheck,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart';
import { money, productDesign, type Product } from '@/lib/catalog';
import { CasePreview } from './case-preview';
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
export function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const items = useCart((s) => s.items),
    mounted = useMounted();
  useEffect(() => setOpen(false), [path]);
  return (
    <>
      <div className="announcement">
        Tu creatividad, en tus manos. <span>Hecho para ser tuyo.</span>
        <span className="demo-label">Tienda de demostración · Sin cobros</span>
      </div>
      <header className="header">
        <Link href="/" className="logo" aria-label="iCases inicio">
          iCases<span>®</span>
        </Link>
        <nav className={open ? 'nav open' : 'nav'} aria-label="Navegación principal">
          {[
            ['/', 'Inicio'],
            ['/tienda', 'Tienda'],
            ['/personalizar', 'Personalizar funda'],
          ].map(([url, label]) => (
            <Link key={url} className={path === url ? 'active' : ''} href={url}>
              {label}
              {url === '/personalizar' && <ArrowUpRight size={15} />}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link
            className="bag-link"
            href="/carrito"
            aria-label={`Carrito, ${mounted ? items.reduce((s, i) => s + i.quantity, 0) : 0} artículos`}
          >
            <ShoppingBag size={21} />
            <span className="bag-count">
              {mounted ? items.reduce((s, i) => s + i.quantity, 0) : 0}
            </span>
          </Link>
          <button
            className="icon-button mobile-menu"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
    </>
  );
}
export function Footer() {
  return (
    <footer>
      <div className="footer-top">
        <div>
          <Link href="/" className="logo">
            iCases<span>®</span>
          </Link>
          <p>Una funda. Infinitas formas de ser vos.</p>
        </div>
        <div>
          <strong>Encontrá tu estilo</strong>
          <Link href="/tienda">Explorar colección</Link>
          <Link href="/personalizar">Crear mi funda</Link>
        </div>
        <div>
          <strong>Estamos para ayudarte</strong>
          <Link href="/informacion#envios">Envíos y entregas</Link>
          <Link href="/informacion#materiales">Materiales y cuidados</Link>
          <Link href="/informacion#preguntas">Preguntas frecuentes</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} iCases · Uruguay</span>
        <span>Demo local. Los pedidos no generan cobros ni envíos.</span>
        <Link href="/informacion#privacidad">Privacidad</Link>
      </div>
    </footer>
  );
}
export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  return (
    <Link href={`/tienda/${product.id}`} className="product-card">
      <div className={`product-visual tone-${index % 4}`}>
        <span className="product-tag">{product.categoryId}</span>
        <CasePreview design={productDesign(product)} className="product-case" />
        <span className="product-go">
          <ArrowUpRight size={20} />
        </span>
      </div>
      <div className="product-meta">
        <div>
          <h3>{product.name}</h3>
          <p>{product.categoryId} Collection</p>
        </div>
        <strong>
          {money(product.price)}
          <small>desde</small>
        </strong>
      </div>
    </Link>
  );
}
export function Benefits() {
  return (
    <div className="benefits">
      {[
        [ShieldCheck, 'Pensadas para proteger', 'Diseño que acompaña tu día.'],
        [Paintbrush, 'Tan única como vos', 'Tu idea, sin límites creativos.'],
        [Package, 'Hechas a tu medida', 'Elegí el modelo de tu iPhone.'],
      ].map(([Icon, title, text]) => {
        const I = Icon as typeof Check;
        return (
          <div key={String(title)}>
            <I size={26} strokeWidth={1.4} />
            <div>
              <h3>{String(title)}</h3>
              <p>{String(text)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <ShoppingBag size={42} strokeWidth={1} />
      <h2>{title}</h2>
      <p>{text}</p>
      <Link href="/tienda" className="button">
        Explorar la tienda <ArrowRight size={18} />
      </Link>
    </div>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div className={error ? 'notice error' : 'notice'} role={error ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
