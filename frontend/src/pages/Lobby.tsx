import React from 'react';
import type { Socket } from 'socket.io-client';

export default function Lobby({ socket, onReady }: { socket: Socket | null; onReady: (id: string) => void }) {
  // Placeholder Lobby while we wire Game first
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">Lobby</h1>
      <button
        className="bg-blue-500 text-white px-3 py-2 rounded"
        onClick={() => {
          const id = `lobby-${Math.random().toString(36).slice(2, 8)}`;
          onReady(id);
        }}
      >
        Quick Start
      </button>
    </div>
  );
}
