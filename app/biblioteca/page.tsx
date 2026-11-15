import type { Metadata } from "next";
import { Library } from "@/components/library";
import { getGames } from "@/lib/data/games";

export const metadata: Metadata = {
  title: "Biblioteca",
  description: "Explora y busca todos los juegos disponibles en Arcade Vault.",
};

export default async function LibraryPage() {
  const games = await getGames();
  return <Library games={games} />;
}
