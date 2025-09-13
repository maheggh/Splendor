// backend/server.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

import * as lobbyManager from './lobbyManager.js';
import * as gameManager from './gameManager.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Serve static assets: prefer built frontend if present, else fallback to public
const distPath = path.join(__dirname, '../frontend/dist');
const publicPath = path.join(__dirname, '../frontend/public');
app.use(express.static(distPath));
app.use(express.static(publicPath));

// SPA fallback: return built index.html if present
app.get('*', (req, res, next) => {
  const file = path.join(distPath, 'index.html');
  if (fs.existsSync(file)) return res.sendFile(file);
  return next();
});

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
