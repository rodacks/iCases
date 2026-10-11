'use client';
import { region } from '@/lib/catalog';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Check, ShieldCheck } from 'lucide-react';
import { CasePreview } from './case-preview';
import { Notice } from './ui';
import { models, materials, money, productPrice, productDesign, type Product } from '@/lib/catalog';
import { useCart } from '@/lib/cart';
export function ProductDetail({ product }: { product: Product }) {
  const [model, setModel] = useState(''),
    [added, setAdded] = useState(false);
  const add = useCart((s) => s.add);
  const material = materials.find((m) => m.id === product.materialId)!;
  return (
    <div className="section-width page-space">
      <Link href="/tienda" className="text-link">
        <ArrowLeft size={16} /> Volver a la colección
      </Link>
      <div className="product-detail">
        <div className="detail-art">
          <CasePreview interactive design={productDesign(product, model || 'iphone-16-pro')} />
          <span>Representación ilustrativa · El acabado puede variar</span>
        </div>
        <div className="detail-info">
          <div className="eyebrow">{product.categoryId} COLLECTION</div>
          <h1>{product.name}</h1>
          <p className="detail-price">
            {money(model ? productPrice(product, model) : product.price)}{' '}
            <small>
              {region.currency}
              {!model ? ' · desde' : ''}
            </small>
          </p>
          <p>{product.description}</p>
          <div className="material-info">
            <ShieldCheck size={22} />
            <div>
              <strong>{material.name}</strong>
              <p>{material.description}</p>
            </div>
          </div>
          <label className="field">
            Tu modelo de iPhone
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setAdded(false);
              }}
              required
            >
              <option value="">Seleccioná tu modelo</option>
              {models
                .filter((m) => product.models.includes(m.id))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </label>
          <p className="availability">
            <span className="green-dot" />
            {product.available ? 'Disponible en el catálogo de demostración' : 'No disponible'}
          </p>
          <button
            className="button full"
            disabled={!model || !product.available}
            onClick={() => {
              add({
                key: `${product.id}:${model}`,
                kind: 'product',
                productId: product.id,
                modelId: model,
                materialId: product.materialId,
                name: product.name,
                unitPrice: productPrice(product, model),
                design: productDesign(product, model),
              });
              setAdded(true);
            }}
          >
            {added ? <Check size={18} /> : <ShoppingBag size={18} />}{' '}
            {added ? 'Agregada al carrito' : 'Agregar al carrito'}
          </button>
          {added && (
            <Notice>
              Ya está en tu carrito. <Link href="/carrito">Ver carrito →</Link>
            </Notice>
          )}
          <p className="small-note">
            Elegí el modelo exacto desde Ajustes → General → Información en tu iPhone.
          </p>
        </div>
      </div>
    </div>
  );
}
