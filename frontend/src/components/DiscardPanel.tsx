import React, { useState } from 'react';
import type { Socket } from 'socket.io-client';
import Gem from './Gem';

export default function DiscardPanel({ socket, lobbyId, myChips }: { socket: Socket; lobbyId: string; myChips: Record<string, number> }) {
  const [discard, setDiscard] = useState<Record<string, number>>({ white:0, blue:0, green:0, red:0, black:0, gold:0 });
  const colors = ['white','blue','green','red','black','gold'] as const;

  return (
    <div className="p-3 border rounded-lg bg-red-50 shadow-sm">
      <h4 className="font-semibold mb-2 text-center">Discard to 10 Chips</h4>
      <div className="grid grid-cols-2 gap-2">
        {colors.map(color => (
          <div key={color} className="px-2 py-1 border rounded cursor-pointer text-center" onClick={() => setDiscard((d: Record<string, number>) => ({...d, [color]: (d[color] < (myChips[color]||0)) ? d[color]+1 : 0 }))}>
            <Gem color={color} size={32} />
            <div className="text-xs">x{myChips[color] || 0}</div>
            <div className="text-xs">Discard: {discard[color]}</div>
          </div>
        ))}
      </div>
      <button className="bg-red-500 text-white px-4 py-2 rounded mt-2 w-full" onClick={() => socket.emit('discardChips', { lobbyId, discard })}>Submit Discard</button>
    </div>
  );
}
