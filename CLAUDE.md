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
- Supabase vive solo en `lib/supabase/` (`env.ts`, `client.ts` para el navegador, `server.ts` con `server-only` y creado por petición, `database.types.ts` generado). Requiere `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ver `.env.template`). `GET /api/salud` comprueba la conexión.
- `app/layout.tsx` types its props with the globally generated `LayoutProps<"/">` helper (from `.next/types`), not a hand-written interface. It also loads the Geist fonts via `next/font/google`.
