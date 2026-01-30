export type Direction = 'left' | 'right' | 'up' | 'down'

export type PartType = 'head' | 'body' | 'tail' | 'turn-left' | 'turn-right' | 'food'

export type FruitType = 'banana' | 'cherry' | 'strawberry' | 'kiwi'

export interface Coordinates {
  x: number
  y: number
}

export interface GameConfig {
  gridWidth: number
  gridHeight: number
  cellSize: number
  tickSpeed: number
  initialSnakeLength: number
}
