import React from 'react';

type Player = {
  id: string;
  name: string;
  points: number;
  chips: Record<string, number>;
  cards: Array<{ color: string }>;
  reserved: any[];
};

export default function Opponents({ players, meId, showHeader = false }: { players: Player[]; meId: string; showHeader?: boolean }) {
  return (
    <div className="space-y-2">
      {showHeader && <h3 className="font-semibold text-center">Opponents</h3>}
      {players.filter(p => p.id !== meId).map(player => {
        const cardColors: Record<string, number> = { white:0, blue:0, green:0, red:0, black:0 };
        (player.cards || []).forEach(c => { cardColors[c.color] = (cardColors[c.color] || 0) + 1; });
        const totalChips = Object.values(player.chips || {}).reduce((sum, v) => sum + (v || 0), 0);
        const reservedCount = (player.reserved || []).length;
        const cardsSummary = Object.entries(cardColors).filter(([_, amt]) => amt > 0).map(([c, amt]) => (
          <span key={c} className="inline-block px-1 bg-green-100 rounded mr-1 text-xs">{c}:{amt}</span>
        ));
        return (
          <div key={player.id} className="border p-2 rounded-lg bg-white shadow-sm">
            <div className="font-semibold text-center">{player.name}</div>
            <div className="text-sm">Points: {player.points}</div>
            <div className="mt-1 text-xs"><span className="font-semibold">Cards:</span> {cardsSummary.length ? cardsSummary : 'None'}</div>
            <div className="mt-1 text-xs"><span className="font-semibold">Chips:</span> {totalChips}</div>
            <div className="mt-1 text-xs"><span className="font-semibold">Reserved:</span> {reservedCount}</div>
          </div>
        );
      })}
    </div>
  );
}
