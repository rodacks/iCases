'use client';
import { region } from '@/lib/catalog';
import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { categories, models, type Product } from '@/lib/catalog';
import { ProductCard } from './ui';
export function Shop({ products }: { products: Product[] }) {
  const [query, setQuery] = useState(''),
    [category, setCategory] = useState(''),
    [model, setModel] = useState(''),
    [sort, setSort] = useState('featured');
  useEffect(
    () => setCategory(new URLSearchParams(window.location.search).get('categoria') || ''),
    [],
  );
  const filtered = products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) &&
        (!category || p.categoryId === category) &&
        (!model || p.models.includes(model)),
    )
    .sort((a, b) => (sort === 'asc' ? a.price - b.price : sort === 'desc' ? b.price - a.price : 0));
  return (
    <div className="section-width page-space">
      <div className="eyebrow">FUNDAS CON PERSONALIDAD</div>
      <h1 className="page-title">Encontrá la tuya.</h1>
      <p className="page-intro">Diseños listos para acompañarte. Elegí el que más va con vos.</p>
      <div className="shop-controls">
        <label className="search-field">
          <Search size={19} />
          <input
            aria-label="Buscar productos"
            placeholder="Buscar tu próxima funda…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="filter-field">
          <SlidersHorizontal size={17} />
          <select
            aria-label="Filtrar por modelo"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="">Todos los modelos</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <select
          aria-label="Ordenar productos"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="featured">Destacados</option>
          <option value="asc">Menor precio</option>
          <option value="desc">Mayor precio</option>
        </select>
      </div>
      <div className="category-tabs">
        {['', ...categories].map((c) => (
          <button
            key={c}
            className={category === c ? 'selected' : ''}
            onClick={() => setCategory(c)}
          >
            {c || 'Todos los diseños'}
          </button>
        ))}
      </div>
      <p className="results-count" role="status">
        {filtered.length} diseños · Precios desde, en {region.currency}
      </p>
      <div className="product-grid">
        {filtered.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
      {!filtered.length && (
        <div className="empty">
          <h2>No encontramos ese estilo.</h2>
          <button
            className="button secondary"
            onClick={() => {
              setQuery('');
              setCategory('');
              setModel('');
            }}
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
