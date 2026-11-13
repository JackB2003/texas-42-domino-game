import { lazy, Suspense, useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { useSocketStore } from './stores/socketStore.js';
import { useGameStore } from './stores/gameStore.js';
import { Stage } from './components/Stage.js';

// Code-split the game (and its animation deps) from the initial connect screen.
const Table = lazy(() => import('./components/game/Table.js').then((m) => ({ default: m.Table })));

export function App(): JSX.Element {
  const connect = useSocketStore((s) => s.connect);
  const status = useSocketStore((s) => s.status);
  const error = useSocketStore((s) => s.error);
  const view = useGameStore((s) => s.view);

  useEffect(() => {
    void connect();
  }, [connect]);

  if (!view) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-felt text-parchment-100">
        <div className="text-center font-sans">
          <div className="font-display text-3xl text-parchment-accent">JB Texas 42</div>
          <div className="mt-3 text-sm text-parchment-200">
            {status === 'error' ? `Connection error: ${error}` : 'Dealing you in…'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <Stage>
        <Suspense fallback={null}>
          <Table view={view} />
        </Suspense>
      </Stage>
    </MotionConfig>
  );
}
