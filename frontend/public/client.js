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
  
    const currentPlayer = state.players[state.currentPlayerIndex];
  
    // Highlight whose turn it is
    const turnInfo = document.createElement('div');
    turnInfo.className = "mb-4 text-lg font-bold p-2 bg-blue-100 rounded border border-blue-300";
    turnInfo.textContent = `Current Turn: ${currentPlayer.name}`;
    splendorBoard.appendChild(turnInfo);
  
    // Opponents info (short version, as before)
    const otherPlayersContainer = document.createElement('div');
    otherPlayersContainer.className = "mb-6 flex space-x-4 items-start";
  
    const myPlayer = state.players.find(p => p.id === socket.id);
  
    state.players.forEach(player => {
      if (player.id === myPlayer.id) return;
      // Summarize purchased cards by color
      const cardColors = {white:0,blue:0,green:0,red:0,black:0};
      player.cards.forEach(c => cardColors[c.color]++);
      const totalChips = Object.values(player.chips).reduce((sum, val) => sum+val, 0);
      const reservedCount = player.reserved.length;
  
      const pDiv = document.createElement('div');
      pDiv.className = "border p-2 rounded bg-white w-48";
      pDiv.innerHTML = `
        <div class="font-semibold">${player.name}</div>
        <div>Points: ${player.points}</div>
        <div class="mt-2 text-sm">
          <span class="font-semibold">Cards:</span>
          ${Object.entries(cardColors).map(([color, amt]) =>
            amt > 0 ? `<span class="inline-block px-1 bg-green-100 rounded mr-1">${color[0].toUpperCase()}:${amt}</span>` : ''
          ).join('') || 'None'}
        </div>
        <div class="mt-2 text-sm">
          <span class="font-semibold">Chips:</span> ${totalChips}
        </div>
        <div class="mt-2 text-sm">
          <span class="font-semibold">Reserved:</span> ${reservedCount} card${reservedCount !== 1 ? 's' : ''}
        </div>
      `;
      otherPlayersContainer.appendChild(pDiv);
    });
    splendorBoard.appendChild(otherPlayersContainer);
  
    // Market display (unchanged)
    if (state.market) {
      const marketContainer = document.createElement('div');
      marketContainer.className = "space-y-6 mb-6";
  
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
  
          cardDiv.addEventListener('click', () => {
            socket.emit('buyCard', { level, index, lobbyId: currentLobbyId });
          });
  
          const reserveBtn = document.createElement('button');
          reserveBtn.className = "bg-yellow-500 text-white px-2 py-1 mt-2 block";
          reserveBtn.textContent = "Reserve";
          reserveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
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
  
    // Your personal area at the bottom
    const myArea = document.createElement('div');
    myArea.className = "mt-8 border-t pt-4";
  
    const myTitle = document.createElement('div');
    myTitle.className = "font-semibold mb-2";
    myTitle.textContent = "Your Area:";
    myArea.appendChild(myTitle);
  
    // Your chips
    const myChipsDiv = document.createElement('div');
    myChipsDiv.className = "mb-4";
    myChipsDiv.innerHTML = `<div class="font-semibold">Your Chips:</div>
      ${Object.entries(myPlayer.chips).map(([color, amt]) =>
        amt > 0 ? `<span class="inline-block px-2 py-1 bg-gray-200 mr-1 rounded">${color}: ${amt}</span>` : ''
      ).join('') || 'None'}`;
    myArea.appendChild(myChipsDiv);
  
    // Your purchased cards
    const myCardsDiv = document.createElement('div');
    myCardsDiv.className = "mb-4";
    myCardsDiv.innerHTML = `<div class="font-semibold">Your Purchased Cards:</div>`;
    if (myPlayer.cards.length > 0) {
      myPlayer.cards.forEach(card => {
        const c = document.createElement('span');
        c.className = "inline-block px-2 py-1 bg-green-100 mr-1 rounded border border-green-300";
        c.textContent = `${card.color} (Pts: ${card.points})`;
        myCardsDiv.appendChild(c);
      });
    } else {
      myCardsDiv.innerHTML += "None";
    }
    myArea.appendChild(myCardsDiv);
  
    // Your reserved cards
    const myReservedDiv = document.createElement('div');
    myReservedDiv.className = "mb-4";
    myReservedDiv.innerHTML = `<div class="font-semibold">Your Reserved Cards:</div>`;
    if (myPlayer.reserved.length > 0) {
      myPlayer.reserved.forEach(card => {
        const c = document.createElement('span');
        c.className = "inline-block px-2 py-1 bg-yellow-100 mr-1 rounded border border-yellow-400";
        c.innerHTML = `R: ${card.color} (Pts: ${card.points})`;
        myReservedDiv.appendChild(c);
      });
    } else {
      myReservedDiv.innerHTML += "None";
    }
    myArea.appendChild(myReservedDiv);
  
    // Chip selection at the top of the screen
    // Only if it's your turn
    if (myPlayer.id === currentPlayer.id && state.chips) {
      // We'll attach the chip selection to the top, near turn info, for convenience
      const chipBankContainer = document.createElement('div');
      chipBankContainer.className = "mb-6 p-2 border rounded bg-white";
      chipBankContainer.innerHTML = `<div class="font-semibold mb-2">Select Chips (Click to add/remove):</div>`;
      
      const chipColors = ['white', 'blue', 'green', 'red', 'black'];
      const selectedChips = { white:0, blue:0, green:0, red:0, black:0 };
  
      const chipsWrapper = document.createElement('div');
      chipsWrapper.className = "flex space-x-2 .select-all";
  
      chipColors.forEach(color => {
        const chipCount = state.chips[color];
        const chipElem = document.createElement('div');
        chipElem.className = "px-2 py-1 rounded border cursor-pointer";
        chipElem.textContent = `${color}: ${chipCount}`;
        
        // Function to update chip UI based on selectedChips[color]
        const updateChipUI = () => {
          // Reset style
          chipElem.className = "px-2 py-1 rounded border cursor-pointer";
          if (selectedChips[color] === 1) {
            chipElem.classList.add('border-blue-500');
            chipElem.classList.add('bg-blue-100');
          } else if (selectedChips[color] === 2) {
            chipElem.classList.add('border-blue-700');
            chipElem.classList.add('bg-blue-200');
          }
        };
  
        chipElem.addEventListener('click', () => {
          // Cycle through 0->1->2->0
          const totalSelected = Object.values(selectedChips).reduce((a,b) => a+b, 0);
  
          if (selectedChips[color] === 0) {
            // Add 1 if total < 3
            if (totalSelected < 3) {
              selectedChips[color] = 1;
            }
          } else if (selectedChips[color] === 1) {
            // Try adding second chip of same color if it doesn't exceed 3 total
            // The server will check validity anyway. Let's allow 2 and rely on server for final check.
            if (totalSelected < 3) {
              selectedChips[color] = 2;
            } else {
              // If already 2 selected overall, we can either revert to 0 or do nothing.
              // Let's cycle to 0 if we can't add more.
              selectedChips[color] = 0;
            }
          } else {
            // If at 2, clicking again resets to 0
            selectedChips[color] = 0;
          }
          updateChipUI();
        });
  
        chipsWrapper.appendChild(chipElem);
      });
  
      chipBankContainer.appendChild(chipsWrapper);
  
      const takeChipsBtn = document.createElement('button');
      takeChipsBtn.textContent = "Take Chips";
      takeChipsBtn.className = "bg-blue-500 text-white px-4 py-2 mt-2 block";
      takeChipsBtn.addEventListener('click', () => {
        socket.emit('takeChips', { lobbyId: currentLobbyId, selection: selectedChips });
      });
      chipBankContainer.appendChild(takeChipsBtn);
  
      // Insert this chip bank container right after the turn info for better visibility
      splendorBoard.insertBefore(chipBankContainer, splendorBoard.children[1]);
    }
  
    splendorBoard.appendChild(myArea);
  }
  
  
  
  
