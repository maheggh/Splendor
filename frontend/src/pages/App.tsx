import React, { useEffect, useMemo, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import Lobby from './Lobby';
import Game from './Game';
import { ToastProvider, useToast } from '../components/Toast';

export type Player = {
  id: string;
  name: string;
  leader?: boolean;
  chips: Record<string, number>;
  cards: any[];
  reserved: any[];
  points: number;
  needDiscard?: boolean;
};

export type GameState = {
  players: Player[];
  market: any;
  decks: any;
  nobles: any[];
  chips: Record<string, number>;
  currentPlayerIndex: number;
  finalRound: boolean;
  finalRoundStarter: number | null;
};

const DEV_BYPASS = true;

function AppInner() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentLobbyId, setCurrentLobbyId] = useState<string | null>(null);
  const [playersForDev, setPlayersForDev] = useState<{ id: string; name: string }[] | null>(null);
  const { show } = useToast();

  useEffect(() => {
    const s = io();
    setSocket(s);
    s.on('connect', () => {
      setConnected(true);
      if (DEV_BYPASS) {
        const id = `dev-${Math.random().toString(36).slice(2, 8)}`;
        setCurrentLobbyId(id);
        const players = [
          { id: s.id!, name: 'You' },
          { id: `bot-${id}`, name: 'Opponent' },
        ];
        setPlayersForDev(players);
        s.emit('gameReady', { lobbyId: id, players });
      } else {
        s.emit('listLobbies');
      }
    });
    s.on('gameStateUpdate', (gs: GameState) => setGameState(gs));
    s.on('errorMessage', (msg: string) => show(msg));
    s.on('gameOver', (winner: { name: string }) => show(`Game Over! Winner: ${winner.name}`));
    s.on('nobleAwarded', (payload: { playerId: string; nobles: any[] }) => {
      const target = gsOrStateName(gameState, payload.playerId);
      const nobleCount = payload.nobles?.length || 0;
      if (nobleCount > 0) show(`${target} gained a noble` + (nobleCount > 1 ? ` x${nobleCount}` : ''));
    });

    return () => { s.disconnect(); };
  }, []);

  if (!connected) return <div className="p-4">Connecting…</div>;

  // Minimal routing: if we have a gameState, show Game; otherwise Lobby
  if (gameState && socket && currentLobbyId) {
    return (
      <Game
        socket={socket}
        currentLobbyId={currentLobbyId}
        gameState={gameState}
      />
    );
  }

  return <Lobby socket={socket} onReady={(lobbyId) => setCurrentLobbyId(lobbyId)} />;
}

function gsOrStateName(gs: GameState | null, id: string) {
  const p = gs?.players?.find(p => p.id === id);
  return p?.name || 'A player';
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
