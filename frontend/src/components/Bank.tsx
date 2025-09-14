import React, { useMemo, useState } from 'react';
import type { Socket } from 'socket.io-client';
import Gem from './Gem';

export default function Bank({ chips, socket, lobbyId, showHeader = true }: { chips: Record<string, number>; socket: Socket; lobbyId: string; showHeader?: boolean }) {
  const colors = useMemo(() => ['white','blue','green','red','black'] as const, []);
  const [selected, setSelected] = useState<Record<string, number>>({ white:0, blue:0, green:0, red:0, black:0 });
  const gemSize = 40; // larger gems for the bank

  const totalSelected = (Object.values(selected) as number[]).reduce((a,b)=>a+b,0);

  // Keep client-side checks permissive and let the server be the source of truth.
  // Enable confirm if 1-3 chips are selected and bank has enough of each color (no gold allowed).
  const isValidBasic = (() => {
    if (totalSelected === 0) return false;
    if (totalSelected > 3) return false;
    for (const c of colors) {
      const want = selected[c] || 0;
      if (want < 0) return false;
      if (want > (chips[c] || 0)) return false;
    }
    return true;
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
    if (!isValidBasic) return;
    socket.emit('takeChips', { lobbyId, selection: selected });
    // Clear local selection right away; server will update game state or show an error toast
    clear();
  };

  return (
    <div className="p-2">
      {showHeader && <h3 className="font-semibold mb-2 text-center text-white/90">Bank</h3>}
      <div className="flex items-end justify-center gap-6 mb-2">
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
              <div className="flex flex-col items-center">
                <Gem color={c} size={gemSize} />
                <div className="chip-count">x{chips[c]}</div>
              </div>
              {isActive && <div className="text-[10px] mt-0.5">+{selected[c]}</div>}
            </button>
          );
        })}
        {/* Gold cannot be taken directly, show count only */}
        <div className="flex flex-col items-center justify-center">
          <Gem color="gold" size={gemSize} />
          <div className="chip-count mt-0.5">x{chips.gold}</div>
          <div className="text-[10px] mt-0.5 text-white/80">(wild)</div>
        </div>
      </div>
      <div className="flex gap-2 justify-center">
        <button onClick={confirm} className={`px-4 py-2 rounded text-white ${isValidBasic ? 'bg-blue-600' : 'bg-gray-500 cursor-not-allowed'}`} disabled={!isValidBasic}>Confirm</button>
        <button onClick={clear} className="px-3 py-2 rounded border border-white/40 text-white/90">Clear</button>
      </div>
      <div className={`text-[11px] mt-2 text-center ${isValidBasic || totalSelected===0 ? 'text-white/80' : 'text-red-200 font-medium'}`}>
        {isValidBasic || totalSelected===0 ? 'Select up to 3 chips; rules are enforced on confirm.' : 'Invalid selection.'}
      </div>
    </div>
  );
}
