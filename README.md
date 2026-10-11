# iCases

E-commerce local de fundas de iPhone con editor 2D y previsualización 3D interactiva, catálogo, carrito persistente y pedidos de demostración. Interfaz en español de Uruguay; importes enteros en UYU. **No procesa dinero ni realiza envíos.**

Para el despliegue publicado, seguir **[Configuración de Vercel, Blob y PostgreSQL](docs/vercel.md)**. En Vercel no usar SQLite ni carpetas locales para persistencia.

## Iniciar

Requisitos: Node.js 22.12 o superior (verificado con Node 24) y npm. Ejecutar desde la carpeta del proyecto.

```powershell
npm ci
Copy-Item .env.example .env
npm run setup
npm run dev
```

En macOS/Linux, usar `cp .env.example .env` en lugar de `Copy-Item`. No sobrescribir un `.env` existente con una configuración propia.

Abrir **http://127.0.0.1:3000**. El servidor escucha únicamente en loopback de forma predeterminada. Para probar desde un teléfono físico en la misma red, ejecutar `npx next dev --hostname 0.0.0.0` y abrir la IP local del equipo. No establecer `APP_ORIGIN` durante esa prueba, o configurarlo con la URL exacta usada por el teléfono. Usar solo en una red de confianza.

`setup` genera Prisma, prepara el archivo SQLite si no existe, sincroniza el esquema local y ejecuta el seed. Con PostgreSQL aplica migraciones versionadas en lugar de `db push`. El paso de preparación evita un fallo del motor de Prisma en Windows al abrir un archivo SQLite inexistente. No trunca una base existente. El seed es repetible: actualiza el catálogo inicial y conserva diseños, archivos y pedidos.

Producción local:

```powershell
npm run build
npm start
```

No ejecutar compilación y servidor de desarrollo simultáneamente sobre el mismo `.next`.

## Configuración

Consultar `.env.example`:

| Variable        | Uso                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------- |
| `DATABASE_URL`  | SQLite; una ruta relativa `file:./dev.db` se resuelve desde `prisma/`.                       |
| `UPLOAD_DIR`    | Archivos de imagen; relativo a la raíz del proceso o ruta absoluta.                          |
| `APP_ORIGIN`    | Opcional. Origen externo exacto para validar escrituras detrás de un proxy, sin barra final. |
| `COOKIE_SECURE` | `true` en un despliegue HTTPS de producción. Dejar `false` para HTTP local.                  |

La configuración de idioma, moneda y envío está en `src/lib/catalog.ts`. Los precios se almacenan como pesos enteros; si se incorporan monedas con fracciones, migrar explícitamente a unidades menores.

## Funcionalidades implementadas

- Inicio con colecciones, materiales, navegación móvil, enlaces de ayuda y contador de carrito.
- Ocho productos iniciales, seis colecciones, buscador, filtro de modelo y orden de precio.
- Ficha de producto con modelo obligatorio, disponibilidad y precio por variante.
- Modelos de iPhone 13 a 16 y sus variantes correspondientes, cinco materiales y paleta con color personalizado.
- Editor SVG propio: selección, arrastre, tiradores de escala/rotación, controles numéricos, pellizco táctil de escala, duplicación, eliminación, orden de capas y 60 pasos de deshacer/rehacer.
- Siete categorías de stickers vectoriales originales, siete patrones configurables, texto con tres familias y subida de PNG/JPG/WebP.
- Recorte común en pantalla y exportación: superficie de la funda menos el área de cámara. Los elementos pueden quedar parcialmente recortados, pero nunca se imprimen fuera de esa máscara.
- Borrador automático local, copias inmutables de diseño en SQLite y enlaces para recuperarlas en el mismo navegador.
- Exportación PNG transparente a 4×: vista comercial con cámaras y acabado, o composición sin cámaras ni efectos. Configuración JSON descargable desde pedidos personalizados.
- Imágenes verificadas por contenido y decodificadas con Sharp, orientación corregida, metadatos eliminados, WebP persistente de hasta 2048 px; proporción visual conservada. Originales de hasta 5 MiB y 25 megapíxeles; preparación en navegador y transferencia al servidor de hasta 3 MiB.
- Carrito Zustand persistente con miniaturas, cantidades 1–20 y diseños independientes.
- Checkout validado, pedido e ítems guardados juntos, precios recalculados en servidor, instantáneas de diseño/precio e idempotencia ante reintentos.
- Confirmación recuperable por enlace aleatorio. No expone los datos de contacto guardados. Carrito vaciado únicamente después de una respuesta exitosa.
- Estados de carga/error/vacío, foco visible, controles etiquetados y respeto de movimiento reducido.

