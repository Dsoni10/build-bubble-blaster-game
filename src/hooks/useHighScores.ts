import { useCallback, useEffect, useState } from 'react';
import type { HighScoreEntry } from '../game/types';

const STORAGE_KEY = 'bubbleBlaster.highScores.v1';
const MAX_ENTRIES = 8;

function load(): HighScoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function save(entries: HighScoreEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* storage unavailable, ignore */
  }
}

export function useHighScores() {
  const [scores, setScores] = useState<HighScoreEntry[]>([]);

  useEffect(() => {
    setScores(load());
  }, []);

  const addScore = useCallback((name: string, score: number) => {
    const entry: HighScoreEntry = {
      name: name.trim().slice(0, 12) || 'PLAYER',
      score,
      date: new Date().toISOString(),
    };
    const updated = [...load(), entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_ENTRIES);
    save(updated);
    setScores(updated);
    const rank = updated.findIndex((e) => e === entry);
    return { list: updated, rank };
  }, []);

  const isHighScore = useCallback((score: number) => {
    const current = load();
    if (current.length < MAX_ENTRIES) return score > 0;
    return score > current[current.length - 1].score;
  }, []);

  const clearScores = useCallback(() => {
    save([]);
    setScores([]);
  }, []);

  return { scores, addScore, isHighScore, clearScores };
}
