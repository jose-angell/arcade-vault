import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404",
  description: "Esta página no existe en el vault.",
};

export default function NotFound() {
  return (
    <section className="fade-in flex flex-col items-center gap-5 px-4 py-24 text-center">
      <h1 className="pixel neon-magenta flicker text-[clamp(56px,14vw,120px)]">
        404
      </h1>
      <p className="pixel neon-cyan text-[clamp(11px,2.4vw,16px)] tracking-[0.12em]">
        GAME OVER · PÁGINA NO ENCONTRADA
      </p>
      <p className="max-w-md text-sm leading-relaxed text-ink-dim">
        El juego o la página que buscas no existe o ya no está en el vault.
        Revisa la dirección o vuelve a la biblioteca para elegir otro juego.
      </p>
      <Link href="/" className="btn lg pulse mt-4">
        VOLVER AL VAULT
      </Link>
    </section>
  );
}
