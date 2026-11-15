import type { Metadata } from "next";
import { HomePage } from "@/components/home/home-page";
import { getGames } from "@/lib/data/games";

export const metadata: Metadata = {
  title: "Inicio",
  description:
    "Juega los mejores clásicos arcade directamente en tu navegador, gratis y sin descargas.",
};

export default async function Home() {
  const games = await getGames();
  return <HomePage games={games} />;
}
