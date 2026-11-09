import type { Metadata } from "next";
import { HomePage } from "@/components/home/home-page";

export const metadata: Metadata = {
  title: "Inicio",
  description:
    "Juega los mejores clásicos arcade directamente en tu navegador, gratis y sin descargas.",
};

export default function Home() {
  return <HomePage />;
}
