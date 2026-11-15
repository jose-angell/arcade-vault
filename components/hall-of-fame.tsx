import Link from "next/link";
import type { Game, ScoreRow } from "@/lib/games";

const TOP_CLASS = ["top1", "top2", "top3"];
const fmt = (n: number) => n.toLocaleString("es-ES");

function PodiumSlot({
  row,
  rank,
  className,
  champion,
}: {
  row?: ScoreRow;
  rank: string;
  className: string;
  champion?: boolean;
}) {
  return (
    <div className={`podium-slot ${className}`}>
      {champion && (
        <div className="pixel text-[9px] tracking-[0.18em] text-gold">
          CAMPEÓN
        </div>
      )}
      <div className={"rank-num" + (champion ? " mt-1 text-[36px]" : "")}>
        {rank}
      </div>
      <div className="name">{row ? row.name : "---"}</div>
      <div className={"score" + (champion ? " text-[20px]" : "")}>
        {row ? fmt(row.score) : "---"}
      </div>
      <div className="date">{row ? row.date : "---"}</div>
    </div>
  );
}

export function HallOfFame({
  games,
  game,
  rows,
}: {
  games: Game[];
  game: Game;
  rows: ScoreRow[];
}) {
  const [first, second, third] = rows;

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel text-[10px]">
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>

      <nav className="hall-tabs" aria-label="Juegos">
        {games.map((g) => (
          <Link
            key={g.id}
            href={`/salon?juego=${g.id}`}
            scroll={false}
            aria-current={g.id === game.id ? "page" : undefined}
            className={"chip" + (g.id === game.id ? " active" : "")}
          >
            {g.title}
          </Link>
        ))}
      </nav>

      <div className="podium">
        <PodiumSlot row={second} rank="02" className="silver" />
        <PodiumSlot row={first} rank="01" className="gold" champion />
        <PodiumSlot row={third} rank="03" className="bronze" />
      </div>

      <div className="hall-table">
        <div className="th">
          <div>RANGO</div>
          <div>JUGADOR</div>
          <div>PUNTUACIÓN</div>
          <div>FECHA</div>
        </div>
        {rows.length === 0 && (
          <div className="p-10 text-center">
            <div className="pixel text-sm text-magenta">SÉ EL PRIMERO</div>
            <div className="mt-2 text-[11px] tracking-widest text-ink-faint">
              AÚN NO HAY PUNTUACIONES EN {game.title}
            </div>
          </div>
        )}
        {rows.map((r, i) => (
          <div
            key={`${game.id}-${r.rank}`}
            className={"tr" + (TOP_CLASS[i] ? " " + TOP_CLASS[i] : "")}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
            <div className="pl">{r.name}</div>
            <div className="sc">{fmt(r.score)}</div>
            <div className="dt">{r.date}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link href="/biblioteca" className="btn lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}
