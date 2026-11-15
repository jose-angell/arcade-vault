"use client";

import { useEffect } from "react";

// Boundary de todas las rutas (biblioteca, home, detalle, jugar y salón leen
// de Supabase). `retry()` vuelve a pedir los datos, a diferencia de `reset()`.
export default function Error({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section
      className="fade-in flex flex-col items-center gap-5 px-4 py-24 text-center"
      role="alert"
    >
      <h1 className="pixel neon-magenta flicker text-[clamp(22px,5vw,40px)]">
        SEÑAL PERDIDA
      </h1>
      <p className="pixel neon-cyan text-[clamp(11px,2.4vw,16px)] tracking-[0.12em]">
        REINTENTA <span className="blink">_</span>
      </p>
      <p className="max-w-md text-sm leading-relaxed text-ink-dim">
        No hemos podido conectar con el vault. Comprueba tu conexión e inténtalo
        de nuevo.
      </p>
      <button type="button" className="btn lg pulse mt-4" onClick={() => retry()}>
        ↻ REINTENTAR
      </button>
    </section>
  );
}
