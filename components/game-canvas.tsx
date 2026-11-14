"use client";
import { useEffect, useRef } from "react";
import type { EngineCallbacks, EngineEntry, GameEngine } from "@/lib/engines/types";
// Resolución lógica del juego. El bitmap real es LOGICAL × devicePixelRatio y
// el CSS (.game-canvas) lo escala al 100 % del .crt-screen.
const LOGICAL_W = 800;
const LOGICAL_H = 600;
interface GameCanvasProps extends EngineCallbacks {
  engine: EngineEntry;
  /** Recibe el motor al montarse y null al destruirse. */
  onEngine: (engine: GameEngine | null) => void;
}
export function GameCanvas({ engine, onStats, onGameOver, onEngine }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Los callbacks viven en una ref para que el motor no se recree cuando el
  // padre cambia de render.
  const cbRef = useRef({ onStats, onGameOver, onEngine });
  useEffect(() => {
    cbRef.current = { onStats, onGameOver, onEngine };
  });
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(LOGICAL_W * dpr);
    canvas.height = Math.round(LOGICAL_H * dpr);
    const instance = engine.create(canvas, {
      onStats: (s) => cbRef.current.onStats(s),
      onGameOver: (score) => cbRef.current.onGameOver(score),
    });
    cbRef.current.onEngine(instance);
    return () => {
      instance.destroy();
      cbRef.current.onEngine(null);
    };
  }, [engine]);
  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      width={LOGICAL_W}
      height={LOGICAL_H}
      aria-label="Área de juego"
    />
  );
}
