// backend/lobbyManager.js
let lobbies = []; 
// Structure: [{ id: 'lobbyId', name: 'LobbyName', players: [{id, name, leader: bool}], ...}]

export function handleLobbyEvents(io, socket) {
  socket.on('createLobby', (data) => {
    const lobbyId = generateLobbyId();
    const lobbyName = data.lobbyName || `Lobby ${lobbyId}`;
    const playerName = data.playerName;

    const newLobby = {
      id: lobbyId,
      name: lobbyName,
      players: [{ id: socket.id, name: playerName, leader: true }],
      inGame: false
    };
    lobbies.push(newLobby);

    socket.join(lobbyId);
    io.to(socket.id).emit('lobbyJoined', { lobbyId, lobby: newLobby });
    updateLobbyList(io);
  });

  socket.on('joinLobby', (data) => {
    const { lobbyId, playerName } = data;
    const lobby = lobbies.find(l => l.id === lobbyId && !l.inGame);
    if (lobby) {
      lobby.players.push({ id: socket.id, name: playerName, leader: false });
      socket.join(lobbyId);
      io.to(lobbyId).emit('lobbyUpdated', lobby);
      io.to(socket.id).emit('lobbyJoined', { lobbyId, lobby });
      updateLobbyList(io);
    } else {
      socket.emit('errorMessage', 'Lobby not found or already in game.');
    }
  });

  socket.on('listLobbies', () => {
    updateLobbyList(io, socket.id);
  });

  socket.on('promoteLeader', (data) => {
    const { lobbyId, playerId } = data;
    const lobby = lobbies.find(l => l.id === lobbyId);
    if (!lobby) return;

    const leaderPlayer = lobby.players.find(p => p.id === socket.id && p.leader === true);
    if (!leaderPlayer) {
      socket.emit('errorMessage', 'Only the leader can promote others.');
      return;
    }

    lobby.players.forEach(p => p.leader = false);
    const newLeader = lobby.players.find(p => p.id === playerId);
    if (newLeader) newLeader.leader = true;

    io.to(lobbyId).emit('lobbyUpdated', lobby);
  });

  socket.on('kickPlayer', (data) => {
    const { lobbyId, playerId } = data;
    const lobby = lobbies.find(l => l.id === lobbyId);
    if (!lobby) return;

    const leaderPlayer = lobby.players.find(p => p.id === socket.id && p.leader === true);
    if (!leaderPlayer) {
      socket.emit('errorMessage', 'Only the leader can kick players.');
      return;
    }

    lobby.players = lobby.players.filter(p => p.id !== playerId);
    io.to(playerId).emit('kicked');
    io.sockets.sockets.get(playerId)?.leave(lobbyId);
    io.to(lobbyId).emit('lobbyUpdated', lobby);
  });

  socket.on('startGame', (data) => {
    const { lobbyId } = data;
    const lobby = lobbies.find(l => l.id === lobbyId);
    if (!lobby) return;

    const leaderPlayer = lobby.players.find(p => p.id === socket.id && p.leader === true);
    if (!leaderPlayer) {
      socket.emit('errorMessage', 'Only the leader can start the game.');
      return;
    }

    if (lobby.players.length < 2) {
      socket.emit('errorMessage', 'Need at least two players to start the game.');
      return;
    }

    lobby.inGame = true;
    // Notify everyone to switch to game screen
    io.to(lobbyId).emit('gameStarting', { lobbyId, players: lobby.players });
  });

  socket.on('disconnect', () => {
    for (const lobby of lobbies) {
      const playerIndex = lobby.players.findIndex(p => p.id === socket.id);
      if (playerIndex > -1) {
        lobby.players.splice(playerIndex, 1);
        // If lobby is empty, remove it
        if (lobby.players.length === 0) {
          lobbies = lobbies.filter(l => l.id !== lobby.id);
        } else {
          // If the leader left, assign a new leader
          if (!lobby.players.some(p => p.leader)) {
            lobby.players[0].leader = true;
          }
          io.to(lobby.id).emit('lobbyUpdated', lobby);
        }
      }
    }
    updateLobbyList(io);
  });
}

function updateLobbyList(io, socketId) {
  const availableLobbies = lobbies.filter(l => !l.inGame).map(l => ({id: l.id, name: l.name, players: l.players.length }));
  if (socketId) {
    io.to(socketId).emit('lobbyList', availableLobbies);
  } else {
    io.emit('lobbyList', availableLobbies);
  }
}

function generateLobbyId() {
  return Math.random().toString(36).substr(2, 6);
}
