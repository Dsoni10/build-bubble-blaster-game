import { useEffect, useRef, useState } from 'react';
import type { HighScoreEntry } from '../game/types';
import { NeonButton } from './NeonButton';
import { HighScoresList } from './HighScoresList';

interface Props {
  score: number;
  best: number;
  qualifies: boolean;
  submitted: boolean;
  scores: HighScoreEntry[];
  rank: number | null;
  onSubmitName: (name: string) => void;
  onRestart: () => void;
  onMenu: () => void;
}

export function GameOverScreen({
  score,
  best,
  qualifies,
  submitted,
  scores,
  rank,
  onSubmitName,
  onRestart,
  onMenu,
}: Props) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (qualifies && !submitted) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [qualifies, submitted]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Enter' && (!qualifies || submitted)) {
        onRestart();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [qualifies, submitted, onRestart]);

  return (
    <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center overflow-y-auto bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <h2 className="text-3xl font-black uppercase tracking-widest text-rose-300 drop-shadow-[0_0_20px_rgba(255,90,120,0.6)]">
          Game Over
        </h2>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-200/70">Score</p>
          <p className="font-mono text-4xl font-black text-white">{score.toLocaleString()}</p>
          <p className="mt-1 text-xs text-cyan-100/50">Best: {best.toLocaleString()}</p>
        </div>

        {qualifies && !submitted && (
          <form
            className="mt-4 flex w-full flex-col items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmitName(name);
            }}
          >
            <p className="animate-pulse-slow text-sm font-extrabold uppercase tracking-wide text-amber-300">
              🎉 New High Score! Enter your name
            </p>
            <input
              ref={inputRef}
              maxLength={12}
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="PLAYER"
              className="w-full rounded-xl border border-cyan-300/40 bg-slate-900/80 px-4 py-2 text-center text-lg font-bold uppercase tracking-widest text-cyan-100 outline-none focus:border-cyan-300"
            />
            <NeonButton type="submit" className="w-full">
              Save Score
            </NeonButton>
          </form>
        )}

        <div className="mt-5 w-full rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-2 text-sm font-extrabold uppercase tracking-widest text-cyan-200">
            🏆 High Scores
          </h3>
          <HighScoresList scores={scores.slice(0, 6)} highlightIndex={rank ?? undefined} />
        </div>

        <div className="mt-6 flex w-full gap-3">
          <NeonButton onClick={onRestart} className="flex-1">
            ⟲ Play Again
          </NeonButton>
          <NeonButton variant="secondary" onClick={onMenu} className="flex-1">
            🏠 Menu
          </NeonButton>
        </div>
        <p className="mt-3 text-[11px] text-cyan-100/40">Press Enter to instantly replay</p>
      </div>
    </div>
  );
}
