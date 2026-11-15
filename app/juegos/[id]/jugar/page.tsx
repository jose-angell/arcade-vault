import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { GamePlayer } from "@/components/game-player";
import { getGame, getGameStaticParams } from "@/lib/data/games";

export async function generateStaticParams() {
  return getGameStaticParams();
}

export async function generateMetadata({
  params,
}: PageProps<"/juegos/[id]/jugar">): Promise<Metadata> {
  const { id } = await params;
  let game;
  try {
    game = await getGame(id);
  } catch {
    // La lectura falló: el boundary de la página mostrará SEÑAL PERDIDA.
    return { title: "Señal perdida" };
  }
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
  const game = await getGame(id);
  if (!game) notFound();

  return <GamePlayer game={game} />;
}
