// backend/gameManager.js
import * as gameLogic from './gameLogic.js';

let gameSessions = {}; 
// { lobbyId: { gameState, players: [...] } }

export function handleGameEvents(io, socket) {
  socket.on('gameReady', (data) => {
    const { lobbyId, players } = data;
    const gameState = gameLogic.initializeGame(players);
    gameSessions[lobbyId] = { gameState, players };
    io.to(lobbyId).emit('gameStateUpdate', gameSessions[lobbyId].gameState);
  });

  socket.on('takeChips', (data) => {
    const { lobbyId, selection } = data;
    const session = gameSessions[lobbyId];
    if (!session) return;

    const currentPlayer = session.gameState.players[session.gameState.currentPlayerIndex];
    if (socket.id !== currentPlayer.id) {
      socket.emit('errorMessage', 'It is not your turn.');
      return;
    }

    const player = currentPlayer;
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

  socket.on('buyCard', (data) => {
    const { lobbyId, level, index } = data;
    const session = gameSessions[lobbyId];
    if (!session) return;

    const currentPlayer = session.gameState.players[session.gameState.currentPlayerIndex];
    if (socket.id !== currentPlayer.id) {
      socket.emit('errorMessage', 'It is not your turn.');
      return;
    }

    const player = currentPlayer;
    if (gameLogic.canBuyCard(player, { level, index }, session.gameState)) {
      gameLogic.purchaseCard(player, { level, index }, session.gameState);
      gameLogic.nextTurn(session.gameState);
      io.to(lobbyId).emit('gameStateUpdate', session.gameState);
      gameLogic.checkGameOver(session.gameState, (winner) => {
        if (winner) io.to(lobbyId).emit('gameOver', winner);
      });
    } else {
      socket.emit('errorMessage', 'Cannot buy this card.');
    }
  });

  socket.on('reserveCard', (data) => {
    const { lobbyId, level, index } = data;
    const session = gameSessions[lobbyId];
    if (!session) return;

    const currentPlayer = session.gameState.players[session.gameState.currentPlayerIndex];
    if (socket.id !== currentPlayer.id) {
      socket.emit('errorMessage', 'It is not your turn.');
      return;
    }

    const player = currentPlayer;
    if (gameLogic.canReserveCard(player, { level, index }, session.gameState)) {
      gameLogic.reserveCard(player, { level, index }, session.gameState);
      gameLogic.nextTurn(session.gameState);
      io.to(lobbyId).emit('gameStateUpdate', session.gameState);
      gameLogic.checkGameOver(session.gameState, (winner) => {
        if (winner) io.to(lobbyId).emit('gameOver', winner);
      });
    } else {
      socket.emit('errorMessage', 'Cannot reserve this card.');
    }
  });
}
