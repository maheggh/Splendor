import React from 'react';

export default function Gem({ color, size = 16 }: { color: string; size?: number }) {
  const file: Record<string, string> = {
    white: 'white_gem.png',
    blue: 'blue_gem.png',
    green: 'green_gem.png',
    red: 'red_gem.png',
    black: 'black_gem.png',
    gold: 'yellow_gem.png',
  };
  const src = `/images/${file[color] || file.white}`;
  return <img src={src} alt={color} width={size} height={size} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} />;
}
