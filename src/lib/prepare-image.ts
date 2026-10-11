import { imageLimits, imageTypes, hasImageSignature } from './image-limits';
/** Browser preparation; only persistent asset IDs are stored in designs. */
export async function prepareImage(file: File): Promise<File> {
  if (!imageTypes.includes(file.type)) throw new Error('Usá una imagen PNG, JPG o WebP.');
  if (!file.size || file.size > imageLimits.sourceBytes)
    throw new Error('Elegí una imagen de hasta 5 MB.');
  if (!hasImageSignature(new Uint8Array(await file.slice(0, 12).arrayBuffer())))
    throw new Error('El archivo no contiene una imagen PNG, JPG o WebP válida.');
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('No pudimos abrir la imagen. Probá con otro PNG, JPG o WebP.');
  }
  try {
    if (bitmap.width * bitmap.height > imageLimits.pixels)
      throw new Error(
        'La imagen supera los 25 megapíxeles. Reducí sus dimensiones e intentá otra vez.',
      );
    const canvas = document.createElement('canvas');
    for (const edge of [imageLimits.edge, 1536, 1024]) {
      const ratio = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
      canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
      const context = canvas.getContext('2d');
      if (!context)
        throw new Error('Este navegador no pudo preparar la imagen. Intentá con otro navegador.');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const result = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', 0.9),
      );
      if (result && result.size <= imageLimits.uploadBytes) {
        if (!imageTypes.includes(result.type)) throw new Error('No pudimos convertir la imagen.');
        return new File([result], result.type === 'image/webp' ? 'imagen.webp' : 'imagen.png', {
          type: result.type,
        });
      }
    }
    throw new Error('No pudimos reducir la imagen para subirla. Probá con una imagen más pequeña.');
  } finally {
    bitmap.close();
  }
}
export async function uploadImage(file: File) {
  const form = new FormData();
  form.set('file', file);
  let response: Response;
  try {
    response = await fetch('/api/assets', { method: 'POST', body: form });
  } catch {
    throw new Error(
      'No se pudo conectar para subir la imagen. Revisá tu conexión e intentá de nuevo.',
    );
  }
  if (response.status === 413)
    throw new Error('La imagen es demasiado grande para subirla. Probá con una más pequeña.');
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      typeof data?.error === 'string'
        ? data.error
        : 'No pudimos guardar la imagen. Intentá de nuevo en unos minutos.',
    );
  if (
    !data ||
    typeof data.url !== 'string' ||
    !/^\/api\/assets\/[0-9a-f-]{36}$/.test(data.url) ||
    !(data.width > 0) ||
    !(data.height > 0)
  )
    throw new Error('La respuesta de la subida no es válida. Intentá de nuevo.');
  return data as { url: string; width: number; height: number };
}
