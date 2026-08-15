interface Props {
  score: number;
  lives: number;
  combo: number;
  wave: number;
  onPause: () => void;
  showTip: boolean;
}

export function HUD({ score, lives, combo, wave, onPause, showTip }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className="flex items-start justify-between p-3 sm:p-4"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="pointer-events-none flex flex-col gap-1.5">
          <div className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-1.5 font-mono text-xl font-bold text-cyan-100 shadow-lg backdrop-blur">
            {score.toLocaleString()}
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.max(lives, 0) }).map((_, i) => (
              <span key={i} className="text-lg drop-shadow-[0_0_6px_rgba(255,120,180,0.8)]">
                🫧
              </span>
            ))}
          </div>
        </div>

        <div className="pointer-events-none flex flex-col items-center gap-1">
          {combo > 1 && (
            <div className="animate-combo-pop rounded-full bg-amber-400/90 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-900 shadow-lg">
              {combo}x combo
            </div>
          )}
          <div className="rounded-lg bg-white/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-cyan-200/80">
            Wave {wave}
          </div>
        </div>

        <button
          onClick={onPause}
          className="pointer-events-auto rounded-full border border-white/20 bg-white/10 p-2.5 text-lg text-cyan-100 shadow-lg backdrop-blur transition hover:bg-white/20 active:scale-90"
          aria-label="Pause"
        >
          ⏸
        </button>
      </div>

      {showTip && (
        <div className="absolute left-1/2 top-20 -translate-x-1/2 animate-fade-in-out rounded-full bg-slate-950/60 px-4 py-2 text-xs font-semibold text-cyan-100/90 backdrop-blur">
          Drag / arrow keys to move · Hold to shoot
        </div>
      )}
    </div>
  );
}
