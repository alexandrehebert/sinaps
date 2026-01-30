import { load } from 'js-yaml'
import { Coordinates, Direction } from './types'

export interface SnakeSpawn {
  id: number
  x: number
  y: number
  direction: Direction
}

export interface Portal {
  id: number
  x: number
  y: number
}

export interface FoodSpawn {
  id: number
  x: number
  y: number
}

export interface Wall extends Coordinates {
  type: 'corner' | 'horizontal' | 'vertical'
}

export interface LevelData {
  name: string
  width: number
  height: number
  snakes: SnakeSpawn[]
  walls: Wall[]
  portals: Portal[]
  foodSpawns: FoodSpawn[]
}

export class Level {
  public readonly data: LevelData
  private wallMap: Set<string>

  constructor(data: LevelData) {
    // Ensure arrays exist
    this.data = {
      ...data,
      snakes: data.snakes || [],
      walls: data.walls || [],
      portals: data.portals || [],
      foodSpawns: data.foodSpawns || []
    }

    this.wallMap = new Set()

    // Build wall lookup map for fast collision detection
    for (const wall of this.data.walls) {
      this.wallMap.add(`${wall.x}-${wall.y}`)
    }
  }

  hasWall(x: number, y: number): boolean {
    return this.wallMap.has(`${x}-${y}`)
  }

  getPlayerSpawn(): SnakeSpawn {
    // Return first snake spawn for single player, or default spawn
    if (this.data.snakes.length > 0) {
      return this.data.snakes[0]
    }
    // Default spawn if no snakes defined
    return {
      id: 1,
      x: 15,
      y: 10,
      direction: 'right'
    }
  }

  static async load(levelNumber: number): Promise<Level> {
    const response = await fetch(`levels/level-${levelNumber}.yaml`)
    if (!response.ok) {
      throw new Error(`Failed to load level ${levelNumber}`)
    }

    const yamlText = await response.text()
    const data = load(yamlText) as LevelData

    return new Level(data)
  }
}
