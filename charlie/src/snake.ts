import { GAME_CONFIG } from './constants'
import { Coordinates, Direction, PartType } from './types'

export interface SnakePart extends Coordinates {
  direction: Direction
  type: PartType
}

export class Snake {
  private body: SnakePart[]
  private nextDirection: Direction
  private growing: boolean = false

  constructor(startPosition: Coordinates, startDirection: Direction, initialLength: number = GAME_CONFIG.initialSnakeLength) {
    this.nextDirection = startDirection
    this.body = []

    // Initialize snake body based on direction
    for (let i = 0; i < initialLength; i++) {
      const type: PartType = i === 0 ? 'head' : i === initialLength - 1 ? 'tail' : 'body'
      
      let x = startPosition.x
      let y = startPosition.y

      // Offset body parts in the opposite direction of movement
      switch (startDirection) {
        case 'up':
          y += i
          break
        case 'down':
          y -= i
          break
        case 'left':
          x += i
          break
        case 'right':
          x -= i
          break
      }

      this.body.push({
        x,
        y,
        direction: startDirection,
        type
      })
    }
  }

  getHead(): SnakePart {
    return this.body[0]
  }

  getBody(): SnakePart[] {
    return this.body
  }

  getDirection(): Direction {
    return this.body[0].direction
  }

  setDirection(newDirection: Direction): void {
    // Prevent 180-degree turns
    const opposites: Record<Direction, Direction> = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left'
    }

    const currentDirection = this.getDirection()
    if (opposites[currentDirection] !== newDirection) {
      this.nextDirection = newDirection
    }
  }

  grow(): void {
    this.growing = true
  }

  move(gridWidth: number, gridHeight: number, checkWallCollision?: (x: number, y: number) => boolean): boolean {
    const newDirection = this.nextDirection
    const head = this.getHead()
    const oldHeadDirection = head.direction

    // Calculate new head position
    const newHead: SnakePart = {
      x: head.x,
      y: head.y,
      direction: newDirection,
      type: 'head'
    }

    switch (newDirection) {
      case 'up':
        newHead.y--
        break
      case 'down':
        newHead.y++
        break
      case 'left':
        newHead.x--
        break
      case 'right':
        newHead.x++
        break
    }

    // Wrap around edges
    newHead.x = (newHead.x + gridWidth) % gridWidth
    newHead.y = (newHead.y + gridHeight) % gridHeight

    // Check self-collision
    if (this.checkSelfCollision(newHead)) {
      return false
    }

    // Check wall collision
    if (checkWallCollision && checkWallCollision(newHead.x, newHead.y)) {
      return false
    }

    // Determine part type for old head (now becomes body/turn)
    const partType = this.getPartType(oldHeadDirection, newDirection)
    // Only use 'food' sprite if going straight (body type), not during turns
    if (this.growing && partType === 'body') {
      head.type = 'food'
    } else {
      head.type = partType
    }
    head.direction = newDirection

    // Add new head
    this.body.unshift(newHead)

    // Remove tail unless growing
    if (!this.growing) {
      this.body.pop()
      // Update new tail type
      if (this.body.length > 1) {
        this.body[this.body.length - 1].type = 'tail'
      }
    } else {
      // If we are growing, we don't pop the tail, but we still need to make sure 
      // the last part is marked as a tail, especially if it was previously the head
      this.body[this.body.length - 1].type = 'tail'
      this.growing = false
    }

    return true
  }

  private getPartType(fromDirection: Direction, toDirection: Direction): PartType {
    if (fromDirection === toDirection) return 'body'

    // Determine turn direction
    const turns: Record<string, PartType> = {
      'up-right': 'turn-right',
      'up-left': 'turn-left',
      'down-right': 'turn-left',
      'down-left': 'turn-right',
      'left-up': 'turn-right',
      'left-down': 'turn-left',
      'right-up': 'turn-left',
      'right-down': 'turn-right'
    }

    return turns[`${fromDirection}-${toDirection}`] || 'body'
  }

  checkSelfCollision(position: Coordinates): boolean {
    return this.body.some(segment =>
      segment.x === position.x && segment.y === position.y
    )
  }

  checkCollision(position: Coordinates): boolean {
    return this.body.some(segment =>
      segment.x === position.x && segment.y === position.y
    )
  }
}
