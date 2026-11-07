# SPEC 01 — MVP visual: pantallas de Arcade Vault

> **Estado:** aprobado
> **Depende de:** —
> **Fecha:** 2026-11-06
> **Objetivo:** Portar a Next.js App Router las cinco pantallas de `resources/templates/` (biblioteca, detalle, reproductor, acceso y salón de la fama) con datos mock y sin ningún juego real.

## Alcance

**Entra:**

- Navbar con menú móvil y footer, compartidos en `app/layout.tsx`.
- Biblioteca en `/`: hero, buscador por nombre, chips de categoría, grid de tarjetas con efecto tilt y estado "NO HAY RESULTADOS".
- Detalle en `/juegos/[id]`: portada, tags, descripción, stats, botones JUGAR AHORA / VOLVER y leaderboard mock de 10 filas.
- Reproductor en `/juegos/[id]/jugar`: HUD (jugador, puntuación, vidas, nivel), arena CRT decorativa animada, puntuación simulada que sube sola, PAUSA/REANUDAR, FIN, SALIR y modal de fin de juego.
- Acceso en `/acceso`: pestañas INICIAR SESIÓN / CREAR CUENTA, login falso sin validación, JUGAR COMO INVITADO y botones sociales decorativos.
- Salón de la fama en `/salon`: pestañas por juego, podio top 3, tabla de 12 filas y fila "TU MEJOR MARCA" si hay usuario.
- Sesión simulada en memoria compartida entre rutas mediante un Context cliente.
- Página 404 retro para ids de juego inexistentes.

**Fuera de alcance (para futuras specs):**

- Cualquier juego jugable o lógica de juego real.
- Autenticación real, OAuth de Google/GitHub y validación de formularios.
- Persistencia (localStorage, base de datos o API). Recargar la página pierde la sesión.
- Guardar puntuaciones reales o mostrarlas en los rankings.
- Contador de créditos funcional (se muestra fijo "CRÉDITOS · 03").
- Tests automatizados.

## Modelo de datos

Todo vive en `lib/games.ts` como datos estáticos tipados, portados de `resources/templates/data.jsx`.

```ts
type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
type NeonColor = "cyan" | "magenta" | "yellow" | "green";

interface Game {
  id: string;          // "bloque-buster"
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;       // clase CSS: "cover-bricks"
  color: NeonColor;
  best: number;
  plays: string;       // "12.4K"
}

interface ScoreRow { rank: number; name: string; score: number; date: string } // date "DD/MM/2026"

interface SessionUser { name: string } // mayúsculas, máx. 10 caracteres

export const GAMES: Game[];               // los 8 juegos de la plantilla
export const CATS: ("TODOS" | GameCategory)[];
export function getGame(id: string): Game | undefined;
export function seededScores(seed: number, count?: number): ScoreRow[]; // determinista
```

Convenciones:

- Los números se formatean con `toLocaleString("es-ES")`.
- Semillas idénticas a la plantilla: detalle `id.length * 17 + 3` (10 filas), salón `id.length * 23 + 7` (12 filas).
- La sesión vive en `components/session-provider.tsx` (`"use client"`): `{ user: SessionUser | null, signIn(user), signOut() }`. No se escribe nada en `localStorage`.

## Plan de implementación

1. Crear `lib/games.ts` con tipos, `GAMES`, `CATS`, `getGame` y `seededScores`. Verificar: `npm run build` compila.
2. Crear `components/session-provider.tsx` (Context + hook `useSession`) y envolver `{children}` en `app/layout.tsx`.
3. Crear `components/nav.tsx` (cliente: `usePathname` para el link activo, panel móvil, botón de usuario que cierra sesión) y añadir nav, `<main className="av-main">` y footer al layout.
4. Crear `components/game-card.tsx` (cliente, tilt con `useRef`) y `components/library.tsx` (búsqueda + chips). Reemplazar `app/page.tsx` por la biblioteca.
5. Crear `app/juegos/[id]/page.tsx` (server component, `params` como Promise, `generateStaticParams` desde `GAMES`, `notFound()` si el id no existe) con su leaderboard.
6. Crear `app/not-found.tsx` con estética neon y enlace "VOLVER AL VAULT".
7. Crear `components/game-player.tsx` (cliente: intervalo de puntuación, nivel, pausa, modal de fin con feedback "▸ PUNTUACIÓN GUARDADA_") y `app/juegos/[id]/jugar/page.tsx`.
8. Crear `components/auth-form.tsx` (cliente: pestañas, `signIn` y `router.push("/")`) y `app/acceso/page.tsx`.
9. Crear `components/hall-of-fame.tsx` (cliente: pestañas, podio, tabla, fila del usuario) y `app/salon/page.tsx`.
10. Sustituir los `style={{}}` inline de la plantilla por clases existentes o utilidades Tailwind. Ajustar `metadata` por página. Verificar `npm run lint` sin errores.