## Arquitectura

```text
prisma/
  schema.prisma           Entidades SQLite
  seed.ts                 Catálogo reproducible
src/app/
  page.tsx                Inicio
  tienda/                 Catálogo y ficha dinámica
  personalizar/           Editor
  carrito/, checkout/     Compra
  pedido/[id]/            Confirmación y recuperación
  informacion/            Ayuda, materiales y privacidad
  api/                    Productos, diseños, archivos y pedidos
src/components/
  case-art.tsx            Render SVG compartido por tienda/editor/carrito/pedido
  case-preview.tsx        Visor 3D con carga diferida y alternativa SVG
  editor.tsx              Herramientas, historial e interacciones Pointer Events
  shop.tsx                Filtros del catálogo
  cart-page.tsx            Carrito
  checkout.tsx            Formulario e idempotencia del cliente
src/lib/
  catalog.ts              Configuración, tipos y cálculo de precios
  phone-profiles.ts       16 perfiles físicos y referencias oficiales
  phone-scene.ts          Geometrías, materiales e iluminación Three.js
  validation.ts           Esquemas Zod compartidos
  db.ts                   Cliente Prisma
  orders.ts               Servicio de creación de pedidos
  storage.ts              Adaptadores AssetStorage: disco local / Blob privado
  payments.ts             Contrato PaymentProvider y proveedor demo
  server.ts               Sesión, origen, límites de cuerpo y errores
  cart.ts                 Estado global persistente
  export.ts               Exportación SVG → PNG
tests/
  core.test.ts            Lógica de dominio
  e2e/purchase.spec.ts    Compra y recuperación en navegador
```

Next.js App Router y React 19 separan páginas de servidor de componentes interactivos. TypeScript estricto, Tailwind 4 con un sistema visual CSS propio, Lucide y Zustand. El editor usa SVG y Pointer Events para compartir una misma representación vectorial entre todos los pasos con recortes compartidos entre edición y exportación. La previsualización usa Three.js con geometrías procedurales locales: carga diferida, un contexto compartido para miniaturas, render bajo demanda y alternativa SVG cuando WebGL no está disponible. Manrope se sirve localmente. Las imágenes externas se incrustan en el SVG antes de rasterizar, evitando exportaciones vacías o dependientes de rutas del dispositivo.

Entidades: `Product`, `Category`, `PhoneModel`, `Material`, `Asset`, `Design`, `Order`, `OrderItem`. Configuraciones de diseño y snapshots se guardan como JSON versionado en columnas String para mantener compatibilidad simple con SQLite y PostgreSQL. Los recursos se referencian por identificadores inmutables, no por nombres aportados por el usuario. Las tablas de modelos/materiales reflejan la configuración del código; no existe edición administrativa en este MVP.

## Pruebas

Verificación realizada el 11 de octubre de 2026: TypeScript y compilación de producción correctos, 15 pruebas de lógica y 24 casos de navegador verificados (12 por resolución), y `npm audit` sin vulnerabilidades reportadas. Los casos se ejecutaron contra `npm start`; las nuevas pruebas de subida cubren originales mayores de 4,5 MB, archivos inválidos y errores no JSON. Se verificó además la compilación con el cliente PostgreSQL y variables de Vercel, sin conexión a servicios remotos. Se comprobaron los 16 modelos en WebGL, giro táctil, sincronización del diseño, alternativa sin WebGL, arrastre con mouse, gestos táctiles emulados y píxeles transparentes de cámara/flash/exterior en la exportación PNG. Se corrigió la superposición de la vista previa sobre controles móviles. Las capturas de inicio, tienda y editor no presentaron desbordamientos horizontales en 1440 px y 390 px.

