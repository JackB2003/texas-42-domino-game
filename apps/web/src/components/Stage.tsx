import { useEffect, useState, type ReactNode } from 'react';

const DESIGN_W = 1280;
const DESIGN_H = 800;

/**
 * Renders the fixed 1280x800 table and scales it to fit the viewport, keeping
 * the design pixel-perfect on desktop and shrinking it on smaller screens.
 */
export function Stage({ children }: { children: ReactNode }): JSX.Element {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = (): void => {
      const s = Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H);
      setScale(Math.min(1, s));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden bg-felt">
      <div
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          flex: '0 0 auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}
