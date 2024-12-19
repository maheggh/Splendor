// frontend/public/client.js
const socket = io();

const lobbySection = document.getElementById('lobby-section');
const gameSection = document.getElementById('game-section');
const lobbyListElem = document.getElementById('lobbyList');
const lobbyNameInput = document.getElementById('lobbyNameInput');
const createNicknameInput = document.getElementById('createNicknameInput');
const createLobbyBtn = document.getElementById('createLobbyBtn');
const playerList = document.getElementById('playerList');
const leaderActions = document.getElementById('leaderActions');
const startGameBtn = document.getElementById('startGameBtn');
const splendorBoard = document.getElementById('splendor-board');
const gameLobbyName = document.getElementById('game-lobby-name');

// Modal elements
const joinModal = document.getElementById('joinModal');
const joinNicknameInput = document.getElementById('joinNicknameInput');
const confirmJoinBtn = document.getElementById('confirmJoinBtn');

let currentLobbyId = null;
let currentLobby = null;
let currentPlayerId = null; // our socket.id

// We'll store the lobby we want to join before we have the nickname
let lobbyToJoin = null;

socket.on('connect', () => {
  currentPlayerId = socket.id;
  socket.emit('listLobbies');
});

socket.on('lobbyList', (lobbies) => {
  lobbyListElem.innerHTML = '';
  lobbies.forEach(l => {
    const li = document.createElement('li');
    li.className = "border p-2 flex justify-between items-center";
    li.innerHTML = `<span>${l.name} (${l.players} players)</span> <button class="joinBtn bg-blue-500 text-white px-2">Join</button>`;
    const joinBtn = li.querySelector('.joinBtn');
    joinBtn.addEventListener('click', () => {
      lobbyToJoin = l.id;
      // Show the modal for nickname
      joinNicknameInput.value = '';
      joinModal.classList.remove('hidden');
    });
    lobbyListElem.appendChild(li);
  });
});

createLobbyBtn.addEventListener('click', () => {
  const nickname = createNicknameInput.value.trim();
  if (!nickname) {
    alert('Please enter a nickname before creating a lobby.');
    return;
  }
  const lobbyName = lobbyNameInput.value.trim();
  socket.emit('createLobby', { playerName: nickname, lobbyName });
});

// Confirm join action from modal
confirmJoinBtn.addEventListener('click', () => {
  const nickname = joinNicknameInput.value.trim();
  if (!nickname) {
    alert('Please enter a nickname.');
    return;
  }
  // Proceed to join lobby
  socket.emit('joinLobby', { lobbyId: lobbyToJoin, playerName: nickname });
  // Hide modal after joining
  joinModal.classList.add('hidden');
  lobbyToJoin = null;
});

socket.on('lobbyJoined', (data) => {
  currentLobbyId = data.lobbyId;
  currentLobby = data.lobby;

  lobbySection.classList.add('hidden');
  gameSection.classList.remove('hidden');

  updateLobbyUI();
});

socket.on('lobbyUpdated', (lobby) => {
  currentLobby = lobby;
  updateLobbyUI();
});

function updateLobbyUI() {
  gameLobbyName.textContent = currentLobby.name;
  playerList.innerHTML = '';
  const leader = currentLobby.players.find(p => p.leader);
  currentLobby.players.forEach(player => {
    const div = document.createElement('div');
    div.className = "border p-2 flex justify-between items-center";
    div.textContent = player.name + (player.leader ? ' (Leader)' : '');
    if (leader && leader.id === socket.id && player.id !== socket.id) {
      const promoteBtn = document.createElement('button');
      promoteBtn.textContent = 'Promote';
      promoteBtn.className = "bg-yellow-500 text-white px-2 ml-2";
      promoteBtn.addEventListener('click', () => {
        socket.emit('promoteLeader', { lobbyId: currentLobbyId, playerId: player.id });
      });
      const kickBtn = document.createElement('button');
      kickBtn.textContent = 'Kick';
      kickBtn.className = "bg-red-500 text-white px-2 ml-2";
      kickBtn.addEventListener('click', () => {
        socket.emit('kickPlayer', { lobbyId: currentLobbyId, playerId: player.id });
      });
      div.appendChild(promoteBtn);
      div.appendChild(kickBtn);
    }
    playerList.appendChild(div);
  });

  if (leader && leader.id === socket.id) {
    leaderActions.classList.remove('hidden');
  } else {
    leaderActions.classList.add('hidden');
  }
}

