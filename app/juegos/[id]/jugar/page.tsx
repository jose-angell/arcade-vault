import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { GamePlayer } from "@/components/game-player";
import { GAMES, getGame } from "@/lib/games";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/juegos/[id]/jugar">): Promise<Metadata> {
  const { id } = await params;
  const game = getGame(id);
  if (!game) return { title: "Juego no encontrado" };
  return { title: `Jugando ${game.title}` };
}

export default function PlayPage(props: PageProps<"/juegos/[id]/jugar">) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Player params={props.params} />
    </Suspense>
  );
}

// `params` se lee dentro de <Suspense> para no bloquear la navegación.
async function Player({
  params,
}: {
  params: PageProps<"/juegos/[id]/jugar">["params"];
}) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) notFound();

  return <GamePlayer game={game} />;
}
