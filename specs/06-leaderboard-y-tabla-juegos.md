# SPEC 06 — Catálogo de juegos y leaderboard en Supabase

> **Estado:** implementado
> **Depende de:** SPEC 04, SPEC 05
> **Fecha:** 2026-11-14
> **Objetivo:** Mover el catálogo de juegos a una tabla `games` de Supabase y guardar puntuaciones anónimas reales en una tabla `scores` que alimenta el top 10 del salón y del detalle de cada juego.

## Alcance

**Entra:**

- Carpeta `supabase/migrations/` con SQL versionado, aplicado al proyecto en la nube con `apply_migration` del MCP.
- Tabla `games` sembrada con los 8 juegos actuales de `lib/games.ts`, con columna `sort_order`.
- Tabla `scores` vacía: puntuaciones anónimas con iniciales, sin usuario.
- Vista `games_with_stats` con `best` (MAX score) y `plays` (COUNT) calculados de `scores`.
- RLS: lectura pública de `games`, `scores` y la vista. Insert público en `scores` limitado por CHECKs. Sin update ni delete.
- Cliente sin cookies `lib/supabase/public.ts` para lecturas cacheadas.
- Capa de datos `lib/data/games.ts` y `lib/data/scores.ts` con `'use cache'` y `cacheTag`.
- Server Action `saveScore` en `app/juegos/[id]/jugar/actions.ts` que valida, inserta e invalida con `updateTag`.
- Biblioteca, home, detalle, `/jugar` y salón leen de la BD en lugar de `GAMES`.
- Salón y detalle muestran el top 10 real del juego, con estado vacío "SÉ EL PRIMERO".
- Modal FIN DEL JUEGO: GUARDAR PUNTUACIÓN guarda de verdad en juegos con motor, con estados guardando / guardado / error con reintento.
- Estado degradado "SEÑAL PERDIDA · REINTENTA" si falla la lectura de Supabase.
- Regenerar `lib/supabase/database.types.ts`.

**Fuera de alcance (para futuras specs):**

- Autenticación real, perfiles y puntuaciones ligadas a `user_id`.
- Fila "TU MEJOR MARCA" del salón (se elimina; vuelve con auth).
- Anti-trampas o verificación de puntuaciones en servidor.
- Mejor marca por jugador (una fila por nombre).
- Moderación de nombres, borrado o edición de puntuaciones.
- Guardar puntuación en juegos sin motor (siguen con guardado simulado).
- Realtime, paginación del leaderboard y rankings globales.
- Panel de administración del catálogo.
- Fallback local a `lib/games.ts` si la BD no responde.
- Tests automatizados.

## Modelo de datos

Migración `supabase/migrations/<timestamp>_games_and_scores.sql`:

```sql
create table public.games (
  id text primary key,                  -- 'asteroides'
  title text not null,
  short text not null,
  long text not null,
  cat text not null check (cat in ('ARCADE','PUZZLE','SHOOTER','VERSUS')),
  cover text not null,                  -- clase CSS 'cover-asteroides'
  color text not null check (color in ('cyan','magenta','yellow','green')),
  sort_order int not null unique
);

create table public.scores (
  id bigint generated always as identity primary key,
  game_id text not null references public.games(id),
  player_name text not null check (player_name ~ '^[A-Z0-9_]{1,10}$'),
  score int not null check (score between 0 and 10000000),
  created_at timestamptz not null default now()
);
create index scores_game_score_idx on public.scores (game_id, score desc, created_at);

create view public.games_with_stats with (security_invoker = true) as
  select g.*, coalesce(max(s.score), 0) as best, count(s.id) as plays
  from public.games g left join public.scores s on s.game_id = g.id
  group by g.id;
```

RLS: `games` y `scores` con RLS activo. Política `select` para `anon` y `authenticated` en ambas. Política `insert` en `scores` para `anon` con `with check (true)` (los CHECK de columna hacen la validación). Sin políticas de update/delete. Seed: `insert into games` con los 8 juegos y `sort_order` 1..8 en el orden actual.

Tipos en `lib/games.ts` (se quedan los tipos y `CATS`; se borran `GAMES`, `PLAYERS`, `seededScores` y `getGame`):

```ts
export interface Game {
  id: string; title: string; short: string; long: string;
  cat: GameCategory; cover: string; color: NeonColor;
  best: number;   // antes number mock
  plays: number;  // antes string "12.4K"; se formatea al pintar
}
export interface ScoreRow {
  rank: number; name: string; score: number;
  date: string; // "DD/MM/YYYY" desde created_at
}
```

Archivos nuevos:

```ts
// lib/supabase/public.ts  (import "server-only")
export function createPublicClient(): SupabaseClient<Database>; // sin cookies, persistSession: false

// lib/data/games.ts
export async function getGames(): Promise<Game[]>;              // 'use cache', cacheTag('games'), order sort_order
export async function getGame(id: string): Promise<Game | null>; // 'use cache', cacheTag('games')

// lib/data/scores.ts
export async function getTopScores(gameId: string, limit = 10): Promise<ScoreRow[]>;
// 'use cache', cacheTag(`scores:${gameId}`), order score desc, created_at asc

// app/juegos/[id]/jugar/actions.ts  ("use server")
export async function saveScore(input: { gameId: string; name: string; score: number }):
  Promise<{ ok: true } | { ok: false; error: string }>;
```

