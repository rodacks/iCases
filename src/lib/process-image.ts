import sharp from 'sharp';
import { PublicError } from './errors';
import { imageLimits, imageTypes } from './image-limits';
export async function processImage(input: Buffer, mime: string) {
  if (!input.length || input.length > imageLimits.uploadBytes)
    throw new PublicError(
      'La imagen preparada debe pesar como máximo 3 MB. Volvé a seleccionarla en el editor.',
    );
  if (!imageTypes.includes(mime)) throw new PublicError('Usá una imagen PNG, JPG o WebP.');
  try {
    const pipeline = sharp(input, { limitInputPixels: imageLimits.pixels, animated: false });
    const meta = await pipeline.metadata();
    if (
      !['png', 'jpeg', 'webp'].includes(meta.format || '') ||
      !meta.width ||
      !meta.height ||
      meta.width * meta.height > imageLimits.pixels
    )
      throw new Error('invalid image');
    const result = await pipeline
      .rotate()
      .resize({
        width: imageLimits.edge,
        height: imageLimits.edge,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 90 })
      .toBuffer({ resolveWithObject: true });
    if (result.data.length > imageLimits.uploadBytes) throw new Error('encoded image too large');
    return result;
  } catch {
    throw new PublicError(
      'La imagen está dañada, supera los 25 megapíxeles o no es un PNG, JPG o WebP válido.',
    );
  }
}
