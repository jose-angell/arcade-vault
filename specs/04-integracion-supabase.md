# SPEC 04 — Integración base con Supabase

> **Estado:** aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-11-12
> **Objetivo:** Conectar la app Next.js con el proyecto Supabase en la nube mediante clientes tipados de servidor y navegador, listos para que las próximas specs los usen.

## Alcance

**Entra:**

- Dependencias `@supabase/supabase-js` y `@supabase/ssr`.
- Variables de entorno públicas `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, documentadas en `.env.template`.
- Lectura validada de esas variables en un único módulo, con un error claro si faltan.
- Cliente de navegador (`createBrowserClient`) y cliente de servidor (`createServerClient` con `cookies()` de `next/headers`).
- Tipos `Database` generados del proyecto en `lib/supabase/database.types.ts` y usados como genérico en ambos clientes.
- Endpoint de salud `GET /api/salud` que comprueba que URL y clave responden.

**Fuera de alcance (para futuras specs):**

- Autenticación real y sustitución de `components/session-provider.tsx`.
- `proxy.ts` para refrescar la sesión (llega con la spec de auth).
- Tablas, políticas RLS, puntuaciones y leaderboards reales.
- Supabase CLI local, Docker y carpeta `supabase/migrations/`.
- Clave secreta / `service_role` y clientes de administración.
- Storage, Realtime y Edge Functions.
- Cambios visuales en cualquier página.
- Tests automatizados.

## Modelo de datos

No hay tablas nuevas. El esquema `public` está vacío y `database.types.ts` se genera tal cual. Se regenera en cada spec que cambie el esquema.

Variables de entorno (en `.env`, nunca con valores reales en el repo):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

`SUPABASE_DB_PASSWORD` ya existe en `.env.template` y no se usa en código.

Archivos nuevos:

```ts
// lib/supabase/env.ts
export const SUPABASE_URL: string; // lanza Error si falta
export const SUPABASE_PUBLISHABLE_KEY: string; // lanza Error si falta

// lib/supabase/client.ts  ("use client" no necesario, solo se importa desde cliente)
export function createClient(): SupabaseClient<Database>;

// lib/supabase/server.ts  (import "server-only")
export async function createClient(): Promise<SupabaseClient<Database>>;

// app/api/salud/route.ts
// GET → 200 { supabase: "ok" } | 503 { supabase: "error" }
```

Convenciones:

- Todo lo de Supabase vive en `lib/supabase/`. Ningún componente importa `@supabase/*` directamente.
- El cliente de servidor se crea por petición, nunca como singleton de módulo.
- En `setAll` de cookies del cliente de servidor se ignora el error al llamarlo desde un Server Component (patrón oficial de `@supabase/ssr`).
- `/api/salud` llama a `${SUPABASE_URL}/auth/v1/health` con la cabecera `apikey` y no devuelve detalles del error, solo los registra con `console.error`.

## Plan de implementación

1. Instalar `@supabase/supabase-js`, `@supabase/ssr` y `server-only`. Añadir las dos variables a `.env.template` con un comentario sobre dónde obtenerlas (Dashboard → Project Settings → API). Verificar: `npm run build` compila.
2. Generar los tipos del proyecto remoto en `lib/supabase/database.types.ts`.
3. Crear `lib/supabase/env.ts` con la lectura validada de las variables.
4. Crear `lib/supabase/client.ts` con `createBrowserClient<Database>`.
5. Crear `lib/supabase/server.ts` con `createServerClient<Database>` y `await cookies()`.
6. Crear `app/api/salud/route.ts` con el chequeo de salud. Verificar en dev: `GET /api/salud` devuelve `{ "supabase": "ok" }`.
7. Actualizar `CLAUDE.md` (sección Architecture) con una línea sobre `lib/supabase/` y las variables. Verificar `npm run lint` y `npm run build`.

Antes de los pasos 5 y 6 se leen las guías de `node_modules/next/dist/docs/` sobre `cookies()`, Route Handlers y Cache Components, como exige `AGENTS.md`.

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `package.json` incluye `@supabase/supabase-js` y `@supabase/ssr`.
- [ ] `.env.template` documenta `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` sin valores reales.
- [ ] Con las variables configuradas, `GET /api/salud` responde 200 con `{ "supabase": "ok" }`.
- [ ] Con una clave inválida, `GET /api/salud` responde 503 con `{ "supabase": "error" }` y la consola del servidor registra el motivo.
- [ ] Sin `NEXT_PUBLIC_SUPABASE_URL`, el error indica el nombre de la variable que falta.
- [ ] `lib/supabase/server.ts` no puede importarse desde un componente cliente (falla el build por `server-only`).
- [ ] Ambos clientes están tipados con `Database` de `lib/supabase/database.types.ts`.
- [ ] Ninguna página existente cambia de aspecto ni de comportamiento.
- [ ] `SUPABASE_DB_PASSWORD` no aparece en el bundle cliente ni en el repo.

## Decisiones

- **Sí:** solo integración base. El usuario quiere la conexión lista y dejar auth y datos para specs propias.
- **Sí:** proyecto Supabase en la nube. Ya existe, con contraseña en `.env` y MCP conectado. Sin Docker.
- **No:** Supabase CLI local y `supabase/migrations/`. Se decide en la primera spec que cree tablas.
- **Sí:** `@supabase/ssr`. Es el paquete oficial para App Router y gestiona cookies en servidor y navegador.
- **No:** solo `@supabase/supabase-js`. No sirve para sesiones con cookies cuando llegue la auth.
- **Sí:** publishable key (`sb_publishable_…`). Es el formato actual. La anon key JWT es legacy.
- **No:** `service_role` / clave secreta. Ninguna funcionalidad de esta spec la necesita.
- **Sí:** tipos generados en `lib/supabase/database.types.ts`. Las próximas specs obtienen tipado al regenerar.
- **No:** `proxy.ts` ahora. Solo sirve para refrescar sesiones y aún no hay auth.
- **Sí:** endpoint `GET /api/salud`. Da una verificación real de URL y clave sin necesitar tablas.
- **No:** página temporal de prueba. Habría que borrarla después.
- **Nota:** definición rápida. El usuario pidió no detallar más; las decisiones de entorno, claves y tipos se tomaron por defecto con la opción recomendada.

## Riesgos

| Riesgo                                                        | Mitigación                                                                                                                        |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `cookies()` es una API dinámica y choca con `cacheComponents` | Solo se usa en `server.ts`. Las páginas que lo usen en futuras specs lo envuelven en `<Suspense>`. Leer la guía antes del paso 5. |
| Variables ausentes en producción                              | `env.ts` lanza un error con el nombre de la variable y `/api/salud` devuelve 503.                                                 |
| Importar el cliente de servidor desde un componente cliente   | `import "server-only"` hace fallar el build.                                                                                      |
| Tipos desactualizados tras cambios de esquema                 | Cada spec que toque el esquema incluye regenerar `database.types.ts`.                                                             |

## Qué **no** entra en esta spec

- Autenticación real y `proxy.ts`.
- Tablas, RLS y puntuaciones.
- CLI local y migraciones en repo.
- Clave secreta, Storage, Realtime y Edge Functions.
- Tests.

Cada uno, si llega, va en su propia spec.
