import type { EngineCallbacks, GameStatus, PowerupType } from './types';
import { playCombo, playGameOver, playHit, playPop, playPowerup, playShoot } from './sfx';

interface Bubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  tier: 0 | 1 | 2;
  hue: number;
  wobble: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  r: number;
  color: string;
  gravity: number;
}

interface FloatingText {
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  text: string;
  color: string;
  size: number;
}

interface Powerup {
  x: number;
  y: number;
  vy: number;
  r: number;
  type: PowerupType;
  spin: number;
}

interface Star {
  x: number;
  y: number;
  r: number;
  speed: number;
  alpha: number;
}

const TIER_RADIUS: [number, number, number] = [44, 30, 18];
const TIER_SCORE: [number, number, number] = [10, 20, 40];
const HUES = [190, 320, 45, 145, 265, 5];
const GRAVITY = 620;
const COMBO_WINDOW = 1.1;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class BubbleBlasterEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;

  width = 0;
  height = 0;
  private dpr = 1;

  status: GameStatus = 'demo';
  private rafId = 0;
  private lastTime = 0;
  private running = true;

  private player = { x: 0, y: 0, w: 46, h: 34, invulnerableUntil: 0 };
  private lives = 3;
  private hasPlayer = false;

  private keys = new Set<string>();
  private moveDir = 0;
  private controlMode: 'keys' | 'pointer' = 'keys';
  private pointerTargetX: number | null = null;
  private firing = false;
  private fireCooldown = 0;

  private bubbles: Bubble[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private texts: FloatingText[] = [];
  private powerups: Powerup[] = [];
  private stars: Star[] = [];

  private score = 0;
  private combo = 0;
  private comboTimer = 0;

  private elapsed = 0;
  private spawnTimer = 1.2;
  private wave = 1;

  private trauma = 0;
  private flash = 0;

  private buffs = { rapidUntil: 0, multiUntil: 0, shieldUntil: 0 };

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.callbacks = callbacks;
    this.seedStars();
    this.seedDemoBubbles();
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  // ---------- lifecycle ----------

  resize(width: number, height: number, dpr: number) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.player.y = height - Math.max(64, height * 0.1);
    if (this.stars.length === 0 || Math.random() < 0.02) this.seedStars();
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  start() {
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.elapsed = 0;
    this.spawnTimer = 0.4;
    this.wave = 1;
    this.lives = 3;
    this.trauma = 0;
    this.flash = 0;
    this.buffs = { rapidUntil: 0, multiUntil: 0, shieldUntil: 0 };
    this.bubbles = [];
    this.projectiles = [];
    this.particles = [];
    this.texts = [];
    this.powerups = [];
    this.player.x = this.width / 2;
    this.player.invulnerableUntil = performance.now() + 800;
    this.hasPlayer = true;
    this.status = 'playing';
    this.callbacks.onScoreChange?.(0);
    this.callbacks.onLivesChange?.(this.lives);
    this.callbacks.onComboChange?.(0);
    this.callbacks.onWaveChange?.(this.wave);
    // Instant action: a few bubbles already tumbling in.
    this.spawnBubble(0, this.width * 0.25, -40);
    this.spawnBubble(0, this.width * 0.75, -140);
    this.spawnBubble(0, this.width * 0.5, -260);
  }

  startDemo() {
    this.status = 'demo';
    this.hasPlayer = false;
    this.seedDemoBubbles();
  }

  pause() {
    if (this.status === 'playing') this.status = 'paused';
  }

  resume() {
    if (this.status === 'paused') {
      this.status = 'playing';
      this.lastTime = performance.now();
    }
  }

  setStatusGameOver() {
    this.status = 'gameover';
    this.spawnParticles(this.player.x, this.player.y, '#ff5577', 46, 2.4);
    this.addTrauma(1);
    this.flash = 1;
    playGameOver();
  }

  // ---------- input ----------

  setKey(code: string, down: boolean) {
    if (down) this.keys.add(code);
    else this.keys.delete(code);
    this.controlMode = 'keys';
    const left = this.keys.has('ArrowLeft') || this.keys.has('KeyA');
    const right = this.keys.has('ArrowRight') || this.keys.has('KeyD');
    this.moveDir = (right ? 1 : 0) - (left ? 1 : 0);
    if (code === 'Space') this.firing = down;
  }

  setPointer(x: number | null, active: boolean) {
    if (x !== null) {
      this.controlMode = 'pointer';
      this.pointerTargetX = x;
    }
    this.firing = active || this.keys.has('Space');
  }

  // ---------- private setup ----------

  private seedStars() {
    this.stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * (this.width || 400),
      y: Math.random() * (this.height || 800),
      r: rand(0.6, 2.2),
      speed: rand(6, 22),
      alpha: rand(0.25, 0.9),
    }));
  }

  private seedDemoBubbles() {
    this.bubbles = [];
    for (let i = 0; i < 5; i++) {
      this.spawnBubble(
        Math.floor(rand(0, 3)) as 0 | 1 | 2,
        rand(40, (this.width || 400) - 40),
        rand(-200, (this.height || 800) * 0.6),
      );
    }
  }

  private spawnBubble(tier: 0 | 1 | 2, x?: number, y?: number, vx?: number, vy?: number) {
    const r = TIER_RADIUS[tier];
    this.bubbles.push({
      x: x ?? rand(r, (this.width || 400) - r),
      y: y ?? -r - rand(0, 60),
      vx: vx ?? rand(-90, 90) * (tier === 0 ? 1 : 1.3),
      vy: vy ?? rand(-20, 60),
      r,
      tier,
      hue: pick(HUES),
      wobble: Math.random() * Math.PI * 2,
    });
  }

  private addTrauma(amount: number) {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  private spawnParticles(x: number, y: number, color: string, count: number, speedScale = 1) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = rand(40, 260) * speedScale;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rand(0.35, 0.9),
        maxLife: 0.9,
        r: rand(2, 5.5),
        color,
        gravity: rand(120, 260),
      });
    }
  }

  private spawnText(x: number, y: number, text: string, color: string, size = 20) {
    this.texts.push({ x, y, vy: -60, life: 0.9, maxLife: 0.9, text, color, size });
  }

  private hueColor(hue: number, light = 60) {
    return `hsl(${hue}, 90%, ${light}%)`;
  }

  private maybeSpawnPowerup(x: number, y: number) {
    if (Math.random() > 0.13) return;
    const types: PowerupType[] = ['rapid', 'multi', 'shield', 'life'];
    this.powerups.push({ x, y, vy: 70, r: 16, type: pick(types), spin: 0 });
  }

  private popBubble(bubble: Bubble, index: number) {
    const color = this.hueColor(bubble.hue);
    this.spawnParticles(bubble.x, bubble.y, color, bubble.tier === 0 ? 26 : bubble.tier === 1 ? 18 : 12, 1 + bubble.tier * 0.3);
    this.addTrauma(bubble.tier === 0 ? 0.32 : bubble.tier === 1 ? 0.18 : 0.1);
    playPop(bubble.tier);

    if (this.status === 'playing') {
      this.combo += 1;
      this.comboTimer = COMBO_WINDOW;
      const multiplier = 1 + Math.min(2, (this.combo - 1) * 0.15);
      const gained = Math.round(TIER_SCORE[bubble.tier] * multiplier);
      this.score += gained;
      this.callbacks.onScoreChange?.(this.score);
      this.callbacks.onComboChange?.(this.combo);
      this.spawnText(bubble.x, bubble.y, `+${gained}`, color, this.combo > 3 ? 26 : 18);
      if (this.combo > 1 && this.combo % 3 === 0) {
        playCombo(this.combo);
        this.spawnText(bubble.x, bubble.y - 26, `${this.combo}x COMBO!`, '#ffe066', 16);
      }
      this.maybeSpawnPowerup(bubble.x, bubble.y);
    }

    this.bubbles.splice(index, 1);

    if (bubble.tier < 2 && this.status !== 'gameover') {
      const newTier = (bubble.tier + 1) as 0 | 1 | 2;
      for (let i = 0; i < 2; i++) {
        this.bubbles.push({
          x: bubble.x,
          y: bubble.y,
          vx: (i === 0 ? -1 : 1) * rand(90, 190),
          vy: -rand(180, 320),
          r: TIER_RADIUS[newTier],
          tier: newTier,
          hue: bubble.hue,
          wobble: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  private applyPowerup(type: PowerupType) {
    const now = performance.now();
    playPowerup();
    if (type === 'rapid') {
      this.buffs.rapidUntil = now + 8000;
      this.spawnText(this.player.x, this.player.y - 40, 'RAPID FIRE!', '#7CFC00', 18);
    } else if (type === 'multi') {
      this.buffs.multiUntil = now + 9000;
      this.spawnText(this.player.x, this.player.y - 40, 'MULTI SHOT!', '#4dd2ff', 18);
    } else if (type === 'shield') {
      this.buffs.shieldUntil = now + 6000;
      this.spawnText(this.player.x, this.player.y - 40, 'SHIELD UP!', '#ffe066', 18);
    } else if (type === 'life') {
      this.lives = Math.min(5, this.lives + 1);
      this.callbacks.onLivesChange?.(this.lives);
      this.spawnText(this.player.x, this.player.y - 40, '+1 LIFE', '#ff6bd6', 18);
    }
  }

  private fire(now: number) {
    const speed = -640;
    const multi = now < this.buffs.multiUntil;
    if (multi) {
      [-150, 0, 150].forEach((vx) => {
        this.projectiles.push({ x: this.player.x, y: this.player.y - 22, vx, vy: speed, r: 6 });
      });
    } else {
      this.projectiles.push({ x: this.player.x, y: this.player.y - 22, vx: 0, vy: speed, r: 6 });
    }
    this.spawnParticles(this.player.x, this.player.y - 20, '#bff7ff', 4, 0.5);
    playShoot();
  }

  // ---------- loop ----------

  private loop = (time: number) => {
    if (!this.running) return;
    const dt = Math.min(1 / 30, (time - this.lastTime) / 1000 || 0);
    this.lastTime = time;
    this.update(dt, time);
    this.render();
    this.rafId = requestAnimationFrame(this.loop);
  };

  private update(dt: number, now: number) {
    // Ambient stars always drift, even when paused, for a living background.
    for (const s of this.stars) {
      s.y += s.speed * dt;
      if (s.y > this.height) {
        s.y = -4;
        s.x = Math.random() * this.width;
      }
    }

    if (this.status === 'paused') return;

    const active = this.status === 'playing';

    if (active) {
      this.elapsed += dt;
      // difficulty ramp
      const spawnInterval = Math.max(0.5, 1.8 - this.elapsed * 0.015);
      const maxBubbles = Math.min(11, 3 + Math.floor(this.elapsed / 10));
      const newWave = 1 + Math.floor(this.elapsed / 20);
      if (newWave !== this.wave) {
        this.wave = newWave;
        this.callbacks.onWaveChange?.(this.wave);
        this.spawnText(this.width / 2, this.height * 0.3, `WAVE ${this.wave}`, '#9be8ff', 26);
      }
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.bubbles.length < maxBubbles) {
        this.spawnBubble(0);
        this.spawnTimer = spawnInterval * rand(0.75, 1.25);
      }

      // player movement
      const speed = 560;
      if (this.controlMode === 'pointer' && this.pointerTargetX !== null) {
        const dx = this.pointerTargetX - this.player.x;
        const maxStep = speed * dt * 1.6;
        this.player.x += Math.max(-maxStep, Math.min(maxStep, dx));
      } else {
        this.player.x += this.moveDir * speed * dt;
      }
      const margin = this.player.w / 2 + 4;
      this.player.x = Math.max(margin, Math.min(this.width - margin, this.player.x));

      // firing
      this.fireCooldown -= dt;
      const cooldownTime = now < this.buffs.rapidUntil ? 0.11 : 0.26;
      if (this.firing && this.fireCooldown <= 0) {
        this.fire(now);
        this.fireCooldown = cooldownTime;
      }

      // combo timeout
      if (this.combo > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
          this.combo = 0;
          this.callbacks.onComboChange?.(0);
        }
      }
    }

    // projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y < -20 || p.x < -20 || p.x > this.width + 20) {
        this.projectiles.splice(i, 1);
      }
    }

    // bubbles physics (also runs in demo/gameover for ambient life)
    const floorY = this.height - 4;
    for (const b of this.bubbles) {
      b.vy += GRAVITY * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.wobble += dt * 4;
      if (b.x - b.r < 0) {
        b.x = b.r;
        b.vx = Math.abs(b.vx);
      } else if (b.x + b.r > this.width) {
        b.x = this.width - b.r;
        b.vx = -Math.abs(b.vx);
      }
      if (b.y + b.r > floorY) {
        b.y = floorY - b.r;
        b.vy = -Math.abs(b.vy) * 0.96;
        if (Math.abs(b.vy) < 260) b.vy = -rand(300, 420);
      }
      if (b.y - b.r < -140) {
        b.y = -140 + b.r;
        b.vy = Math.abs(b.vy) * 0.5;
      }
    }

    // powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pu = this.powerups[i];
      pu.y += pu.vy * dt;
      pu.spin += dt * 3;
      if (pu.y > this.height + 30) this.powerups.splice(i, 1);
    }

    if (active) {
      this.checkCollisions(now);
    }

    // particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pa = this.particles[i];
      pa.vy += pa.gravity * dt;
      pa.x += pa.vx * dt;
      pa.y += pa.vy * dt;
      pa.life -= dt;
      if (pa.life <= 0) this.particles.splice(i, 1);
    }

    // floating texts
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.y += t.vy * dt;
      t.life -= dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }

    // trauma / flash decay
    this.trauma = Math.max(0, this.trauma - dt * 1.8);
    this.flash = Math.max(0, this.flash - dt * 1.5);
  }

  private checkCollisions(now: number) {
    // projectile vs bubble
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      for (let j = this.projectiles.length - 1; j >= 0; j--) {
        const p = this.projectiles[j];
        const dx = p.x - b.x;
        const dy = p.y - b.y;
        if (dx * dx + dy * dy < (b.r + p.r) * (b.r + p.r)) {
          this.projectiles.splice(j, 1);
          this.popBubble(b, i);
          break;
        }
      }
    }

    // player vs powerup
    if (this.hasPlayer) {
      for (let i = this.powerups.length - 1; i >= 0; i--) {
        const pu = this.powerups[i];
        const dx = pu.x - this.player.x;
        const dy = pu.y - this.player.y;
        if (dx * dx + dy * dy < (pu.r + 22) * (pu.r + 22)) {
          this.applyPowerup(pu.type);
          this.powerups.splice(i, 1);
        }
      }
    }

    // player vs bubble
    if (this.hasPlayer && now > this.player.invulnerableUntil && now > this.buffs.shieldUntil) {
      const pr = this.player.w * 0.42;
      for (const b of this.bubbles) {
        const dx = b.x - this.player.x;
        const dy = b.y - this.player.y;
        if (dx * dx + dy * dy < (b.r + pr) * (b.r + pr)) {
          this.lives -= 1;
          this.callbacks.onLivesChange?.(this.lives);
          this.player.invulnerableUntil = now + 1700;
          this.addTrauma(0.85);
          this.flash = 0.6;
          playHit();
          this.combo = 0;
          this.callbacks.onComboChange?.(0);
          b.vy = -Math.abs(b.vy) - 200;
          if (this.lives <= 0) {
            this.callbacks.onGameOver?.(this.score);
            this.setStatusGameOver();
          }
          break;
        }
      }
    }
  }

  // ---------- render ----------

  private render() {
    const { ctx, width, height } = this;
    if (width === 0 || height === 0) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#0b1030');
    bg.addColorStop(0.55, '#131a3d');
    bg.addColorStop(1, '#1c1440');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // stars
    ctx.save();
    for (const s of this.stars) {
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = '#bfe3ff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // screen shake
    ctx.save();
    if (this.trauma > 0) {
      const power = this.trauma * this.trauma;
      const maxOffset = 18;
      const sx = (Math.random() * 2 - 1) * maxOffset * power;
      const sy = (Math.random() * 2 - 1) * maxOffset * power;
      const rot = (Math.random() * 2 - 1) * 0.03 * power;
      ctx.translate(width / 2, height / 2);
      ctx.rotate(rot);
      ctx.translate(-width / 2 + sx, -height / 2 + sy);
    }

    // floor glow line
    const floorY = height - 4;
    const floorGrad = ctx.createLinearGradient(0, floorY - 40, 0, floorY + 4);
    floorGrad.addColorStop(0, 'rgba(90, 210, 255, 0)');
    floorGrad.addColorStop(1, 'rgba(90, 210, 255, 0.18)');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorY - 40, width, 44);

    // powerups
    for (const pu of this.powerups) {
      ctx.save();
      ctx.translate(pu.x, pu.y);
      ctx.rotate(pu.spin);
      const colorMap: Record<PowerupType, string> = {
        rapid: '#7CFC00',
        multi: '#4dd2ff',
        shield: '#ffe066',
        life: '#ff6bd6',
      };
      const c = colorMap[pu.type];
      ctx.shadowColor = c;
      ctx.shadowBlur = 18;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(0, -pu.r);
      for (let i = 1; i < 6; i++) {
        const ang = (i * Math.PI * 2) / 6 - Math.PI / 2;
        ctx.lineTo(Math.cos(ang) * pu.r, Math.sin(ang) * pu.r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // bubbles
    for (const b of this.bubbles) {
      const wob = Math.sin(b.wobble) * 2;
      ctx.save();
      ctx.translate(b.x, b.y);
      const grad = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.35, b.r * 0.1, 0, 0, b.r + wob);
      grad.addColorStop(0, `hsla(${b.hue}, 100%, 85%, 0.95)`);
      grad.addColorStop(0.55, `hsla(${b.hue}, 90%, 60%, 0.85)`);
      grad.addColorStop(1, `hsla(${b.hue}, 85%, 40%, 0.55)`);
      ctx.fillStyle = grad;
      ctx.shadowColor = `hsla(${b.hue}, 100%, 60%, 0.7)`;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, 0, b.r + wob * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = `hsla(${b.hue}, 100%, 90%, 0.5)`;
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.ellipse(-b.r * 0.32, -b.r * 0.35, b.r * 0.28, b.r * 0.16, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // projectiles
    for (const p of this.projectiles) {
      ctx.save();
      ctx.shadowColor = '#8ff5ff';
      ctx.shadowBlur = 12;
      const grad = ctx.createLinearGradient(p.x, p.y - 14, p.x, p.y + 8);
      grad.addColorStop(0, 'rgba(180,255,255,0)');
      grad.addColorStop(1, '#c8fbff');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.r * 0.6, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // particles
    for (const pa of this.particles) {
      ctx.globalAlpha = Math.max(0, pa.life / pa.maxLife);
      ctx.fillStyle = pa.color;
      ctx.beginPath();
      ctx.arc(pa.x, pa.y, pa.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // player
    if (this.hasPlayer && this.status !== 'demo') {
      const now = performance.now();
      const invuln = now < this.player.invulnerableUntil || now < this.buffs.shieldUntil;
      const flicker = invuln && Math.floor(now / 80) % 2 === 0;
      ctx.save();
      ctx.globalAlpha = flicker ? 0.45 : 1;
      ctx.translate(this.player.x, this.player.y);

      if (now < this.buffs.shieldUntil) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 224, 102, 0.8)';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ffe066';
        ctx.shadowBlur = 20;
        ctx.arc(0, -4, 34, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.shadowColor = '#54e0ff';
      ctx.shadowBlur = 18;
      const grad = ctx.createLinearGradient(0, -22, 0, 16);
      grad.addColorStop(0, '#9df7ff');
      grad.addColorStop(1, '#2a7fd6');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(24, 16);
      ctx.lineTo(10, 10);
      ctx.lineTo(0, 18);
      ctx.lineTo(-10, 10);
      ctx.lineTo(-24, 16);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.stroke();
      ctx.restore();
    }

    // floating texts
    for (const t of this.texts) {
      ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
      ctx.fillStyle = t.color;
      ctx.font = `800 ${t.size}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 6;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    // hit flash overlay
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 60, 90, ${this.flash * 0.35})`;
      ctx.fillRect(0, 0, width, height);
    }
  }
}
