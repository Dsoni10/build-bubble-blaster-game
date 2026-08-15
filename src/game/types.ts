export type GameStatus = 'demo' | 'playing' | 'paused' | 'gameover';

export interface HighScoreEntry {
  name: string;
  score: number;
  date: string;
}

export interface EngineCallbacks {
  onScoreChange?: (score: number) => void;
  onLivesChange?: (lives: number) => void;
  onComboChange?: (combo: number) => void;
  onGameOver?: (finalScore: number) => void;
  onWaveChange?: (wave: number) => void;
}

export type PowerupType = 'rapid' | 'multi' | 'shield' | 'life';
