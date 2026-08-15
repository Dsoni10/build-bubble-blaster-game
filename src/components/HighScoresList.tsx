import type { HighScoreEntry } from '../game/types';

interface Props {
  scores: HighScoreEntry[];
  highlightIndex?: number;
  compact?: boolean;
}

export function HighScoresList({ scores, highlightIndex, compact }: Props) {
  if (scores.length === 0) {
    return (
      <p className="py-3 text-center text-sm text-cyan-100/50">
        No scores yet — be the first legend!
      </p>
    );
  }

  return (
    <ol className={compact ? 'space-y-1' : 'space-y-1.5'}>
      {scores.map((entry, i) => (
        <li
          key={`${entry.name}-${entry.date}-${i}`}
          className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm ${
            i === highlightIndex
              ? 'bg-cyan-400/20 text-cyan-100 ring-1 ring-cyan-300/70'
              : 'bg-white/5 text-cyan-50/80'
          }`}
        >
          <span className="flex items-center gap-2 font-semibold">
            <span className="w-5 text-right text-cyan-300/70">{i + 1}.</span>
            <span className="tracking-wide">{entry.name}</span>
          </span>
          <span className="font-mono font-bold text-white">{entry.score.toLocaleString()}</span>
        </li>
      ))}
    </ol>
  );
}
