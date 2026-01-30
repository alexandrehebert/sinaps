import { Direction } from "./types";

export const KeyCodes: {
  [key: string]: Direction
} = {
  'ArrowUp': 'up',
  'ArrowDown': 'down',
  'ArrowLeft': 'left',
  'ArrowRight': 'right',
}

export const SnakeColors = {
  GREEN:  0x008A63,
  PURPLE: 0xB766C9,
  ORANGE: 0xD4685B,
  BLUE:   0x2C6ACE,
}

export const DIRECTIONS: Direction[] = ['left', 'up', 'right', 'down']