```powershell
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm audit
```

Playwright levanta el servidor de desarrollo si no hay uno en el puerto 3000. Verifica dos proyectos: Chromium de escritorio y Chromium con viewport/touch de iPhone 13. Esto no equivale a una prueba en Safari/iOS físico.

Los recorridos cubren subir y recuperar imágenes, cambios de diseño, exportación, carrito tras recarga, compra personalizada, compra prediseñada con filtros/cantidades, precios manipulados, reintentos idempotentes, archivos falsos y conservación del carrito ante un error del servidor. Las pruebas crean pedidos de demostración en la base activa. Para una ejecución aislada, usar un `.env` de pruebas con otro `DATABASE_URL` y `UPLOAD_DIR`, ejecutar `setup` y arrancar un servidor nuevo con esas variables; no reutilizar el servidor habitual.

`node scripts/visual-check.mjs` captura inicio, editor y catálogo en ambas resoluciones, informa desbordamientos y errores del navegador. Requiere el servidor activo. Capturas y trazas quedan en `test-results/`, excluido de Git.

## Ampliar el catálogo

### Modelos

Agregar una entrada en `models` de `src/lib/catalog.ts` y un perfil en `src/lib/phone-profiles.ts`: medidas del cuerpo, generación, cámaras, frontal, marco, botones, puerto y enlaces oficiales. Revisar `calibratedGeometry()` si aparece una disposición nueva. `CaseArt` y `phone-scene` consumen la misma geometría para alinear impresión y cámaras. Ejecutar `npm run db:seed`. Las dimensiones generales se basan en Apple; cámaras, radios y funda son aproximaciones visuales, no CAD de fabricación.

### Materiales y precios

Agregar a `materials` un ID estable, nombre, descripción y precio base. Implementar el acabado en `case-art.tsx` cuando corresponda. La personalización agrega 200 UYU en `customPrice()`, además del sobreprecio del modelo. Esa función se utiliza en el editor y en el servidor. `productPrice()` valida compatibilidad y aplica el sobreprecio a los productos prediseñados.

### Productos y colecciones

Agregar la colección a `categories` y una entrada a `products`. Definir ID estable, precio base, material, color, patrón, descripción, modelos compatibles y disponibilidad. Ejecutar el seed. La tienda se consulta desde SQLite; las tarjetas destacadas de inicio usan la misma configuración inicial del código. Para retirar un producto inicial, establecer `available: false`; borrar una entrada del seed no elimina registros existentes ni históricos.

### Stickers, patrones y diseños

Agregar stickers a `stickers` e implementar sus trazos en `Sticker`. Son recursos vectoriales locales, sin imágenes remotas ni licencias de terceros. Para un patrón, ampliar `patterns`, `patternNames`, su miniatura CSS y el render de `CaseArt`. `designSchema` utiliza la lista de patrones y valida los stickers reconocidos.

La configuración tiene `version: 1` y los diseños nuevos incluyen `templateVersion: 2`. La ausencia de este campo mantiene la plantilla histórica sin desplazar elementos de pedidos o carritos existentes. El editor ofrece una actualización explícita de plantilla para diseños antiguos; revisar la composición después de actualizar. Si cambia su estructura, añadir una migración de lectura y mantener compatibilidad con snapshots ya pedidos. No reutilizar IDs con un significado distinto. Las copias guardadas son inmutables: editar crea un nuevo diseño para no alterar artículos anteriores del carrito o pedidos.

## Datos y recuperación

La base inicial es `prisma/dev.db`. Los archivos están en `storage/uploads/`. Respaldar **ambos juntos**; conservar solo SQLite no recupera las imágenes. Las miniaturas se reconstruyen con el mismo SVG a partir del JSON. El resumen del pedido tiene la instantánea completa de cada funda, incluso si cambian los precios del catálogo.

En Vercel, PostgreSQL conserva registros y Vercel Blob privado conserva imágenes; cada recurso registra su proveedor. Los originales se preparan en el navegador y las subidas al servidor se limitan a 3 MiB para respetar el máximo de Vercel. Ver `docs/vercel.md`.

