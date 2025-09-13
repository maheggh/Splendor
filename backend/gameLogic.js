// backend/gameLogic.js

import { LEVEL_1_CARDS, LEVEL_2_CARDS, LEVEL_3_CARDS, NOBLES } from "./cards.js";

export function initializeGame(players) {
  // Clone and shuffle decks to avoid mutating module arrays across games
  const level1 = [...LEVEL_1_CARDS];
  const level2 = [...LEVEL_2_CARDS];
  const level3 = [...LEVEL_3_CARDS];
  const nobles = [...NOBLES];

  shuffleArray(level1);
  shuffleArray(level2);
  shuffleArray(level3);
  shuffleArray(nobles);

  // Draw initial market (4 cards from each level)
  const market = {
    level1: level1.splice(0,4),
    level2: level2.splice(0,4),
    level3: level3.splice(0,4)
  };

  // Set chip counts based on number of players (Splendor rules)
  // 2 players: 4 of each color, 3 players: 5, 4 players: 7
  const playerCount = players.length;
  let base = 7;
  if (playerCount === 2) base = 4;
  else if (playerCount === 3) base = 5;

  const chips = { white: base, blue: base, green: base, red: base, black: base, gold: 5 };

  const playerStates = players.map(p => ({
    id: p.id,
    name: p.name,
    chips: {white:0,blue:0,green:0,red:0,black:0,gold:0},
    cards: [],
    points: 0,
    reserved: []
  }));

  // Draw nobles: number of players + 1
  const numNobles = Math.min(nobles.length, playerCount + 1);
  const availableNobles = nobles.splice(0, numNobles);

  return {
    players: playerStates,
    market,
    decks: {
      level1: level1,
      level2: level2,
      level3: level3
    },
    nobles: availableNobles,
    chips,
    currentPlayerIndex: 0,
    finalRound: false,
    finalRoundStarter: null
  };
}

// Decide if a player can take the requested chips
export function canTakeChips(player, selection, gameState) {
  const colors = Object.keys(selection).filter(color => selection[color] > 0);
  const count = colors.reduce((acc,c) => acc+selection[c],0);

  if (count === 0) return false;
  if (count > 3) return false;

  const { chips } = gameState;

  // Players cannot take gold directly
  if ((selection.gold || 0) > 0) return false;

  // Enforce allowed patterns only: either 3 different (one each) OR 2 of the same color (with >=4 available)
  const isThreeDifferent = count === 3 && colors.length === 3 && colors.every(c => selection[c] === 1);
  const isTwoSame = count === 2 && colors.length === 1 && selection[colors[0]] === 2 && chips[colors[0]] >= 4;
  if (!isThreeDifferent && !isTwoSame) return false;

  // Check if enough chips in bank
  for (const color of colors) {
    if (chips[color] < selection[color]) return false;
  }

  // Do not block selections that push the player over 10; they'll discard at end of turn

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
  // cardInfo may refer to a market card {level, index} or a reserved card by reservedIndex
  let card = getCardFromMarket(gameState, cardInfo);
  if (!card) {
    const reservedObj = getReservedCard(player, cardInfo);
    if (reservedObj) card = reservedObj.card;
  }
  if (!card) return false;

  const cost = { ...card.cost };
  const discounts = calculateDiscounts(player);
  for (const color in cost) {
    cost[color] = Math.max(0, cost[color] - (discounts[color] || 0));
  }

  let goldNeeded = 0;
  for (const color in cost) {
    const required = cost[color];
    if ((player.chips[color] || 0) < required) {
      const shortfall = required - (player.chips[color] || 0);
      goldNeeded += shortfall;
    }
  }

  return (player.chips.gold || 0) >= goldNeeded;
}

// enables players to reserve a card
export function canReserveCard(player, cardInfo, gameState) {
  // A player can reserve either a face-up market card (specified by index)
  // or reserve blindly from the top of the corresponding deck (no index provided).
  if (!cardInfo || cardInfo.level === undefined) return false;
  const reservingFromMarket = cardInfo.index !== undefined && cardInfo.index !== null;
  if (reservingFromMarket) {
    const card = getCardFromMarket(gameState, cardInfo);
    if (!card) return false;
  } else {
    // Reserving from deck: ensure the deck has cards
    const deckArr = gameState.decks[`level${cardInfo.level}`];
    if (!deckArr || deckArr.length === 0) return false;
  }
  // A player can reserve a card if they have fewer than 3 reserved cards.
  if (player.reserved.length >= 3) return false;
  return true;
}