startGameBtn.addEventListener('click', () => {
  socket.emit('startGame', { lobbyId: currentLobbyId });
});

socket.on('gameStarting', (data) => {
  playerList.classList.add('hidden');
  leaderActions.classList.add('hidden');
  splendorBoard.classList.remove('hidden');

  socket.emit('gameReady', { lobbyId: data.lobbyId, players: data.players });
});

socket.on('gameStateUpdate', (gameState) => {
  renderGame(gameState);
});

socket.on('kicked', () => {
  alert('You have been kicked from the lobby.');
  window.location.reload();
});

socket.on('gameOver', (winner) => {
  alert(`Game Over! The winner is ${winner.name}`);
});

function renderGame(state) {
    splendorBoard.innerHTML = '';
  
    // Show current player's turn
    const currentPlayer = state.players[state.currentPlayerIndex];
    const turnInfo = document.createElement('div');
    turnInfo.className = "mb-4 text-lg font-bold";
    turnInfo.textContent = `Current Turn: ${currentPlayer.name}`;
    splendorBoard.appendChild(turnInfo);
  
    // Display players and their points, chips
    const playersContainer = document.createElement('div');
    playersContainer.className = "mb-6 flex space-x-4";
    state.players.forEach(player => {
      const pDiv = document.createElement('div');
      pDiv.className = "border p-2 rounded bg-white";
      pDiv.innerHTML = `
        <div class="font-semibold">${player.name}</div>
        <div>Points: ${player.points}</div>
        <div class="mt-2">Chips:
          ${Object.entries(player.chips).map(([color, amt]) => 
            amt > 0 ? `<span class="inline-block px-2 py-1 bg-gray-200 mr-1 rounded">${color}: ${amt}</span>` : ''
          ).join('')}
        </div>
      `;
      playersContainer.appendChild(pDiv);
    });
    splendorBoard.appendChild(playersContainer);
  
    // Display the chip bank
    if (state.chips) {
      const bankContainer = document.createElement('div');
      bankContainer.className = "mb-6";
      bankContainer.innerHTML = `
        <div class="font-semibold mb-2">Available Chips:</div>
        ${Object.entries(state.chips).map(([color, amt]) => 
          `<span class="inline-block px-2 py-1 bg-gray-200 mr-1 rounded">${color}: ${amt}</span>`
        ).join('')}
      `;
      splendorBoard.appendChild(bankContainer);
    }
  
    // Display the market cards if market exists
    if (state.market) {
      const marketContainer = document.createElement('div');
      marketContainer.className = "space-y-6";
  
      [1, 2, 3].forEach(level => {
        const levelCards = state.market[`level${level}`];
        if (!levelCards) return; // If no market for this level, skip
  
        const levelSection = document.createElement('div');
        levelSection.innerHTML = `<div class="font-semibold mb-2">Level ${level} Cards:</div>`;
        const cardsWrapper = document.createElement('div');
        cardsWrapper.className = "grid grid-cols-4 gap-4";
  
        levelCards.forEach((card, index) => {
          if (!card) {
            // If there's a missing card slot
            const emptySlot = document.createElement('div');
            emptySlot.className = "border p-2 rounded bg-gray-50 text-gray-400 text-center";
            emptySlot.textContent = "Empty";
            cardsWrapper.appendChild(emptySlot);
            return;
          }
  
          const cardDiv = document.createElement('div');
          cardDiv.className = "border p-4 rounded bg-white shadow cursor-pointer hover:shadow-lg transition-shadow";
          cardDiv.innerHTML = `
            <div class="font-bold">Points: ${card.points}</div>
            <div class="text-sm">Gives: ${card.color}</div>
            <div class="mt-2">
              <span class="font-semibold">Cost:</span>
              ${Object.entries(card.cost).map(([cColor, cAmt]) => 
                `<span class="inline-block mr-1 px-2 py-1 bg-gray-200 rounded">${cColor}: ${cAmt}</span>`
              ).join('')}
            </div>
          `;
  
          cardDiv.dataset.level = level;
          cardDiv.dataset.index = index;
  
          // Add a click event to buy the card
          cardDiv.addEventListener('click', () => {
            socket.emit('buyCard', { level, index, lobbyId: currentLobbyId });
          });
  
          cardsWrapper.appendChild(cardDiv);
        });
  
        levelSection.appendChild(cardsWrapper);
        marketContainer.appendChild(levelSection);
      });
  
      splendorBoard.appendChild(marketContainer);
    }
  }
  
