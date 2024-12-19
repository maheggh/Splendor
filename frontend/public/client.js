function renderGame(state) {
    splendorBoard.innerHTML = '';
    
    // Display current player turn
    const currentPlayer = state.players[state.currentPlayerIndex];
    const turnInfo = document.createElement('div');
    turnInfo.className = "mb-4 text-lg font-bold";
    turnInfo.textContent = `Current Turn: ${currentPlayer.name}`;
    splendorBoard.appendChild(turnInfo);
  
    // Display players' info
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
    const bankContainer = document.createElement('div');
    bankContainer.className = "mb-6";
    bankContainer.innerHTML = `
      <div class="font-semibold mb-2">Available Chips:</div>
      ${Object.entries(state.chips).map(([color, amt]) => 
        `<span class="inline-block px-2 py-1 bg-gray-200 mr-1 rounded">${color}: ${amt}</span>`
      ).join('')}
    `;
    splendorBoard.appendChild(bankContainer);
  
    // Display the market
    // We'll create three sections for level 1, level 2, and level 3.
    const marketContainer = document.createElement('div');
    marketContainer.className = "space-y-6";
  
    [1, 2, 3].forEach(level => {
      const levelSection = document.createElement('div');
      levelSection.innerHTML = `<div class="font-semibold mb-2">Level ${level} Cards:</div>`;
      const cardsWrapper = document.createElement('div');
      cardsWrapper.className = "grid grid-cols-4 gap-4";
  
      state.market[`level${level}`].forEach((card, index) => {
        if (!card) {
          // If there's a missing card (maybe all are purchased), show an empty slot
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
        
        // Store data so we know which card this is if we want to buy it
        cardDiv.dataset.level = level;
        cardDiv.dataset.index = index;
  
        // When clicked, try to buy the card (you'll need to ensure the current player has enough chips)
        cardDiv.addEventListener('click', () => {
          // Emit buyCard event to the server
          socket.emit('buyCard', { level, index: parseInt(index, 10), lobbyId: currentLobbyId });
        });
  
        cardsWrapper.appendChild(cardDiv);
      });
  
      levelSection.appendChild(cardsWrapper);
      marketContainer.appendChild(levelSection);
    });
  
    splendorBoard.appendChild(marketContainer);
  }
  