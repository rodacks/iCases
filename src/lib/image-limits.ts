export const imageLimits = {
  sourceBytes: 5 * 1024 * 1024,
  uploadBytes: 3 * 1024 * 1024,
  requestBytes: 3 * 1024 * 1024 + 64 * 1024,
  pixels: 25_000_000,
  edge: 2048,
};
export const imageTypes = ['image/png', 'image/jpeg', 'image/webp'];
export function hasImageSignature(bytes: Uint8Array) {
  return (
    (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)) ||
    (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) ||
    (bytes.length >= 12 &&
      new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' &&
      new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP')
  );
}
