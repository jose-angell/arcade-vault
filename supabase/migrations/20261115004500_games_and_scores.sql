-- SPEC 06: catálogo de juegos y leaderboard anónimo.

create table public.games (
  id text primary key,
  title text not null,
  short text not null,
  long text not null,
  cat text not null check (cat in ('ARCADE','PUZZLE','SHOOTER','VERSUS')),
  cover text not null,
  color text not null check (color in ('cyan','magenta','yellow','green')),
  sort_order int not null unique
);

create table public.scores (
  id bigint generated always as identity primary key,
  game_id text not null references public.games(id),
  player_name text not null check (player_name ~ '^[A-Z0-9_]{1,10}$'),
  score int not null check (score between 0 and 10000000),
  created_at timestamptz not null default now()
);

create index scores_game_score_idx on public.scores (game_id, score desc, created_at);

create view public.games_with_stats with (security_invoker = true) as
  select g.*, coalesce(max(s.score), 0) as best, count(s.id) as plays
  from public.games g
  left join public.scores s on s.game_id = g.id
  group by g.id;

-- RLS
alter table public.games enable row level security;
alter table public.scores enable row level security;

create policy "games_select_public" on public.games
  for select to anon, authenticated using (true);

create policy "scores_select_public" on public.scores
  for select to anon, authenticated using (true);

create policy "scores_insert_anon" on public.scores
  for insert to anon with check (true);

-- Privilegios explícitos (no dependemos de los default privileges del proyecto).
-- Sin update ni delete.
grant select on public.games to anon, authenticated;
grant select on public.scores to anon, authenticated;
grant select on public.games_with_stats to anon, authenticated;
grant insert on public.scores to anon;
grant usage on sequence public.scores_id_seq to anon;

-- Seed
insert into public.games (id, title, short, long, cat, cover, color, sort_order) values
  ('bloque-buster', 'BLOQUE BUSTER', 'Rebota la pelota y destruye muros de neón.', 'Pilota una nave-paleta y rebota un núcleo de plasma para pulverizar muros de bloques cromáticos. Cada nivel reorganiza la grilla en patrones imposibles. ¿Hasta dónde llegará tu racha?', 'ARCADE', 'cover-bricks', 'cyan', 1),
  ('caida', 'CAÍDA', 'Encaja las piezas antes de que el techo te aplaste.', 'Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.', 'PUZZLE', 'cover-tetro', 'magenta', 2),
  ('serpentina', 'SERPENTINA', 'Crece sin morder tu propia cola.', 'Una serpiente de luz recorre la grilla buscando núcleos magenta. Cada bocado la alarga y la hace más veloz. Un movimiento en falso y se devora a sí misma.', 'ARCADE', 'cover-snake', 'green', 3),
  ('gloton', 'GLOTÓN', 'Devora puntos y escapa de los fantasmas.', 'Un círculo glotón patrulla un laberinto coleccionando puntos luminosos. Cuatro espectros lo persiguen, pero cada cierto tiempo aparece una píldora que invierte los papeles.', 'ARCADE', 'cover-glot', 'yellow', 4),
  ('invasores', 'INVASORES', 'Defiende el planeta de filas alienígenas.', 'Olas de pixeles hostiles descienden formación tras formación. Mueve tu cañón en horizontal y abre fuego con precisión, antes de que toquen la superficie.', 'SHOOTER', 'cover-invaders', 'green', 5),
  ('asteroides', 'ASTEROIDES', 'Pulveriza asteroides en gravedad cero.', 'Tu nave triangular flota en vacío absoluto. Rota, propúlsate y dispara para partir rocas en fragmentos cada vez más pequeños. Atrapa el cristal 3x para disparar en abanico.', 'SHOOTER', 'cover-asteroides', 'cyan', 6),
  ('ranaria', 'RANARIA', 'Cruza la autopista de pixeles.', 'Salta entre carriles de coches a toda velocidad y troncos a la deriva en el río. Llega a los nenúfares antes de que se acabe el tiempo.', 'ARCADE', 'cover-rana', 'green', 7),
  ('duelo-pixel', 'DUELO PIXEL', 'Dos paletas. Una pelota. Reflejos máximos.', 'El duelo más puro: dos paletas verticales se enfrentan por rebotar una pelota luminosa. Modo solitario contra la CPU o partida local a dos jugadores.', 'VERSUS', 'cover-duelo', 'cyan', 8);
