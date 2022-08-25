import { DisplayObject } from "pixi.js";
import { Boundaries, Coordinates, Direction, PartType } from "./types";
import { DIRECTIONS } from "./constants";
import { SnakePart } from "./snake";

export function checkCollision(objA: DisplayObject, objB: DisplayObject): boolean {
  const a = objA.getBounds();
  const b = objB.getBounds();

  const rightmostLeft = a.left < b.left ? b.left : a.left;
  const leftmostRight = a.right > b.right ? b.right : a.right;

  if (leftmostRight <= rightmostLeft) {
    return false;
  }

  const bottommostTop = a.top < b.top ? b.top : a.top;
  const topmostBottom = a.bottom > b.bottom ? b.bottom : a.bottom;

  return topmostBottom > bottommostTop;
}

export const compareCoordinates = (left: Coordinates, right: Coordinates) =>
  left.x === right.x && left.y === right.y

export const toPosition = (coordinates: Coordinates) => [coordinates.x * 100, coordinates.y * 100]

export const toAngle = (direction: Direction) => ({
  right: 0,
  down: 90,
  left: 180,
  up: 270
})[direction]

export const toCoordinates = (coordinates: Coordinates, bounds: Boundaries, direction: Direction) => {
  if (['left', 'right'].includes(direction)) {
    coordinates.x = direction === 'left' ? coordinates.x - 1 : direction === 'right' ? coordinates.x + 1 : coordinates.x
    coordinates.x = coordinates.x < 0 ? bounds.width - 1 : coordinates.x >= bounds.width ? 0 : coordinates.x
  } else {
    coordinates.y = direction === 'up' ? coordinates.y - 1 : direction === 'down' ? coordinates.y + 1 : coordinates.y
    coordinates.y = coordinates.y < 0 ? bounds.height - 1 : coordinates.y >= bounds.height ? 0 : coordinates.y
  }
  return coordinates
}

export const toPartType = (previous: Direction, next: Direction): PartType => {
  const diff = DIRECTIONS.indexOf(next) - DIRECTIONS.indexOf(previous)
  if (!diff) return 'body'
  if (diff === 1) return 'turn-right'
  if (diff === -1) return 'turn-left'
  return diff > 0 ? 'turn-left' : 'turn-right'
}

export const isValidMove = (previous: Direction, next: Direction): boolean =>
  Math.abs(DIRECTIONS.indexOf(next) - DIRECTIONS.indexOf(previous)) !== 2

export const isCannibalMove = (parts: SnakePart[], head: SnakePart) => {
  for (const part of parts) {
    if (checkCollision(part, head)) {
      return true
    }
  }
  return false
}

export function randInt(max: number) {
  return Math.floor((Math.random() * max * 10) + 1) % max;
}
