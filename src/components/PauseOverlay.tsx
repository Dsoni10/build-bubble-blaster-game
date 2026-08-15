import { useState } from 'react';
import { NeonButton } from './NeonButton';
import { isMuted, toggleMuted } from '../game/sfx';

interface Props {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
}

export function PauseOverlay({ onResume, onRestart, onMenu }: Props) {
  const [muted, setMutedState] = useState(isMuted());

  return (
    <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center bg-slate-950/75 backdrop-blur-sm">
      <h2 className="mb-6 text-4xl font-black uppercase tracking-widest text-cyan-100 drop-shadow-[0_0_20px_rgba(56,224,255,0.6)]">
        Paused
      </h2>
      <div className="flex w-56 flex-col gap-3">
        <NeonButton onClick={onResume}>▶ Resume</NeonButton>
        <NeonButton variant="secondary" onClick={onRestart}>
          ⟲ Restart
        </NeonButton>
        <NeonButton
          variant="secondary"
          onClick={() => setMutedState(toggleMuted())}
        >
          {muted ? '🔇 Sound Off' : '🔊 Sound On'}
        </NeonButton>
        <NeonButton variant="ghost" onClick={onMenu}>
          🏠 Main Menu
        </NeonButton>
      </div>
    </div>
  );
}
