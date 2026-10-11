import { z } from 'zod';
import { models, materials, patterns, departments, stickers } from './catalog';
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const modelId = z
  .string()
  .refine((v) => models.some((m) => m.id === v), 'Elegí un modelo válido');
export const materialId = z
  .string()
  .refine((v) => materials.some((m) => m.id === v), 'Material inválido');
export const designSchema = z.object({
  version: z.literal(1),
  templateVersion: z.literal(2).optional(),
  modelId,
  materialId,
  color,
  pattern: z.enum(patterns),
  patternColor: color,
  patternScale: z.number().min(0.5).max(3),
  patternX: z.number().min(-100).max(100),
  patternY: z.number().min(-100).max(100),
  elements: z
    .array(
      z
        .object({
          id: z.string().uuid(),
          type: z.enum(['text', 'image', 'sticker']),
          value: z.string().min(1).max(160),
          x: z.number().min(0).max(280),
          y: z.number().min(0).max(620),
          width: z.number().min(15).max(400),
          height: z.number().min(15).max(500),
          rotation: z.number().min(-360).max(360),
          color,
          font: z.enum(['Arial', 'Georgia', 'Courier New']),
        })
        .superRefine((el, ctx) => {
          if (el.type === 'image' && !/^\/api\/assets\/[0-9a-f-]{36}$/.test(el.value))
            ctx.addIssue({ code: 'custom', message: 'Imagen inválida' });
          if (el.type === 'sticker' && !stickers.some((s) => s.id === el.value))
            ctx.addIssue({ code: 'custom', message: 'Sticker inválido' });
        }),
    )
    .max(40),
});
export const customerSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(150),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d ()-]{8,22}$/),
  department: z.string().refine((v) => departments.includes(v)),
  city: z.string().trim().min(2).max(100),
  address: z.string().trim().min(5).max(220),
  notes: z.string().trim().max(1000).default(''),
});
export const lineSchema = z
  .object({
    kind: z.enum(['product', 'custom']),
    productId: z.string().max(80).optional(),
    designId: z.string().uuid().optional(),
    modelId,
    quantity: z.number().int().min(1).max(20),
  })
  .superRefine((l, ctx) => {
    if ((l.kind === 'custom' && !l.designId) || (l.kind === 'product' && !l.productId))
      ctx.addIssue({ code: 'custom', message: 'Artículo incompleto' });
  });
export const checkoutSchema = z.object({
  requestId: z.string().uuid(),
  customer: customerSchema,
  items: z.array(lineSchema).min(1).max(50),
});
