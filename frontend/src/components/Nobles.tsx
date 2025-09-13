import React from 'react';
import Gem from './Gem';

export default function Nobles({ nobles }: { nobles: Array<{ cost: Record<string, number>; points: number }> }) {
  if (!nobles || nobles.length === 0) return null;
  return (
    <div className="p-3 bg-white/90 border rounded-lg card-shadow">
      <h3 className="font-semibold mb-2 text-center">Nobles</h3>
      <div className="flex flex-wrap gap-3 justify-center">
        {nobles.map((noble, i) => (
          <div key={i} className="noble-tile text-sm">
            <div className="flex items-center justify-center mb-1 font-bold text-yellow-700">+{noble.points}</div>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(noble.cost).map(([c, amt]) => (
                <span key={c} className="inline-flex items-center text-xs"><Gem color={c} size={16} />{amt}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
