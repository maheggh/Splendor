// backend/server.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const lobbyManager = require('./lobbyManager');
const gameManager = require('./gameManager');

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
