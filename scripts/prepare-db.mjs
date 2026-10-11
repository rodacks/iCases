import { mkdir, open } from 'node:fs/promises';
import path from 'node:path';
try {
  process.loadEnvFile('.env');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const url = process.env.DATABASE_URL;
if (!url) throw new Error('Copiá .env.example a .env antes de inicializar la base de datos.');
if (url.startsWith('file:')) {
  const file = path.resolve('prisma', url.slice(5));
  await mkdir(path.dirname(file), { recursive: true });
  // Prisma on Windows may fail opening a SQLite database that does not exist yet.
  const handle = await open(file, 'a');
  await handle.close();
}
