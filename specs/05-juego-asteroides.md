# SPEC 05 — Juego Asteroides jugable en la plataforma

> **Estado:** implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-11-13
> **Objetivo:** Portar `resources/02-asteroids` a un motor TypeScript que se monta en el CRT de `/juegos/asteroides/jugar` y alimenta el HUD y el modal de fin de partida de la plataforma con datos reales.

## Alcance

**Entra:**

- Nueva entrada `asteroides` en `lib/games.ts` y eliminación del mock `rocas`.
- Portada `.cover-asteroides`: renombrar `.cover-rocas` en `app/globals.css` y poner el triángulo en cyan.
- Motor `createAsteroidsGame` en TypeScript, sin globales, con las mismas mecánicas, constantes y aspecto que `game.js`, incluido el power-up de triple disparo.
- Registro de motores por id. `GamePlayer` monta un `<canvas>` si el juego tiene motor y conserva la arena mock con puntuación simulada si no lo tiene.
- HUD doble: el canvas mantiene su HUD (SCORE, NIVEL, vidas, 3x) y el HUD de la plataforma muestra Puntuación, Vidas y Nivel reales.
- Fin de partida: al perder la última vida, el canvas dibuja GAME OVER y se abre el modal FIN DEL JUEGO con la puntuación real.
- Botones: PAUSA/REANUDAR congela y reanuda el motor. FIN termina la partida y abre el modal. JUGAR DE NUEVO reinicia el motor.
- Teclas: `P` y `Esc` alternan la pausa. Flechas y Espacio llevan `preventDefault` mientras se juega.
- Auto-pausa al ocultar la pestaña (`visibilitychange`) o al perder el foco (`blur`).
- Canvas con resolución lógica 800×600, escalado por CSS al `.crt-screen` 4:3 y con `devicePixelRatio`.
- Controles táctiles: botonera ◀ ▶ ▲ FUEGO bajo el CRT, visible solo con `(pointer: coarse)`.
- Leyenda de controles bajo el CRT: `← → ROTAR · ↑ PROPULSAR · ESPACIO DISPARAR · P PAUSA`.

**Fuera de alcance (para futuras specs):**

- Guardar puntuaciones en Supabase, tablas, RLS y leaderboard real. "GUARDAR PUNTUACIÓN" sigue simulado.
- Récord personal en localStorage.
- Portar Tetris (`03-tetris`) y Arkanoid (`04-arkanoid`).
- OVNIs, sonido y nuevas mecánicas.
- Recolorear el juego con el neón de la plataforma.
- Cambios en la página de detalle `/juegos/[id]` aparte de los datos de la entrada.
- Tests automatizados.

## Modelo de datos

Entrada nueva en `GAMES` (`lib/games.ts`), en la posición que ocupaba `rocas`:

```ts
{
  id: "asteroides",
  title: "ASTEROIDES",
  short: "Pulveriza asteroides en gravedad cero.",
  long: "Tu nave triangular flota en vacío absoluto. Rota, propúlsate y dispara para partir rocas en fragmentos cada vez más pequeños. Atrapa el cristal 3x para disparar en abanico.",
  cat: "SHOOTER",
  cover: "cover-asteroides",
  color: "cyan",
  best: 0,
  plays: "0",
}
```

Contrato de motores en `lib/engines/types.ts`:

```ts
export interface EngineStats {
  score: number;
  lives: number;
  level: number;
}

export interface EngineCallbacks {
  onStats(stats: EngineStats): void; // solo cuando cambia algún valor
  onGameOver(finalScore: number): void;
}

export interface GameEngine {
  pause(): void;
  resume(): void;
  restart(): void; // nueva partida y reanuda
  end(): void; // fuerza game over → onGameOver
  setKey(code: string, down: boolean): void; // para la botonera táctil
  destroy(): void; // cancela rAF y quita listeners
}

export interface ControlDef {
  label: string;
  code: string;
  legend: string;
}

export interface EngineEntry {
  create(canvas: HTMLCanvasElement, cb: EngineCallbacks): GameEngine;
  controls: ControlDef[]; // botonera táctil y leyenda
}
```

Archivos:

