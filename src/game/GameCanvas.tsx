import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { BubbleBlasterEngine } from './engine';
import type { EngineCallbacks } from './types';

export interface GameCanvasHandle {
  start: () => void;
  pause: () => void;
  resume: () => void;
  startDemo: () => void;
}

interface Props {
  callbacks: EngineCallbacks;
}

export const GameCanvas = forwardRef<GameCanvasHandle, Props>(({ callbacks }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<BubbleBlasterEngine | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useImperativeHandle(ref, () => ({
    start: () => engineRef.current?.start(),
    pause: () => engineRef.current?.pause(),
    resume: () => engineRef.current?.resume(),
    startDemo: () => engineRef.current?.startDemo(),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new BubbleBlasterEngine(canvas, {
      onScoreChange: (s) => callbacksRef.current.onScoreChange?.(s),
      onLivesChange: (l) => callbacksRef.current.onLivesChange?.(l),
      onComboChange: (c) => callbacksRef.current.onComboChange?.(c),
      onGameOver: (s) => callbacksRef.current.onGameOver?.(s),
      onWaveChange: (w) => callbacksRef.current.onWaveChange?.(w),
    });
    engineRef.current = engine;

    const container = canvas.parentElement as HTMLElement;
    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      engine.resize(rect.width, rect.height, dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    window.addEventListener('orientationchange', resize);

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'Space', 'KeyA', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }
      engine.setKey(e.code, true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      engine.setKey(e.code, false);
    };
    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);

    const toLocalX = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      return clientX - rect.left;
    };

    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      engine.setPointer(toLocalX(e.clientX), true);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.buttons === 0 && e.pointerType === 'mouse') {
        engine.setPointer(toLocalX(e.clientX), false);
        return;
      }
      engine.setPointer(toLocalX(e.clientX), true);
    };
    const onPointerUp = (e: PointerEvent) => {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      engine.setPointer(null, false);
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      engine.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full touch-none select-none"
      style={{ touchAction: 'none' }}
    />
  );
});

GameCanvas.displayName = 'GameCanvas';
