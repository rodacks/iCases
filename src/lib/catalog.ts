import { calibratedGeometry } from './phone-profiles';
export const region = { locale: 'es-UY', currency: 'UYU', shipping: 0 };
export const money = (amount: number) =>
  new Intl.NumberFormat(region.locale, {
    style: 'currency',
    currency: region.currency,
    maximumFractionDigits: 0,
  }).format(amount);
export const models = [
  ...[13, 14, 15, 16].flatMap((g) => [
    { id: `iphone-${g}`, name: `iPhone ${g}`, extra: 0, shape: g === 16 ? 'vertical' : 'diagonal' },
    ...(g === 13
      ? [{ id: 'iphone-13-mini', name: 'iPhone 13 mini', extra: 0, shape: 'mini' }]
      : [
          {
            id: `iphone-${g}-plus`,
            name: `iPhone ${g} Plus`,
            extra: 100,
            shape: g === 16 ? 'vertical-large' : 'large',
          },
        ]),
    { id: `iphone-${g}-pro`, name: `iPhone ${g} Pro`, extra: 100, shape: 'pro' },
    { id: `iphone-${g}-pro-max`, name: `iPhone ${g} Pro Max`, extra: 150, shape: 'pro-large' },
  ]),
];
export const materials = [
  {
    id: 'silicone',
    name: 'Silicona',
    description: 'Suave al tacto. Color que se siente.',
    price: 990,
  },
  {
    id: 'tpu',
    name: 'TPU flexible',
    description: 'Liviana, flexible y lista para cada día.',
    price: 790,
  },
  {
    id: 'clear',
    name: 'Transparente',
    description: 'Tu iPhone también es parte del diseño.',
    price: 890,
  },
  {
    id: 'matte',
    name: 'Acabado mate',
    description: 'Una superficie satinada y discreta.',
    price: 1090,
  },
  { id: 'gloss', name: 'Acabado brillante', description: 'Más luz para tus ideas.', price: 1190 },
];
export const categories = ['Minimal', 'Abstract', 'Nature', 'Retro', 'Premium', 'Transparent'];
export const patterns = [
  'none',
  'check',
  'stripes',
  'dots',
  'flowers',
  'abstract',
  'gradient',
  'minimal',
] as const;
export const patternNames: Record<string, string> = {
  none: 'Sin patrón',
  check: 'Cuadros',
  stripes: 'Rayas',
  dots: 'Lunares',
  flowers: 'Flores',
  abstract: 'Abstracto',
  gradient: 'Degradado',
  minimal: 'Minimal',
};
export const palette = [
  '#c8d4b4',
  '#c7bee8',
  '#e7a69a',
  '#f5d882',
  '#86aab5',
  '#f3eee4',
  '#2d3431',
  '#d5e8ee',
];
export const stickers = [
  { id: 'heart', name: 'Corazones', glyph: '♥' },
  { id: 'star', name: 'Estrellas', glyph: '✦' },
  { id: 'smile', name: 'Emojis', glyph: '☺' },
  { id: 'flower', name: 'Flores', glyph: '✿' },
  { id: 'diamond', name: 'Figuras geométricas', glyph: '◆' },
  { id: 'sun', name: 'Símbolos', glyph: '☼' },
  { id: 'spark', name: 'Estética minimalista', glyph: '✧' },
];
export const departments = [
  'Artigas',
  'Canelones',
  'Cerro Largo',
  'Colonia',
  'Durazno',
  'Flores',
  'Florida',
  'Lavalleja',
  'Maldonado',
  'Montevideo',
  'Paysandú',
  'Río Negro',
  'Rivera',
  'Rocha',
  'Salto',
  'San José',
  'Soriano',
  'Tacuarembó',
  'Treinta y Tres',
];
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  color: string;
  pattern: string;
  materialId: string;
  models: string[];
  available: boolean;
  categoryId: string;
};
export const products: Product[] = [
  [
    'sage',
    'Sage Studio',
    'Minimal',
    '#c8d4b4',
    'minimal',
    'silicone',
    1090,
    'La calma tiene un color. Verde salvia y un gesto sutil para acompañarte todos los días.',
  ],
  [
    'lilac',
    'Lilac Wave',
    'Abstract',
    '#c7bee8',
    'abstract',
    'matte',
    1290,
    'Curvas libres, tonos lavanda y una pequeña dosis de imaginación.',
  ],
  [
    'bloom',
    'Daisy Days',
    'Nature',
    '#f5d882',
    'flowers',
    'silicone',
    1190,
    'Un jardín de margaritas que siempre va con vos. Alegre, cálida y luminosa.',
  ],
  [
    'checker',
    'Check Mate',
    'Retro',
    '#e7a69a',
    'check',
    'gloss',
    1290,
    'Un clásico reinventado. Cuadros terracota con un acabado lleno de luz.',
  ],
  [
    'night',
    'Midnight Club',
    'Premium',
    '#2d3431',
    'minimal',
    'matte',
    1390,
    'Oscura, sobria y con mucho carácter. Los detalles hacen la diferencia.',
  ],
  [
    'sky',
    'Clear Sky',
    'Transparent',
    '#d5e8ee',
    'dots',
    'clear',
    990,
    'Transparencia con pequeños puntos de personalidad.',
  ],
  [
    'ocean',
    'Ocean Lines',
    'Minimal',
    '#86aab5',
    'stripes',
    'tpu',
    990,
    'El ritmo del mar, convertido en líneas. Flexible y liviana.',
  ],
  [
    'sunset',
    'Soft Sunset',
    'Abstract',
    '#e7a69a',
    'gradient',
    'gloss',
    1390,
    'Un atardecer que cabe en la palma de tu mano.',
  ],
].map(([id, name, categoryId, color, pattern, materialId, price, description]) => ({
  id: String(id),
  name: String(name),
  categoryId: String(categoryId),
  color: String(color),
  pattern: String(pattern),
  materialId: String(materialId),
  price: Number(price),
  description: String(description),
  models: models.map((m) => m.id),
  available: true,
}));
export type Element = {
  id: string;
  type: 'text' | 'sticker' | 'image';
  value: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  font: string;
};
export type Design = {
  version: 1;
  templateVersion?: 2;
  modelId: string;
  materialId: string;
  color: string;
  pattern: (typeof patterns)[number];
  patternColor: string;
  patternScale: number;
  patternX: number;
  patternY: number;
  elements: Element[];
};
export const newDesign = (): Design => ({
  version: 1,
  templateVersion: 2,
  modelId: 'iphone-16',
  materialId: 'silicone',
  color: '#c8d4b4',
  pattern: 'none',
  patternColor: '#ffffff',
  patternScale: 1,
  patternX: 0,
  patternY: 0,
  elements: [],
});
export function customPrice(modelId: string, materialId: string) {
  const model = models.find((m) => m.id === modelId),
    material = materials.find((m) => m.id === materialId);
  if (!model || !material) throw new Error('Modelo o material inválido');
  return material.price + model.extra + 200;
}
export function productPrice(product: Pick<Product, 'price' | 'models'>, modelId: string) {
  const model = models.find((m) => m.id === modelId);
  if (!model || !product.models.includes(modelId)) throw new Error('Modelo incompatible');
  return product.price + model.extra;
}
export function productDesign(product: Product, modelId = 'iphone-16'): Design {
  return {
    ...newDesign(),
    modelId,
    materialId: product.materialId,
    color: product.color,
    pattern: product.pattern as Design['pattern'],
  };
}
export function geometry(modelId: string, templateVersion?: 2) {
  if (templateVersion === 2) return calibratedGeometry(modelId);
  const shape = models.find((m) => m.id === modelId)?.shape || 'diagonal';
  const pro = shape.includes('pro'),
    vertical = shape.includes('vertical');
  return {
    height: shape === 'mini' ? 440 : shape.includes('large') ? 500 : 470,
    cameraWidth: shape.includes('pro') ? 130 : shape.includes('vertical') ? 68 : 112,
    cameraHeight: shape.includes('pro') ? 136 : shape.includes('vertical') ? 136 : 112,
    pro: shape.includes('pro'),
    vertical: shape.includes('vertical'),
    lensRadius: 23,
    lenses: pro
      ? [
          [55, 55],
          [55, 115],
          [113, 85],
        ]
      : vertical
        ? [
            [53, 55],
            [53, 111],
          ]
        : [
            [52, 52],
            [103, 103],
          ],
    flash: [pro ? 119 : vertical ? 100 : 105, pro ? 40 : 43],
    cameraRadius: 15,
    flashHole: false,
    unit: 268 / 71.5,
  };
}
