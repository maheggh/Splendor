// backend/gameManager.js
import * as gameLogic from './gameLogic.js';

let gameSessions = {}; 
// { lobbyId: { gameState, players: [...] } }
// We track per-session temporary flags like which player must discard

export function handleGameEvents(io, socket) {
  socket.on('gameReady', (data) => {
    const { lobbyId, players } = data;
  // Ensure the socket is in the lobby room (important for dev quick-start where no lobby join happened)
  try { socket.join(lobbyId); } catch {}
    const gameState = gameLogic.initializeGame(players);
    gameSessions[lobbyId] = { gameState, players };
    io.to(lobbyId).emit('gameStateUpdate', gameSessions[lobbyId].gameState);
  });

  socket.on('takeChips', (data) => {
    const { lobbyId, selection } = data;
    const session = gameSessions[lobbyId];
    if (!session) return;
    if (session.gameState && session.gameState.gameShouldEnd) {
      socket.emit('errorMessage', 'Game has ended.');
      return;
    }

    const currentPlayer = session.gameState.players[session.gameState.currentPlayerIndex];
    if (socket.id !== currentPlayer.id) {
      socket.emit('errorMessage', 'It is not your turn.');
      return;
    }

    // If player must discard before taking further actions
    if (currentPlayer.needDiscard) {
      socket.emit('errorMessage', 'You must discard down to 10 chips before taking other actions.');
      return;
    }

    const player = currentPlayer;
    // Allow taking even if it pushes the player over 10; they'll be required to discard
    if (gameLogic.canTakeChips(player, selection, session.gameState)) {
      gameLogic.applyChipSelection(player, selection, session.gameState);
      // If player now has more than 10 chips, mark they must discard
      const total = Object.values(player.chips).reduce((a,b)=>a+b,0);
      if (total > 10) {
        player.needDiscard = true;
        // Emit state so client can show discard UI
        io.to(lobbyId).emit('gameStateUpdate', session.gameState);
        return;
      }
      // End of action: award nobles if any eligible
      const awarded = gameLogic.awardNobles(player, session.gameState);
      if (awarded && awarded.length) {
        io.to(lobbyId).emit('nobleAwarded', { playerId: player.id, nobles: awarded });
      }
      if (!session.gameState.finalRound && player.points >= 15) {
        session.gameState.finalRound = true;
        session.gameState.finalRoundStarter = session.gameState.currentPlayerIndex;
      }
      gameLogic.nextTurn(session.gameState);
      io.to(lobbyId).emit('gameStateUpdate', session.gameState);
      gameLogic.checkGameOver(session.gameState, (winner) => {
        if (winner) io.to(lobbyId).emit('gameOver', winner);
      });
    } else {
      socket.emit('errorMessage', 'Invalid chip selection');
    }
  });

  socket.on('discardChips', (data) => {
    const { lobbyId, discard } = data; // discard: {white:1,...}
    const session = gameSessions[lobbyId];
    if (!session) return;
    const currentPlayer = session.gameState.players[session.gameState.currentPlayerIndex];
    if (socket.id !== currentPlayer.id) {
      socket.emit('errorMessage', 'It is not your turn.');
      return;
    }

    if (!currentPlayer.needDiscard) {
      socket.emit('errorMessage', 'You are not required to discard.');
      return;
    }

    // Validate discard amounts and apply
    const totalDiscard = Object.values(discard).reduce((a,b)=>a+b,0);
    const playerTotal = Object.values(currentPlayer.chips).reduce((a,b)=>a+b,0);
    if (playerTotal - totalDiscard !== 10) {
      socket.emit('errorMessage', 'Discard must bring you down to exactly 10 chips.');
      return;
    }

    for (const color in discard) {
      const amt = discard[color] || 0;
      if (amt > (currentPlayer.chips[color] || 0)) {
        socket.emit('errorMessage', 'Invalid discard amount');
        return;
      }
      currentPlayer.chips[color] -= amt;
      session.gameState.chips[color] += amt;
    }

    currentPlayer.needDiscard = false;
    // After discarding, proceed to next turn
    gameLogic.nextTurn(session.gameState);
    io.to(lobbyId).emit('gameStateUpdate', session.gameState);
    gameLogic.checkGameOver(session.gameState, (winner) => {
      if (winner) io.to(lobbyId).emit('gameOver', winner);
    });
  });

  socket.on('buyCard', (data) => {
    const { lobbyId, level, index } = data;
    const session = gameSessions[lobbyId];
    if (!session) return;
    if (session.gameState && session.gameState.gameShouldEnd) {
      socket.emit('errorMessage', 'Game has ended.');
      return;
    }

    const currentPlayer = session.gameState.players[session.gameState.currentPlayerIndex];
    if (socket.id !== currentPlayer.id) {
      socket.emit('errorMessage', 'It is not your turn.');
      return;
    }

    if (currentPlayer.needDiscard) {
      socket.emit('errorMessage', 'You must discard down to 10 chips before taking other actions.');
      return;
    }

    const player = currentPlayer;
    const buyInfo = { level, index };
    if (data.reservedIndex !== undefined) buyInfo.reservedIndex = data.reservedIndex;

    if (gameLogic.canBuyCard(player, buyInfo, session.gameState)) {
        const result = gameLogic.purchaseCard(player, buyInfo, session.gameState) || { awardedNobles: [] };
        if (result.awardedNobles && result.awardedNobles.length) {
          io.to(lobbyId).emit('nobleAwarded', { playerId: player.id, nobles: result.awardedNobles });
        }
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
    if (session.gameState && session.gameState.gameShouldEnd) {
      socket.emit('errorMessage', 'Game has ended.');
      return;
    }

    const currentPlayer = session.gameState.players[session.gameState.currentPlayerIndex];
    if (socket.id !== currentPlayer.id) {
      socket.emit('errorMessage', 'It is not your turn.');
      return;
    }

    if (currentPlayer.needDiscard) {
      socket.emit('errorMessage', 'You must discard down to 10 chips before taking other actions.');
      return;
    }

    const player = currentPlayer;
    if (gameLogic.canReserveCard(player, { level, index }, session.gameState)) {
      gameLogic.reserveCard(player, { level, index }, session.gameState);
      // If player now exceeds 10 chips because of gold, require discard
      const total = Object.values(player.chips).reduce((a,b)=>a+b,0);
      if (total > 10) {
        player.needDiscard = true;
        io.to(lobbyId).emit('gameStateUpdate', session.gameState);
        return;
      }
      // End of action: award nobles if any eligible
        const awarded = gameLogic.awardNobles(player, session.gameState);
        if (awarded && awarded.length) {
          io.to(lobbyId).emit('nobleAwarded', { playerId: player.id, nobles: awarded });
        }
      if (!session.gameState.finalRound && player.points >= 15) {
        session.gameState.finalRound = true;
        session.gameState.finalRoundStarter = session.gameState.currentPlayerIndex;
      }
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
