import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Sparkles, Plus } from 'lucide-react';
import { CasePreview } from '@/components/case-preview';
import { ProductCard, Benefits } from '@/components/ui';
import { products, productDesign, materials } from '@/lib/catalog';
export default function Home() {
  return (
    <>
      <section className="hero section-width">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="green-dot" /> DISEÑADA POR VOS. PARA VOS.
          </div>
          <h1>
            Tu iPhone.
            <br />
            Tu estilo.
            <br />
            <em>Tu funda.</em>
          </h1>
          <p>
            Tu próxima funda no existe todavía.
            <br />
            Creala con tus colores, tus fotos y eso que te hace ser vos.
          </p>
          <div className="hero-buttons">
            <Link className="button" href="/personalizar">
              Diseñar mi funda <ArrowUpRight size={19} />
            </Link>
            <Link className="button secondary" href="/tienda">
              Explorar colección <ArrowRight size={18} />
            </Link>
          </div>
          <div className="hero-note">
            <span className="mini-swatches">
              <i />
              <i />
              <i />
            </span>
            Infinitas ideas. Una funda muy tuya.
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-orbit" />
          <span className="art-caption">THE EVERYDAY, REIMAGINED.</span>
          <div className="floating-case case-back">
            <CasePreview design={productDesign(products[3])} />
          </div>
          <div className="floating-case case-front">
            <CasePreview
              design={{
                ...productDesign(products[0], 'iphone-16-pro'),
                pattern: 'none',
                elements: [
                  {
                    id: 'home',
                    type: 'sticker',
                    value: 'flower',
                    x: 140,
                    y: 285,
                    width: 130,
                    height: 130,
                    rotation: -15,
                    color: '#f6f1d9',
                    font: 'Arial',
                  },
                ],
              }}
            />
          </div>
          <div className="floating-case case-side">
            <CasePreview design={productDesign(products[1], 'iphone-16-pro')} />
          </div>
          <div className="art-badge">
            <Sparkles size={20} />
            <span>
              Un poquito de vos.
              <br />
              <strong>En cada detalle.</strong>
            </span>
          </div>
          <span className="art-bottom">
            01 / YOUR CASE, YOUR RULES <Plus size={16} />
          </span>
        </div>
      </section>
      <div className="ticker">
        <span>UN LIENZO PARA TUS IDEAS</span>
        <span>✳</span>
        <span>HECHA PARA TU IPHONE</span>
        <span>✳</span>
        <span>100% TU ESTILO</span>
        <span>✳</span>
        <span>DISEÑÁ. COMBINÁ. CREÁ.</span>
      </div>
      <section className="section-width section-space">
        <div className="section-heading">
          <div>
            <div className="eyebrow">LA COLECCIÓN</div>
            <h2>Un match para cada estilo.</h2>
            <p>Diseños que hablan por vos, sin decir una palabra.</p>
          </div>
          <Link href="/tienda" className="text-link">
            Ver todas las fundas <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="product-grid">
          {products.slice(0, 4).map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>
      <section className="create-banner section-width">
        <div className="banner-art">
          <div className="idea-sticker sticker-one">
            make it
            <br />
            <em>yours.</em>
          </div>
          <div className="idea-sticker sticker-two">✳</div>
          <div className="idea-sticker sticker-three">☺</div>
          <span className="scribble">Tus ideas quedan bien acá ↗</span>
        </div>
        <div className="banner-copy">
          <div className="eyebrow">TU PEQUEÑO ESTUDIO CREATIVO</div>
          <h2>
            No hay otra
            <br />
            como la tuya.
          </h2>
          <p>
            Una foto que te encanta. Tu frase favorita. Una combinación que solo se te ocurriría a
            vos.
          </p>
          <Link href="/personalizar" className="button">
            Empezar a crear <ArrowUpRight size={18} />
          </Link>
          <span className="small-note">Sin experiencia. Sin reglas. A tu manera.</span>
        </div>
      </section>
      <section className="section-width section-space">
        <div className="section-heading">
          <div>
            <div className="eyebrow">DE TU IDEA A TU FUNDA</div>
            <h2>Así de simple.</h2>
          </div>
          <p>
            Vos ponés la creatividad.
            <br />
            El editor se encarga del resto.
          </p>
        </div>
        <div className="steps">
          {[
            [
              '01',
              'Elegí tu base',
              'Tu modelo de iPhone, tu material y ese color que te representa.',
            ],
            [
              '02',
              'Dale tu toque',
              'Sumá imágenes, textos y stickers. Mové todo hasta que se sienta tuyo.',
            ],
            [
              '03',
              'Llevá tu creación',
              'Guardá tu diseño y probá el checkout. Esta demo no realiza cobros.',
            ],
          ].map(([n, t, p]) => (
            <div key={n}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{p}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="materials-section">
        <div className="section-width">
          <div className="section-heading">
            <div>
              <div className="eyebrow">SE VE BIEN. SE SIENTE MEJOR.</div>
              <h2>El detalle está en la textura.</h2>
            </div>
            <Link href="/informacion#materiales" className="text-link">
              Conocé los materiales <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="material-grid">
            {materials.slice(0, 3).map((m, i) => (
              <Link
                href={`/personalizar?material=${m.id}`}
                key={m.id}
                className={`material-card material-${i}`}
              >
                <div className="material-sample" />
                <h3>
                  {m.name} <ArrowUpRight size={18} />
                </h3>
                <p>{m.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section-width section-space">
        <div className="section-heading">
          <div>
            <div className="eyebrow">IDEAS PARA INSPIRARTE</div>
            <h2>Encontrá tu mood.</h2>
          </div>
        </div>
        <div className="mood-links">
          {['Minimal', 'Abstract', 'Nature', 'Retro'].map((c, i) => (
            <Link key={c} href={`/tienda?categoria=${c}`}>
              <span>0{i + 1}</span>
              <h3>{c}</h3>
              <ArrowUpRight />
            </Link>
          ))}
        </div>
        <Benefits />
      </section>
    </>
  );
}
