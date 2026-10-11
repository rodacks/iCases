'use client';
import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Rotate3D, ChevronLeft, ChevronRight } from 'lucide-react';
import { CaseArt } from './case-art';
import { rasterizeSvg } from '@/lib/export';
import type { Design } from '@/lib/catalog';
import type { mountPhoneViewer } from '@/lib/phone-scene';

type Props = { design: Design; interactive?: boolean; className?: string };
export function CasePreview({ design, interactive = false, className = '' }: Props) {
  const container = useRef<HTMLDivElement>(null),
    source = useRef<SVGSVGElement>(null),
    root = useRef<HTMLDivElement>(null),
    viewer = useRef<ReturnType<typeof mountPhoneViewer> | null>(null);
  const [visible, setVisible] = useState(false),
    [renderedKey, setRenderedKey] = useState(''),
    [image, setImage] = useState(''),
    [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const key = JSON.stringify(design);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '160px' },
    );
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    const timer = setTimeout(
      async () => {
        try {
          const [engine, canvas] = await Promise.all([
            import('@/lib/phone-scene'),
            rasterizeSvg(source.current!, 3),
          ]);
          if (cancelled) return;
          if (interactive) {
            if (viewer.current) viewer.current.update(design, canvas);
            else viewer.current = engine.mountPhoneViewer(container.current!, design, canvas);
          } else {
            const image = await engine.renderPhoneSnapshot(design, canvas);
            if (cancelled) return;
            setImage(image);
          }
          setRenderedKey(key);
          setStatus('ready');
        } catch {
          if (!cancelled) setStatus('fallback');
        }
      },
      interactive ? 90 : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // The serialized configuration intentionally controls texture refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, visible, interactive]);
  useEffect(
    () => () => {
      viewer.current?.dispose();
      viewer.current = null;
    },
    [interactive],
  );
  return (
    <div
      ref={root}
      className={`case-preview ${interactive ? 'is-interactive' : 'is-static'} ${className}`}
      data-preview-status={status}
      data-design-color={design.color}
      data-rendered-config={renderedKey}
    >
      {status !== 'ready' && <CaseArt design={design} className="preview-fallback" />}
      {interactive ? (
        <div ref={container} className="three-viewport" />
      ) : (
        image && (
          <img
            src={image}
            alt="Vista tridimensional de la funda con relieve y acabado"
            className="rendered-phone"
            draggable={false}
          />
        )
      )}
      <div className="texture-source" aria-hidden="true">
        <CaseArt ref={source} design={design} printOnly />
      </div>
      {interactive && status === 'ready' && (
        <div className="viewer-controls">
          <span>
            <Rotate3D size={15} /> Arrastrá para girar
          </span>
          <div>
            <button
              type="button"
              aria-label="Girar funda a la izquierda"
              onClick={() => viewer.current?.rotate(-Math.PI / 6)}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              aria-label="Restablecer vista 3D"
              onClick={() => viewer.current?.reset()}
            >
              <RotateCcw size={15} />
            </button>
            <button
              type="button"
              aria-label="Girar funda a la derecha"
              onClick={() => viewer.current?.rotate(Math.PI / 6)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      )}
      {interactive && status === 'fallback' && (
        <span className="viewer-fallback-note">
          Vista 2D · El 3D no está disponible en este dispositivo.
        </span>
      )}
    </div>
  );
}
