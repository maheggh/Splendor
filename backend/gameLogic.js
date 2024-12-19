// backend/gameLogic.js

// Sample cards for demonstration purposes.
// In a real implementation, you'd use the actual Splendor card set.
// Each card has a level, a point value, a cost object, and a gem color it grants.
const LEVEL_1_CARDS = [
    { points: 0, color: 'black', cost: { white: 1, blue: 1 }, },
    { points: 0, color: 'green', cost: { red: 2 }, },
    { points: 0, color: 'white', cost: { black: 1, green: 1 }, },
    // ... add as many as needed to simulate a deck (usually ~40 cards total)
  ];
  
  const LEVEL_2_CARDS = [
    { points: 1, color: 'red', cost: { white: 2, blue: 2, black: 2 }, },
    { points: 1, color: 'blue', cost: { green: 3, red: 2 }, },
    // ... similarly populate
  ];
  
  const LEVEL_3_CARDS = [
    { points: 3, color: 'white', cost: { white: 3, blue: 3, black: 3, green: 3, red: 3 }, },
    // ... add a few high-cost, high-point cards
  ];
  
  module.exports = {
    initializeGame,
    canTakeChips,
    applyChipSelection,
    canBuyCard,
    purchaseCard,
    nextTurn,
    checkGameOver
  };
  
  function initializeGame(players) {
    // Shuffle decks
    shuffleArray(LEVEL_1_CARDS);
    shuffleArray(LEVEL_2_CARDS);
    shuffleArray(LEVEL_3_CARDS);
  
    // Draw initial market (4 cards from each level)
    const market = {
      level1: LEVEL_1_CARDS.splice(0,4),
      level2: LEVEL_2_CARDS.splice(0,4),
      level3: LEVEL_3_CARDS.splice(0,4)
    };
  
    // Initial chips: For a 4-player game, Splendor typically has 7 of each colored chip and 5 gold.
    // Adjust if different player counts.
    const chips = { white:7, blue:7, green:7, red:7, black:7, gold:5 };
  
    const playerStates = players.map(p => ({
      id: p.id,
      name: p.name,
      chips: {white:0,blue:0,green:0,red:0,black:0,gold:0},
      cards: [],    // purchased cards
      points: 0,
      reserved: []  // reserved cards
    }));
  
    return {
      players: playerStates,
      market,
      decks: {
        level1: LEVEL_1_CARDS,
        level2: LEVEL_2_CARDS,
        level3: LEVEL_3_CARDS
      },
      chips,
      currentPlayerIndex: 0
    };
  }
  
  // Decide if a player can take the requested chips
  // selection = { white: x, blue: x, ... }
  // Rules (simplified):
  // - Player can take 3 different chips if available.
  // - Or can take 2 of the same color if there are at least 4 in the bank of that color.
  function canTakeChips(selection, gameState) {
    // Count how many colors requested
    const colors = Object.keys(selection).filter(color => selection[color] > 0);
    const count = colors.reduce((acc,c) => acc+selection[c],0);
  
    if (count === 0) return false;
    if (count > 3) return false;
  
    const { chips } = gameState;
  
    // If taking 2 of the same color
    if (count === 2 && colors.length === 1) {
      const color = colors[0];
      if (chips[color] < 4) return false;
    }
  
    // If taking 3 different colors
    if (count === 3 && colors.length !== 3) return false;
  
    // Check if enough chips in bank
    for (const color of colors) {
      if (chips[color] < selection[color]) return false;
    }
  
    return true;
  }
  
  function applyChipSelection(player, selection, gameState) {
    const { chips } = gameState;
    for (const color in selection) {
      if (selection[color] > 0) {
        chips[color] -= selection[color];
        player.chips[color] += selection[color];
      }
    }
  }
  
  // Check if a player can afford a card
  // cardInfo = { level: 1, index: 2 } means gameState.market[level1][2]
  function canBuyCard(player, cardInfo, gameState) {
    const card = getCardFromMarket(gameState, cardInfo);
    if (!card) return false;
  
    const cost = { ...card.cost };
    // Apply discounts from player's owned cards
    // Each card's color grants a discount of that color cost by 1
    const discounts = calculateDiscounts(player);
    for (const color in cost) {
      cost[color] = Math.max(0, cost[color] - (discounts[color] || 0));
    }
  
    // Check if player has enough chips + gold to pay cost
    let goldNeeded = 0;
    for (const color in cost) {
      const required = cost[color];
      if (player.chips[color] >= required) {
        // They can pay these chips directly
      } else {
        // Need gold chips for shortfall
        const shortfall = required - player.chips[color];
        goldNeeded += shortfall;
      }
    }
  
    return player.chips.gold >= goldNeeded;
  }
  
  function purchaseCard(player, cardInfo, gameState) {
    const card = getCardFromMarket(gameState, cardInfo);
    if (!card) return;
  
    // Calculate final cost with discounts
    const cost = { ...card.cost };
    const discounts = calculateDiscounts(player);
    for (const color in cost) {
      cost[color] = Math.max(0, cost[color] - (discounts[color] || 0));
    }
  
    // Deduct chips
    let goldUsed = 0;
    for (const color in cost) {
      const required = cost[color];
      const playerHas = player.chips[color];
      if (playerHas >= required) {
        player.chips[color] -= required;
        // Return no chips to bank for the moment (in Splendor you discard them back to bank)
        gameState.chips[color] += required;
      } else {
        // Use what color chips player has
        if (playerHas > 0) {
          player.chips[color] = 0;
          gameState.chips[color] += playerHas;
        }
        const remainder = required - playerHas;
        // remainder must be paid in gold
        player.chips.gold -= remainder;
        goldUsed += remainder;
        // gold does not get returned to a specific color in the bank, it's a wildcard
        // Actually, gold chips do return to the bank after use
        gameState.chips.gold += remainder;
      }
    }
  
    // Give the player the card
    player.cards.push(card);
    player.points += card.points;
  
    // Replace the purchased card with a new one from the deck
    const marketArray = gameState.market[`level${cardInfo.level}`];
    marketArray[cardInfo.index] = gameState.decks[`level${cardInfo.level}`].shift();
  }
  
  // Move to the next player's turn
  function nextTurn(gameState) {
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  }
  
  // Check if any player has reached 15 points
  function checkGameOver(gameState, callback) {
    const winner = gameState.players.find(p => p.points >= 15);
    if (winner) callback(winner);
  }
  
  // Helper Functions
  function getCardFromMarket(gameState, {level, index}) {
    const arr = gameState.market[`level${level}`];
    return arr && arr[index] ? arr[index] : null;
  }
  
  function calculateDiscounts(player) {
    // Each card color the player owns reduces cost of that color by 1
    // Count how many of each color the player has
    const discounts = { white:0, blue:0, green:0, red:0, black:0 };
    for (const card of player.cards) {
      discounts[card.color] = (discounts[card.color] || 0) + 1;
    }
    return discounts;
  }
  
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i+1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  