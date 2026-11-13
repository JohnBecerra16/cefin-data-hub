# CEFIN Data Hub

Plataforma propia de captación de CEFIN. Reemplazará progresivamente los formularios de ActiveCampaign sin interrumpir las campañas existentes.

## Estado

Fase 1, tarea 1: aplicación base verificada localmente. La captación, la base de datos, el CAPTCHA, la confirmación y las exportaciones todavía no están implementados. La página inicial no procesa datos personales.

Flujo acordado: **landings → API de Data Hub en Next.js/Vercel → PostgreSQL en Railway → confirmación → WhatsApp**.

## Desarrollo local

Requiere Node.js 22 y npm. Las versiones exactas se conservan en `package-lock.json`.

```powershell
npm ci
npm run dev
```

Abrir http://localhost:3000. No se necesitan credenciales para la página inicial ni para compilarla.

En la computadora inicial, el lanzador habitual de npm tiene una referencia global rota. Se puede usar la instalación incluida con Node sin modificar la configuración global:

```powershell
& 'C:\Program Files\nodejs\node.exe' 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run dev
```

El mismo prefijo sirve para `ci`, `run lint`, `run typecheck`, `test` y `run build`.

## Configuración de servidor

Copiar `.env.example` a `.env.local` y completar con valores propios cuando se prepare PostgreSQL. Nunca subir `.env.local`, URLs de conexión reales ni exportaciones al repositorio.

```powershell
npm run check:env
```

Este comando comprueba formato y presencia, **no conectividad ni permisos**. Requiere `DATABASE_URL` y `ALLOWED_ORIGINS`; no imprime valores. Carga `.env.local`; en Vercel las variables se inyectarán desde la configuración del entorno. En producción debe establecerse `NODE_ENV=production` para exigir HTTPS en los orígenes.

Cuando exista una base de desarrollo de Railway, copiar su URL pública de conexión a `DATABASE_URL` en `.env.local`. Generar una migración revisable con `npm run db:generate`; aplicarla solo después de revisar el SQL con `npm run db:migrate`. La configuración lee `.env.local` para estos comandos. **No ejecutes `db:migrate` contra producción** hasta revisar y aprobar el SQL y configurar una copia de seguridad.

Drizzle mantiene las tablas tipadas en `src/db/schema.ts`, genera migraciones SQL versionables y ofrece consultas TypeScript sobre PostgreSQL. No crea la instancia de Railway: administra el esquema y permite conectarse a la base existente. `src/db/index.ts` crea el pool del lado del servidor solo cuando se solicita; su capacidad local se limita a 3 conexiones.

La configuración se valida de forma diferida a través de `getServerEnv()`, marcado `server-only`. La compilación de la página estática no certifica que exista una base configurada. Los futuros servicios deberán validar antes de operar.

## Verificación

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

`typecheck` genera primero los tipos de rutas de Next.js. Las pruebas actuales solo cubren la configuración. No equivalen a las pruebas de aceptación de captación.

Se fija temporalmente `minimatch` 11.0.1 mediante un override limitado a las versiones 7–11 vulnerables de las herramientas de desarrollo (GHSA-g3hv-75wg-m249). No se reemplazan las ramas antiguas que usan otra API. Revisar y retirar el override cuando las dependencias superiores incorporen la corrección; verificar lint, tipos, pruebas y build después de cambiarlo.

## Infraestructura prevista

- Vercel: aplicación Next.js y API; runtime Node.js 22.
- Railway: PostgreSQL. Vercel necesitará una dirección accesible externamente; un hostname privado de Railway no sirve fuera de su red.
- Pendientes: driver y pooling compatibles con transacciones, TLS verificado, región, permisos mínimos, respaldos y prueba de restauración.
- Entornos de desarrollo, pruebas y producción con bases y secretos independientes.

No hay conexión a cuentas, recursos externos creados ni despliegues efectuados por esta inicialización.

## Documentación

- [Arquitectura y decisiones](docs/architecture.md)
- [Roadmap y criterios de verificación](docs/roadmap.md)
