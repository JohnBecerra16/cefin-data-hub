# Arquitectura de captación

## Alcance acordado

Next.js App Router, React, TypeScript y Tailwind en Vercel; PostgreSQL en Railway. Drizzle ORM gestiona el esquema tipado y las consultas PostgreSQL; Drizzle Kit genera migraciones SQL revisables. El driver `pg` conecta desde Node.js en Vercel con un pool pequeño. Zod valida configuración y, posteriormente, entradas HTTP.

Las landings son clientes independientes de la API. No se presupone un único repositorio o alojamiento para ellas. No modificar CEFIN WEB ni otras landings sin autorización expresa.

El teléfono tendrá selector de país y lada, con México (+52) inicial y modificable. Se validará según el país seleccionado y se almacenará en E.164. No se concatenará la lada sin validar el número. No será criterio de fusión de contactos. Su carácter opcional sigue siendo la propuesta inicial.

Arquitectura modular única: transporte en `src/app/api/v1`, lógica en `src/modules`, persistencia en `src/db`, configuración y seguridad en `src/lib`. No crear módulos vacíos ni introducir Redis, workers o microservicios en la base.

## Esquema inicial en Drizzle

- `brands`: UUID, código único, nombre, estado y fechas.
- `contacts`: UUID, marca, nombre, correo original y normalizado, teléfono opcional y fechas. Único `(brand_id, email_normalized)`.
- `registration_events`: UUID, marca, nombre, slug, estado, WhatsApp y versión del aviso. Único `(brand_id, slug)`.
- `registrations`: UUID, marca, contacto, evento, atribución, landing y fecha. Único `(brand_id, contact_id, event_id)`.
- `contact_consents`: evidencia por marca, contacto, inscripción, finalidad, decisión, versión del aviso/texto y fecha. Historial sin sobrescritura.
- `registration_attempts`: seguimiento técnico sin cuerpos, correos, teléfonos ni tokens.
- `registration_requests`: clave de idempotencia, huella HMAC del contenido, resultado y caducidad propuesta de 24 horas.
- `rate_limit_buckets`: contadores compartidos, atómicos y con vencimiento, sin depender de memoria de una instancia.

UUID, `timestamptz`, claves foráneas e índices adecuados. El esquema está declarado en `src/db/schema.ts`; su SQL revisable está en `drizzle/0000_keen_mandarin.sql`. Claves compuestas `(brand_id, contact_id)` y `(brand_id, event_id)` hacia claves únicas `(brand_id, id)` impiden cruces de marca. Consentimientos apuntan a la combinación marca/inscripción/contacto. La migración aún no está aplicada a Railway. No confiar solo en filtros de aplicación ni usar borrado en cascada indiscriminado.

Normalizar correo recortando extremos y pasando a minúsculas; no eliminar puntos ni sufijos `+`. No sobrescribir perfiles existentes desde un formulario público. Conservar atribución inicial de cada inscripción. Una persona puede tener varias inscripciones, pero solo una por evento y marca.

## Contrato propuesto

`POST /api/v1/registrations`, JSON máximo de 16 KiB, cabecera `Idempotency-Key` UUID. Entrada: `brandCode`, `eventSlug`, `contact` (nombre, correo y teléfono), `attribution` (fuente, medio, campaña, UTMs y landing), `consent` (versión del aviso, aceptación de registro y marketing separado), `antiSpam` (token y honeypot).

Para el teléfono, el contrato definitivo incorporará país ISO y número introducido; el servidor derivará E.164. No confiar en que el cliente ya lo haya normalizado.

Nombre: 2–150 caracteres; correo: hasta 254; códigos: hasta 100; atribución: hasta 200 por campo; landing: hasta 2,048. Orígenes exactos autorizados; eliminar fragmentos y parámetros arbitrarios de la landing. No aceptar WhatsApp ni redirecciones arbitrarias en la solicitud. La atribución pública es declarada por el cliente, no evidencia confiable del origen publicitario.

Éxito HTTP 200 para inscripción nueva o existente, con `ok`, `requestId`, comprobante temporal opaco y un identificador de conversión estable por inscripción. No exponer existencia de contactos ni datos personales.

Errores: 400 solicitud inválida; 403 origen/antispam; 404 marca/evento no disponible; 409 reutilización de clave con otro contenido; 413 tamaño; 415 formato; 422 validación; 429 límite con `Retry-After`; 503 dependencia indisponible. Respuestas sin caché, sin trazas ni detalles SQL.

## Flujo transaccional

Validar tamaño, origen, límites y contenido. Recuperar respuesta idempotente confirmada cuando exista; verificar antispam para operaciones nuevas. En una transacción: verificar marca/evento activos con el bloqueo apropiado, resolver contacto e inscripción mediante restricciones únicas, guardar evidencia y resultado idempotente. Responder éxito solo después del commit.

Excluir el token CAPTCHA de la huella del contenido para poder renovarlo durante reintentos. No exigir reutilizar un token consumido al recuperar una respuesta ya confirmada. La concurrencia debe probarse sobre PostgreSQL real, incluida una desactivación simultánea de evento.

## Controles por implementar

CORS no es autenticación. Turnstile es el candidato a CAPTCHA con validación en servidor de hostname y acción. Rate limiting compartido por IP seudonimizada y evento, y correo mediante HMAC; confiar solo en cabeceras del proxy conocido. Secretos exclusivamente de servidor. No registrar cuerpos ni tokens.

WhatsApp: HTTPS, hostname exacto permitido (inicialmente `chat.whatsapp.com`) y ruta de invitación validada. El clic no acredita ingreso al grupo.

Confirmación: comprobante temporal sin datos personales; identificador estable de conversión, protección contra recargas y deduplicación compatible con el proveedor de analítica. No prometer entrega exactamente una vez a plataformas externas. La analítica no debe bloquear WhatsApp.

Exportación propuesta: comando operativo protegido y rol PostgreSQL de lectura limitado por marca, con auditoría y neutralización de fórmulas CSV. Una descarga web requeriría autenticación y autorización administrativa antes de exponerse.

Privacidad: finalidades de registro y marketing separadas, consentimiento independiente por marca, aviso versionado, retención y procedimiento de derechos/revocación por definir antes de datos reales. El formulario no prueba titularidad del correo.

## Decisiones abiertas antes de operar

Credenciales y configuración de Railway/Vercel, dominios autorizados, cuenta CAPTCHA, aviso de privacidad validado, teléfono obligatorio u opcional, mecanismo definitivo de exportación, límites y retención. No bloquean la aplicación base; sí las capacidades que dependan de ellos.

## Referencias oficiales

- https://nextjs.org/docs/app/getting-started/installation
- https://nextjs.org/docs/app/guides/environment-variables
- https://www.postgresql.org/docs/current/ddl-constraints.html
- https://www.postgresql.org/docs/current/sql-insert.html
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf
- https://orm.drizzle.team/docs/get-started/postgresql-new
- https://orm.drizzle.team/docs/drizzle-kit-generate
