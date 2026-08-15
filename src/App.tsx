import { useCallback, useEffect, useRef, useState } from 'react';
import { GameCanvas, type GameCanvasHandle } from './game/GameCanvas';
import { StartScreen } from './components/StartScreen';
import { HUD } from './components/HUD';
import { PauseOverlay } from './components/PauseOverlay';
import { GameOverScreen } from './components/GameOverScreen';
import { useHighScores } from './hooks/useHighScores';
import { playPause, playStart } from './game/sfx';

type Screen = 'start' | 'playing' | 'paused' | 'gameover';

const TIP_KEY = 'bubbleBlaster.seenTip';

export default function App() {
  const canvasHandle = useRef<GameCanvasHandle | null>(null);
  const [screen, setScreen] = useState<Screen>('start');

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [wave, setWave] = useState(1);
  const [showTip, setShowTip] = useState(false);

  const [gameOverScore, setGameOverScore] = useState(0);
  const [qualifies, setQualifies] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rank, setRank] = useState<number | null>(null);
  const [bestAtEnd, setBestAtEnd] = useState(0);

  const { scores, addScore, isHighScore } = useHighScores();

  const handlePlay = useCallback(() => {
    playStart();
    canvasHandle.current?.start();
    setScore(0);
    setLives(3);
    setCombo(0);
    setWave(1);
    setSubmitted(false);
    setQualifies(false);
    setRank(null);
    setScreen('playing');

    let seenTip = true;
    try {
      seenTip = localStorage.getItem(TIP_KEY) === '1';
    } catch {
      seenTip = true;
    }
    if (!seenTip) {
      setShowTip(true);
      try {
        localStorage.setItem(TIP_KEY, '1');
      } catch {
        /* ignore */
      }
      setTimeout(() => setShowTip(false), 4200);
    }
  }, []);

  const handlePause = useCallback(() => {
    playPause();
    canvasHandle.current?.pause();
    setScreen('paused');
  }, []);

  const handleResume = useCallback(() => {
    playPause();
    canvasHandle.current?.resume();
    setScreen('playing');
  }, []);

  const handleMenu = useCallback(() => {
    canvasHandle.current?.startDemo();
    setScreen('start');
  }, []);

  const handleGameOver = useCallback(
    (finalScore: number) => {
      setBestAtEnd(scores.length ? scores[0].score : 0);
      setGameOverScore(finalScore);
      setQualifies(isHighScore(finalScore));
      setSubmitted(false);
      setRank(null);
      setScreen('gameover');
    },
    [isHighScore, scores],
  );

  const handleSubmitName = useCallback(
    (name: string) => {
      const { rank: r } = addScore(name, gameOverScore);
      setSubmitted(true);
      setRank(r);
    },
    [addScore, gameOverScore],
  );

  // Global pause toggle (Escape / P) while in-game.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (screen === 'playing') handlePause();
        else if (screen === 'paused') handleResume();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [screen, handlePause, handleResume]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-slate-950 font-sans text-white [font-family:'Rubik',system-ui,sans-serif]">
      <div className="relative h-full w-full">
        <GameCanvas
          ref={canvasHandle}
          callbacks={{
            onScoreChange: setScore,
            onLivesChange: setLives,
            onComboChange: setCombo,
            onWaveChange: setWave,
            onGameOver: handleGameOver,
          }}
        />

        {(screen === 'playing' || screen === 'paused') && (
          <HUD
            score={score}
            lives={lives}
            combo={combo}
            wave={wave}
            onPause={handlePause}
            showTip={showTip}
          />
        )}

        {screen === 'start' && <StartScreen scores={scores} onPlay={handlePlay} />}

        {screen === 'paused' && (
          <PauseOverlay onResume={handleResume} onRestart={handlePlay} onMenu={handleMenu} />
        )}

        {screen === 'gameover' && (
          <GameOverScreen
            score={gameOverScore}
            best={Math.max(bestAtEnd, gameOverScore)}
            qualifies={qualifies}
            submitted={submitted}
            scores={scores}
            rank={rank}
            onSubmitName={handleSubmitName}
            onRestart={handlePlay}
            onMenu={handleMenu}
          />
        )}
      </div>
    </div>
  );
}
