import { dominoId, isTrumpTile, type PlayerView } from '@texas42/shared';
import { DominoTile } from './DominoTile.js';
import { Avatar } from './Avatar.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useSocketStore } from '../../stores/socketStore.js';

export function Hand({ view }: { view: PlayerView }): JSX.Element {
  const selected = useUIStore((s) => s.selectedDomino);
  const selectDomino = useUIStore((s) => s.selectDomino);
  const playDomino = useSocketStore((s) => s.playDomino);

  const canPlay = view.phase === 'playing' && view.turn === 0;
  const legalIds = new Set(view.yourLegalPlays.map(dominoId));

  let chip = 'Waiting…';
  let chipBg = '#6b5d49';
  if (canPlay) {
    chip = 'Your turn';
    chipBg = '#3D6FB4';
  } else if (view.phase === 'playing') {
    chip = 'Playing…';
    chipBg = '#8a6a3a';
  }

  const onTileClick = (id: string): void => {
    if (!canPlay) return;
    if (!legalIds.has(id)) return;
    const tile = view.yourHand.find((d) => dominoId(d) === id);
    if (!tile) return;
    // Single tap plays the tile immediately (no select → confirm step).
    selectDomino(tile);
    playDomino(tile);
  };

  const onHandKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
    const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (idx === -1) return;
    e.preventDefault();
    const next = e.key === 'ArrowRight' ? idx + 1 : idx - 1;
    buttons[(next + buttons.length) % buttons.length]?.focus();
  };

  return (
    <div className="flex items-end gap-[15px]">
      <div className="flex flex-col items-center gap-1.5">
        <Avatar seat={0} active={canPlay} />
        <div style={{ background: chipBg, color: '#fff', font: "600 10px 'Libre Franklin'", padding: '2px 11px', borderRadius: 9 }}>
          {chip}
        </div>
      </div>
      <div className="flex items-end gap-2" role="group" aria-label="Your hand" onKeyDown={onHandKeyDown}>
        {view.phase === 'dealing'
          ? null
          : view.yourHand.map((d) => {
          const id = dominoId(d);
          const legal = canPlay && legalIds.has(id);
          const isSelected = selected !== null && dominoId(selected) === id;
          const dimmed = canPlay && !legal;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTileClick(id)}
              disabled={canPlay && !legal}
              aria-label={`Play ${d.t}-${d.b}${legal ? ' (legal)' : ''}`}
              className={legal ? 't42-hand-tile' : ''}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: legal ? 'pointer' : 'default',
                opacity: dimmed ? 0.45 : 1,
                transform: isSelected ? 'translateY(-12px)' : undefined,
                transition: 'transform .12s ease, opacity .15s ease',
                outline: legal ? '3px solid rgba(70,201,126,.9)' : 'none',
                outlineOffset: 2,
                borderRadius: 11,
              }}
            >
              <DominoTile top={d.t} bottom={d.b} w={62} glow={isTrumpTile(d, view.trump) ? '#F5A623' : ''} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
