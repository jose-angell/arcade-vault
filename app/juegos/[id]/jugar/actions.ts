"use server";

import { updateTag } from "next/cache";
import { ENGINES } from "@/lib/engines";
import { createClient } from "@/lib/supabase/server";

export type SaveScoreResult = { ok: true } | { ok: false; error: string };

const NAME_RE = /^[A-Z0-9_]{1,10}$/;
const MAX_SCORE = 10_000_000;

export async function saveScore(input: {
  gameId: string;
  name: string;
  score: number;
}): Promise<SaveScoreResult> {
  const { gameId, name, score } = input ?? {};

  // Solo los juegos con motor guardan puntuaciones reales.
  if (typeof gameId !== "string" || !Object.hasOwn(ENGINES, gameId)) {
    return { ok: false, error: "Este juego no admite guardar puntuaciones." };
  }
  if (typeof name !== "string" || !NAME_RE.test(name)) {
    return { ok: false, error: "Iniciales no válidas (A-Z, 0-9 y _; máx. 10)." };
  }
  if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
    return { ok: false, error: "Puntuación no válida." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("scores")
    .insert({ game_id: gameId, player_name: name, score });
  if (error) {
    return { ok: false, error: "No se pudo guardar la puntuación." };
  }

  updateTag(`scores:${gameId}`);
  updateTag("games"); // best y plays cambian
  return { ok: true };
}
