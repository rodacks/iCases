import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { databaseConfig, postgresSchema } from './database-config.mjs';
try {
  process.loadEnvFile('.env');
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
}
const { postgres, directUrl } = databaseConfig(process.env);
if (postgres) process.env.DIRECT_URL = directUrl;
let schema = 'prisma/schema.prisma';
if (postgres) {
  schema = 'prisma/schema.postgresql.prisma';
  const source = await readFile('prisma/schema.prisma', 'utf8');
  await writeFile(schema, postgresSchema(source));
}
const command = process.argv[2] || 'generate';
if (!['generate', 'push', 'schema', 'deploy', 'status', 'dev', 'init'].includes(command))
  throw new Error('Comando Prisma no admitido');
if (command === 'schema') {
  console.log(schema);
  process.exit(0);
}
if (command === 'push' && postgres)
  throw new Error(
    'PostgreSQL usa migraciones versionadas: ejecutar npm run db:migrate:deploy. db:push queda reservado a SQLite local.',
  );
if (['deploy', 'status', 'dev'].includes(command) && !postgres)
  throw new Error('Las migraciones son PostgreSQL. Para SQLite local usar npm run db:push.');
if (command === 'dev' && process.env.VERCEL)
  throw new Error('migrate dev solo debe ejecutarse en una base PostgreSQL de desarrollo.');
if (['push', 'init'].includes(command) && !postgres) await import('./prepare-db.mjs');
const args =
  command === 'generate'
    ? ['generate']
    : command === 'init'
      ? postgres
        ? ['migrate', 'deploy']
        : ['db', 'push']
      : command === 'push'
        ? ['db', 'push']
        : ['migrate', command, ...process.argv.slice(3)];
const cli = fileURLToPath(new URL('../node_modules/prisma/build/index.js', import.meta.url));
const result = spawnSync(process.execPath, [cli, ...args, '--schema', schema], {
  stdio: 'inherit',
  env: process.env,
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
