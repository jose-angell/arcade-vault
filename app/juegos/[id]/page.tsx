import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { getGame, getGameStaticParams } from "@/lib/data/games";
import { getTopScores } from "@/lib/data/scores";
import { formatPlays } from "@/lib/games";

export async function generateStaticParams() {
  return getGameStaticParams();
}

export async function generateMetadata({
  params,
}: PageProps<"/juegos/[id]">): Promise<Metadata> {
  const { id } = await params;
  let game;
  try {
    game = await getGame(id);
  } catch {
    // La lectura falló: el boundary de la página mostrará SEÑAL PERDIDA.
    return { title: "Señal perdida" };
  }
  if (!game) return { title: "Juego no encontrado" };
  return { title: game.title, description: game.short };
}

const TOP_CLASS = ["top1", "top2", "top3"];

export default function GameDetailPage(props: PageProps<"/juegos/[id]">) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <GameDetail params={props.params} />
    </Suspense>
  );
}

// `params` se lee dentro de <Suspense> para no bloquear la navegación.
async function GameDetail({
  params,
}: {
  params: PageProps<"/juegos/[id]">["params"];
}) {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) notFound();

  const scores = await getTopScores(id, 10);

  return (
    <div className="av-detail fade-in">
      <div>
        <div className="detail-cover">
          <div className={"cover-bg " + game.cover} />
        </div>
        <div className="detail-info mt-5">
          <div className="detail-tags">
            <span>{game.cat}</span>
            <span>1 JUGADOR</span>
            <span>TECLADO / TÁCTIL</span>
            <span>RETRO 1985</span>
          </div>
          <h2 className="neon-cyan">{game.title}</h2>
          <p>{game.long}</p>
          <div className="stat-strip">
            <div>
              <div className="l">Partidas</div>
              <div className="v">{formatPlays(game.plays)}</div>
            </div>
            <div>
              <div className="l">Mejor global</div>
              <div className="v text-magenta [text-shadow:0_0_6px_rgba(255,0,110,0.5)]">
                {game.best.toLocaleString("es-ES")}
              </div>
            </div>
            <div>
              <div className="l">Dificultad</div>
              <div className="v text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.5)]">
                ★ ★ ★ ☆ ☆
              </div>
            </div>
          </div>
          <div className="detail-actions">
            <Link href={`/juegos/${game.id}/jugar`} className="btn xl pulse">
              ▶ JUGAR AHORA
            </Link>
            <Link href="/biblioteca" className="btn ghost lg">
              VOLVER AL VAULT
            </Link>
          </div>
        </div>
      </div>

      <aside>
        <div className="leaderboard">
          <h3>MEJORES PUNTUACIONES</h3>
          {scores.length === 0 && (
            <div className="p-8 text-center">
              <div className="pixel text-sm text-magenta">SÉ EL PRIMERO</div>
              <div className="mt-2 text-[11px] tracking-widest text-ink-faint">
                AÚN NO HAY PUNTUACIONES
              </div>
            </div>
          )}
          {scores.map((r, i) => (
            <div
              key={r.rank}
              className={"lb-row" + (TOP_CLASS[i] ? " " + TOP_CLASS[i] : "")}
            >
              <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
              <div className="pl">
                {r.name}
                <div className="text-[10px] tracking-widest text-ink-faint">
                  {r.date}
                </div>
              </div>
              <div className="sc">{r.score.toLocaleString("es-ES")}</div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
