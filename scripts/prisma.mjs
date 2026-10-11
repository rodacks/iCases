import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
try {
  process.loadEnvFile('.env');
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
}
const url = process.env.DATABASE_URL || '';
const postgres = /^postgres(ql)?:\/\//.test(url);
if (process.env.VERCEL && !postgres)
  throw new Error(
    'Vercel requiere DATABASE_URL de PostgreSQL persistente; SQLite local no es compatible.',
  );
if (url && !postgres && !url.startsWith('file:'))
  throw new Error('DATABASE_URL debe usar file: (local) o postgresql: (producción).');
let schema = 'prisma/schema.prisma';
if (postgres) {
  schema = 'prisma/schema.postgresql.prisma';
  const source = await readFile('prisma/schema.prisma', 'utf8');
  await writeFile(
    schema,
    '// Generado por scripts/prisma.mjs. Editar schema.prisma como fuente única.\n' +
      source.replace('provider = "sqlite"', 'provider = "postgresql"'),
  );
}
const command = process.argv[2] || 'generate';
if (!['generate', 'push', 'schema'].includes(command))
  throw new Error('Comando Prisma no admitido');
if (command === 'schema') {
  console.log(schema);
  process.exit(0);
}
if (command === 'push' && !postgres) await import('./prepare-db.mjs');
const args = command === 'push' ? ['db', 'push'] : ['generate'];
const cli = fileURLToPath(new URL('../node_modules/prisma/build/index.js', import.meta.url));
const result = spawnSync(process.execPath, [cli, ...args, '--schema', schema], {
  stdio: 'inherit',
  env: process.env,
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
