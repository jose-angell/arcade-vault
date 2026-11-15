// Datos mock compartidos, portados de resources/templates/data.jsx
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type NeonColor = "cyan" | "magenta" | "yellow" | "green";
export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;
  color: NeonColor;
  best: number;
  plays: number; // nº de partidas; formatear con formatPlays
}
export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string; // "DD/MM/YYYY"
}
// < 1000 tal cual; si no, "12.4K".
export function formatPlays(n: number): string {
  return n < 1000 ? String(n) : `${(n / 1000).toFixed(1)}K`;
}
export interface SessionUser {
  name: string; // mayúsculas, máx. 10 caracteres
}
export const CATS: ("TODOS" | GameCategory)[] = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"];
