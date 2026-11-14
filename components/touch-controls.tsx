"use client";
import type { PointerEvent } from "react";
import type { ControlDef } from "@/lib/engines/types";
/**
 * Texto de la leyenda a partir de los `legend` de los controles.
 * Un fragmento sin espacios (p. ej. "←") se une al siguiente con un espacio;
 * el resto se separa con " · ". `P PAUSA` lo añade la plataforma, no el motor.
 */
export function controlsLegend(controls: ControlDef[]): string {
  const parts = [...controls.map((c) => c.legend), "P PAUSA"];
  return parts.reduce((acc, part, i) => {
    if (i === 0) return part;
    const prev = parts[i - 1];
    return acc + (prev.includes(" ") ? " · " : " ") + part;
  }, "");
}
export function ControlsLegend({ controls }: { controls: ControlDef[] }) {
  return <p className="controls-legend">{controlsLegend(controls)}</p>;
}
export function TouchControls({
  controls,
  onKey,
}: {
  controls: ControlDef[];
  onKey: (code: string, down: boolean) => void;
}) {
  const press = (code: string) => (e: PointerEvent) => {
    e.preventDefault();
    onKey(code, true);
  };
  const release = (code: string) => () => onKey(code, false);
  return (
    <div className="touch-controls" role="group" aria-label="Controles táctiles">
      {controls.map((c) => (
        <button
          key={c.code}
          type="button"
          className={`touch-btn${c.code === "Space" ? " fire" : ""}`}
          onPointerDown={press(c.code)}
          onPointerUp={release(c.code)}
          onPointerCancel={release(c.code)}
          onPointerLeave={release(c.code)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
