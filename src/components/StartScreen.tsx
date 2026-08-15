import { useState } from 'react';
import type { HighScoreEntry } from '../game/types';
import { NeonButton } from './NeonButton';
import { HighScoresList } from './HighScoresList';
import { isMuted, toggleMuted } from '../game/sfx';

interface Props {
  scores: HighScoreEntry[];
  onPlay: () => void;
}

export function StartScreen({ scores, onPlay }: Props) {
  const [muted, setMutedState] = useState(isMuted());

  return (
    <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-8 backdrop-blur-sm">
      <button
        onClick={() => setMutedState(toggleMuted())}
        className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/10 p-2.5 text-lg text-cyan-100 shadow-lg backdrop-blur transition hover:bg-white/20"
        aria-label="Toggle sound"
      >
        {muted ? '🔇' : '🔊'}
      </button>

      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="relative mb-1 select-none">
          <div className="absolute inset-0 -z-10 animate-pulse-slow rounded-full bg-cyan-400/30 blur-3xl" />
          <div className="text-6xl drop-shadow-[0_0_20px_rgba(103,232,249,0.8)]">🫧</div>
        </div>
        <h1
          className="bubble-title bg-gradient-to-b from-cyan-200 via-cyan-300 to-sky-500 bg-clip-text text-5xl font-black tracking-tight text-transparent drop-shadow-[0_4px_20px_rgba(56,224,255,0.45)] sm:text-6xl"
        >
          BUBBLE
          <br />
          BLASTER
        </h1>
        <p className="mt-3 max-w-xs text-sm font-medium text-cyan-100/70">
          Pop the drifting bubbles before they touch you. Chain combos, grab power-ups, and chase
          the high score!
        </p>

        <NeonButton onClick={onPlay} className="mt-7 w-52 animate-pulse-slow text-xl">
          ▶ Play
        </NeonButton>

        <div className="mt-6 grid w-full grid-cols-2 gap-3 text-left text-xs text-cyan-100/70">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="mb-1 font-bold text-cyan-200">⌨️ Keyboard</p>
            <p>← → or A/D to move</p>
            <p>Space to shoot</p>
            <p>P / Esc to pause</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="mb-1 font-bold text-cyan-200">👆 Touch</p>
            <p>Drag to move</p>
            <p>Hold to fire</p>
            <p>Tap ⏸ to pause</p>
          </div>
        </div>

        <div className="mt-7 w-full rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="mb-2 text-sm font-extrabold uppercase tracking-widest text-cyan-200">
            🏆 High Scores
          </h2>
          <HighScoresList scores={scores.slice(0, 5)} />
        </div>
      </div>
    </div>
  );
}
