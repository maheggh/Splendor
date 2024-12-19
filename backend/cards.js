const LEVEL_1_CARDS = [
    // White-producing cards (8)
    { points: 0, color: 'white', cost: { blue:1, black:1 } },
    { points: 0, color: 'white', cost: { black:2 } },
    { points: 0, color: 'white', cost: { blue:2 } },
    { points: 0, color: 'white', cost: { green:1, blue:1 } },
    { points: 0, color: 'white', cost: { green:2 } },
    { points: 0, color: 'white', cost: { red:1, blue:1 } },
    { points: 0, color: 'white', cost: { black:1, green:1 } },
    { points: 1, color: 'white', cost: { blue:1, green:1, red:1, black:1 } },
  
    // Blue-producing cards (8)
    { points: 0, color: 'blue', cost: { red:1, black:1 } },
    { points: 0, color: 'blue', cost: { red:2 } },
    { points: 0, color: 'blue', cost: { black:2 } },
    { points: 0, color: 'blue', cost: { green:1, black:1 } },
    { points: 0, color: 'blue', cost: { green:2 } },
    { points: 0, color: 'blue', cost: { white:1, black:1 } },
    { points: 0, color: 'blue', cost: { white:2 } },
    { points: 1, color: 'blue', cost: { white:1, green:1, red:1, black:1 } },
  
    // Green-producing cards (8)
    { points: 0, color: 'green', cost: { white:1, black:1 } },
    { points: 0, color: 'green', cost: { white:2 } },
    { points: 0, color: 'green', cost: { white:1, red:1 } },
    { points: 0, color: 'green', cost: { white:1, blue:1 } },
    { points: 0, color: 'green', cost: { blue:1, red:1 } },
    { points: 0, color: 'green', cost: { red:2 } },
    { points: 0, color: 'green', cost: { white:1, black:1, red:1 } },
    { points: 1, color: 'green', cost: { white:1, blue:1, black:1, red:1 } },
  
    // Red-producing cards (8)
    { points: 0, color: 'red', cost: { white:2 } },
    { points: 0, color: 'red', cost: { white:1, green:1 } },
    { points: 0, color: 'red', cost: { white:1, blue:1 } },
    { points: 0, color: 'red', cost: { blue:2 } },
    { points: 0, color: 'red', cost: { green:2 } },
    { points: 0, color: 'red', cost: { black:1, blue:1 } },
    { points: 0, color: 'red', cost: { white:1, black:1 } },
    { points: 1, color: 'red', cost: { white:1, blue:1, green:1, black:1 } },
  
    // Black-producing cards (8)
    { points: 0, color: 'black', cost: { white:1, red:1 } },
    { points: 0, color: 'black', cost: { white:2 } },
    { points: 0, color: 'black', cost: { white:1, green:1 } },
    { points: 0, color: 'black', cost: { green:2 } },
    { points: 0, color: 'black', cost: { blue:1, green:1 } },
    { points: 0, color: 'black', cost: { blue:2 } },
    { points: 0, color: 'black', cost: { red:2 } },
    { points: 1, color: 'black', cost: { white:1, blue:1, green:1, red:1 } }
  ];
  

  const LEVEL_2_CARDS = [
    // White-producing cards (6)
    { points: 1, color: 'white', cost: { black:3, red:2 } },
    { points: 1, color: 'white', cost: { blue:2, black:2 } },
    { points: 1, color: 'white', cost: { blue:1, green:3 } },
    { points: 1, color: 'white', cost: { green:2, black:2 } },
    { points: 2, color: 'white', cost: { black:5 } },
    { points: 2, color: 'white', cost: { blue:2, green:2, red:2 } },
  
    // Blue-producing cards (6)
    { points: 1, color: 'blue', cost: { white:3, red:2 } },
    { points: 1, color: 'blue', cost: { white:2, red:2 } },
    { points: 1, color: 'blue', cost: { white:2, black:2 } },
    { points: 1, color: 'blue', cost: { white:1, black:3 } },
    { points: 2, color: 'blue', cost: { white:5 } },
    { points: 2, color: 'blue', cost: { white:2, green:2, black:2 } },
  
    // Green-producing cards (6)
    { points: 1, color: 'green', cost: { white:2, red:2 } },
    { points: 1, color: 'green', cost: { white:1, blue:3 } },
    { points: 1, color: 'green', cost: { blue:2, red:2 } },
    { points: 1, color: 'green', cost: { white:3, blue:2 } },
    { points: 2, color: 'green', cost: { blue:5 } },
    { points: 2, color: 'green', cost: { white:2, blue:2, black:2 } },
  
    // Red-producing cards (6)
    { points: 1, color: 'red', cost: { white:2, blue:2 } },
    { points: 1, color: 'red', cost: { white:3, green:2 } },
    { points: 1, color: 'red', cost: { green:2, black:2 } },
    { points: 1, color: 'red', cost: { white:1, green:3 } },
    { points: 2, color: 'red', cost: { green:5 } },
    { points: 2, color: 'red', cost: { white:2, green:2, blue:2 } },
  
    // Black-producing cards (6)
    { points: 1, color: 'black', cost: { blue:2, green:2 } },
    { points: 1, color: 'black', cost: { blue:3, red:2 } },
    { points: 1, color: 'black', cost: { green:2, red:2 } },
    { points: 1, color: 'black', cost: { blue:1, red:3 } },
    { points: 2, color: 'black', cost: { red:5 } },
    { points: 2, color: 'black', cost: { blue:2, red:2, white:2 } }
  ];
  
  
  const LEVEL_3_CARDS = [
    // White-producing (4)
    { points: 3, color: 'white', cost: { blue:3, green:3, red:3, black:3 } },
    { points: 4, color: 'white', cost: { black:7 } },
    { points: 4, color: 'white', cost: { green:3, red:6 } },
    { points: 5, color: 'white', cost: { white:3, blue:3, green:3, red:3 } },
  
    // Blue-producing (4)
    { points: 3, color: 'blue', cost: { white:3, green:3, red:3, black:3 } },
    { points: 4, color: 'blue', cost: { white:7 } },
    { points: 4, color: 'blue', cost: { red:3, black:6 } },
    { points: 5, color: 'blue', cost: { white:3, green:3, red:3, black:3 } },
  
    // Green-producing (4)
    { points: 3, color: 'green', cost: { white:3, blue:3, red:3, black:3 } },
    { points: 4, color: 'green', cost: { blue:7 } },
    { points: 4, color: 'green', cost: { white:3, black:6 } },
    { points: 5, color: 'green', cost: { white:3, blue:3, red:3, black:3 } },
  
    // Red-producing (4)
    { points: 3, color: 'red', cost: { white:3, blue:3, green:3, black:3 } },
    { points: 4, color: 'red', cost: { green:7 } },
    { points: 4, color: 'red', cost: { blue:3, black:6 } },
    { points: 5, color: 'red', cost: { white:3, blue:3, green:3, black:3 } },
  
    // Black-producing (4)
    { points: 3, color: 'black', cost: { white:3, blue:3, green:3, red:3 } },
    { points: 4, color: 'black', cost: { red:7 } },
    { points: 4, color: 'black', cost: { white:3, red:6 } },
    { points: 5, color: 'black', cost: { white:3, blue:3, green:3, red:3 } }
  ];
  

export {LEVEL_1_CARDS, LEVEL_2_CARDS, LEVEL_3_CARDS}