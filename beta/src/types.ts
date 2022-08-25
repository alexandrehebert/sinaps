export type Direction = 'left' | 'right' | 'up' | 'down'

export type Coordinates = { x: number, y: number }

export type PartType = 'turn-left' | 'turn-right' | 'food' | 'head' | 'tail' | 'body'

export type Boundaries = {
  width: number,
  height: number
}

export type FruitType = 'banana' | 'cherry' | 'strawberry' | 'kiwi' | 'cannibal'

export type PortalType = 'in' | 'in-body' | 'in-tail' | 'out' | 'out-head' | 'out-tail' | 'out-turn-left' | 'out-turn-right'
