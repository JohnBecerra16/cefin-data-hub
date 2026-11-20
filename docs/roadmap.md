# Roadmap

## Fase 0 — Definición

Directorio vacío inspeccionado. Diagnóstico y modelo propuestos. Flujo landings → Next.js/Vercel → PostgreSQL/Railway → confirmación → WhatsApp aceptado. Inicio de implementación autorizado. Las propuestas abiertas se distinguen de la configuración operativa verificada.

## Fase 1 — Captación V0.1

1. Aplicación base, configuración y verificaciones locales: completada localmente el 13 de noviembre de 2026. Lint sin advertencias, comprobación de tipos, 5 pruebas de configuración y build de producción correctos. Prueba HTTP local: 200, idioma es-MX y cabeceras configuradas. Instalación final: auditoría con 0 vulnerabilidades reportadas. No se ha desplegado ni probado PostgreSQL.
2. Drizzle, esquema y migraciones PostgreSQL: migración inicial revisada y corregida localmente; conexión segura de la futura API mediante red privada de Railway y aplicación a PostgreSQL pendientes de aprobación.
3. Servicio transaccional de registro y deduplicación: pendiente.
4. API, idempotencia, CORS, CAPTCHA y límites: pendiente.
5. Confirmación y medición sin duplicados por recarga: pendiente.
6. Exportación administrativa protegida: pendiente.
7. Pruebas integrales y preparación operativa: pendiente.

## Verificación requerida de V0.1

- Contacto nuevo y existente; otro evento y registro repetido.
- Correo/teléfono inválidos; evento inexistente/inactivo.
- Concurrencia: mismo contacto/evento, varios eventos y desactivación de evento.
- Aislamiento por marca en escrituras, consultas y exportaciones.
- Reintento posterior a pérdida de respuesta; clave reutilizada con otro contenido.
- Fallo de PostgreSQL, rollback y ausencia de falso éxito.
- CAPTCHA inválido, caducado, repetido, hostname/acción incorrectos y proveedor caído.
- CORS/preflight, cuerpo grande, campos desconocidos, abuso y encabezados IP falsificados.
- UTMs conservadas y URLs peligrosas rechazadas.
- Confirmación válida/expirada, recarga, analítica fallida y WhatsApp independiente.
- Exportación autorizada/denegada y fórmulas CSV neutralizadas.
- Logs sin información personal; respaldo y restauración verificados.

## Fases posteriores

Fase 2: formulario reutilizable con selector internacional de lada, landing piloto, reversión y migración gradual; modificación de repositorios externos requiere autorización expresa.

Fase 3: importación histórica de ActiveCampaign y Hotmart.

Fase 4: email marketing. Fase 5: automatizaciones. Fase 6: inteligencia comercial y futura integración con Tráfico OS.

No se ha verificado ni modificado el roadmap crítico de seguridad de CEFIN WEB.

## Seguimiento de herramientas

ESLint 9.39.5 es compatible con los peer dependencies de los plugins que trae eslint-config-next 16.4.6, pero npm advierte que su rama ya no tiene soporte. La rama 10 produjo conflictos de peers en import, React y accesibilidad; no se forzó su uso. Revisar actualización compatible antes de producción. El override de minimatch está documentado en README y mantiene la auditoría sin alertas; no sustituye esta revisión de soporte.

El lanzador global de npm de la computadora inicial apunta a una instalación incompleta. Las verificaciones se ejecutaron con la copia de npm incluida en Node.js, sin modificar archivos globales. El ejecutor tsx requirió salir del sandbox por un error de consulta de usuario de Windows; las 5 pruebas pasaron fuera del sandbox.

## Archivos creados en la tarea 1

```text
C:\Users\John\Desktop\CEFIN\cefin-data-hub\.env.example
C:\Users\John\Desktop\CEFIN\cefin-data-hub\.gitignore
C:\Users\John\Desktop\CEFIN\cefin-data-hub\.nvmrc
C:\Users\John\Desktop\CEFIN\cefin-data-hub\package.json
C:\Users\John\Desktop\CEFIN\cefin-data-hub\package-lock.json
C:\Users\John\Desktop\CEFIN\cefin-data-hub\tsconfig.json
C:\Users\John\Desktop\CEFIN\cefin-data-hub\next.config.ts
C:\Users\John\Desktop\CEFIN\cefin-data-hub\eslint.config.mjs
C:\Users\John\Desktop\CEFIN\cefin-data-hub\postcss.config.mjs
C:\Users\John\Desktop\CEFIN\cefin-data-hub\README.md
C:\Users\John\Desktop\CEFIN\cefin-data-hub\docs\architecture.md
C:\Users\John\Desktop\CEFIN\cefin-data-hub\docs\roadmap.md
C:\Users\John\Desktop\CEFIN\cefin-data-hub\src\app\layout.tsx
C:\Users\John\Desktop\CEFIN\cefin-data-hub\src\app\page.tsx
C:\Users\John\Desktop\CEFIN\cefin-data-hub\src\app\globals.css
C:\Users\John\Desktop\CEFIN\cefin-data-hub\src\lib\config\env-schema.ts
C:\Users\John\Desktop\CEFIN\cefin-data-hub\src\lib\config\server-env.ts
C:\Users\John\Desktop\CEFIN\cefin-data-hub\scripts\check-env.ts
C:\Users\John\Desktop\CEFIN\cefin-data-hub\tests\env.test.ts
```

Next.js generó `C:\Users\John\Desktop\CEFIN\cefin-data-hub\next-env.d.ts`; el build y TypeScript generaron `.next` y `tsconfig.tsbuildinfo`, todos excluidos del control de versiones. Las dependencias locales se encuentran en `node_modules`, también excluido.