Convenciones:

- `saveScore` rechaza si `ENGINES[gameId]` no existe, si el nombre no cumple `^[A-Z0-9_]{1,10}$` o si el score no es entero en 0..10.000.000. Inserta con el cliente de `lib/supabase/server.ts`.
- Tras insertar, `updateTag('scores:<gameId>')` y `updateTag('games')` (best/plays cambian).
- `plays` se formatea al pintar: `< 1000` tal cual, si no `12.4K`.
- Fecha de `ScoreRow` en zona `Europe/Madrid`, formato `DD/MM/YYYY`.
- Ningún componente importa `@supabase/*`; solo `lib/supabase/` y `lib/data/`.

## Plan de implementación

1. Leer en `node_modules/next/dist/docs/` las guías de `use cache`, `cacheTag`, `updateTag`, Server Actions y `generateStaticParams` con Cache Components, como exige `AGENTS.md`.
2. Crear `supabase/migrations/<timestamp>_games_and_scores.sql` (tablas, índice, vista, RLS, seed de juegos) y aplicarla con `apply_migration`. Verificar con `list_tables` y `get_advisors` (sin avisos de seguridad).
3. Regenerar `lib/supabase/database.types.ts` con `generate_typescript_types`. Verificar: `npm run build` compila.
4. Crear `lib/supabase/public.ts` y `lib/data/games.ts`. Cambiar el tipo `Game` (`plays: number`) y el helper de formato.
5. Migrar lecturas del catálogo: `app/page.tsx`/`home-page.tsx`, `app/biblioteca/page.tsx`/`library.tsx`, `app/juegos/[id]/page.tsx` (incluido `generateStaticParams` y `generateMetadata`) y `app/juegos/[id]/jugar/page.tsx` usan `getGames`/`getGame`; los componentes cliente reciben `games` por props. Borrar `GAMES` y `getGame` de `lib/games.ts`. Verificar: la biblioteca muestra los 8 juegos en el mismo orden.
6. Crear `lib/data/scores.ts`. Detalle `/juegos/[id]` pinta el top 10 real con estado vacío "SÉ EL PRIMERO".
7. Salón: `app/salon/page.tsx` carga juegos (server) y `HallOfFame` recibe juegos y el top de la pestaña activa (pestaña en `?juego=<id>` o top precargado por juego; se decide al leer la guía en el paso 1, sin cambiar la UI). Podio con huecos "---" si hay menos de 3 filas. Eliminar la fila "TU MEJOR MARCA". Borrar `seededScores` y `PLAYERS`.
8. Estado degradado: `error.tsx` en las rutas que leen de la BD (o boundary por sección) con "SEÑAL PERDIDA · REINTENTA" y botón que llama a `reset`.
9. Crear `app/juegos/[id]/jugar/actions.ts` con `saveScore` y conectar el modal de `components/game-player.tsx`: botón deshabilitado con iniciales vacías o inválidas, estado GUARDANDO…, toast ▸ PUNTUACIÓN GUARDADA_, mensaje de error con reintento. En juegos sin motor el guardado sigue simulado. Verificar: jugar ASTEROIDES, guardar, y ver la fila en el salón y en el detalle.
10. Actualizar `CLAUDE.md` (Architecture) con `supabase/migrations/`, `lib/data/` y `lib/supabase/public.ts`. Verificar `npm run lint` y `npm run build`.

## Criterios de aceptación

- [x] `npm run build` y `npm run lint` terminan sin errores.
- [x] `supabase/migrations/` contiene la migración y está aplicada en el proyecto (visible en `list_migrations`).
- [x] `get_advisors` de seguridad no reporta tablas sin RLS ni la vista como `security definer`.
- [x] `lib/games.ts` ya no exporta `GAMES`, `seededScores` ni `getGame`. `grep seededScores` no devuelve resultados.
- [x] La biblioteca y la home muestran los 8 juegos en el mismo orden que antes, leídos de `games`.
- [x] Cambiar el `title` de un juego en Supabase y revalidar el tag `games` cambia el título en la biblioteca.
- [x] `/juegos/no-existe` da 404.
- [x] Con `scores` vacía, el salón y el detalle muestran "SÉ EL PRIMERO" y el récord de cada juego es 0.
- [x] Al terminar ASTEROIDES y guardar con iniciales `TEST_01`, aparece ▸ PUNTUACIÓN GUARDADA_ y la fila sale en el salón y en `/juegos/asteroides` sin reiniciar el servidor.
- [x] Tras guardar, el récord y las partidas de ASTEROIDES en la tarjeta y el detalle reflejan la nueva fila.
- [x] El top 10 está ordenado por puntuación descendente y, a igualdad, por fecha más antigua primero. Muestra como máximo 10 filas.
- [x] Con iniciales vacías el botón GUARDAR PUNTUACIÓN está deshabilitado.
- [x] `saveScore` con nombre `"ab c"`, score `-1`, score `1.5` o `gameId` `caida` devuelve `{ ok: false }` y no inserta nada.
- [x] Un insert directo con la publishable key y `player_name = 'hola'` es rechazado por el CHECK.
- [x] Un update o delete en `scores` con la publishable key no afecta a ninguna fila.
- [x] En un juego mock (p. ej. CAÍDA) GUARDAR PUNTUACIÓN sigue simulado y no crea filas en `scores`.
- [x] Si falla el insert, el modal muestra un error y permite reintentar sin perder la puntuación.
- [x] Con una URL de Supabase inválida, biblioteca, detalle y salón muestran "SEÑAL PERDIDA · REINTENTA" en lugar de romper la página.
- [x] La fila "TU MEJOR MARCA" ya no aparece en el salón.
- [x] Ningún archivo fuera de `lib/supabase/` y `lib/data/` importa `@supabase/*`.
- [x] La consola no muestra errores de hidratación en `/`, `/biblioteca`, `/salon` ni `/juegos/asteroides`.

