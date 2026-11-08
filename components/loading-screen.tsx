// Fallback de <Suspense> para rutas que leen `params` (juegos/[id]).
export function LoadingScreen() {
  return (
    <div
      className="flex flex-col items-center gap-3 px-4 py-32 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="pixel neon-cyan text-sm tracking-[0.16em]">
        CARGANDO <span className="blink">_</span>
      </div>
      <div className="mono text-[11px] tracking-[0.16em] text-ink-faint">
        PREPARANDO LA MÁQUINA
      </div>
    </div>
  );
}
