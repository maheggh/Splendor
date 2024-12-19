// backend/gameLogic.js

import { LEVEL_1_CARDS, LEVEL_2_CARDS, LEVEL_3_CARDS } from "./cards.js";

export function initializeGame(players) {
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
  const chips = { white:7, blue:7, green:7, red:7, black:7, gold:5 };

  const playerStates = players.map(p => ({
    id: p.id,
    name: p.name,
    chips: {white:0,blue:0,green:0,red:0,black:0,gold:0},
    cards: [],
    points: 0,
    reserved: []
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
export function canTakeChips(selection, gameState) {
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

export function applyChipSelection(player, selection, gameState) {
  const { chips } = gameState;
  for (const color in selection) {
    if (selection[color] > 0) {
      chips[color] -= selection[color];
      player.chips[color] += selection[color];
    }
  }
}

// Check if a player can afford a card
export function canBuyCard(player, cardInfo, gameState) {
  const card = getCardFromMarket(gameState, cardInfo);
  if (!card) return false;

  const cost = { ...card.cost };
  const discounts = calculateDiscounts(player);
  for (const color in cost) {
    cost[color] = Math.max(0, cost[color] - (discounts[color] || 0));
  }

  let goldNeeded = 0;
  for (const color in cost) {
    const required = cost[color];
    if (player.chips[color] < required) {
      const shortfall = required - player.chips[color];
      goldNeeded += shortfall;
    }
  }

  return player.chips.gold >= goldNeeded;
}

export function purchaseCard(player, cardInfo, gameState) {
  const card = getCardFromMarket(gameState, cardInfo);
  if (!card) return;

  const cost = { ...card.cost };
  const discounts = calculateDiscounts(player);
  for (const color in cost) {
    cost[color] = Math.max(0, cost[color] - (discounts[color] || 0));
  }

  for (const color in cost) {
    const required = cost[color];
    const playerHas = player.chips[color];
    if (playerHas >= required) {
      player.chips[color] -= required;
      gameState.chips[color] += required;
    } else {
      if (playerHas > 0) {
        player.chips[color] = 0;
        gameState.chips[color] += playerHas;
      }
      const remainder = required - playerHas;
      player.chips.gold -= remainder;
      gameState.chips.gold += remainder;
    }
  }

  player.cards.push(card);
  player.points += card.points;

  const marketArray = gameState.market[`level${cardInfo.level}`];
  marketArray[cardInfo.index] = gameState.decks[`level${cardInfo.level}`].shift();
}

// Move to the next player's turn
export function nextTurn(gameState) {
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
}

// Check if any player has reached 15 points
export function checkGameOver(gameState, callback) {
  const winner = gameState.players.find(p => p.points >= 15);
  if (winner) callback(winner);
}

// Helper Functions
function getCardFromMarket(gameState, {level, index}) {
  const arr = gameState.market[`level${level}`];
  return arr && arr[index] ? arr[index] : null;
}

function calculateDiscounts(player) {
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
