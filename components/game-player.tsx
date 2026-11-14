"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/session-provider";
import { GameCanvas } from "@/components/game-canvas";
import { ControlsLegend, TouchControls } from "@/components/touch-controls";
import { ENGINES } from "@/lib/engines";
import type { EngineStats, GameEngine } from "@/lib/engines/types";
import type { Game } from "@/lib/games";
const LIVES = 3;
const POINTS_PER_LEVEL = 2500;
export function GamePlayer({ game }: { game: Game }) {
  const { user } = useSession();
  // Motor real si el juego lo tiene; si no, arena mock con puntuación simulada.
  const entry = ENGINES[game.id];
  const engineRef = useRef<GameEngine | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [engineLevel, setEngineLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [name, setName] = useState(user ? user.name : "INVITADO");
  const [saved, setSaved] = useState(false);
  // Puntuación simulada. El azar vive solo dentro del intervalo (nunca en el
  // render), así que no hay hydration mismatch.
  useEffect(() => {
    if (entry || over || paused) return;
    const t = setInterval(() => setScore((s) => s + Math.floor(10 + Math.random() * 90)), 220);
    return () => clearInterval(t);
  }, [entry, over, paused]);
  const level = entry ? engineLevel : 1 + Math.floor(score / POINTS_PER_LEVEL);
  const handleEngine = useCallback((engine: GameEngine | null) => {
    engineRef.current = engine;
  }, []);
  const handleStats = useCallback((s: EngineStats) => {
    setScore(s.score);
    setLives(s.lives);
    setEngineLevel(s.level);
  }, []);
  const handleGameOver = useCallback((finalScore: number) => {
    setScore(finalScore);
    setPaused(false);
    setOver(true);
  }, []);
  // Sincroniza la pausa de React con el motor.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (paused) engine.pause();
    else engine.resume();
  }, [paused]);
  // P y Esc alternan la pausa; pestaña oculta o pérdida de foco la activan.
  useEffect(() => {
    if (over) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code !== "KeyP" && e.code !== "Escape") return;
      const t = e.target;
      if (t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      setPaused((p) => !p);
    };
    const autoPause = () => setPaused(true);
    const onVisibility = () => {
      if (document.hidden) setPaused(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", autoPause);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", autoPause);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [over]);
  const finish = () => {
    if (entry) {
      engineRef.current?.end(); // dispara onGameOver
    } else {
      setOver(true);
    }
  };
  const restart = () => {
    setScore(0);
    setLives(LIVES);
    setEngineLevel(1);
    setPaused(false);
    setOver(false);
    setSaved(false);
    engineRef.current?.restart();
  };
  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div className="flex flex-wrap gap-6">
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v text-ink">{name}</div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{score.toLocaleString("es-ES")}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">{"♥ ".repeat(lives).trim()}</div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(level).padStart(2, "0")}</div>
          </div>
        </div>
        <div className="hud-actions">
          <button type="button" className="btn yellow" onClick={() => setPaused((p) => !p)}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button type="button" className="btn magenta" onClick={finish}>
            FIN
          </button>
          <Link href={`/juegos/${game.id}`} className="btn ghost">
            SALIR
          </Link>
        </div>
      </div>
      <div className="crt">
        <div className="crt-screen">
          {entry ? (
            <GameCanvas
              engine={entry}
              onEngine={handleEngine}
              onStats={handleStats}
              onGameOver={handleGameOver}
            />
          ) : (
            <div className="game-arena">
              <div className="grid-floor" />
              <div className="enemy e1" />
              <div className="enemy e2" />
              <div className="enemy e3" />
              <div className="player-ship" />
            </div>
          )}
          {/* El canvas dibuja su propio EN PAUSA */}
          {paused && !entry && (
            <div className="crt-content z-5 bg-black/60">
              <div>
                <div className="pixel neon-yellow text-[22px]">EN PAUSA</div>
                <div className="mono mt-2.5 text-[11px] tracking-[0.16em] text-ink-dim">
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>
      {entry && (
        <>
          <ControlsLegend controls={entry.controls} />
          <TouchControls
            controls={entry.controls}
            onKey={(code, down) => engineRef.current?.setKey(code, down)}
          />
        </>
      )}
      {over && (
        <div className="modal-bd">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
            <h2 id="game-over-title">FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>
            {!saved ? (
              <div className="input-row">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder="TUS INICIALES"
                  aria-label="Tus iniciales"
                />
                <button type="button" className="btn yellow" onClick={() => setSaved(true)}>
                  GUARDAR PUNTUACIÓN
                </button>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button type="button" className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <Link href="/biblioteca" className="btn magenta">
                VOLVER AL VAULT
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
