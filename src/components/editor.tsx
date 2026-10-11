'use client';
import { region } from '@/lib/catalog';
import { useState, useRef, useEffect, type PointerEvent } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Download,
  Save,
  Upload,
  Plus,
  Check,
  Layers,
  Palette,
  Type,
  Shapes,
  Image as ImageIcon,
  ShoppingBag,
  RotateCcw,
} from 'lucide-react';
import { CaseArt, Sticker } from './case-art';
import { CasePreview } from './case-preview';
import { Notice } from './ui';
import {
  models,
  materials,
  palette,
  patterns,
  patternNames,
  stickers,
  money,
  customPrice,
  newDesign,
  geometry,
  type Design,
  type Element,
} from '@/lib/catalog';
import { designSchema } from '@/lib/validation';
import { exportPng } from '@/lib/export';
import { useCart } from '@/lib/cart';
type Gesture = {
  initial: Design;
  element: Element;
  mode: 'move' | 'resize' | 'rotate';
  x: number;
  y: number;
  pointer: number;
  second?: { id: number; x: number; y: number; distance: number };
};
export function Editor() {
  const [design, setDesign] = useState<Design>(newDesign),
    [view, setView] = useState<'edit' | '3d'>('edit'),
    [selected, setSelected] = useState(''),
    [tab, setTab] = useState('base'),
    [text, setText] = useState('Hola, mundo'),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [ready, setReady] = useState(false),
    [savedId, setSavedId] = useState(''),
    [historyVersion, setHistoryVersion] = useState(0);
  const past = useRef<Design[]>([]),
    future = useRef<Design[]>([]),
    gesture = useRef<Gesture | null>(null),
    current = useRef(design),
    svg = useRef<SVGSVGElement>(null),
    print = useRef<SVGSVGElement>(null),
    file = useRef<HTMLInputElement>(null);
  const addToCart = useCart((s) => s.add);
  current.current = design;
  const element = design.elements.find((e) => e.id === selected);
  const g = geometry(design.modelId, design.templateVersion);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const params = new URLSearchParams(window.location.search);
      try {
        const id = params.get('design');
        if (id) {
          const res = await fetch(`/api/designs/${id}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          if (!cancelled) {
            setDesign(designSchema.parse(data.config));
            setSavedId(id);
            setMessage('Diseño recuperado. Podés seguir creando.');
          }
        } else {
          const draft = localStorage.getItem('icases-draft-v1');
          let value = draft ? designSchema.parse(JSON.parse(draft)) : newDesign();
          const mat = params.get('material');
          if (materials.some((m) => m.id === mat)) value = { ...value, materialId: mat! };
          if (!cancelled) setDesign(value);
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'No pudimos recuperar el borrador');
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem('icases-draft-v1', JSON.stringify(design));
      } catch {
        setError('No pudimos guardar el borrador en este navegador. Usá Guardar diseño.');
      }
    }
  }, [design, ready]);
  function remember(before: Design) {
    past.current = [...past.current.slice(-59), before];
    future.current = [];
    setHistoryVersion((v) => v + 1);
    setSavedId('');
    setMessage('');
  }
  function commit(next: Design) {
    remember(current.current);
    setDesign(next);
  }
  function update(patch: Partial<Design>) {
    commit({ ...current.current, ...patch });
  }
  function changeElement(patch: Partial<Element>) {
    update({ elements: design.elements.map((e) => (e.id === selected ? { ...e, ...patch } : e)) });
  }
  function addElement(
    type: Element['type'],
    value: string,
    dimensions?: { width: number; height: number },
  ) {
    if (design.elements.length >= 40) {
      setError('Podés usar hasta 40 elementos por diseño.');
      return;
    }
    const id = crypto.randomUUID();
    const width = dimensions
      ? Math.min(160, dimensions.width)
      : type === 'text'
        ? Math.min(230, value.length * 16)
        : 95;
    const height = dimensions
      ? (width * dimensions.height) / dimensions.width
      : type === 'text'
        ? 40
        : 95;
    const factor = Math.min(1, 250 / height);
    const el: Element = {
      id,
      type,
      value,
      x: 140,
      y: 300,
      width: Math.max(15, width * factor),
      height: Math.max(15, height * factor),
      rotation: 0,
      color: type === 'sticker' ? '#f6f1d9' : '#26382a',
      font: 'Arial',
    };
    update({ elements: [...design.elements, el] });
    setSelected(id);
    setError('');
  }
  function undo() {
    const previous = past.current.pop();
    if (previous) {
      future.current.push(design);
      setDesign(previous);
      setSavedId('');
      setHistoryVersion((v) => v + 1);
    }
  }
  function redo() {
    const next = future.current.pop();
    if (next) {
      past.current.push(design);
      setDesign(next);
      setSavedId('');
      setHistoryVersion((v) => v + 1);
    }
  }
  function point(e: PointerEvent) {
    const rect = svg.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * 280) / rect.width,
      y: ((e.clientY - rect.top) * g.height) / rect.height,
    };
  }
  function begin(e: PointerEvent<SVGGElement>, el: Element, mode: Gesture['mode']) {
    e.preventDefault();
    e.stopPropagation();
    if (gesture.current) {
      secondPointer(e);
      return;
    }
    const p = point(e);
    setSelected(el.id);
    gesture.current = {
      initial: current.current,
      element: el,
      mode,
      x: p.x,
      y: p.y,
      pointer: e.pointerId,
    };
    svg.current?.setPointerCapture(e.pointerId);
  }
  function secondPointer(e: PointerEvent) {
    const active = gesture.current;
    if (active && active.pointer !== e.pointerId && !active.second) {
      const p = point(e);
      active.second = {
        id: e.pointerId,
        ...p,
        distance: Math.max(10, Math.hypot(p.x - active.x, p.y - active.y)),
      };
      active.element = current.current.elements.find((x) => x.id === active.element.id)!;
      svg.current?.setPointerCapture(e.pointerId);
    }
  }
  function move(e: PointerEvent<SVGSVGElement>) {
    const active = gesture.current;
    if (!active) return;
    e.preventDefault();
    const p = point(e),
      el = active.element;
    let patch: Partial<Element> = {};
    if (active.second) {
      if (e.pointerId === active.second.id) {
        active.second.x = p.x;
        active.second.y = p.y;
      } else {
        active.x = p.x;
        active.y = p.y;
      }
      const ratio =
        Math.hypot(active.second.x - active.x, active.second.y - active.y) / active.second.distance;
      const scale = Math.max(
        15 / Math.min(el.width, el.height),
        Math.min(400 / el.width, 500 / el.height, ratio),
      );
      patch = { width: el.width * scale, height: el.height * scale };
    } else if (active.mode === 'move') {
      patch = {
        x: Math.max(0, Math.min(280, el.x + p.x - active.x)),
        y: Math.max(0, Math.min(g.height, el.y + p.y - active.y)),
      };
    } else if (active.mode === 'rotate') {
      patch = { rotation: Math.round((Math.atan2(p.y - el.y, p.x - el.x) * 180) / Math.PI + 90) };
    } else {
      const initial = Math.max(10, Math.hypot(active.x - el.x, active.y - el.y)),
        ratio = Math.hypot(p.x - el.x, p.y - el.y) / initial;
      const scale = Math.max(
        15 / Math.min(el.width, el.height),
        Math.min(400 / el.width, 500 / el.height, ratio),
      );
      patch = { width: el.width * scale, height: el.height * scale };
    }
    setDesign({
      ...current.current,
      elements: current.current.elements.map((item) =>
        item.id === el.id ? { ...item, ...patch } : item,
      ),
    });
  }
  function end(e: PointerEvent<SVGSVGElement>) {
    const active = gesture.current;
    if (!active) return;
    if (svg.current?.hasPointerCapture(e.pointerId)) svg.current.releasePointerCapture(e.pointerId);
    remember(active.initial);
    gesture.current = null;
  }
  async function upload(image: File) {
    setBusy(true);
    setError('');
    try {
      if (
        !['image/png', 'image/jpeg', 'image/webp'].includes(image.type) ||
        image.size > 5 * 1024 * 1024
      )
        throw new Error('Elegí un PNG, JPG o WebP de hasta 5 MB.');
      const form = new FormData();
      form.set('file', image);
      const res = await fetch('/api/assets', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addElement('image', data.url, data);
      setMessage('Imagen guardada y lista para editar.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos subir la imagen.');
    } finally {
      setBusy(false);
      if (file.current) file.current.value = '';
    }
  }
  async function save(cart = false) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(design),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSavedId(data.id);
      window.history.replaceState(null, '', `/personalizar?design=${data.id}`);
      if (cart) {
        addToCart({
          key: data.id,
          kind: 'custom',
          designId: data.id,
          name: 'Tu creación · Funda personalizada',
          modelId: design.modelId,
          materialId: design.materialId,
          unitPrice: data.price,
          design: data.config,
        });
        setMessage('¡Tu creación ya está en el carrito!');
      } else
        setMessage(
          'Diseño guardado en el servidor. Conservá el enlace para volver a editarlo en este navegador.',
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar tu diseño.');
    } finally {
      setBusy(false);
    }
  }
  async function exportDesign(printOnly = false) {
    setBusy(true);
    setError('');
    try {
      await exportPng(
        (printOnly ? print : svg).current!,
        printOnly ? 'icases-composicion.png' : 'icases-vista-previa.png',
      );
      setMessage('PNG exportado. La plantilla es ilustrativa, no está calibrada para fabricación.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo exportar');
    } finally {
      setBusy(false);
    }
  }
  function remove() {
    update({ elements: design.elements.filter((e) => e.id !== selected) });
    setSelected('');
  }
  function reorder(direction: number) {
    const list = [...design.elements],
      i = list.findIndex((e) => e.id === selected),
      target = i + direction;
    if (target < 0 || target >= list.length) return;
    [list[i], list[target]] = [list[target], list[i]];
    update({ elements: list });
  }
  return (
    <div className="editor-page">
      <div className="editor-heading">
        <div>
          <Link href="/" className="text-link">
            <ArrowLeft size={15} /> Volver
          </Link>
          <h1>
            Tu estudio creativo<span>Hacé que sea tuya.</span>
          </h1>
        </div>
        <div className="editor-top-actions">
          <button
            className="icon-button"
            onClick={undo}
            disabled={!past.current.length}
            aria-label="Deshacer"
          >
            <Undo2 size={19} />
          </button>
          <button
            className="icon-button"
            onClick={redo}
            disabled={!future.current.length}
            aria-label="Rehacer"
          >
            <Redo2 size={19} />
          </button>
          <button
            className="button secondary compact"
            disabled={busy || !ready}
            onClick={() => save()}
          >
            <Save size={16} /> Guardar diseño
          </button>
        </div>
      </div>
      <div className="editor-layout">
        <aside className="editor-tools">
          <div className="tool-tabs" role="tablist" aria-label="Herramientas de diseño">
            {[
              ['base', Palette, 'Base'],
              ['stickers', Shapes, 'Stickers'],
              ['image', ImageIcon, 'Imagen'],
              ['text', Type, 'Texto'],
              ['layers', Layers, 'Capas'],
            ].map(([id, Icon, label]) => {
              const I = Icon as typeof Palette;
              return (
                <button
                  key={String(id)}
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(String(id))}
                  className={tab === id ? 'selected' : ''}
                >
                  <I size={20} />
                  <span>{String(label)}</span>
                </button>
              );
            })}
          </div>
          <div className="tool-content" role="tabpanel">
            {tab === 'base' && (
              <>
                <div className="tool-title">
                  <span>01</span>
                  <h2>Empezá por la base</h2>
                </div>
                <label className="field">
                  Modelo de iPhone
                  <select
                    aria-label="Modelo de iPhone"
                    value={design.modelId}
                    onChange={(e) => {
                      const h = geometry(e.target.value, design.templateVersion).height;
                      update({
                        modelId: e.target.value,
                        elements: design.elements.map((el) => ({ ...el, y: Math.min(el.y, h) })),
                      });
                    }}
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </label>
                {!design.templateVersion && (
                  <div className="field">
                    <small>Este diseño conserva la plantilla anterior.</small>
                    <button
                      type="button"
                      className="button secondary compact"
                      onClick={() => update({ templateVersion: 2 })}
                    >
                      Actualizar plantilla del modelo
                    </button>
                  </div>
                )}
                <label className="field">
                  Material
                  <select
                    aria-label="Material"
                    value={design.materialId}
                    onChange={(e) => update({ materialId: e.target.value })}
                  >
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} · {money(m.price)}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="small-note">
                  {materials.find((m) => m.id === design.materialId)?.description}
                </p>
                <div className="field">
                  <span>Color de base</span>
                  <div className="swatches">
                    {palette.map((color) => (
                      <button
                        key={color}
                        style={{ background: color }}
                        className={design.color === color ? 'selected' : ''}
                        aria-label={`Color ${color}`}
                        aria-pressed={design.color === color}
                        onClick={() => update({ color })}
                      >
                        {design.color === color && <Check size={16} />}
                      </button>
                    ))}
                    <label className="custom-color" title="Color personalizado">
                      <Plus size={17} />
                      <input
                        type="color"
                        aria-label="Color personalizado"
                        value={design.color}
                        onChange={(e) => update({ color: e.target.value })}
                      />
                    </label>
                  </div>
                </div>
                <div className="field">
                  <span>Un poco de patrón</span>
                  <div className="pattern-grid">
                    {patterns.map((p) => (
                      <button
                        key={p}
                        className={design.pattern === p ? 'selected' : ''}
                        onClick={() => update({ pattern: p })}
                      >
                        <span
                          className={`pattern-chip pattern-${p}`}
                          style={{ backgroundColor: design.color }}
                        />
                        {patternNames[p]}
                      </button>
                    ))}
                  </div>
                </div>
                {design.pattern !== 'none' && (
                  <>
                    <label className="field inline-field">
                      Color del patrón
                      <input
                        type="color"
                        value={design.patternColor}
                        onChange={(e) => update({ patternColor: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      Escala del patrón
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={design.patternScale}
                        onChange={(e) => update({ patternScale: Number(e.target.value) })}
                      />
                    </label>
                    <div className="two-fields">
                      <label className="field">
                        Posición X
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={design.patternX}
                          onChange={(e) => update({ patternX: Number(e.target.value) })}
                        />
                      </label>
                      <label className="field">
                        Posición Y
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={design.patternY}
                          onChange={(e) => update({ patternY: Number(e.target.value) })}
                        />
                      </label>
                    </div>
                  </>
                )}
              </>
            )}
            {tab === 'stickers' && (
              <>
                <div className="tool-title">
                  <span>02</span>
                  <h2>Pequeños grandes detalles</h2>
                </div>
                <p className="small-note">Tocá un sticker para sumarlo. Después, hacelo tuyo.</p>
                <div className="sticker-grid">
                  {stickers.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => addElement('sticker', s.id)}
                      aria-label={`Añadir ${s.name}`}
                    >
                      <svg viewBox="0 0 100 100">
                        <Sticker kind={s.id} color={s.id === 'smile' ? '#e9c663' : '#88996f'} />
                      </svg>
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {tab === 'image' && (
              <>
                <div className="tool-title">
                  <span>03</span>
                  <h2>Un recuerdo, siempre cerca</h2>
                </div>
                <div className="upload-box">
                  <Upload size={30} strokeWidth={1.3} />
                  <h3>Tu foto favorita va acá</h3>
                  <p>PNG, JPG o WebP · Hasta 5 MB</p>
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() => file.current?.click()}
                  >
                    Subir mi imagen
                  </button>
                  <input
                    ref={file}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="visually-hidden"
                    aria-label="Subir mi imagen"
                    onChange={(e) => {
                      const image = e.target.files?.[0];
                      if (image) void upload(image);
                    }}
                  />
                </div>
                <p className="small-note">
                  Las imágenes se guardan en el servidor local y permanecen asociadas a tu diseño.
                  Usá imágenes propias o con permiso.
                </p>
              </>
            )}
            {tab === 'text' && (
              <>
                <div className="tool-title">
                  <span>04</span>
                  <h2>Decilo a tu manera</h2>
                </div>
                <label className="field">
                  Tu texto
                  <input
                    maxLength={60}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Una frase muy tuya"
                  />
                </label>
                <button
                  className="button secondary full"
                  disabled={!text.trim()}
                  onClick={() => addElement('text', text.trim())}
                >
                  <Plus size={18} /> Añadir texto
                </button>
                <p className="small-note">
                  Seleccioná el texto en la funda para ajustar tipografía, tamaño y color.
                </p>
              </>
            )}
            {tab === 'layers' && (
              <>
                <div className="tool-title">
                  <span>05</span>
                  <h2>Cada cosa en su lugar</h2>
                </div>
                <p className="small-note">Las capas de arriba se ven por delante.</p>
                {!design.elements.length && <p>Todavía no agregaste elementos.</p>}
                <div className="layer-list">
                  {[...design.elements].reverse().map((el, i) => (
                    <button
                      key={el.id}
                      className={selected === el.id ? 'selected' : ''}
                      onClick={() => setSelected(el.id)}
                    >
                      <Layers size={16} />
                      <span>
                        {el.type === 'image'
                          ? 'Imagen'
                          : el.type === 'sticker'
                            ? stickers.find((s) => s.id === el.value)?.name
                            : el.value}
                      </span>
                      <small>{design.elements.length - i}</small>
                    </button>
                  ))}
                </div>
              </>
            )}
            {element && (
              <div className="element-controls">
                <h3>
                  Editar{' '}
                  {element.type === 'text'
                    ? 'texto'
                    : element.type === 'image'
                      ? 'imagen'
                      : 'sticker'}
                </h3>
                {element.type === 'text' && (
                  <>
                    <label className="field">
                      Contenido
                      <input
                        value={element.value}
                        maxLength={60}
                        onChange={(e) => changeElement({ value: e.target.value || ' ' })}
                      />
                    </label>
                    <label className="field">
                      Tipografía
                      <select
                        aria-label="Tipografía"
                        value={element.font}
                        onChange={(e) => changeElement({ font: e.target.value })}
                      >
                        {['Arial', 'Georgia', 'Courier New'].map((f) => (
                          <option key={f}>{f}</option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
                {element.type !== 'image' && (
                  <label className="field inline-field">
                    Color del elemento
                    <input
                      type="color"
                      value={element.color}
                      onChange={(e) => changeElement({ color: e.target.value })}
                    />
                  </label>
                )}
                <label className="field">
                  Tamaño <span>{Math.round(element.width)}</span>
                  <input
                    aria-label="Tamaño del elemento"
                    type="range"
                    min={Math.ceil(Math.max(15, (15 * element.width) / element.height))}
                    max={Math.floor(Math.min(400, (500 * element.width) / element.height))}
                    value={element.width}
                    onChange={(e) => {
                      const width = Number(e.target.value);
                      changeElement({ width, height: (width * element.height) / element.width });
                    }}
                  />
                </label>
                <label className="field">
                  Rotación · {Math.round(element.rotation)}°
                  <input
                    aria-label="Rotación del elemento"
                    type="range"
                    min="-180"
                    max="180"
                    value={element.rotation}
                    onChange={(e) => changeElement({ rotation: Number(e.target.value) })}
                  />
                </label>
                <div className="two-fields">
                  <label className="field">
                    Posición X
                    <input
                      aria-label="Posición X del elemento"
                      type="number"
                      min="0"
                      max="280"
                      value={Math.round(element.x)}
                      onChange={(e) =>
                        changeElement({ x: Math.max(0, Math.min(280, Number(e.target.value))) })
                      }
                    />
                  </label>
                  <label className="field">
                    Posición Y
                    <input
                      aria-label="Posición Y del elemento"
                      type="number"
                      min="0"
                      max={g.height}
                      value={Math.round(element.y)}
                      onChange={(e) =>
                        changeElement({
                          y: Math.max(0, Math.min(g.height, Number(e.target.value))),
                        })
                      }
                    />
                  </label>
                </div>
                <div className="element-actions">
                  <button
                    className="icon-button"
                    aria-label="Duplicar elemento"
                    disabled={design.elements.length >= 40}
                    onClick={() => {
                      const id = crypto.randomUUID();
                      update({
                        elements: [
                          ...design.elements,
                          {
                            ...element,
                            id,
                            x: Math.min(280, element.x + 12),
                            y: Math.min(g.height, element.y + 12),
                          },
                        ],
                      });
                      setSelected(id);
                    }}
                  >
                    <Copy size={17} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Traer adelante"
                    disabled={design.elements.at(-1)?.id === selected}
                    onClick={() => reorder(1)}
                  >
                    <ArrowUp size={17} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Enviar atrás"
                    disabled={design.elements[0]?.id === selected}
                    onClick={() => reorder(-1)}
                  >
                    <ArrowDown size={17} />
                  </button>
                  <button
                    className="icon-button danger"
                    aria-label="Eliminar elemento"
                    onClick={remove}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
        <div className="editor-canvas-panel">
          <div className="canvas-label">
            <span className="green-dot" /> TU DISEÑO, EN VIVO
            <div className="preview-switch" aria-label="Modo de vista">
              <button type="button" aria-pressed={view === 'edit'} onClick={() => setView('edit')}>
                Editar 2D
              </button>
              <button type="button" aria-pressed={view === '3d'} onClick={() => setView('3d')}>
                Vista 3D
              </button>
            </div>
          </div>
          <div className={`canvas-stage ${view === '3d' ? 'show-3d' : ''}`}>
            {view === '3d' && <CasePreview interactive design={design} />}
            <div className={view === '3d' ? 'edit-surface is-hidden' : 'edit-surface'}>
              <CaseArt
                ref={svg}
                design={design}
                selected={selected}
                onElementDown={begin}
                className="editing-case"
                onPointerDown={(e) => {
                  if (gesture.current) secondPointer(e);
                  else setSelected('');
                }}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
              />
            </div>
          </div>
          <p className="canvas-help">
            {view === 'edit'
              ? 'Arrastrá para mover · Usá los tiradores para escalar y rotar'
              : 'Girá la funda para ver los bordes, las cámaras y el acabado.'}
            <br />
            {view === 'edit'
              ? 'En pantallas táctiles también podés escalar con dos dedos.'
              : 'Para mover elementos sobre la funda, volvé a Editar 2D.'}
          </p>
          <p className="small-note">
            Plantilla ilustrativa. Los diseños se recortan al borde y alrededor de la cámara.
          </p>
          <div className="canvas-bottom">
            <span>
              {models.find((m) => m.id === design.modelId)?.name} <span>· Vista posterior</span>
            </span>
            <button
              className="text-link"
              onClick={() => {
                if (
                  confirm(
                    '¿Empezar de nuevo? Se borrará el borrador actual. Los diseños guardados se conservan.',
                  )
                ) {
                  commit(newDesign());
                  setSelected('');
                  window.history.replaceState(null, '', '/personalizar');
                }
              }}
            >
              <RotateCcw size={15} /> Reiniciar
            </button>
          </div>
        </div>
        <aside className="design-summary">
          <span className="eyebrow">UNA CREACIÓN ORIGINAL</span>
          <h2>Diseñada por vos.</h2>
          <div className="summary-specs">
            <p>
              <span>Modelo</span>
              <strong>{models.find((m) => m.id === design.modelId)?.name}</strong>
            </p>
            <p>
              <span>Material</span>
              <strong>{materials.find((m) => m.id === design.materialId)?.name}</strong>
            </p>
            <p>
              <span>Personalización</span>
              <strong>Incluida · {money(200)}</strong>
            </p>
          </div>
          <div className="design-total">
            <span>Tu funda, a tu manera</span>
            <strong>
              {money(customPrice(design.modelId, design.materialId))}
              <small> {region.currency}</small>
            </strong>
          </div>
          <button className="button full" disabled={busy || !ready} onClick={() => save(true)}>
            <ShoppingBag size={18} />
            {busy ? 'Guardando…' : 'Agregar al carrito'}
          </button>
          <p className="small-note">Checkout de demostración. No se realiza ningún cobro.</p>
          {message && (
            <Notice>
              {message}{' '}
              {message.includes('carrito') && (
                <Link href="/carrito">
                  Ver carrito <ArrowRight size={14} />
                </Link>
              )}
            </Notice>
          )}
          {error && <Notice error>{error}</Notice>}
          <div className="export-actions">
            <button className="text-link" disabled={busy} onClick={() => exportDesign()}>
              <Download size={16} /> Descargar vista PNG
            </button>
            <button className="text-link" disabled={busy} onClick={() => exportDesign(true)}>
              <Download size={16} /> Descargar composición PNG
            </button>
          </div>
          <p className="small-note">
            Composición: sin cámaras ni efectos de presentación. Requiere calibración antes de
            producir.
          </p>
          <div className="save-indicator">
            <Check size={14} />
            {savedId
              ? 'Guardado en el servidor'
              : ready
                ? 'Borrador automático en este navegador'
                : 'Recuperando borrador…'}
          </div>
        </aside>
      </div>
      <div className="export-hidden" aria-hidden="true">
        <CaseArt ref={print} design={design} printOnly />
      </div>
      <span className="visually-hidden">Historial {historyVersion}</span>
    </div>
  );
}
