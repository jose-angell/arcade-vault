import { cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { ScoreRow } from "@/lib/games";
const dateFormat = new Intl.DateTimeFormat("es-ES", {
  timeZone: "Europe/Madrid",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
export async function getTopScores(gameId: string, limit = 10): Promise<ScoreRow[]> {
  "use cache";
  cacheTag(`scores:${gameId}`);
  const { data, error } = await createPublicClient()
    .from("scores")
    .select("player_name, score, created_at")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`No se pudo leer el ranking: ${error.message}`);
  return data.map((r, i) => ({
    rank: i + 1,
    name: r.player_name,
    score: r.score,
    date: dateFormat.format(new Date(r.created_at)),
  }));
}
