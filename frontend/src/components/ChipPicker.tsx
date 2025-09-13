import React, { useMemo, useState } from 'react';
import type { Socket } from 'socket.io-client';
import Gem from './Gem';

export default function ChipPicker({ socket, lobbyId, bank }: { socket: Socket; lobbyId: string; bank: Record<string, number> }) {
  const colors = useMemo(() => ['white','blue','green','red','black'] as const, []);
  const [selected, setSelected] = useState<Record<string, number>>({ white:0, blue:0, green:0, red:0, black:0 });

  const toggle = (color: string) => {
    setSelected((prev: Record<string, number>) => {
      const total = (Object.values(prev) as number[]).reduce<number>((a,b) => a + b, 0);
      const next = { ...prev };
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

  return (
    <div className="p-3 border rounded-lg bg-white shadow-sm">
      <h4 className="font-semibold mb-2 text-center">Take Chips</h4>
      <div className="grid grid-cols-3 gap-2">
        {colors.map(color => (
          <div key={color} onClick={() => toggle(color)} className="px-2 py-2 rounded border cursor-pointer text-center">
            <Gem color={color} size={32} />
            <div className="text-xs">x{bank[color]}</div>
            <div className="text-xs">Selected: {selected[color]}</div>
          </div>
        ))}
      </div>
      <button className="bg-blue-500 text-white px-4 py-2 rounded mt-2 w-full" onClick={() => socket.emit('takeChips', { lobbyId, selection: selected })}>Take Chips</button>
    </div>
  );
}