El borrador y el carrito viven en localStorage; no sustituyen el guardado en servidor. La cookie HttpOnly `icases-session` vincula el navegador con los diseños y las subidas. Recuperar un enlace de diseño exige esa cookie. El enlace aleatorio de pedido y las URLs aleatorias de imágenes funcionan como enlaces privados por posesión: no publicarlos ni usarlos como sustituto de autorización para información sensible.

Para reiniciar totalmente una demo local, primero detener Next, respaldar si hace falta, eliminar manualmente `prisma/dev.db` y `storage/uploads/`, limpiar los datos del sitio en el navegador y volver a ejecutar `setup`. El seed solo nunca elimina pedidos.

## Antes de producción

Esta entrega es un MVP local funcional. Quedan fuera del alcance: pagos reales, envío real, cuentas, administración e inventario avanzado.

1. Configurar PostgreSQL persistente siguiendo `docs/vercel.md`. El script Prisma selecciona el proveedor según `DATABASE_URL`; migrar los datos históricos manteniendo identificadores y usar las migraciones versionadas de `prisma/migrations`. Ver [Neon y despliegue](docs/neon.md). `vercel.json` ejecuta `npm run vercel-build` para generar Prisma, migrar y compilar.
2. Conectar Vercel Blob privado y migrar los recursos locales según `docs/vercel.md`. El adaptador ya está implementado. Añadir política de retención, limpieza de subidas huérfanas, cuotas y backups.
3. Configurar HTTPS, `COOKIE_SECURE=true` y `APP_ORIGIN` exacto detrás del proxy. Añadir límites de frecuencia/carga en el perímetro, observabilidad y control de acceso para pedidos y archivos privados. El MVP tiene límites de cuerpo, validación de contenido y protección de origen, pero no cuotas distribuidas ni cuentas.
4. Reemplazar el proveedor demo por una integración de pagos con credenciales solo en servidor, verificación de webhooks e idempotencia de la pasarela. No marcar un pedido como pagado desde el navegador.
5. Definir logística, impuestos, política de privacidad comercial y canales de atención reales. Los textos actuales identifican explícitamente la demo.
6. Validar plantillas con el fabricante: dimensiones, cámaras, sangrado, zonas seguras, resolución, fuentes y perfiles de color. Los PNG de este MVP **no son archivos calibrados de producción**.
7. Probar Safari/iOS y Android físicos, accesibilidad con lectores de pantalla y carga concurrente. El editor tiene controles accesibles alternativos a arrastre, pero todavía no una auditoría WCAG completa.

Las dependencias quedan fijadas por `package-lock.json`. El override de `deepmerge-ts` usa la versión 8 corregida para la dependencia transitiva de Prisma; las pruebas y generación verifican su compatibilidad en este proyecto.

## Modelos 3D y referencias

Hay perfiles para los 16 modelos del catálogo (iPhone 13–16, incluidas sus variantes). [Inventario de fotografías y fichas oficiales](docs/iphone-references.md). Las fotografías se consultaron como referencias visuales; el sitio no las descarga ni necesita conectarse con Apple para renderizar. No se incluyen logos ni fondos de pantalla de Apple.

Se representan cámaras diagonales, triples y verticales, lentes y anillos con relieve, flash y LiDAR en Pro, notch/Dynamic Island, puerto Lightning/USB-C, interruptor/botón de acción y Camera Control cuando corresponde. Las medidas generales preservan la relación de aspecto y diferencian Mini/Plus/Max. Los acabados de funda responden al material seleccionado.

El modo Vista 3D permite arrastrar con mouse o dedo y usar controles de giro; Editar 2D conserva las herramientas de composición. La exportación PNG sigue siendo una composición plana, no una captura WebGL. La geometría es ilustrativa: no constituye una reproducción industrial exacta ni reemplaza plantillas validadas por el fabricante. No se modelan las variantes regionales de bandeja SIM.

Para revisar las referencias nuevamente: `npx tsx scripts/reference-sheet.mts` genera hojas de referencia en `test-results/references` y actualiza el inventario. Requiere conexión a Apple. `node scripts/preview-3d.mjs` captura las vistas de la aplicación local en escritorio y móvil.
