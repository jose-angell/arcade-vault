import { cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Game, GameCategory, NeonColor } from "@/lib/games";
const COLUMNS = "id, title, short, long, cat, cover, color, best, plays, sort_order";
type GameRow = {
  id: string | null;
  title: string | null;
  short: string | null;
  long: string | null;
  cat: string | null;
  cover: string | null;
  color: string | null;
  best: number | null;
  plays: number | null;
};
// La vista tipa todas las columnas como nullable; las de games son not null.
function toGame(row: GameRow): Game {
  return {
    id: row.id as string,
    title: row.title as string,
    short: row.short as string,
    long: row.long as string,
    cat: row.cat as GameCategory,
    cover: row.cover as string,
    color: row.color as NeonColor,
    best: row.best ?? 0,
    plays: row.plays ?? 0,
  };
}
export async function getGames(): Promise<Game[]> {
  "use cache";
  cacheTag("games");
  const { data, error } = await createPublicClient()
    .from("games_with_stats")
    .select(COLUMNS)
    .order("sort_order");
  if (error) throw new Error(`No se pudo leer el catálogo: ${error.message}`);
  return data.map(toGame);
}
export async function getGame(id: string): Promise<Game | null> {
  "use cache";
  cacheTag("games");
  const { data, error } = await createPublicClient()
    .from("games_with_stats")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el juego: ${error.message}`);
  return data ? toGame(data) : null;
}
