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

function colorToClass(color) {
    // Maps gem colors to background classes for small colored dots
    switch(color) {
      case 'white': return 'bg-gray-100 border border-gray-300';
      case 'blue': return 'bg-blue-400';
      case 'green': return 'bg-green-400';
      case 'red': return 'bg-red-400';
      case 'black': return 'bg-black';
      default: return 'bg-gray-200';
    }
  }
  
  function renderGame(state) {
    splendorBoard.innerHTML = '';
  
    const currentPlayer = state.players[state.currentPlayerIndex];
    const myPlayer = state.players.find(p => p.id === socket.id);
  
    // Turn info
    const turnInfo = document.createElement('div');
    turnInfo.className = "mb-2 text-lg font-bold p-2 bg-blue-100 rounded border border-blue-300";
    turnInfo.textContent = `Current Turn: ${currentPlayer.name}`;
    splendorBoard.appendChild(turnInfo);
  
    // Opponents info (compact)
    const otherPlayersContainer = document.createElement('div');
    otherPlayersContainer.className = "mb-2 flex space-x-2 items-start";
    state.players.forEach(player => {
      if (player.id === myPlayer.id) return;
      const cardColors = {white:0,blue:0,green:0,red:0,black:0};
      player.cards.forEach(c => cardColors[c.color]++);
      const totalChips = Object.values(player.chips).reduce((sum, val) => sum+val, 0);
      const reservedCount = player.reserved.length;
  
      // Summarize cards as initials with a gem icon would be too large,
      // just show counts as before but more compact
      const cardSummary = Object.entries(cardColors).filter(([_,amt])=>amt>0).map(([cColor, amt]) =>
        `<span class="inline-block px-1 bg-green-100 rounded mr-1">${colorToImage(cColor)}:${amt}</span>`
      ).join('') || 'None';
  
      const pDiv = document.createElement('div');
      pDiv.className = "border p-1 rounded bg-white w-40 text-sm";
      pDiv.innerHTML = `
        <div class="font-semibold">${player.name}</div>
        <div>Pts: ${player.points}</div>
        <div class="mt-1">
          <span class="font-semibold">Cards:</span> ${cardSummary}
        </div>
        <div class="mt-1">
          <span class="font-semibold">Chips:</span> ${totalChips}
        </div>
        <div class="mt-1">
          <span class="font-semibold">Reserved:</span> ${reservedCount}
        </div>
      `;
      otherPlayersContainer.appendChild(pDiv);
    });
    splendorBoard.appendChild(otherPlayersContainer);
  
    // Market with bigger cards and less gap
    if (state.market) {
      const marketContainer = document.createElement('div');
      marketContainer.className = "space-y-4 mb-4";
  
      [1, 2, 3].forEach(level => {
        const levelCards = state.market[`level${level}`];
        if (!levelCards) return; 
  
        const levelSection = document.createElement('div');
        levelSection.innerHTML = `<div class="font-semibold mb-1">Level ${level} Cards:</div>`;
        const cardsWrapper = document.createElement('div');
        cardsWrapper.className = "grid grid-cols-4 gap-2"; // less gap
  
        levelCards.forEach((card, index) => {
          if (!card) {
            const emptySlot = document.createElement('div');
            emptySlot.className = "border p-2 rounded bg-gray-50 text-gray-400 text-center w-36 h-56";
            emptySlot.textContent = "Empty";
            cardsWrapper.appendChild(emptySlot);
            return;
          }
  
          const cardDiv = document.createElement('div');
          cardDiv.className = `
            w-36 h-56 border rounded-lg bg-white shadow-md 
            flex flex-col justify-between p-2 relative 
            hover:shadow-lg transition-shadow text-sm
          `;
  
          // Points and gem provided
          cardDiv.innerHTML = `
            <div class="flex justify-between items-center">
              <div class="font-bold text-xl">${card.points > 0 ? card.points : ''}</div>
              <div class="text-sm px-2 py-1 bg-gray-200 rounded flex items-center space-x-1">
                <span>Gives:</span> ${colorToImage(card.color)}
              </div>
            </div>
            <div class="flex-1 flex flex-col justify-center items-center text-sm">
              <span class="font-semibold">Cost:</span>
              <div class="mt-1 grid grid-cols-2 gap-1">
                ${gemCostDisplay(card.cost)}
              </div>
            </div>
          `;
  
          cardDiv.addEventListener('click', () => {
            socket.emit('buyCard', { level, index, lobbyId: currentLobbyId });
          });
  
          const reserveBtn = document.createElement('button');
          reserveBtn.className = `
            text-xs bg-yellow-500 text-white py-1 px-2 rounded 
            absolute bottom-2 left-1/2 transform -translate-x-1/2
          `;
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
  
    // Your personal area
    const myArea = document.createElement('div');
    myArea.className = "mt-4 border-t pt-2 text-sm";
  
    const myTitle = document.createElement('div');
    myTitle.className = "font-semibold mb-1";
    myTitle.textContent = "Your Area:";
    myArea.appendChild(myTitle);
  
    // Your chips
    const myChipsDiv = document.createElement('div');
    myChipsDiv.className = "mb-2";
    myChipsDiv.innerHTML = `<div class="font-semibold">Your Chips:</div>${gemChipsDisplay(myPlayer.chips)}`;
    myArea.appendChild(myChipsDiv);
  
    // Your purchased cards
    const myCardsDiv = document.createElement('div');
    myCardsDiv.className = "mb-2";
    myCardsDiv.innerHTML = `<div class="font-semibold">Your Purchased Cards:</div>${playerCardsDisplay(myPlayer.cards)}`;
    myArea.appendChild(myCardsDiv);
  
    // Your reserved cards
    const myReservedDiv = document.createElement('div');
    myReservedDiv.className = "mb-2";
    myReservedDiv.innerHTML = `<div class="font-semibold">Your Reserved Cards:</div>${reservedCardsDisplay(myPlayer.reserved)}`;
    myArea.appendChild(myReservedDiv);
  
    // If it's your turn, show chip selection
    if (myPlayer.id === currentPlayer.id && state.chips) {
      const chipBankContainer = document.createElement('div');
      chipBankContainer.className = "mb-4 p-2 border rounded bg-white select-none";
  
      chipBankContainer.innerHTML = `<div class="font-semibold mb-1">Select Chips (Click to add/remove):</div>`;
  
      const chipColors = ['white', 'blue', 'green', 'red', 'black'];
      const selectedChips = { white:0, blue:0, green:0, red:0, black:0 };
  
      const chipsWrapper = document.createElement('div');
      chipsWrapper.className = "flex space-x-2 select-none";
  
      chipsWrapper.style.userSelect = "none"; // Ensure no text selection
  
      chipsWrapper.innerHTML = chipColors.map(color => {
        const chipCount = state.chips[color];
        return `
          <div data-color="${color}" class="px-2 py-1 rounded border cursor-pointer inline-block">
            ${colorToImage(color)} x${chipCount}
          </div>
        `;
      }).join('');
  
      // Attach click events after innerHTML
      chipsWrapper.querySelectorAll('div[data-color]').forEach(elem => {
        const color = elem.getAttribute('data-color');
        const updateChipUI = () => {
          elem.className = "px-2 py-1 rounded border cursor-pointer inline-block";
          if (selectedChips[color] === 1) {
            elem.classList.add('border-blue-500', 'bg-blue-100');
          } else if (selectedChips[color] === 2) {
            elem.classList.add('border-blue-700', 'bg-blue-200');
          }
        };
  
        elem.addEventListener('click', () => {
          const totalSelected = Object.values(selectedChips).reduce((a,b) => a+b, 0);
          if (selectedChips[color] === 0) {
            if (totalSelected < 3) {
              selectedChips[color] = 1;
            }
          } else if (selectedChips[color] === 1) {
            if (totalSelected < 3) {
              selectedChips[color] = 2;
            } else {
              selectedChips[color] = 0;
            }
          } else {
            selectedChips[color] = 0;
          }
          updateChipUI();
        });
      });
  
      chipBankContainer.appendChild(chipsWrapper);
  
      const takeChipsBtn = document.createElement('button');
      takeChipsBtn.textContent = "Take Chips";
      takeChipsBtn.className = "bg-blue-500 text-white px-4 py-1 mt-2 block";
      takeChipsBtn.addEventListener('click', () => {
        socket.emit('takeChips', { lobbyId: currentLobbyId, selection: selectedChips });
      });
      chipBankContainer.appendChild(takeChipsBtn);
  
      // Insert at the top after turn info, for easy access
      splendorBoard.insertBefore(chipBankContainer, splendorBoard.children[1]);
    }
  
    splendorBoard.appendChild(myArea);
  }
  
  
  
