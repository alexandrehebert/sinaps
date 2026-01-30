import { GameConfig, FruitType } from './types'

export const GAME_CONFIG: GameConfig = {
  gridWidth: 30,
  gridHeight: 20,
  cellSize: 20, // 20px per square
  tickSpeed: 150, // milliseconds per tick
  initialSnakeLength: 1
}

export const COLORS = {
  background: '#353444',
  grid: '#3F2F05',
  snake: '#008A63',
  snakeHead: '#00ffc8',
  food: '#ff006e'
}

export const SNAKE_COLORS = [
  { r: 0, g: 138, b: 99 },   // GREEN: 0x008A63
  { r: 183, g: 102, b: 201 }, // PURPLE: 0xB766C9
  { r: 212, g: 104, b: 91 },  // ORANGE: 0xD4685B
  { r: 44, g: 106, b: 206 }   // BLUE: 0x2C6ACE
]

export const SPRITE_SIZE = 100 // Original sprite size in pixels
export const FRUIT_SCALE = 0.15 // Scale fruits to 15% (15px from 100px sprite)

export const FRUIT_TYPES: FruitType[] = ['banana', 'cherry', 'strawberry', 'kiwi']
