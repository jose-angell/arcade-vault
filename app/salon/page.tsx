import type { Metadata } from "next";
import { Suspense } from "react";
import { HallOfFame } from "@/components/hall-of-fame";
import { LoadingScreen } from "@/components/loading-screen";
import { getGames } from "@/lib/data/games";
import { getTopScores } from "@/lib/data/scores";

export const metadata: Metadata = {
  title: "Salón de la Fama",
  description: "Las mejores puntuaciones de cada juego de Arcade Vault.",
};

export default function HallPage(props: PageProps<"/salon">) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Hall searchParams={props.searchParams} />
    </Suspense>
  );
}

// `searchParams` se lee dentro de <Suspense> para no bloquear la navegación.
async function Hall({
  searchParams,
}: {
  searchParams: PageProps<"/salon">["searchParams"];
}) {
  const { juego } = await searchParams;
  const games = await getGames();
  const wanted = Array.isArray(juego) ? juego[0] : juego;
  const game = games.find((g) => g.id === wanted) ?? games[0];
  const rows = await getTopScores(game.id, 10);

  return <HallOfFame games={games} game={game} rows={rows} />;
}
