import path from 'node:path';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
export interface AssetStorage {
  put(id: string, data: Buffer): Promise<void>;
  get(id: string): Promise<Buffer>;
  remove(id: string): Promise<void>;
}
// Runtime files live on a persistent volume, not inside the server bundle.
const root = path.resolve(
  /* turbopackIgnore: true */ process.env.UPLOAD_DIR || './storage/uploads',
);
function filename(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error('Recurso inválido');
  return path.join(root, `${id}.webp`);
}
export const storage: AssetStorage = {
  async put(id, data) {
    await mkdir(root, { recursive: true });
    await writeFile(filename(id), data, { flag: 'wx' });
  },
  get(id) {
    return readFile(filename(id));
  },
  remove(id) {
    return unlink(filename(id));
  },
};
