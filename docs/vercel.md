# Subidas persistentes en Vercel

## Causa del fallo

La implementación original escribía los archivos en `storage/uploads` y los registros en un archivo SQLite. El directorio del despliegue de una Function no es un volumen de escritura persistente. `/tmp` tampoco conserva archivos entre instancias o despliegues. Adicionalmente, una Function acepta cuerpos de hasta 4,5 MB, mientras el editor permitía originales de 5 MB. Sin los logs del despliegue no se puede atribuir el 500 observado a una llamada exacta; estas incompatibilidades sí están presentes en el código original.

Referencias: [límites de Functions](https://vercel.com/docs/functions/limitations), [Blob privado](https://vercel.com/docs/vercel-blob/private-storage), [SDK Blob](https://vercel.com/docs/vercel-blob/using-blob-sdk), [Prisma 6 en Vercel](https://docs.prisma.io/docs/orm/v6/prisma-client/deployment/serverless/deploy-to-vercel).

## Configuración necesaria

1. En el proyecto de Vercel, crear/conectar un **Blob Store PRIVATE**, desde Storage. No usar un store público para este adaptador. La conexión agrega `BLOB_READ_WRITE_TOKEN` a los entornos seleccionados. No exponerlo con `NEXT_PUBLIC_` ni subirlo a GitHub.
2. Conectar una base **PostgreSQL persistente**, por ejemplo Neon desde Marketplace. Copiar su cadena PostgreSQL a `DATABASE_URL` en los entornos correspondientes. Preferir la conexión con pool recomendada por el proveedor para Functions. El código mantiene Prisma 6; no requiere migrar a Prisma 7/8.
3. Configurar las variables siguientes y volver a desplegar:

| Variable                | Valor en Vercel                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `ASSET_STORAGE`         | `vercel-blob`                                                                                           |
| `BLOB_READ_WRITE_TOKEN` | Token del store **privado**, solo servidor                                                              |
| `DATABASE_URL`          | `postgresql://...` con TLS, nunca `file:...`                                                            |
| `COOKIE_SECURE`         | `true`                                                                                                  |
| `APP_ORIGIN`            | Opcional: origen HTTPS exacto, sin barra final; si se configura, debe coincidir con el dominio visitado |

`UPLOAD_DIR` solo se utiliza en desarrollo local o en la herramienta de migración. Vercel establece `VERCEL` automáticamente. No añadir esa variable al `.env` local. Separar bases/stores de Preview y Production cuando se prueben datos de demostración. No fijar el dominio de producción como `APP_ORIGIN` en un Preview con otro dominio.

## Preparar las tablas y desplegar

Seguir [la guía Neon: configuración, migraciones y despliegue](neon.md). `vercel.json` ejecuta `npm run vercel-build`: generación del cliente, migraciones PostgreSQL y compilación. El catálogo se carga una vez con `npm run setup` usando las URLs Neon. Para bases existentes, revisar el procedimiento de baseline antes de desplegar. SQLite sigue disponible para desarrollo local.

## Datos e imágenes anteriores

Cambiar `DATABASE_URL` no traslada los pedidos de SQLite a PostgreSQL. Si hay datos que conservar, exportar/importar todas las tablas manteniendo sus IDs y relaciones antes de cambiar producción. El seed solo carga catálogo; no migra pedidos. Respaldar SQLite y `storage/uploads` juntos.

Para los registros `Asset` ya importados y sus archivos originales disponibles localmente, ejecutar en ese equipo con `DATABASE_URL` apuntando a la base destino, `UPLOAD_DIR` apuntando a la carpeta antigua y el token Blob configurado:

```powershell
npm run db:generate
npx tsx scripts/migrate-assets.ts
```

La herramienta mantiene los UUID y las URLs `/api/assets/:id`, comprueba colisiones, permite reintentos y marca cada registro como `vercel-blob` después de transferirlo. No borra archivos locales. Si ya migraste los recursos en SQLite antes de importar las tablas, conservar también `storageProvider`. No borrar el store o los objetos asociados a pedidos. Los archivos perdidos de instancias antiguas de Vercel no se pueden reconstruir sin una copia.

## Flujo y límites

- PNG, JPG o WebP de hasta **5 MiB** y **25 megapíxeles** como original.
- El navegador verifica firma, decodifica, corrige orientación y reduce a 2048 px (1536/1024 si necesita reducir bytes). Genera WebP conservando transparencia; usa PNG si el navegador no codifica WebP. La previsualización transitoria usa una URL Blob local que se revoca al terminar.
- Solo se envían hasta **3 MiB** de imagen y un margen de 64 KiB para multipart: por debajo del límite de la Function. No es necesario autorizar subidas directas desde el cliente ni exponer tokens.
- Sharp vuelve a comprobar contenido, píxeles y tamaño; normaliza a WebP sin metadatos. El servidor no confía en el MIME del navegador.
- El servidor guarda bytes en Blob privado y metadatos en PostgreSQL. Cada registro conserva su proveedor; las imágenes antiguas no cambian de origen silenciosamente.
- Diseños, carrito, pedidos, SVG, stickers y preview 3D mantienen el contrato `/api/assets/:id`. El proxy de lectura evita CORS al exportar PNG. Las URLs aleatorias siguen siendo enlaces por posesión, como en el MVP: Blob privado no añade cuentas ni autenticación de compradores.
- Errores de configuración devuelven 503 comprensible; archivo inválido, 400; recurso inexistente, 404. Un fallo temporal de lectura ya no se disfraza de 404. Se toleran respuestas de error no JSON de la plataforma. Si la subida falla no se añade una imagen incompleta al diseño.

## Comprobación en el despliegue

1. Subir PNG transparente, JPG y WebP. Probar un original de 4,5–5 MB: comprobar en Network que el POST real quede por debajo de 3,1 MiB.
2. Confirmar POST 200, recurso GET 200 y registro `Asset.storageProvider=vercel-blob`.
3. Girar/escalar, exportar PNG y guardar una funda; completar un pedido demo y recuperar su diseño después de recargar.
4. Hacer otro despliegue y comprobar que la misma URL de imagen sigue funcionando.
5. Revisar Functions Logs si hay error. No compartir tokens o cadenas de conexión en capturas.

Las pruebas automatizadas locales cubren validaciones, reducción real en Chromium, errores de plataforma, ambos flujos de compra y el contrato del SDK Blob con un doble de prueba. Para certificar la conexión real con Blob y PostgreSQL hay que ejecutar esta comprobación con los servicios configurados; un doble de prueba no reemplaza esa verificación.

## Archivos del cambio

- `src/app/api/assets/route.ts` y `src/app/api/assets/[id]/route.ts`: subida validada y recuperación según proveedor.
- `src/lib/storage.ts`: Blob privado y disco exclusivamente para entornos locales.
- `src/lib/prepare-image.ts`, `src/lib/process-image.ts`, `src/lib/image-limits.ts`: preparación en navegador, verificación en servidor y límites compartidos.
- `src/components/editor.tsx`: integración y vista previa transitoria, sin modificar las herramientas del editor.
- `src/lib/errors.ts`, `src/lib/server.ts`: errores de servicio comprensibles.
- `prisma/schema.prisma`: proveedor de almacenamiento por recurso.
- `scripts/prisma.mjs`, `package.json`, `package-lock.json`, `.gitignore`: cliente Prisma por entorno y dependencia Blob.
- `scripts/migrate-assets.ts`: transferencia de recursos existentes conservando sus IDs.
- `.env.example`, `README.md`, `docs/vercel.md`: configuración y procedimiento de despliegue.
- `tests/assets.test.ts`, `tests/e2e/uploads.spec.ts`: validaciones, contrato Blob y subidas reales desde Chromium.

Verificación de esta entrega: 12 pruebas de lógica aprobadas; 24 casos de navegador comprobados en escritorio/móvil contra build de producción. La prueba de tamaño multipart se corrigió para leer Content-Length porque Chromium no expone el cuerpo binario mediante postDataBuffer; los seis casos de subida pasaron al repetirlos. Se compiló con Prisma PostgreSQL y VERCEL=1 usando una URL ficticia local (sin consultas ni escrituras remotas), además de la compilación SQLite. Esto valida el empaquetado, no la conexión real a servicios. npm audit no reportó vulnerabilidades.