- `lib/engines/asteroids.ts`: `createAsteroidsGame` con clases `Bullet`, `Asteroid`, `PowerUp`, `Ship` y `Particle` cerradas sobre el `ctx` de la instancia.
- `lib/engines/index.ts`: `export const ENGINES: Partial<Record<string, EngineEntry>> = { asteroides: … }`.
- `components/game-canvas.tsx`, componente cliente: crea el motor en `useEffect` y lo destruye en el cleanup.
- `components/touch-controls.tsx`, componente cliente: usa `pointerdown`/`pointerup`/`pointercancel`/`pointerleave` y llama a `setKey`.

Convenciones:

- Los listeners de teclado del motor ignoran eventos cuyo `target` sea `input` o `textarea`, para que se pueda escribir en el modal.
- En pausa o en game over el motor no procesa entrada y vacía `justPressed`.
- El overlay del canvas en game over muestra `GAME OVER` / `PUNTAJE: N`, sin "ESPACIO PARA REINICIAR". Espacio ya no reinicia.
- El HUD de la plataforma pinta las vidas con `"♥ ".repeat(lives)` y el nivel con `padStart(2, "0")`.

## Plan de implementación

1. Datos: añadir la entrada `asteroides`, borrar `rocas` y renombrar `.cover-rocas` a `.cover-asteroides` con el triángulo en cyan. Verificar: la biblioteca muestra ASTEROIDES y no ROCAS, y `/juegos/asteroides/jugar` abre la arena mock.
2. Crear `lib/engines/types.ts` y `lib/engines/asteroids.ts` con el port fiel de `game.js`: instancia aislada, `dt` con tope de 50 ms, `pause`/`resume`/`restart`/`end`/`setKey`/`destroy`, `onStats` y `onGameOver`, y `preventDefault` en flechas y Espacio.
3. Crear `lib/engines/index.ts` con `ENGINES` y los `controls` de asteroides.
4. Crear `components/game-canvas.tsx`: canvas 800×600 × DPR escalado al 100 % del `.crt-screen` con la clase `.game-canvas`, motor expuesto por `ref` o callback.
5. Modificar `components/game-player.tsx`:
   - Si `ENGINES[game.id]` existe, renderiza `GameCanvas` en lugar de `.game-arena`, desactiva el intervalo simulado y usa stats reales.
   - PAUSA llama a `pause`/`resume`, FIN a `end`, y JUGAR DE NUEVO a `restart`.
   - Gestiona `P`/`Esc`, `visibilitychange` y `blur`, que ponen `paused`.

   Verificar: se juega con teclado, el HUD de la plataforma se actualiza y el modal sale al perder.

6. Crear `components/touch-controls.tsx` y la leyenda bajo el CRT, con estilos en `globals.css` y la botonera solo en `@media (pointer: coarse)`. Verificar en DevTools con emulación táctil.
7. Verificar `npm run lint` y `npm run build`, y que los demás juegos siguen con la arena mock.

Antes del paso 4 se leen las guías de `node_modules/next/dist/docs/` sobre componentes cliente y Cache Components, como exige `AGENTS.md`.

## Criterios de aceptación

- [x] `npm run build` y `npm run lint` terminan sin errores.
- [x] La biblioteca muestra ASTEROIDES con portada `.cover-asteroides` y ya no existe ROCAS. `/juegos/rocas` da 404.
- [x] En `/juegos/asteroides/jugar` el CRT muestra el juego en canvas con el mismo aspecto y mecánicas que `resources/02-asteroids`: rotar, propulsar, disparar, partir asteroides, triple disparo, invencibilidad con parpadeo y paso de nivel.
- [x] El canvas se ve nítido en pantallas con `devicePixelRatio` 2 y llena el `.crt-screen` sin deformarse.
- [x] Al destruir un asteroide grande, la Puntuación del HUD de la plataforma sube 20 y coincide con el SCORE del canvas.
- [x] Al perder una vida, Vidas del HUD de la plataforma baja de ♥ ♥ ♥ a ♥ ♥. Al limpiar la oleada, Nivel pasa a 02.
- [x] Al perder la tercera vida, el canvas dibuja GAME OVER y se abre el modal con la misma puntuación final.
- [x] PAUSA congela el juego y muestra EN PAUSA. REANUDAR continúa sin saltos. `P` y `Esc` hacen lo mismo.
- [x] Cambiar de pestaña o de ventana pausa el juego automáticamente.
- [x] FIN abre el modal con la puntuación actual y el juego deja de responder a teclas.
- [x] JUGAR DE NUEVO empieza una partida con 0 puntos, 3 vidas y nivel 01.
- [x] Escribir en el input de iniciales del modal no mueve la nave ni dispara.
- [x] Flechas y Espacio no hacen scroll de la página mientras se juega.
- [x] Con emulación táctil aparece la botonera ◀ ▶ ▲ FUEGO. Mantener ◀ rota la nave y FUEGO dispara. En escritorio no aparece.
- [x] Bajo el CRT se ve la leyenda de controles.
- [x] Al salir con SALIR y volver a entrar hay una sola instancia: velocidad normal, sin listeners duplicados y sin errores en consola. También en dev con Strict Mode.
- [x] Los demás juegos (p. ej. `/juegos/caida/jugar`) siguen con la arena mock y la puntuación simulada.
- [x] La consola no muestra errores de hidratación en `/juegos/asteroides/jugar`.

