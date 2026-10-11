// Shared by the CLI and regression tests. Never print connection strings.
export function databaseConfig(env) {
  const url = env.DATABASE_URL || '';
  const postgres = /^postgres(ql)?:\/\//.test(url);
  if (!url || (env.VERCEL && !postgres))
    throw new Error(
      'Configurar DATABASE_URL: en Vercel debe ser la URL PostgreSQL pooled de Neon (Settings → Environment Variables, entorno del despliegue). No usar file: ni dejarla vacía. Ver docs/vercel.md.',
    );
  if (!postgres && !url.startsWith('file:'))
    throw new Error('DATABASE_URL debe usar file: (local) o postgresql: (producción).');
  if (postgres) {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname || parsed.pathname.length < 2) throw new Error();
    } catch {
      throw new Error(
        'DATABASE_URL no es una URL PostgreSQL válida. Copiar la cadena completa desde Neon.',
      );
    }
  }
  const directUrl = env.DIRECT_URL || env.DATABASE_URL_UNPOOLED || url;
  if (postgres && !/^postgres(ql)?:\/\//.test(directUrl))
    throw new Error('DIRECT_URL / DATABASE_URL_UNPOOLED debe ser una URL PostgreSQL.');
  return { postgres, directUrl };
}

export function postgresSchema(source) {
  return (
    '// Generado; editar prisma/schema.prisma y crear una migración PostgreSQL.\n' +
    source
      .replace('provider = "sqlite"', 'provider = "postgresql"')
      .replace(
        'url = env("DATABASE_URL")',
        'url = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")',
      )
  );
}
