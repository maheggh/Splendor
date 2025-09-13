import React from 'react';
import Gem from './Gem';

type CardData = {
  color: 'white' | 'blue' | 'green' | 'red' | 'black';
  points: number;
  cost: Record<string, number>;
};

export default function Card({ card, onBuy, onReserve }: { card: CardData; onBuy?: () => void; onReserve?: () => void }) {
  const tint: Record<string, string> = { white: '#e9e7e2', blue: '#c2dbff', green: '#cfead1', red: '#ffd6d6', black: '#e7e7e7' };
  return (
    <div className="spl-card" onClick={onBuy}>
      <div className="spl-card__header" style={{ backgroundColor: tint[card.color] || '#eee7d9' }}>
        <div className="spl-card__points">{card.points > 0 ? card.points : ''}</div>
        <div className="spl-card__gem"><Gem color={card.color} size={16} /></div>
      </div>
      {/* Art placeholder */}
      <div className="spl-card__body">
        <div className="spl-card__art" />
        {/* Right-side vertical cost rail */}
        <div className="spl-card__costs">
          {Object.entries(card.cost || {}).map(([c, amt]) => (
            <span key={c} className="spl-card__cost"><Gem color={c} size={16} />{amt as any}</span>
          ))}
        </div>
      </div>
      {onReserve && (
        <button className="spl-card__reserve" onClick={(e) => { e.stopPropagation(); onReserve(); }}>Reserve</button>
      )}
    </div>
  );
}
