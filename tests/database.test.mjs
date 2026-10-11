import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { databaseConfig, postgresSchema } from '../scripts/database-config.mjs';

test('Vercel rejects missing/SQLite URLs without leaking secrets', () => {
  for (const DATABASE_URL of ['', 'file:./dev.db', 'https://user:secret@example.com']) {
    assert.throws(
      () => databaseConfig({ VERCEL: '1', DATABASE_URL }),
      (e) => e.message.includes('Configurar DATABASE_URL') && !e.message.includes('secret'),
    );
  }
  assert.equal(databaseConfig({ DATABASE_URL: 'file:./dev.db' }).postgres, false);
});

test('Neon uses pooled runtime URL and explicit or integration-provided direct URL', () => {
  const DATABASE_URL =
    'postgresql://user:password@ep-example-pooler.neon.tech/neondb?sslmode=require';
  const direct = DATABASE_URL.replace('-pooler', '');
  assert.deepEqual(databaseConfig({ VERCEL: '1', DATABASE_URL, DATABASE_URL_UNPOOLED: direct }), {
    postgres: true,
    directUrl: direct,
  });
  assert.equal(
    databaseConfig({ DATABASE_URL, DIRECT_URL: direct, DATABASE_URL_UNPOOLED: 'unused' }).directUrl,
    direct,
  );
  assert.equal(databaseConfig({ DATABASE_URL }).directUrl, DATABASE_URL);
  assert.throws(() => databaseConfig({ DATABASE_URL, DIRECT_URL: 'file:./dev.db' }));
});

test('committed initial PostgreSQL migration matches all current Prisma entities', () => {
  const source = readFileSync('prisma/schema.prisma', 'utf8');
  const schema = postgresSchema(source);
  assert.match(schema, /provider = "postgresql"/);
  assert.match(schema, /directUrl = env\("DIRECT_URL"\)/);
  // Diff requires no database connection; catches drift between the schema and SQL.
  const directory = mkdtempSync(join(tmpdir(), 'icases-schema-'));
  const schemaPath = join(directory, 'schema.prisma');
  writeFileSync(schemaPath, schema);
  const result = spawnSync(
    process.execPath,
    [
      'node_modules/prisma/build/index.js',
      'migrate',
      'diff',
      '--from-empty',
      '--to-schema-datamodel',
      schemaPath,
      '--script',
    ],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        DATABASE_URL: 'postgresql://test:test@127.0.0.1:9/check',
        DIRECT_URL: 'postgresql://test:test@127.0.0.1:9/check',
      },
    },
  );
  unlinkSync(schemaPath);
  rmdirSync(directory);
  assert.equal(result.status, 0, result.stderr);
  const normalize = (s) => s.replace(/\r\n/g, '\n').trim();
  assert.equal(
    normalize(result.stdout),
    normalize(readFileSync('prisma/migrations/20261011000000_initial/migration.sql', 'utf8')),
  );
});