Antes de escribir cada ruta se leen las guías de `node_modules/next/dist/docs/` relevantes (rutas dinámicas, `generateStaticParams`, `not-found`, Cache Components), como exige `AGENTS.md`.

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `/` muestra los 8 juegos. Escribir "ser" deja solo SERPENTINA.
- [ ] El chip PUZZLE deja solo CAÍDA. Una búsqueda sin coincidencias muestra "NO HAY RESULTADOS".
- [ ] Pulsar una tarjeta navega a `/juegos/<id>` y muestra el título, la descripción larga y 10 filas de leaderboard.
- [ ] `/juegos/no-existe` muestra la página 404 retro con enlace a `/`.
- [ ] "JUGAR AHORA" navega a `/juegos/<id>/jugar` y la puntuación del HUD sube sola.
- [ ] PAUSA detiene la puntuación y muestra "EN PAUSA". REANUDAR la reanuda.
- [ ] FIN abre el modal con la puntuación final. GUARDAR PUNTUACIÓN muestra "▸ PUNTUACIÓN GUARDADA_". JUGAR DE NUEVO reinicia a 0.
- [ ] Entrar en `/acceso` con usuario "kai" redirige a `/` y la navbar muestra "KAI ▾".
- [ ] Con sesión iniciada, el HUD del reproductor muestra el nombre y `/salon` muestra la fila "TU MEJOR MARCA".
- [ ] Pulsar "KAI ▾" cierra la sesión y la navbar vuelve a "Iniciar Sesión".
- [ ] `/salon` muestra podio de 3 y tabla de 12 filas, y cambia los datos al pulsar otra pestaña de juego.
- [ ] El link activo de la navbar se resalta en `/`, `/juegos/*` (Biblioteca) y `/salon`.
- [ ] Con ancho ≤ 840px la navbar muestra el botón ≡ y abre el panel lateral.
- [ ] Recargar la página pierde la sesión (no se usa `localStorage`).

## Decisiones

- **Sí:** rutas reales del App Router (`/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/acceso`, `/salon`). Enlaces compartibles y botón atrás funcional.
- **No:** SPA con estado en el hash como `app.jsx`. Ignora el router de Next.
- **Sí:** mantener la simulación de la plantilla en el reproductor. Permite ver todos los estados visuales (jugando, pausa, fin).
- **No:** placeholder estático en el CRT. Deja estados sin poder revisar.
- **Sí:** sesión solo en memoria con un Context cliente en el layout. El usuario pidió cero persistencia.
- **No:** `localStorage` (`av_user`, `av_scores`). Se pospone a la spec de autenticación/persistencia.
- **Sí:** GUARDAR PUNTUACIÓN solo da feedback visual. Los rankings siguen siendo mock.
- **Sí:** reutilizar las clases de `app/globals.css`, ya portadas de `styles.css`. Tailwind solo para ajustes puntuales.
- **No:** migrar todo a Tailwind. Más trabajo con el mismo resultado visual.
- **Sí:** `notFound()` + `app/not-found.tsx` retro para ids inexistentes.
- **No:** redirección silenciosa a `/`.
- **Sí:** componentes en `components/` y datos en `lib/` en la raíz, importados con `@/*`.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `cacheComponents` exige que las rutas dinámicas no lean datos dinámicos fuera de `<Suspense>` | `generateStaticParams` desde `GAMES` y datos estáticos. Consultar la guía de Cache Components antes del paso 5. |
| APIs de Next 16 distintas de versiones anteriores (`params` como Promise) | Leer `node_modules/next/dist/docs/` antes de cada ruta. |
| Hydration mismatch por `toLocaleString` o valores aleatorios | `seededScores` es determinista. La puntuación aleatoria solo cambia dentro de `useEffect`. |
| La fila "TU MEJOR MARCA" usa un rango y una puntuación inventados | Se acepta en el MVP y se documenta como mock. |

## Qué **no** entra en esta spec

- Juegos jugables.
- Autenticación real y OAuth.
- Persistencia de sesión o de puntuaciones.
- Rankings reales.
- Créditos funcionales.
- Tests.

Cada uno, si llega, va en su propia spec.
