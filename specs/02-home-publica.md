# SPEC 02 — Home pública de Arcade Vault

> **Estado:** aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-11-08
> **Objetivo:** Convertir `/` en una home pública portada de `resources/templates/home-about/home.jsx`, visible con o sin sesión, y mover la biblioteca a `/biblioteca`.

## Alcance

**Entra:**

- Home en `/` con todas las secciones de la plantilla: hero con siluetas flotantes, "¿POR QUÉ ARCADE VAULT?", "JUEGOS DISPONIBLES AHORA", stats, "ACTIVIDAD EN VIVO", precios + FAQ y CTA final.
- Biblioteca movida de `/` a `/biblioteca` sin cambios funcionales.
- Navbar con links "Inicio" (`/`) y "Biblioteca" (`/biblioteca`, activo también en `/juegos/*`), en escritorio y panel móvil.
- CTAs según sesión: sin sesión "CREAR CUENTA" y "EMPEZAR GRATIS" llevan a `/acceso`; con sesión se sustituyen por "SEGUIR JUGANDO" hacia `/biblioteca`.
- Animación `.reveal` por scroll (IntersectionObserver) que respeta `prefers-reduced-motion`.
- Textos ajustados a datos reales: cifra de juegos desde `GAMES.length` y nombres de nuestros juegos en lugar de marcas reales.
- Enlaces existentes que significan "volver a la biblioteca" apuntan a `/biblioteca`.

**Fuera de alcance (para futuras specs):**

- Página About / "Acerca de" (ni ruta ni link en la navbar).
- Actividad en vivo real (puntuaciones y top desde datos reales).
- Saludo personalizado con el nombre del usuario en el hero.
- Cambios en biblioteca, detalle, reproductor, acceso o salón más allá de rutas y enlaces.
- Persistencia, autenticación real y tests automatizados (siguen como en SPEC 01).

## Modelo de datos

Nuevo `lib/home.ts` con datos estáticos tipados, copiados de la plantilla:

```ts
import type { NeonColor } from "@/lib/games";

interface Feature { icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET"; title: string; desc: string; color: NeonColor }
interface RecentScore { player: string; game: string; score: number; ago: string; color: NeonColor } // ago: "hace 2 min"
interface TopPlayer { rank: number; player: string; score: number }
interface FaqItem { q: string; a: string }

export const FEATURES: Feature[];          // 4 tarjetas
export const RECENT_SCORES: RecentScore[]; // 7 filas de la plantilla
export const TOP_TODAY: TopPlayer[];       // 5 filas de la plantilla
export const FAQ: FaqItem[];               // 3 preguntas
```

Convenciones:

- Reutiliza `GAMES` y `NeonColor` de `lib/games.ts` (SPEC 01). El rail muestra `GAMES.slice(0, 6)`.
- La stat de juegos se calcula como `` `${GAMES.length}` `` + "JUEGOS".
- Números con `toLocaleString("es-ES")`, como en SPEC 01.
- La feature "JUEGOS CLÁSICOS" menciona Bloque Buster, Caída y Serpentina.

## Plan de implementación

1. Mover la biblioteca: crear `app/biblioteca/page.tsx` que renderiza `<Library />` con `metadata` "Biblioteca". `/` sigue mostrando la biblioteca temporalmente. Verificar: `/biblioteca` funciona.
2. Actualizar enlaces de "volver a la biblioteca" a `/biblioteca`: `app/juegos/[id]/page.tsx`, `components/hall-of-fame.tsx`, `components/game-player.tsx`, y `router.push("/biblioteca")` en `components/auth-form.tsx`. `app/not-found.tsx` sigue en `/`.
3. Navbar (`components/nav.tsx`): añadir "Inicio" (activo solo en `pathname === "/"`) y cambiar "Biblioteca" a `/biblioteca` (activo en `/biblioteca` y `/juegos/*`), en escritorio y panel móvil.
4. Portar a `app/globals.css` las clases de la home desde `resources/templates/home-about/styles.css` (`home-*`, `silo`, `feature-*`, `mini-*`, `stat-*`, `activity-*`, `tick-*`, `top-*`, `price-*`/`pc-*`, `faq-*`, `final-*`, `reveal`), sin duplicar las que ya existen. Añadir bloque `@media (prefers-reduced-motion: reduce)` que deja `.reveal` visible y detiene siluetas y `pulse`.
5. Crear `lib/home.ts` con `FEATURES`, `RECENT_SCORES`, `TOP_TODAY` y `FAQ`.
6. Crear componentes server: `components/home/floating-silhouettes.tsx` y `components/home/feature-icon.tsx` (SVG pixel de la plantilla).
7. Crear `components/home/reveal.tsx` (cliente): hook/efecto con IntersectionObserver que añade `.in` a `.reveal`.
8. Crear `components/home/session-ctas.tsx` (cliente, `useSession`): variantes `hero` y `pricing` que muestran "CREAR CUENTA"/"EMPEZAR GRATIS" → `/acceso` sin sesión, o "SEGUIR JUGANDO" → `/biblioteca` con sesión.
9. Crear `components/home/home-page.tsx` con las 7 secciones usando `<Link>` (mini-cards → `/juegos/<id>`, "VER SALÓN →" → `/salon`, EXPLORAR/VER TODOS/INSERTAR MONEDA → `/biblioteca`). Reemplazar `app/page.tsx` por la home con `metadata` "Inicio".
10. Sustituir `style={{}}` inline por clases o utilidades Tailwind (salvo `transitionDelay`/`width` dinámicos). Verificar `npm run lint` y `npm run build`.

