import { isTrumpTile, SEAT_TEAM, type Domino, type PlayerView, type Seat } from '@texas42/shared';
import { DominoTile } from './DominoTile.js';
import { useUIStore } from '../../stores/uiStore.js';

const TEAM_COLOR = { us: '#3D6FB4', them: '#BF8F2A' } as const;

interface SlotData {
  domino: Domino | null;
  glow: string;
  winner: boolean;
}

function Slot({
  data,
  fly,
  youEmpty,
}: {
  data: SlotData;
  fly: 'pos' | 'neg';
  youEmpty?: boolean;
}): JSX.Element {
  if (!data.domino) {
    if (youEmpty) {
      return (
        <div
          className="flex items-center justify-center text-center"
          style={{ width: 46, height: 84, border: '2px dashed rgba(61,111,180,.85)', borderRadius: 8, background: 'rgba(61,111,180,.14)', color: '#79A6E2', font: "700 9px 'Libre Franklin'", lineHeight: 1.2 }}
        >
          YOUR
          <br />
          PLAY
        </div>
      );
    }
    return <div style={{ width: 42, height: 81, borderRadius: 8, border: '1px dashed rgba(255,255,255,.12)' }} />;
  }
  return (
    <div
      className={data.winner ? 't42-winner' : undefined}
      style={{
        animation: data.winner ? undefined : `t42-fly-${fly} .44s cubic-bezier(.2,.8,.3,1) both`,
      }}
    >
      <DominoTile top={data.domino.t} bottom={data.domino.b} w={42} glow={data.glow} />
    </div>
  );
}

export function TrickArea({ view }: { view: PlayerView }): JSX.Element {
  const resolved = useUIStore((s) => s.resolvedTrick);

  const bySeat = (seat: Seat): SlotData => {
    if (resolved) {
      const play = resolved.plays.find((p) => p.seat === seat);
      if (!play) return { domino: null, glow: '', winner: false };
      const isWinner = resolved.winner === seat;
      return {
        domino: play.domino,
        glow: isWinner ? TEAM_COLOR[SEAT_TEAM[seat]] : isTrumpTile(play.domino, view.trump) ? '#F5A623' : '',
        winner: isWinner,
      };
    }
    const play = view.currentTrick.plays.find((p) => p.seat === seat);
    if (!play) return { domino: null, glow: '', winner: false };
    return {
      domino: play.domino,
      glow: isTrumpTile(play.domino, view.trump) ? '#F5A623' : '',
      winner: false,
    };
  };

  const cYou = bySeat(0);
  const cLeft = bySeat(1);
  const cPartner = bySeat(2);
  const cRight = bySeat(3);
  const youCanPlay = view.phase === 'playing' && view.turn === 0;

  const turnHint = youCanPlay ? '· tap a tile to play' : '';

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div
        style={{
          position: 'relative',
          width: 214,
          height: 198,
          animation: resolved ? 't42-collect .7s ease forwards' : undefined,
        }}
      >
        {/* partner (top) */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }}>
          <Slot data={cPartner} fly="neg" />
        </div>
        {/* left */}
        <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%) rotate(90deg)' }}>
          <Slot data={cLeft} fly="pos" />
        </div>
        {/* right */}
        <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%) rotate(90deg)' }}>
          <Slot data={cRight} fly="neg" />
        </div>
        {/* you (bottom) */}
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
          <Slot data={cYou} fly="pos" youEmpty={youCanPlay} />
        </div>
        {/* center hub */}
        <div
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,.4)', border: '1px solid rgba(61,111,180,.3)' }}
        />
      </div>
      <div style={{ background: 'rgba(0,0,0,.4)', borderRadius: 9, padding: '5px 16px', color: '#e8d9bf', font: "600 11px 'Libre Franklin'" }}>
        Trick {Math.max(1, view.trickNo)} of 7 · Trump: <span style={{ color: '#79A6E2' }}>{view.trump ?? '—'}</span> {turnHint}
      </div>
    </div>
  );
}
