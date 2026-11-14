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
