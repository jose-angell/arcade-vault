import type { EngineCallbacks, GameEngine } from "./types";
// Port fiel de resources/02-asteroids/game.js. Sin globales: todo el estado
// vive dentro de cada instancia creada por createAsteroidsGame.
const W = 800;
const H = 600;
const POWERUP_DROP_CHANCE = 0.15;
const POWERUP_DURATION = 5;
const POWERUP_TTL = 12;
const TRIPLE_SPREAD = 0.18;
const RADII = [0, 16, 30, 50]; // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32]; // velocidad base por tamaño
const POINTS = [0, 100, 50, 20]; // puntos por tamaño
const GAME_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "Space"]);
// ── Utils ───────────────────────────────────────────────────────────────────
const wrap = (v: number, max: number) => ((v % max) + max) % max;
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
type GameState = "playing" | "dead" | "gameover";
export function createAsteroidsGame(canvas: HTMLCanvasElement, cb: EngineCallbacks): GameEngine {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");
  const g: CanvasRenderingContext2D = ctx;
  // ── Input ─────────────────────────────────────────────────────────────────
  const keys: Record<string, boolean> = {};
  const justPressed: Record<string, boolean> = {};
  function pressed(code: string): boolean {
    const val = justPressed[code];
    justPressed[code] = false;
    return !!val;
  }
  function keyChange(code: string, down: boolean) {
    if (down) {
      if (!keys[code]) justPressed[code] = true;
      keys[code] = true;
    } else {
      keys[code] = false;
    }
  }
  function clearInput() {
    for (const k of Object.keys(keys)) keys[k] = false;
    for (const k of Object.keys(justPressed)) justPressed[k] = false;
  }
  function isTypingTarget(t: EventTarget | null) {
    return t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA");
  }
  const onKeyDown = (e: KeyboardEvent) => {
    if (isTypingTarget(e.target)) return;
    if (GAME_KEYS.has(e.code) && !paused && state !== "gameover") {
      e.preventDefault();
    }
    if (paused || state === "gameover") return;
    keyChange(e.code, true);
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (isTypingTarget(e.target)) return;
    keyChange(e.code, false);
  };
  // ── Bullet ────────────────────────────────────────────────────────────────
  class Bullet {
    x: number;
    y: number;
    vx: number;
    vy: number;
    ttl = 1.1;
    radius = 2;
    dead = false;
    constructor(x: number, y: number, angle: number) {
      const SPEED = 520;
      this.x = x;
      this.y = y;
      this.vx = Math.cos(angle) * SPEED;
      this.vy = Math.sin(angle) * SPEED;
    }
    update(dt: number) {
      this.x = wrap(this.x + this.vx * dt, W);
      this.y = wrap(this.y + this.vy * dt, H);
      this.ttl -= dt;
      if (this.ttl <= 0) this.dead = true;
    }
    draw() {
      g.fillStyle = "#fff";
      g.beginPath();
      g.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      g.fill();
    }
  }
  // ── Asteroid ──────────────────────────────────────────────────────────────
  class Asteroid {
    x: number;
    y: number;
    size: number;
    radius: number;
    dead = false;
    vx: number;
    vy: number;
    rotSpeed: number;
    rot: number;
    verts: [number, number][] = [];
    constructor(x: number, y: number, size = 3) {
      this.x = x;
      this.y = y;
      this.size = size;
      this.radius = RADII[size];
      const angle = rand(0, Math.PI * 2);
      const speed = SPEEDS[size] + rand(-15, 15);
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.rotSpeed = rand(-1.2, 1.2);
      this.rot = rand(0, Math.PI * 2);
      // Polígono irregular
      const n = randInt(8, 13);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const r = this.radius * rand(0.6, 1.0);
        this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
    }
    update(dt: number) {
      this.x = wrap(this.x + this.vx * dt, W);
      this.y = wrap(this.y + this.vy * dt, H);
      this.rot += this.rotSpeed * dt;
    }
    split(): Asteroid[] {
      if (this.size <= 1) return [];
      return [
        new Asteroid(this.x, this.y, this.size - 1),
        new Asteroid(this.x, this.y, this.size - 1),
      ];
    }
    draw() {
      g.save();
      g.translate(this.x, this.y);
      g.rotate(this.rot);
      g.strokeStyle = "#fff";
      g.lineWidth = 1.5;
      g.lineJoin = "round";
      g.beginPath();
      g.moveTo(this.verts[0][0], this.verts[0][1]);
      for (let i = 1; i < this.verts.length; i++) g.lineTo(this.verts[i][0], this.verts[i][1]);
      g.closePath();
      g.stroke();
      g.restore();
    }
  }
  // ── PowerUp ───────────────────────────────────────────────────────────────
  class PowerUp {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius = 12;
    ttl = POWERUP_TTL;
    dead = false;
    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
      const angle = rand(0, Math.PI * 2);
      const speed = rand(20, 40);
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
    }
    update(dt: number) {
      this.x = wrap(this.x + this.vx * dt, W);
      this.y = wrap(this.y + this.vy * dt, H);
      this.ttl -= dt;
      if (this.ttl <= 0) this.dead = true;
    }
    draw() {
      if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;
      const pulse = 0.85 + Math.sin(performance.now() / 150) * 0.15;
      g.save();
      g.translate(this.x, this.y);
      g.rotate(Math.PI / 4);
      g.strokeStyle = "#0ff";
      g.lineWidth = 2;
      const r = this.radius * pulse;
      g.strokeRect(-r, -r, r * 2, r * 2);
      g.restore();
      g.fillStyle = "#0ff";
      g.font = "bold 12px monospace";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("3x", this.x, this.y);
    }
  }
  // ── Ship ──────────────────────────────────────────────────────────────────
  class Ship {
    x = W / 2;
    y = H / 2;
    angle = -Math.PI / 2;
    vx = 0;
    vy = 0;
    radius = 12;
    thrusting = false;
    invincible = 3;
    shootCooldown = 0;
    dead = false;
    tripleShot = 0;
    reset() {
      this.x = W / 2;
      this.y = H / 2;
      this.angle = -Math.PI / 2;
      this.vx = 0;
      this.vy = 0;
      this.radius = 12;
      this.thrusting = false;
      this.invincible = 3;
      this.shootCooldown = 0;
      this.dead = false;
    }
    update(dt: number) {
      if (this.dead) return;
      if (this.invincible > 0) this.invincible -= dt;
      if (this.shootCooldown > 0) this.shootCooldown -= dt;
      if (this.tripleShot > 0) this.tripleShot -= dt;
      const ROT = 3.5; // rad/s
      const THRUST = 260; // px/s²
      const DRAG = 0.987;
      if (keys["ArrowLeft"]) this.angle -= ROT * dt;
      if (keys["ArrowRight"]) this.angle += ROT * dt;
      this.thrusting = !!keys["ArrowUp"];
      if (this.thrusting) {
        this.vx += Math.cos(this.angle) * THRUST * dt;
        this.vy += Math.sin(this.angle) * THRUST * dt;
      }
      this.vx *= DRAG;
      this.vy *= DRAG;
      this.x = wrap(this.x + this.vx * dt, W);
      this.y = wrap(this.y + this.vy * dt, H);
    }
    tryShoot(): Bullet[] {
      if (this.shootCooldown > 0 || this.dead) return [];
      this.shootCooldown = 0.2;
      const NOSE = 21;
      const ox = this.x + Math.cos(this.angle) * NOSE;
      const oy = this.y + Math.sin(this.angle) * NOSE;
      if (this.tripleShot > 0) {
        return [
          new Bullet(ox, oy, this.angle - TRIPLE_SPREAD),
          new Bullet(ox, oy, this.angle),
          new Bullet(ox, oy, this.angle + TRIPLE_SPREAD),
        ];
      }
      return [new Bullet(ox, oy, this.angle)];
    }
    draw() {
      if (this.dead) return;
      // Parpadeo durante invencibilidad de reaparición
      if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;
      g.save();
      g.translate(this.x, this.y);
      g.rotate(this.angle);
      g.strokeStyle = "#fff";
      g.lineWidth = 1.5;
      g.lineJoin = "round";
      // Silueta clásica: triángulo con muesca trasera
      g.beginPath();
      g.moveTo(20, 0); // nariz
      g.lineTo(-12, -9); // ala izquierda
      g.lineTo(-7, 0); // muesca trasera
      g.lineTo(-12, 9); // ala derecha
      g.closePath();
      g.stroke();
      // Llama del propulsor
      if (this.thrusting && Math.random() > 0.35) {
        g.beginPath();
        g.moveTo(-8, -4);
        g.lineTo(-8 - rand(6, 14), 0);
        g.lineTo(-8, 4);
        g.strokeStyle = "rgba(255, 130, 0, 0.85)";
        g.stroke();
      }
      g.restore();
    }
  }
  // ── Partículas (explosión) ────────────────────────────────────────────────
  class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    ttl: number;
    dead = false;
    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
      const angle = rand(0, Math.PI * 2);
      const speed = rand(30, 130);
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.life = rand(0.4, 1.1);
      this.ttl = this.life;
    }
    update(dt: number) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.ttl -= dt;
      if (this.ttl <= 0) this.dead = true;
    }
    draw() {
      const alpha = this.ttl / this.life;
      g.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(this.x, this.y);
      g.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
      g.stroke();
    }
  }
  // ── Estado del juego ──────────────────────────────────────────────────────
  let ship = new Ship();
  let bullets: Bullet[] = [];
  let asteroids: Asteroid[] = [];
  let particles: Particle[] = [];
  let powerUps: PowerUp[] = [];
  let score = 0;
  let lives = 3;
  let level = 1;
  let state: GameState = "playing";
  let deadTimer = 0;
  let powerUpSpawned = false;
  let killsSinceSpawn = 0;
  let paused = false;
  let destroyed = false;
  let gameOverNotified = false;
  let rafId = 0;
  let lastTime: number | null = null;
  let lastStats: { score: number; lives: number; level: number } | null = null;
  function emitStats() {
    if (
      lastStats &&
      lastStats.score === score &&
      lastStats.lives === lives &&
      lastStats.level === level
    )
      return;
    lastStats = { score, lives, level };
    cb.onStats({ score, lives, level });
  }
  function notifyGameOver() {
    if (gameOverNotified) return;
    gameOverNotified = true;
    cb.onGameOver(score);
  }
  function spawnAsteroids(count: number) {
    const SAFE_DIST = 130;
    for (let i = 0; i < count; i++) {
      let x: number, y: number;
      do {
        x = rand(0, W);
        y = rand(0, H);
      } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
      asteroids.push(new Asteroid(x, y, 3));
    }
  }
  function initGame() {
    ship = new Ship();
    bullets = [];
    asteroids = [];
    particles = [];
    powerUps = [];
    powerUpSpawned = false;
    killsSinceSpawn = 0;
    score = 0;
    lives = 3;
    level = 1;
    state = "playing";
    gameOverNotified = false;
    spawnAsteroids(4);
  }
  function nextLevel() {
    level++;
    bullets = [];
    particles = [];
    powerUps = [];
    powerUpSpawned = false;
    killsSinceSpawn = 0;
    ship.reset();
    spawnAsteroids(3 + level);
  }
  function explode(x: number, y: number, count = 8) {
    for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
  }
  function killShip() {
    explode(ship.x, ship.y, 14);
    ship.dead = true;
    lives--;
    if (lives <= 0) {
      state = "gameover";
      clearInput();
    } else {
      state = "dead";
      deadTimer = 2;
    }
  }
  // ── Update ────────────────────────────────────────────────────────────────
  function update(dt: number) {
    if (state === "gameover") {
      particles.forEach((p) => p.update(dt));
      particles = particles.filter((p) => !p.dead);
      return;
    }
    if (state === "dead") {
      deadTimer -= dt;
      particles.forEach((p) => p.update(dt));
      particles = particles.filter((p) => !p.dead);
      asteroids.forEach((a) => a.update(dt));
      if (deadTimer <= 0) {
        state = "playing";
        ship.reset();
      }
      return;
    }
    // Disparar
    if (pressed("Space")) {
      bullets.push(...ship.tryShoot());
    }
    ship.update(dt);
    bullets.forEach((b) => b.update(dt));
    asteroids.forEach((a) => a.update(dt));
    particles.forEach((p) => p.update(dt));
    powerUps.forEach((p) => p.update(dt));
    bullets = bullets.filter((b) => !b.dead);
    particles = particles.filter((p) => !p.dead);
    powerUps = powerUps.filter((p) => !p.dead);
    for (const p of powerUps) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        ship.tripleShot = POWERUP_DURATION;
      }
    }
    // Bala vs asteroide
    const newAsteroids: Asteroid[] = [];
    for (const b of bullets) {
      for (const a of asteroids) {
        if (!a.dead && !b.dead && dist(b, a) < a.radius) {
          b.dead = true;
          a.dead = true;
          score += POINTS[a.size];
          explode(a.x, a.y, a.size * 5);
          newAsteroids.push(...a.split());
          if (!powerUpSpawned) {
            killsSinceSpawn++;
            const guaranteed = killsSinceSpawn >= 5;
            if (guaranteed || Math.random() < POWERUP_DROP_CHANCE) {
              powerUps.push(new PowerUp(a.x, a.y));
              powerUpSpawned = true;
            }
          }
        }
      }
    }
    asteroids = asteroids.filter((a) => !a.dead).concat(newAsteroids);
    bullets = bullets.filter((b) => !b.dead);
    // Nave vs asteroide
    if (ship.invincible <= 0) {
      for (const a of asteroids) {
        if (dist(ship, a) < ship.radius + a.radius * 0.82) {
          killShip();
          break;
        }
      }
    }
    // Nivel completado
    if (state === "playing" && asteroids.length === 0) nextLevel();
  }
  // ── Draw ──────────────────────────────────────────────────────────────────
  function drawLifeIcon(x: number, y: number) {
    g.save();
    g.translate(x, y);
    g.rotate(-Math.PI / 2);
    g.strokeStyle = "#fff";
    g.lineWidth = 1.2;
    g.lineJoin = "round";
    g.beginPath();
    g.moveTo(9, 0);
    g.lineTo(-6, -5);
    g.lineTo(-3, 0);
    g.lineTo(-6, 5);
    g.closePath();
    g.stroke();
    g.restore();
  }
  function drawHUD() {
    g.fillStyle = "#fff";
    g.font = "15px monospace";
    g.textBaseline = "alphabetic";
    g.textAlign = "left";
    g.fillText(`SCORE  ${score}`, 14, 26);
    g.textAlign = "center";
    g.fillText(`NIVEL ${level}`, W / 2, 26);
    for (let i = 0; i < lives; i++) drawLifeIcon(W - 16 - i * 22, 18);
    if (ship.tripleShot > 0) {
      g.textAlign = "left";
      g.fillStyle = "#0ff";
      g.fillText(`3x  ${ship.tripleShot.toFixed(1)}s`, 14, 46);
    }
  }
  function drawOverlay(title: string, sub?: string) {
    g.textAlign = "center";
    g.textBaseline = "alphabetic";
    g.fillStyle = "#fff";
    g.font = "bold 46px monospace";
    g.fillText(title, W / 2, H / 2 - 18);
    if (sub) {
      g.font = "18px monospace";
      g.fillStyle = "rgba(255,255,255,0.65)";
      g.fillText(sub, W / 2, H / 2 + 22);
    }
  }
  function draw() {
    // Resolución lógica 800×600; el tamaño real del bitmap (× DPR) lo fija el
    // componente, aquí solo se ajusta la escala.
    g.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    g.fillStyle = "#000";
    g.fillRect(0, 0, W, H);
    particles.forEach((p) => p.draw());
    asteroids.forEach((a) => a.draw());
    powerUps.forEach((p) => p.draw());
    bullets.forEach((b) => b.draw());
    ship.draw();
    drawHUD();
    if (state === "gameover") drawOverlay("GAME OVER", `PUNTAJE: ${score}`);
    else if (paused) drawOverlay("EN PAUSA");
  }
  // ── Loop principal ────────────────────────────────────────────────────────
  function loop(ts: number) {
    if (destroyed) return;
    const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;
    if (paused || state === "gameover") {
      for (const k of Object.keys(justPressed)) justPressed[k] = false;
    }
    if (!paused) update(dt);
    draw();
    emitStats();
    if (state === "gameover") notifyGameOver();
    rafId = requestAnimationFrame(loop);
  }
  // ── API pública ───────────────────────────────────────────────────────────
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  initGame();
  emitStats();
  rafId = requestAnimationFrame(loop);
  return {
    pause() {
      if (paused) return;
      paused = true;
      clearInput();
    },
    resume() {
      if (!paused) return;
      paused = false;
      lastTime = null; // evita un dt gigante tras la pausa
      clearInput();
    },
    restart() {
      initGame();
      paused = false;
      lastTime = null;
      clearInput();
      emitStats();
    },
    end() {
      if (state === "gameover") return;
      state = "gameover";
      paused = false;
      clearInput();
      notifyGameOver();
    },
    setKey(code: string, down: boolean) {
      if (paused || state === "gameover") return;
      keyChange(code, down);
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    },
  };
}
