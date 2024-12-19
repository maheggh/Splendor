// backend/server.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

import * as lobbyManager from './lobbyManager.js';
import * as gameManager from './gameManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static(path.join(__dirname, '../frontend/public')));

io.on('connection', (socket) => {
  console.log(`New user connected: ${socket.id}`);

  // Handle lobby-related events
  lobbyManager.handleLobbyEvents(io, socket);

  // Handle game-related events
  gameManager.handleGameEvents(io, socket);
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