## Decisiones

- **Sí:** tabla `games` como fuente única del catálogo. Decisión del usuario; además es la FK de `scores`.
- **No:** `games` solo como FK con la UI leyendo `lib/games.ts`. Dos fuentes de verdad.
- **No:** fallback a `lib/games.ts` si la BD falla. Mismo motivo; se muestra estado degradado.
- **Sí:** puntuaciones anónimas con iniciales. No hay auth; la auth va en su propia spec.
- **No:** auth en esta spec. La duplicaría en tamaño.
- **Sí:** Server Action + RLS de insert con CHECKs en columnas. Validación en servidor y en BD.
- **No:** RPC `security definer`. Más SQL que mantener para el mismo resultado sin auth.
- **No:** insert desde el navegador. Más fácil de manipular y salta la validación de `ENGINES`.
- **Sí:** top 10 por juego con todas las entradas. Un nombre puede repetirse.
- **No:** mejor marca por jugador. Requiere `DISTINCT ON` o vista; se deja para otra spec.
- **Sí:** `best` y `plays` calculados en la vista `games_with_stats`. Datos reales, sin columnas que desincronizar.
- **No:** copiar los valores mock como columnas. No reflejarían partidas reales.
- **Sí:** `scores` vacía y estado "SÉ EL PRIMERO". Todo lo visible es real.
- **No:** sembrar filas demo. Ensuciarían el leaderboard real.
- **Sí:** `supabase/migrations/` en el repo y aplicación vía MCP. Versionado sin Docker ni CLI local (cierra la decisión aplazada en SPEC 04).
- **Sí:** `'use cache'` + `cacheTag` + `updateTag` tras guardar. Páginas rápidas y frescas tras cada guardado.
- **No:** lecturas dinámicas por petición. Más lentas sin beneficio.
- **Sí:** cliente sin cookies `lib/supabase/public.ts`. `'use cache'` no admite `cookies()`.
- **Sí:** solo juegos con motor guardan puntuación. Evita llenar el leaderboard con puntuaciones simuladas.
- **Sí:** nombre `^[A-Z0-9_]{1,10}$` y score 0..10.000.000. Encaja con el input actual (mayúsculas, 10 caracteres).
- **Sí:** columna `sort_order`. Conserva el orden actual.
- **No:** orden alfabético. Cambiaría la biblioteca.
- **Sí:** eliminar la fila "TU MEJOR MARCA". Sin auth no se sabe quién es el usuario.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `'use cache'` con un cliente que lee cookies falla en build | Lecturas solo con `lib/supabase/public.ts`. El cliente con cookies se usa solo en la Server Action. |
| `generateStaticParams` consulta la BD en build y falla sin variables | Usa `getGames()`; si falla, el build lo reporta. Variables documentadas en `.env.template`. |
| Cualquiera con la publishable key inserta puntuaciones falsas | Aceptado: sin anti-trampas en esta spec. Los CHECK limitan forma y rango. Se documenta para la spec de auth. |
| Nombres ofensivos en el leaderboard | Regex limita a `A-Z0-9_`. Moderación fuera de alcance. |
| La vista expone datos con permisos del creador | `security_invoker = true` y comprobación con `get_advisors`. |
| Caché obsoleta tras guardar | `updateTag` de `scores:<id>` y `games` en la Server Action; criterio de aceptación lo verifica. |
| `plays` cambia de string a number y rompe tarjetas | Helper de formato único; revisar tarjeta y detalle en el paso 5. |

## Qué **no** entra en esta spec

- Autenticación, perfiles y "TU MEJOR MARCA".
- Anti-trampas y moderación.
- Mejor marca por jugador, paginación y Realtime.
- Guardado real en juegos sin motor.
- Panel de administración y tests.

Cada uno, si llega, va en su propia spec.
