import { createAsteroidsGame } from "./asteroids";
import type { EngineEntry } from "./types";
export const ENGINES: Partial<Record<string, EngineEntry>> = {
  asteroides: {
    create: createAsteroidsGame,
    controls: [
      { label: "◀", code: "ArrowLeft", legend: "←" },
      { label: "▶", code: "ArrowRight", legend: "→ ROTAR" },
      { label: "▲", code: "ArrowUp", legend: "↑ PROPULSAR" },
      { label: "FUEGO", code: "Space", legend: "ESPACIO DISPARAR" },
    ],
  },
};
