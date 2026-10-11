# PostgreSQL en Neon y despliegue en Vercel

El error `Vercel requiere DATABASE_URL...` indica que el build no tiene una URL PostgreSQL: falta la variable, todavía usa `file:./dev.db` o está configurada para otro entorno. `.env.example` no configura Vercel. Las credenciales deben crearse en Neon y guardarse en Vercel, nunca en GitHub.

## Configuración exacta

1. En el proyecto iCases de Vercel, abrir **Storage → Create Database → Neon** (Marketplace), o crear un proyecto en [Neon Console](https://console.neon.tech) y conectarlo a Vercel. Elegir una región cercana a las Functions.
2. En Neon → **Connect**, seleccionar la rama, base y usuario de producción. Activar **Connection pooling** y copiar la URL cuyo host contiene `-pooler`. En Vercel → **Settings → Environment Variables**, guardarla como `DATABASE_URL`, seleccionando **Production**. Reemplazar el valor SQLite anterior.
3. En el mismo diálogo Neon, desactivar pooling y copiar la URL directa de la **misma base y rama**. Guardarla como `DIRECT_URL`. Si la integración ya proporciona `DATABASE_URL_UNPOOLED`, el script también acepta esa variable cuando no existe `DIRECT_URL`. Si no hay ninguna, el CLI usa `DATABASE_URL`; se recomienda configurar explícitamente la directa.
4. Conservar los parámetros TLS, como `sslmode=require`. Copiar solo la URL: sin `psql`, sin comillas envolventes ni nombre de variable. No usar `NEXT_PUBLIC_`.
5. Para **Preview**, conectar una rama/base Neon separada y configurar ambas URLs para ese entorno. No aplicar migraciones experimentales a Production. Si la integración agrega un prefijo personalizado, copiar sus valores a los nombres que usa iCases.
6. `vercel.json` establece Install Command **`npm ci`** y Build Command **`npm run vercel-build`**. Quitar overrides anteriores de estos comandos en el dashboard. Subir todos los cambios a GitHub y hacer **Redeploy**. Un despliegue anterior no recibe variables nuevas.

Ejemplo de estructura (valores ficticios; copiar los reales desde Neon):

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@ep-EXAMPLE-pooler.REGION.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://USER:PASSWORD@ep-EXAMPLE.REGION.aws.neon.tech/neondb?sslmode=require
ASSET_STORAGE=vercel-blob
BLOB_READ_WRITE_TOKEN=TOKEN_DEL_STORE_PRIVADO
COOKIE_SECURE=true
```

Las dos últimas variables de almacenamiento mantienen la subida persistente de imágenes. Crear/conectar un Blob Store **privado**, según [la guía de imágenes](vercel.md).

## Esquema y migraciones

`prisma/schema.prisma` es la fuente única de entidades, con SQLite para desarrollo. `scripts/prisma.mjs` genera `prisma/schema.postgresql.prisma` al detectar una URL PostgreSQL y añade `directUrl`. Ese archivo generado no se versiona. El cliente de la aplicación usa la conexión pooled; Prisma CLI usa la directa. No se necesitan adaptadores adicionales con Prisma 6 y su motor actual.

`prisma/migrations` contiene exclusivamente migraciones PostgreSQL y su `migration_lock.toml`. La inicial `20261011000000_initial` crea las ocho tablas, relaciones e índices. No se aplica a SQLite.

El build Vercel genera el cliente, ejecuta **`prisma migrate deploy`** y compila Next. Aplica solamente migraciones pendientes y no ejecuta reset ni `db push`. Si la base no está accesible, detiene el despliegue. `npm run build` compila sin migrar para uso local/CI; no sustituye `vercel-build` en Vercel.

### Base Neon nueva

Las tablas se crean durante el primer despliegue. Para cargar el catálogo inicial, configurar las URLs Neon en el `.env` local ignorado o en variables del proceso y ejecutar una vez:

```powershell
npm ci
npm run setup
npm run db:migrate:status
```

También puede hacerse antes del primer despliegue: `setup` genera el cliente, aplica migraciones y carga el catálogo. El seed actualiza productos iniciales y conserva pedidos/diseños; no se ejecuta automáticamente en cada build. Cambiar la URL no importa los pedidos SQLite ni sus imágenes; ver [migración de datos e imágenes](vercel.md#datos-e-imágenes-anteriores).

### PostgreSQL con tablas existentes

Si las tablas se crearon con `db push`, Prisma puede dar P3005 al desplegar. Respaldar la base y comparar el esquema antes de establecer una línea base. Estos comandos PowerShell requieren `DATABASE_URL` y `DIRECT_URL` en las variables del proceso:

```powershell
node scripts/prisma.mjs schema
npx prisma migrate diff --from-url "$env:DIRECT_URL" --to-schema-datamodel prisma/schema.postgresql.prisma --exit-code
```

Solo si no hay diferencias (salida 0), registrar la migración inicial como aplicada y continuar:

```powershell
npx prisma migrate resolve --applied 20261011000000_initial --schema prisma/schema.postgresql.prisma
npm run db:migrate:deploy
```

Si hay diferencias (salida 2), revisarlas y preparar una actualización que conserve datos antes del baseline. No usar reset ni marcar como aplicado un esquema que no coincide. Si ya existe otro historial de migraciones, conciliarlo antes de utilizar este inicial.

## Desarrollo y cambios futuros

SQLite sigue usando `DATABASE_URL=file:./dev.db`, `npm run setup` y `npm run dev`. Después de trabajar contra Neon, restaurar esa URL, quitar las URLs directas PostgreSQL del entorno y ejecutar `npm run db:generate`. No ejecutar pruebas de compra contra Production.

Para cambios de entidades: editar `prisma/schema.prisma`, configurar una **base PostgreSQL de desarrollo** y ejecutar `npm run db:migrate:dev -- --name descripcion`. Prisma necesita permisos de desarrollo para crear su shadow database. Revisar y versionar el SQL generado junto al esquema. `migrate dev` está bloqueado en Vercel; `db:push` está reservado a SQLite. Nunca editar una migración ya aplicada.

## Validación y límites de la comprobación

Las pruebas verifican selección de proveedor, URLs Neon y correspondencia exacta entre el SQL inicial y el esquema PostgreSQL. La compilación con cliente PostgreSQL y `VERCEL=1` se puede verificar sin acceder a Neon; eso no prueba una conexión real ni aplica migraciones. Para completar la comprobación remota, revisar que el log muestre la migración aplicada y el build correcto; abrir la tienda, subir una imagen, completar un pedido demo y recuperarlo después de otro despliegue.

Referencias oficiales: [Neon/Vercel](https://neon.com/docs/guides/vercel-managed-integration), [Prisma 6 en Vercel](https://www.prisma.io/docs/orm/v6/prisma-client/deployment/serverless/deploy-to-vercel).
