import React, { useMemo, useState } from 'react';
import type { Socket } from 'socket.io-client';
import Gem from './Gem';

export default function Bank({ chips, socket, lobbyId, showHeader = true }: { chips: Record<string, number>; socket: Socket; lobbyId: string; showHeader?: boolean }) {
  const colors = useMemo(() => ['white','blue','green','red','black'] as const, []);
  const [selected, setSelected] = useState<Record<string, number>>({ white:0, blue:0, green:0, red:0, black:0 });

  const totalSelected = (Object.values(selected) as number[]).reduce((a,b)=>a+b,0);

  const isValid = (() => {
    const colorsPicked = Object.entries(selected).filter(([_, v]) => v > 0) as Array<[string, number]>;
    if (totalSelected === 0) return false;
    if (totalSelected > 3) return false;
    // Check bank has enough of each chosen color
    if (colorsPicked.some(([c, v]) => (chips as any)[c] < v)) return false;
    // Pattern: three different (all 1) or two same (exactly 2 of one color, and bank has >=4 for that color)
    const threeDifferent = totalSelected === 3 && colorsPicked.length === 3 && colorsPicked.every(([_, v]) => v === 1);
    const twoSame = totalSelected === 2 && colorsPicked.length === 1 && colorsPicked[0][1] === 2 && (chips as any)[colorsPicked[0][0]] >= 4;
    return threeDifferent || twoSame;
  })();

  const toggle = (color: string) => {
    setSelected(prev => {
      const next = { ...prev } as Record<string, number>;
      const total = Object.values(next).reduce((a,b)=>a+b,0);
      // Cycle 0 -> 1 -> 2 (for taking 2 of same). Enforce max 3 total.
      if (next[color] === 0) {
        if (total < 3) next[color] = 1;
      } else if (next[color] === 1) {
        if (total < 3) next[color] = 2; else next[color] = 0;
      } else {
        next[color] = 0;
      }
      return next;
    });
  };

  const clear = () => setSelected({ white:0, blue:0, green:0, red:0, black:0 });
  const confirm = () => {
    if (!isValid) return;
    socket.emit('takeChips', { lobbyId, selection: selected });
  };

  return (
    <div className="p-2">
      {showHeader && <h3 className="font-semibold mb-2 text-center text-white/90">Bank</h3>}
      <div className="flex items-end justify-center gap-5 mb-2">
        {colors.map(c => {
          const isDisabled = chips[c] === 0;
          const isActive = selected[c] > 0;
          return (
            <button
              key={c}
              disabled={isDisabled}
              onClick={() => toggle(c)}
              className={`flex flex-col items-center justify-center ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${isActive ? 'chip-selected' : ''}`}
            >
              <div className={`chip chip--${c}`}>
                {/* optional gem overlay */}
              </div>
              <div className="chip-count">x{chips[c]}</div>
              {isActive && <div className="text-[10px] mt-0.5">+{selected[c]}</div>}
            </button>
          );
        })}
        {/* Gold cannot be taken directly, show count only */}
        <div className="flex flex-col items-center justify-center">
          <div className="chip chip--gold" />
          <div className="chip-count">x{chips.gold}</div>
          <div className="text-[10px] mt-0.5 text-white/80">(wild)</div>
        </div>
      </div>
      <div className="flex gap-2 justify-center">
        <button onClick={confirm} className={`px-4 py-2 rounded text-white ${isValid ? 'bg-blue-600' : 'bg-gray-500 cursor-not-allowed'}`} disabled={!isValid}>Confirm</button>
        <button onClick={clear} className="px-3 py-2 rounded border border-white/40 text-white/90">Clear</button>
      </div>
      <div className={`text-[11px] mt-2 text-center ${isValid || totalSelected===0 ? 'text-white/80' : 'text-red-200 font-medium'}`}>
        {isValid || totalSelected===0 ? 'Take 3 different colors or 2 of the same (if ≥ 4 in bank).' : 'Invalid selection.'}
      </div>
    </div>
  );
}