export function reserveCard(player, cardInfo, gameState) {
  if (!cardInfo || cardInfo.level === undefined) return;

  let reservedCard = null;
  const reservingFromMarket = cardInfo.index !== undefined && cardInfo.index !== null;
  if (reservingFromMarket) {
    // Reserve from market
    const card = getCardFromMarket(gameState, cardInfo);
    if (!card) return;
    // Remove the card from the market and replace from deck
    const marketArray = gameState.market[`level${cardInfo.level}`];
    marketArray[cardInfo.index] = gameState.decks[`level${cardInfo.level}`].shift();
    reservedCard = card;
  } else {
    // Reserve blindly from the top of the deck
    const deckArr = gameState.decks[`level${cardInfo.level}`];
    if (!deckArr || deckArr.length === 0) return;
    reservedCard = deckArr.shift();
  }

  // Add to player’s reserved cards
  player.reserved.push(reservedCard);

  // If gold chips are available, give one gold chip
  if (gameState.chips.gold > 0) {
    gameState.chips.gold -= 1;
    player.chips.gold += 1;
  }
}
  

export function purchaseCard(player, cardInfo, gameState) {
  // Allow purchasing either a market card or a reserved card.
  let fromReserved = false;
  let card = getCardFromMarket(gameState, cardInfo);
  if (!card) {
    const reservedObj = getReservedCard(player, cardInfo);
    if (reservedObj) {
      card = reservedObj.card;
      fromReserved = true;
    }
  }
  if (!card) return;

  const cost = { ...card.cost };
  const discounts = calculateDiscounts(player);
  for (const color in cost) {
    cost[color] = Math.max(0, cost[color] - (discounts[color] || 0));
  }

  // Deduct chips from player and return to bank
  for (const color in cost) {
    const required = cost[color];
    const playerHas = player.chips[color] || 0;
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

  // If buying from market, replace the market slot
  if (!fromReserved) {
    const marketArray = gameState.market[`level${cardInfo.level}`];
    marketArray[cardInfo.index] = gameState.decks[`level${cardInfo.level}`].shift();
  } else {
    // remove reserved card from player's reserved list
    const reservedIndex = cardInfo.reservedIndex !== undefined ? cardInfo.reservedIndex : player.reserved.findIndex(r => r === card);
    if (reservedIndex >= 0) player.reserved.splice(reservedIndex, 1);
  }

  player.cards.push(card);
  player.points += card.points;

  // After purchasing, check for nobles
  const awardedNobles = awardNobles(player, gameState);

  // If someone reached 15 points and finalRound not started, start final round
  if (!gameState.finalRound && player.points >= 15) {
    gameState.finalRound = true;
    gameState.finalRoundStarter = gameState.currentPlayerIndex;
  }
  return { awardedNobles };
}

// Move to the next player's turn
export function nextTurn(gameState) {
  // If final round started and we've returned to the starter, the game should end after this move
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  if (gameState.finalRound && gameState.currentPlayerIndex === gameState.finalRoundStarter) {
    // Game over: find highest points (tie-breaking by fewest purchased cards as in official rules is optional)
    // We set a flag; actual callback done in checkGameOver
    gameState.gameShouldEnd = true;
  }
}

// Check if any player has reached 15 points
export function checkGameOver(gameState, callback) {
  // If final round has been triggered and flagged to end, determine the winner
  if (gameState.gameShouldEnd) {
    let winner = null;
    for (const p of gameState.players) {
      if (!winner || p.points > winner.points || (p.points === winner.points && p.cards.length < winner.cards.length)) {
        winner = p;
      }
    }
    if (winner) callback(winner);
    return;
  }

  // Otherwise, immediate win when 15 or more points and final round not started
  const potential = gameState.players.find(p => p.points >= 15);
  if (potential && !gameState.finalRound) {
    // don't immediately end; wait for other players to finish their turns
    gameState.finalRound = true;
    gameState.finalRoundStarter = gameState.currentPlayerIndex;
    return;
  }
}

// Helper Functions
function getCardFromMarket(gameState, cardInfo) {
  if (!cardInfo || cardInfo.level === undefined || cardInfo.index === undefined) return null;
  const level = cardInfo.level;
  const index = cardInfo.index;
  const arr = gameState.market && gameState.market[`level${level}`];
  return arr && arr[index] ? arr[index] : null;
}

function getReservedCard(player, cardInfo) {
  // cardInfo can be { reservedIndex }
  if (cardInfo && cardInfo.reservedIndex !== undefined) {
    const idx = cardInfo.reservedIndex;
    return idx >= 0 && idx < player.reserved.length ? { card: player.reserved[idx], reservedIndex: idx } : null;
  }
  return null;
}

function calculateDiscounts(player) {
  const discounts = { white:0, blue:0, green:0, red:0, black:0 };
  for (const card of player.cards) {
    discounts[card.color] = (discounts[card.color] || 0) + 1;
  }
  return discounts;
}

export function awardNobles(player, gameState) {
  const discounts = calculateDiscounts(player);
  const awarded = [];
  gameState.nobles = gameState.nobles || [];
  for (let i = 0; i < gameState.nobles.length; i++) {
    const noble = gameState.nobles[i];
    let qualifies = true;
    for (const color in noble.cost) {
      if ((discounts[color] || 0) < noble.cost[color]) { qualifies = false; break; }
    }
    if (qualifies) {
      player.points += noble.points;
      awarded.push(noble);
      gameState.nobles.splice(i,1);
      break; // Only one
    }
  }
  return awarded;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
