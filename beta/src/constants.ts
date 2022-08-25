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
  GREEN:  0x008A65,
  PURPLE: 0xC543C3,
  ORANGE: 0xFF836A,
  BLUE:   0x007EB0,
}

export const DIRECTIONS: Direction[] = ['left', 'up', 'right', 'down']
