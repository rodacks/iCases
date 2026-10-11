import type { Metadata } from 'next';
import { Header, Footer } from '@/components/ui';
import '@fontsource-variable/manrope';
import './globals.css';
import './refinements.css';
export const metadata: Metadata = {
  title: { default: 'iCases — Tu iPhone. Tu estilo.', template: '%s · iCases' },
  description:
    'Diseñá una funda tan única como vos. Fundas de iPhone personalizables y colecciones con personalidad. Demo local en pesos uruguayos.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-UY" data-scroll-behavior="smooth">
      <body>
        <a href="#main" className="skip-link">
          Saltar al contenido
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
