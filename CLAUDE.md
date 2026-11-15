# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arcade Vault: an online platform for playing games and competing for the highest score. The README says the project follows Spec Driven Design (`/spec` and `/spec-impl` workflows, skills from `Klerith/fernando-skills`, installed with `npx skills@latest add Klerith/fernando-skills`). No `spec/` directory exists yet, and the app is still the Create Next App scaffold.

## Commands

- `npm run dev`: start the dev server
- `npm run build`: production build
- `npm run start`: serve the production build
- `npm run lint`: ESLint (flat config in `eslint.config.mjs`)

No test runner is configured.

## skills

Usa siempre /frontend-design para hacer interfaz de usuairo

## Next.js version warning

`package.json` pins Next 16.4.5 with React 19.3, which has breaking changes from older Next.js. `AGENTS.md` requires reading the relevant guide in `node_modules/next/dist/docs/` (`01-app`, `02-pages`, `03-architecture`, `04-community`) before writing Next.js code, and heeding deprecation notices. Don't rely on memory of older APIs.

## Architecture

- App Router only (`app/`). The path alias `@/*` maps to the repo root.
- `next.config.ts` enables `cacheComponents` and `partialPrefetching`, plus `experimental.agentFeedback`. With `cacheComponents` on, data fetching and caching follow the Cache Components model, so check the docs before using dynamic APIs or fetching in server components.
- Tailwind CSS v4 is wired through Turbopack: a `*.css` rule in `next.config.ts` uses `@tailwindcss/turbopack`. There is no `tailwind.config` file, and styles live in `app/globals.css`.
- Supabase vive solo en `lib/supabase/` y `lib/data/`: ningún otro archivo importa `@supabase/*`. En `lib/supabase/`: `env.ts`, `client.ts` para el navegador, `server.ts` con `server-only` y creado por petición (con cookies; lo usa la Server Action), `public.ts` (`createPublicClient`, sin cookies, para lecturas dentro de `'use cache'`) y `database.types.ts` generado. Requiere `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ver `.env.template`). `GET /api/salud` comprueba la conexión.
- `app/layout.tsx` types its props with the globally generated `LayoutProps<"/">` helper (from `.next/types`), not a hand-written interface. It also loads the Geist fonts via `next/font/google`.
- Esquema versionado en `supabase/migrations/` (SQL aplicado al proyecto en la nube con `apply_migration` del MCP; el nombre del archivo lleva la versión que asigna Supabase). Tablas `games` (catálogo, `sort_order`) y `scores` (puntuaciones anónimas con iniciales), y vista `games_with_stats` (`best`, `plays`). RLS: lectura pública, insert público en `scores` limitado por CHECKs, sin update ni delete. Tras cambiar el esquema, regenera `lib/supabase/database.types.ts`.
- Capa de datos en `lib/data/` (`games.ts`, `scores.ts`): funciones con `'use cache'` y `cacheTag` (`games`, `scores:<gameId>`). El catálogo sale de la BD, no de `lib/games.ts` (solo tipos, `CATS` y `formatPlays`). `saveScore` (`app/juegos/[id]/jugar/actions.ts`) valida, inserta e invalida con `updateTag`; solo guardan los juegos con motor en `lib/engines`.
- `app/error.tsx` es el boundary raíz ("SEÑAL PERDIDA · REINTENTA", botón con `retry()`). En desarrollo, `getGameStaticParams()` devuelve un id de relleno si la BD falla; en producción el build falla.
