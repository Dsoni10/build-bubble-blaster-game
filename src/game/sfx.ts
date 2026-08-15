// Lightweight synthesized sound effects using the Web Audio API.
// No external audio assets required — keeps the bundle tiny and loads instantly.

let ctx: AudioContext | null = null;
let muted = false;

const MUTE_KEY = 'bubbleBlaster.muted';

try {
  muted = localStorage.getItem(MUTE_KEY) === '1';
} catch {
  muted = false;
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function toggleMuted(): boolean {
  setMuted(!muted);
  return muted;
}

interface ToneOpts {
  freq: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
  slideTo?: number;
  delay?: number;
}

function tone({ freq, duration, type = 'sine', volume = 0.2, slideTo, delay = 0 }: ToneOpts) {
  if (muted) return;
  const audio = getCtx();
  if (!audio) return;
  const t0 = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + duration);
  }
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function playShoot() {
  tone({ freq: 620, duration: 0.09, type: 'triangle', volume: 0.09, slideTo: 900 });
}

export function playPop(size: 0 | 1 | 2) {
  const base = size === 0 ? 220 : size === 1 ? 320 : 460;
  tone({ freq: base, duration: 0.16, type: 'sine', volume: 0.18, slideTo: base * 1.8 });
  tone({ freq: base * 1.5, duration: 0.12, type: 'triangle', volume: 0.08, slideTo: base * 2.4, delay: 0.02 });
}

export function playHit() {
  tone({ freq: 160, duration: 0.35, type: 'sawtooth', volume: 0.22, slideTo: 40 });
}

export function playPowerup() {
  tone({ freq: 440, duration: 0.12, type: 'square', volume: 0.12, slideTo: 660, delay: 0 });
  tone({ freq: 660, duration: 0.14, type: 'square', volume: 0.12, slideTo: 990, delay: 0.08 });
}

export function playGameOver() {
  tone({ freq: 300, duration: 0.5, type: 'sawtooth', volume: 0.2, slideTo: 60 });
  tone({ freq: 220, duration: 0.6, type: 'sine', volume: 0.15, slideTo: 40, delay: 0.1 });
}

export function playCombo(step: number) {
  const freq = 500 + Math.min(step, 10) * 60;
  tone({ freq, duration: 0.09, type: 'square', volume: 0.1 });
}

export function playPause() {
  tone({ freq: 500, duration: 0.08, type: 'sine', volume: 0.1, slideTo: 300 });
}

export function playStart() {
  tone({ freq: 300, duration: 0.1, type: 'triangle', volume: 0.12, slideTo: 500 });
  tone({ freq: 500, duration: 0.14, type: 'triangle', volume: 0.12, slideTo: 800, delay: 0.08 });
}
