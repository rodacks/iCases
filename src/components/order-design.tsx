'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { CaseArt } from './case-art';
import { exportPng, downloadBlob } from '@/lib/export';
import type { Design } from '@/lib/catalog';
export function OrderDesign({ design, designId }: { design: Design; designId: string | null }) {
  const svg = useRef<SVGSVGElement>(null);
  const [error, setError] = useState('');
  return (
    <div className="order-design">
      <CaseArt ref={svg} design={design} />
      {designId && (
        <>
          <Link href={`/personalizar?design=${designId}`} className="text-link">
            Recuperar diseño
          </Link>
          <button
            className="text-link"
            onClick={async () => {
              try {
                await exportPng(svg.current!, 'icases-pedido.png');
              } catch {
                setError('No se pudo exportar. Intentá nuevamente.');
              }
            }}
          >
            <Download size={14} /> PNG
          </button>
          <button
            className="text-link"
            onClick={() =>
              downloadBlob(
                new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' }),
                'icases-diseno.json',
              )
            }
          >
            Configuración JSON
          </button>
          {error && <small role="alert">{error}</small>}
        </>
      )}
    </div>
  );
}
