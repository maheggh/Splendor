// backend/gameManager.js
const gameLogic = require('./gameLogic');

let gameSessions = {}; 
// { lobbyId: { gameState, players: [...] } }

module.exports = {
  handleGameEvents
};

function handleGameEvents(io, socket) {
  socket.on('gameReady', (data) => {
    const { lobbyId, players } = data;
    // Initialize a new game session
    const gameState = gameLogic.initializeGame(players);
    gameSessions[lobbyId] = { gameState, players };
    io.to(lobbyId).emit('gameStateUpdate', gameSessions[lobbyId].gameState);
  });

  socket.on('takeChips', (data) => {
    const { lobbyId, selection } = data;
    const session = gameSessions[lobbyId];
    if (!session) return;

    const player = session.gameState.players.find(p => p.id === socket.id);
    if (gameLogic.canTakeChips(selection, session.gameState)) {
      gameLogic.applyChipSelection(player, selection, session.gameState);
      gameLogic.nextTurn(session.gameState);
      io.to(lobbyId).emit('gameStateUpdate', session.gameState);
      gameLogic.checkGameOver(session.gameState, (winner) => {
        if (winner) io.to(lobbyId).emit('gameOver', winner);
      });
    } else {
      socket.emit('errorMessage', 'Invalid chip selection');
    }
  });

  // Similarly handle 'buyCard', 'reserveCard', etc.
}