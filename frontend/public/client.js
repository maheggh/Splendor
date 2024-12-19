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
  
    // Display players and their points, chips, purchased, and reserved cards
    const playersContainer = document.createElement('div');
    playersContainer.className = "mb-6 flex space-x-4";
    state.players.forEach(player => {
      const purchasedHTML = player.cards.map(card => 
        `<span class="inline-block px-2 py-1 bg-green-100 mr-1 rounded border border-green-300">
           ${card.color} (Pts: ${card.points})
         </span>`).join('');
  
      const reservedHTML = player.reserved.map(card => 
        `<span class="inline-block px-2 py-1 bg-yellow-100 mr-1 rounded border border-yellow-400">
           R: ${card.color} (Pts: ${card.points})
         </span>`).join('');
  
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
        <div class="mt-2">Purchased Cards: ${purchasedHTML || "None"}</div>
        <div class="mt-2">Reserved Cards: ${reservedHTML || "None"}</div>
      `;
      playersContainer.appendChild(pDiv);
    });
    splendorBoard.appendChild(playersContainer);
  
    // Display the chip bank and taking chips UI
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
  
      // Add UI for taking chips
      const takeChipsContainer = document.createElement('div');
      takeChipsContainer.className = "mb-6";
  
      const instructions = document.createElement('div');
      instructions.textContent = "Take Chips: Select up to 3 chips (3 different colors, or 2 of the same if enough are available).";
      takeChipsContainer.appendChild(instructions);
  
      const chipColors = ['white', 'blue', 'green', 'red', 'black'];
      const chipSelection = { white:0, blue:0, green:0, red:0, black:0 };
  
      chipColors.forEach(color => {
        const wrapper = document.createElement('div');
        wrapper.className = "inline-block mr-2";
  
        const label = document.createElement('label');
        label.textContent = color + ": ";
  
        const select = document.createElement('select');
        select.className = "border p-1";
        [0,1,2].forEach(num => {
          const opt = document.createElement('option');
          opt.value = num;
          opt.textContent = num;
          select.appendChild(opt);
        });
  
        select.addEventListener('change', () => {
          chipSelection[color] = parseInt(select.value, 10);
        });
  
        wrapper.appendChild(label);
        wrapper.appendChild(select);
        takeChipsContainer.appendChild(wrapper);
      });
  
      const takeChipsBtn = document.createElement('button');
      takeChipsBtn.textContent = "Take Chips";
      takeChipsBtn.className = "bg-blue-500 text-white px-4 py-2 ml-4";
      takeChipsBtn.addEventListener('click', () => {
        socket.emit('takeChips', { lobbyId: currentLobbyId, selection: chipSelection });
      });
      takeChipsContainer.appendChild(takeChipsBtn);
  
      splendorBoard.appendChild(takeChipsContainer);
    }
  
    // Display the market cards
    if (state.market) {
      const marketContainer = document.createElement('div');
      marketContainer.className = "space-y-6";
  
      [1, 2, 3].forEach(level => {
        const levelCards = state.market[`level${level}`];
        if (!levelCards) return; 
  
        const levelSection = document.createElement('div');
        levelSection.innerHTML = `<div class="font-semibold mb-2">Level ${level} Cards:</div>`;
        const cardsWrapper = document.createElement('div');
        cardsWrapper.className = "grid grid-cols-4 gap-4";
  
        levelCards.forEach((card, index) => {
          if (!card) {
            const emptySlot = document.createElement('div');
            emptySlot.className = "border p-2 rounded bg-gray-50 text-gray-400 text-center";
            emptySlot.textContent = "Empty";
            cardsWrapper.appendChild(emptySlot);
            return;
          }
  
          const cardDiv = document.createElement('div');
          cardDiv.className = "border p-4 rounded bg-white shadow relative hover:shadow-lg transition-shadow";
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
  
          // Click to buy card (if it's your turn and affordable)
          cardDiv.addEventListener('click', () => {
            socket.emit('buyCard', { level, index, lobbyId: currentLobbyId });
          });
  
          // Reserve button
          const reserveBtn = document.createElement('button');
          reserveBtn.className = "bg-yellow-500 text-white px-2 py-1 mt-2 block";
          reserveBtn.textContent = "Reserve";
          reserveBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Don't trigger buyCard on cardDiv
            socket.emit('reserveCard', { lobbyId: currentLobbyId, level, index });
          });
  
          cardDiv.appendChild(reserveBtn);
          cardsWrapper.appendChild(cardDiv);
        });
  
        levelSection.appendChild(cardsWrapper);
        marketContainer.appendChild(levelSection);
      });
  
      splendorBoard.appendChild(marketContainer);
    }
  }
  
  