Antes de los pasos 1 y 9 se leen las guías relevantes de `node_modules/next/dist/docs/` (rutas, `metadata`, Cache Components), como exige `AGENTS.md`.

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `/` muestra el hero "EL ARCADE CLÁSICO ESTÁ DE VUELTA" y las secciones // 01 a // 04 más el CTA final.
- [ ] `/biblioteca` muestra los 8 juegos con buscador y chips como antes en `/`.
- [ ] El rail de la home muestra 6 mini-cards. Pulsar una navega a `/juegos/<id>`.
- [ ] La stat de juegos muestra "8" y ningún texto de la home menciona Arkanoid, Tetris ni Snake.
- [ ] "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" navegan a `/biblioteca`.
- [ ] "VER SALÓN →" navega a `/salon`.
- [ ] Sin sesión, "CREAR CUENTA" y "EMPEZAR GRATIS →" navegan a `/acceso`.
- [ ] Con sesión ("kai"), esos dos botones no aparecen y en su lugar hay "SEGUIR JUGANDO" hacia `/biblioteca`.
- [ ] Iniciar sesión o "JUGAR COMO INVITADO" en `/acceso` redirige a `/biblioteca`.
- [ ] La navbar muestra "Inicio" y "Biblioteca". "Inicio" se resalta solo en `/`. "Biblioteca" se resalta en `/biblioteca` y `/juegos/*`.
- [ ] El panel móvil (≤ 840px) incluye "Inicio" y "Biblioteca". No hay link "Acerca de".
- [ ] "VOLVER" en detalle, salón y reproductor lleva a `/biblioteca`.
- [ ] Al hacer scroll las secciones `.reveal` aparecen. Con `prefers-reduced-motion: reduce` todo el contenido se ve sin animación.
- [ ] La consola no muestra errores de hidratación en `/`.

## Decisiones

- **Sí:** home en `/` y biblioteca en `/biblioteca`. La home es la portada real para visitantes.
- **No:** home en `/inicio`. La portada seguiría siendo la biblioteca.
- **Sí:** todas las secciones de la plantilla. El usuario las quiere todas.
- **Sí:** con sesión se ocultan los CTAs de registro y aparece "SEGUIR JUGANDO". Evita invitar a crear cuenta a quien ya la tiene.
- **No:** saludo personalizado en el hero. Más lógica cliente sin valor claro ahora.
- **Sí:** links "Inicio" y "Biblioteca" separados en la navbar.
- **No:** link "Acerca de". About queda fuera de esta spec.
- **Sí:** tras el login se redirige a `/biblioteca`. Mantiene el comportamiento actual de terminar en la lista de juegos.
- **Sí:** actividad en vivo con arrays estáticos en `lib/home.ts`. Deterministas, sin hydration mismatch.
- **No:** generarla con `seededScores`. Habría que inventar juegos y tiempos aparte.
- **Sí:** portar el CSS de la plantilla a `app/globals.css` y respetar `prefers-reduced-motion`. Sigue la convención de SPEC 01 y mejora accesibilidad.
- **No:** reescribir con Tailwind. Más trabajo con el mismo resultado.
- **Sí:** textos ajustados a datos reales (`GAMES.length`, nombres propios). Evita cifras falsas y marcas registradas.
- **Sí:** la home es server component y solo `reveal` y `session-ctas` son cliente. Minimiza JS en la portada.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Clases de `styles.css` de home-about que chocan con las ya portadas en `globals.css` | Portar solo las clases de la home y comparar antes las comunes (`btn`, `pulse`, `section-*`). |
| Contenido `.reveal` invisible si el JS no carga o falla el observer | Con reduced-motion se muestra sin animar. El observer se registra en `useEffect` y desconecta al desmontar. |
| Parpadeo de CTAs al hidratar (sesión en memoria, cliente) | La sesión empieza en `null` en servidor y cliente, así que el primer render es igual. Se acepta el cambio tras login. |
| Enlaces olvidados que aún apuntan a `/` como biblioteca | El paso 2 lista los archivos detectados con `href="/"` y `router.push("/")`. |

## Qué **no** entra en esta spec

- Página About.
- Actividad en vivo real.
- Saludo personalizado.
- Persistencia, autenticación real y tests.

Cada uno, si llega, va en su propia spec.