## Decisiones

- **Sí:** nueva entrada `asteroides` y borrar `rocas`. El usuario quiere un id propio y evitar dos juegos de asteroides en la biblioteca.
- **No:** reusar o renombrar `rocas`. Se descartó a favor de una entrada nueva.
- **Sí:** motor TypeScript con `create`/`destroy`. Sin globales, limpia rAF y listeners al desmontar y se comunica con la plataforma.
- **No:** iframe con el HTML original. No comunica puntuación ni vidas.
- **No:** pegar el JS en un `useEffect`. Globales y listeners difíciles de limpiar.
- **Sí:** carpeta `lib/engines/` en lugar de `lib/games/`. `lib/games.ts` ya existe, y una carpeta con el mismo nombre crearía imports ambiguos con `@/lib/games`.
- **Sí:** registro `ENGINES` por id. Tetris y Arkanoid se añadirán sin tocar `GamePlayer`.
- **No:** condicional `game.id === "asteroides"`. Habría que tocarlo con cada juego.
- **Sí:** HUD en canvas y en plataforma (ambos). Decisión del usuario.
- **Sí:** el modal de la plataforma decide el fin de partida y el reinicio. Espacio ya no reinicia, para no chocar con el modal.
- **Sí:** guardado de puntuación simulado. Supabase, tablas y leaderboard van en su propia spec.
- **Sí:** controles táctiles en botonera bajo el CRT, solo `pointer: coarse`. No tapan el juego y reutilizan `setKey`.
- **No:** botones superpuestos o gestos. Tapan la pantalla o son imprecisos.
- **Sí:** auto-pausa en `visibilitychange` y `blur`. Evita morir con la pestaña oculta.
- **Sí:** aspecto original en blanco vectorial. Port fiel. El neón queda fuera.

## Riesgos

| Riesgo                                                          | Mitigación                                                                                                      |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Strict Mode monta el efecto dos veces y duplica rAF o listeners | `destroy()` cancela el rAF y quita todos los listeners. Hay un criterio de aceptación que lo comprueba.         |
| `onStats` en cada frame provoca re-render a 60 fps              | Emitir solo cuando cambia score, lives o level.                                                                 |
| Las teclas del juego interfieren con el input del modal         | Ignorar eventos cuyo `target` sea `input`/`textarea` y no procesar entrada en game over.                        |
| `dt` gigante al volver de una pestaña oculta                    | Tope de 50 ms del original, auto-pausa y reiniciar `lastTime` en `resume`.                                      |
| Borrar `rocas` rompe enlaces o referencias                      | Solo aparece en `lib/games.ts` y `globals.css` (verificado con grep). `generateStaticParams` se actualiza solo. |
| `best: 0` se ve raro en tarjeta o detalle                       | Revisarlo en el paso 1. Si se ve mal, se ajusta el valor y no el componente.                                    |

## Qué **no** entra en esta spec

- Guardar puntuaciones y leaderboard real.
- Tetris y Arkanoid.
- OVNIs, sonido y recoloreado neón.
- Tests.

Cada uno, si llega, va en su propia spec.
