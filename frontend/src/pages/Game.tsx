import React from 'react';
import type { Socket } from 'socket.io-client';
import type { GameState } from './App';
import Gem from '../components/Gem';
import Card from '../components/Card';
import Bank from '../components/Bank';
import Nobles from '../components/Nobles';
import Opponents from '../components/Opponents';
import DiscardPanel from '../components/DiscardPanel';

export default function Game({ socket, currentLobbyId, gameState }: { socket: Socket; currentLobbyId: string; gameState: GameState }) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const me = gameState.players.find(p => p.id === socket.id)!;
  const others = gameState.players.filter(p => p.id !== (socket.id || ''));
  const mid = Math.ceil(others.length / 2);
  const leftOpp = others.slice(0, mid);
  const rightOpp = others.slice(mid);

  return (
    <div className="min-h-screen p-6">
      <div className="w-full grid grid-cols-12 gap-10">
        {/* Left opponents */}
        <div className="col-span-12 md:col-span-2 space-y-6">
          <Opponents players={leftOpp as any} meId={socket.id || ''} />
        </div>

        {/* Center board */}
        <div className="col-span-12 md:col-span-8 space-y-10">
          {/* Banner / Turn */}
          <div className="text-lg font-bold p-3 bg-white/90 rounded-lg card-shadow text-center">Current Turn: {currentPlayer.name}</div>

          {/* Top row: Bank (left) and Nobles (right) with clear gap */}
          <div className="grid grid-cols-2 gap-8 items-start">
            <div className="bg-white/90 rounded-lg card-shadow p-4">
              <div className="flex items-center justify-center">
                <Bank chips={gameState.chips} socket={socket} lobbyId={currentLobbyId} showHeader={false} />
              </div>
            </div>
            <Nobles nobles={gameState.nobles as any} />
          </div>

          {/* Market with extra spacing below top row */}
          <div className="mt-8">
            <Market socket={socket} currentLobbyId={currentLobbyId} market={gameState.market} decks={gameState.decks} />
          </div>

          {/* Player area at the bottom */}
          <PlayerArea me={me} socket={socket} currentLobbyId={currentLobbyId} />
          {me.needDiscard ? (
            <DiscardPanel socket={socket} lobbyId={currentLobbyId} myChips={me.chips} />
          ) : null}
        </div>

        {/* Right opponents */}
        <div className="col-span-12 md:col-span-2 space-y-6">
          <Opponents players={rightOpp as any} meId={socket.id || ''} />
        </div>
      </div>
    </div>
  );
}

function Market({ socket, currentLobbyId, market, decks }: { socket: Socket; currentLobbyId: string; market: any; decks: any }) {
  const colorTint: Record<string, string> = { white: '#e8e8e8', blue: '#cfe3ff', green: '#d7f2d7', red: '#ffd0d0', black: '#e2e2e2' };
  return (
    <div className="space-y-8">
      {([3,2,1] as const).map(level => {
        const cards = market[`level${level}`] || [];
        const deckLeft = decks[`level${level}`]?.length ?? 0;
        return (
          <div key={level}>
            <div className="board-grid items-start gap-x-8 gap-y-8">
              {/* Deck tile (click to reserve top) */}
              <button
                className={`relative deck-tile ${level===1?'deck-l1': level===2?'deck-l2':'deck-l3'}`}
                title={`Level ${level} deck`}
                disabled={deckLeft===0}
                onClick={() => socket.emit('reserveCard', { lobbyId: currentLobbyId, level })}
              >
                <span>DECK</span>
                <span className="deck-count">{deckLeft}</span>
              </button>
              {cards.map((card: any, index: number) => (
                <Card key={index}
                  card={card}
                  onBuy={() => socket.emit('buyCard', { level, index, lobbyId: currentLobbyId })}
                  onReserve={() => socket.emit('reserveCard', { lobbyId: currentLobbyId, level, index })}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PlayerArea({ me, socket, currentLobbyId }: { me: any; socket: Socket; currentLobbyId: string }) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <h3 className="font-semibold mb-3 text-center text-lg">Your Area</h3>
        <div className="space-y-2">
          <div className="text-base"><strong>Points:</strong> {me.points}</div>
          <div className="text-lg flex flex-wrap items-center gap-3"><strong>Chips:</strong> {(['white','blue','green','red','black','gold'] as const).map(c => (
            <span key={c} className="inline-flex items-center mr-1 text-base"><Gem color={c} size={40} />{me.chips[c] ?? 0}</span>
          ))}</div>
          <div className="text-lg"><strong>Purchased Cards:</strong> {me.cards.length === 0 ? 'None' : me.cards.map((c: any, i: number) => (
            <span key={i} className="inline-block mr-1 px-1.5 py-0.5 border rounded text-base"><Gem color={c.color} size={22} />{c.points>0? ('+'+c.points):''}</span>
          ))}</div>
          <div className="text-lg"><strong>Reserved Cards:</strong> {me.reserved.length === 0 ? 'None' : me.reserved.map((c: any, i: number) => (
            <span key={i} className="inline-block mr-2 mb-1 p-1.5 border rounded text-base"><Gem color={c.color} size={22} />{Object.entries(c.cost || {}).map(([cc, amt]) => (
              <span key={cc} className="inline-flex items-center mr-0.5 text-base"><Gem color={cc as string} size={22} />{amt as any}</span>
            ))}{c.points? <span className="font-bold">+{c.points}</span> : null} <button className="buyReservedBtn bg-green-600 text-white px-1.5 py-0.5 mt-1 rounded text-xs" onClick={() => socket.emit('buyCard', { lobbyId: currentLobbyId, reservedIndex: i })}>Buy</button></span>
          ))}</div>
        </div>
      </div>
    </div>
  );
}
