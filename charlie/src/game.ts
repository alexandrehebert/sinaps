import { Snake, SnakePart } from './snake'
import { Coordinates, Direction, FruitType } from './types'
import { GAME_CONFIG, COLORS, SPRITE_SIZE, FRUIT_TYPES, SNAKE_COLORS } from './constants'
import { Level } from './level'

export class Game {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private snake: Snake
  private food: { position: Coordinates; type: FruitType }
  private lastTick: number = 0
  private running: boolean = false
  private animationFrameId: number | null = null
  private sprites: Map<string, HTMLImageElement> = new Map()
  private spritesLoaded: boolean = false
  private headAnimationFrame: number = 0
  private headFrames: string[] = ['snake-head-1', 'snake-head-2', 'snake-head-3']
  private snakeColor: { r: number; g: number; b: number }
  private moveBuffer: Direction[] = []
  private readonly maxBufferSize: number = 3
  private level: Level | null = null

  constructor(canvas: HTMLCanvasElement, levelNumber: number = 1) {
    this.canvas = canvas

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('Could not get canvas context')
    this.ctx = ctx

    // Disable anti-aliasing for crisp pixels
    this.ctx.imageSmoothingEnabled = false

    // Pick random snake color
    this.snakeColor = SNAKE_COLORS[Math.floor(Math.random() * SNAKE_COLORS.length)]

    // Initialize with temporary values, will be updated when level loads
    const startPos: Coordinates = {
      x: Math.floor(GAME_CONFIG.gridWidth / 2),
      y: Math.floor(GAME_CONFIG.gridHeight / 2)
    }
    this.snake = new Snake(startPos, 'right')
    this.food = this.generateFood()

    this.setupControls()
    this.loadLevel(levelNumber)
    this.loadSprites()
  }

  private async loadLevel(levelNumber: number): Promise<void> {
    try {
      this.level = await Level.load(levelNumber)

      // Resize canvas based on level dimensions
      this.canvas.width = this.level.data.width * GAME_CONFIG.cellSize
      this.canvas.height = this.level.data.height * GAME_CONFIG.cellSize

      // Reinitialize snake with level spawn point
      const spawn = this.level.getPlayerSpawn()
      this.snake = new Snake({ x: spawn.x, y: spawn.y }, spawn.direction)

      // Regenerate food to avoid walls
      this.food = this.generateFood()
    } catch (error) {
      console.error('Failed to load level:', error)
      // Continue with default level - set default canvas size
      this.canvas.width = GAME_CONFIG.gridWidth * GAME_CONFIG.cellSize
      this.canvas.height = GAME_CONFIG.gridHeight * GAME_CONFIG.cellSize
    }
  }

  private async loadSprites(): Promise<void> {
    const spriteNames = [
      'snake-head-1',
      'snake-head-2',
      'snake-head-3',
      'snake-body',
      'snake-tail',
      'snake-turn-left',
      'snake-turn-right',
      'snake-food',
      'fruit-banana',
      'fruit-cherry',
      'fruit-strawberry',
      'fruit-kiwi',
      'wall-corner',
      'wall-section'
    ]

    const promises = spriteNames.map(name => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.src = `static/sprites/${name}.png`
        img.onload = () => {
          this.sprites.set(name, img)
          resolve()
        }
        img.onerror = () => reject(new Error(`Failed to load ${name}`))
      })
    })

    try {
      await Promise.all(promises)
      this.spritesLoaded = true
    } catch (error) {
      console.error('Failed to load sprites:', error)
    }
  }

  private setupControls(): void {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        if (!this.running) {
          this.restart()
        }
        return
      }

      const directionMap: Record<string, Direction> = {
        'ArrowUp': 'up',
        'ArrowDown': 'down',
        'ArrowLeft': 'left',
        'ArrowRight': 'right'
      }

      const direction = directionMap[e.key]
      if (direction) {
        e.preventDefault()

        // Add to buffer if not full
        if (this.moveBuffer.length < this.maxBufferSize) {
          // Get the direction to compare against (last buffered move or current snake direction)
          const lastDirection = this.moveBuffer.length > 0
            ? this.moveBuffer[this.moveBuffer.length - 1]
            : this.snake.getDirection()

          // Check if this is a valid move (not opposite direction)
          const opposites: Record<Direction, Direction> = {
            up: 'down',
            down: 'up',
            left: 'right',
            right: 'left'
          }

          if (opposites[lastDirection] !== direction && lastDirection !== direction) {
            this.moveBuffer.push(direction)
          }
        }
      }
    })
  }

  private generateFood(): { position: Coordinates; type: FruitType } {
    // Use level dimensions if available, otherwise use default
    const width = this.level ? this.level.data.width : GAME_CONFIG.gridWidth
    const height = this.level ? this.level.data.height : GAME_CONFIG.gridHeight

    let position: Coordinates
    do {
      position = {
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height)
      }
    } while (
      this.snake.checkCollision(position) ||
      (this.level && this.level.hasWall(position.x, position.y))
    )

    const type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)]
    return { position, type }
  }

  private update(): void {
    // Get next direction from buffer or continue current direction
    let nextDirection: Direction
    if (this.moveBuffer.length > 0) {
      // Get and remove first move from buffer
      nextDirection = this.moveBuffer.shift()!
    } else {
      // Continue in current direction
      nextDirection = this.snake.getDirection()
    }

    // Set the direction
    this.snake.setDirection(nextDirection)

    // Get level bounds or use defaults
    const width = this.level ? this.level.data.width : GAME_CONFIG.gridWidth
    const height = this.level ? this.level.data.height : GAME_CONFIG.gridHeight

    // Move snake with wall collision check
    const wallCheck = this.level ? (x: number, y: number) => this.level!.hasWall(x, y) : undefined
    const alive = this.snake.move(width, height, wallCheck)

    if (!alive) {
      this.gameOver()
      return
    }

    // Cycle head animation frame
    this.headAnimationFrame = (this.headAnimationFrame + 1) % this.headFrames.length

    // Check food collision
    const head = this.snake.getHead()
    if (head.x === this.food.position.x && head.y === this.food.position.y) {
      this.snake.grow()
      this.food = this.generateFood()
    }
  }

  private render(): void {
    if (!this.spritesLoaded) return

    // Clear canvas
    this.ctx.fillStyle = COLORS.background
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw walls
    if (this.level) {
      for (const wall of this.level.data.walls) {
        this.drawWall(wall)
      }
    }

    // Draw food (scaled smaller)
    this.drawFruit(
      `fruit-${this.food.type}`,
      this.food.position.x * GAME_CONFIG.cellSize,
      this.food.position.y * GAME_CONFIG.cellSize
    )

    // Draw snake
    const body = this.snake.getBody()
    body.forEach((segment) => {
      this.drawSnakePart(segment)
    })
  }

  private drawSnakePart(part: SnakePart): void {
    // Use animated head sprite for head, regular sprites for body parts
    const spriteName = part.type === 'head'
      ? this.headFrames[this.headAnimationFrame]
      : `snake-${part.type}`
    const x = part.x * GAME_CONFIG.cellSize
    const y = part.y * GAME_CONFIG.cellSize
    const angle = this.getAngle(part.direction)

    // Recolor snake sprites with the chosen color - scaled to cell size
    this.drawSprite(spriteName, x, y, angle, true, GAME_CONFIG.cellSize)
  }

  private drawWall(wall: { x: number; y: number; type?: string }): void {
    // Use corner sprite for corners, section sprite for horizontal/vertical
    const spriteName = wall.type === 'corner' ? 'wall-corner' : 'wall-section'
    const sprite = this.sprites.get(spriteName)
    if (!sprite) return

    const x = wall.x * GAME_CONFIG.cellSize
    const y = wall.y * GAME_CONFIG.cellSize
    const size = GAME_CONFIG.cellSize

    this.ctx.save()
    this.ctx.translate(x + size / 2, y + size / 2)

    // Rotate vertical sections 90 degrees
    if (wall.type === 'vertical') {
      this.ctx.rotate(Math.PI / 2)
    }

    this.ctx.drawImage(
      sprite,
      -size / 2,
      -size / 2,
      size,
      size
    )

    this.ctx.restore()
  }

  private getAngle(direction: Direction): number {
    const angles: Record<Direction, number> = {
      right: 0,
      down: 90,
      left: 180,
      up: 270
    }
    return angles[direction]
  }

  private drawSprite(name: string, x: number, y: number, angle: number, recolor: boolean = false, size: number = SPRITE_SIZE): void {
    const sprite = this.sprites.get(name)
    if (!sprite) return

    this.ctx.save()

    // Translate to center of cell
    this.ctx.translate(x + GAME_CONFIG.cellSize / 2, y + GAME_CONFIG.cellSize / 2)

    // Rotate
    this.ctx.rotate((angle * Math.PI) / 180)

    if (recolor) {
      // Create temporary canvas for color replacement
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = SPRITE_SIZE
      tempCanvas.height = SPRITE_SIZE
      const tempCtx = tempCanvas.getContext('2d')
      if (tempCtx) {
        // Draw original sprite
        tempCtx.drawImage(sprite, 0, 0)

        // Get image data
        const imageData = tempCtx.getImageData(0, 0, SPRITE_SIZE, SPRITE_SIZE)
        const data = imageData.data

        // Replace white (0xFFFFFF) with snake color and gray (0x999999) with border color
        const borderColor = { r: 0x3F, g: 0x2F, b: 0x05 } // Match grid color for better integration

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const a = data[i + 3]

          // Check if pixel is white (with some tolerance) - replace with snake color
          if (a > 0 && r > 240 && g > 240 && b > 240) {
            data[i] = this.snakeColor.r
            data[i + 1] = this.snakeColor.g
            data[i + 2] = this.snakeColor.b
          }
          // Check if pixel is gray (around 0x999999) - replace with border color
          else if (a > 0 && r >= 140 && r <= 160 && g >= 140 && g <= 160 && b >= 140 && b <= 160) {
            data[i] = borderColor.r
            data[i + 1] = borderColor.g
            data[i + 2] = borderColor.b
          }
        }

        // Put modified image data back
        tempCtx.putImageData(imageData, 0, 0)

        // Draw recolored sprite scaled to size
        this.ctx.drawImage(
          tempCanvas,
          -size / 2,
          -size / 2,
          size,
          size
        )
      }
    } else {
      // Draw sprite centered without recoloring, scaled to size
      this.ctx.drawImage(
        sprite,
        -size / 2,
        -size / 2,
        size,
        size
      )
    }

    this.ctx.restore()
  }

  private drawFruit(name: string, x: number, y: number): void {
    const sprite = this.sprites.get(name)
    if (!sprite) return

    // Calculate fruit size (smaller than cell)
    const fruitSize = GAME_CONFIG.cellSize * 0.75 // 75% of cell size

    this.ctx.save()
    this.ctx.translate(x + GAME_CONFIG.cellSize / 2, y + GAME_CONFIG.cellSize / 2)

    this.ctx.drawImage(
      sprite,
      -fruitSize / 2,
      -fruitSize / 2,
      fruitSize,
      fruitSize
    )

    this.ctx.restore()
  }

  private gameLoop = (timestamp: number): void => {
    if (!this.running) return

    // Fixed time step
    if (timestamp - this.lastTick >= GAME_CONFIG.tickSpeed) {
      this.update()
      this.lastTick = timestamp
    }

    this.render()
    this.animationFrameId = requestAnimationFrame(this.gameLoop)
  }

  start(): void {
    if (this.running) return

    // Wait for sprites to load
    const checkLoaded = () => {
      if (this.spritesLoaded) {
        this.running = true
        this.lastTick = performance.now()
        this.animationFrameId = requestAnimationFrame(this.gameLoop)
      } else {
        setTimeout(checkLoaded, 100)
      }
    }
    checkLoaded()
  }

  stop(): void {
    this.running = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private gameOver(): void {
    this.stop()
  }

  private restart(): void {
    if (this.running) return

    // Pick random snake color
    this.snakeColor = SNAKE_COLORS[Math.floor(Math.random() * SNAKE_COLORS.length)]

    // Reinitialize snake and food
    if (this.level) {
      const spawn = this.level.getPlayerSpawn()
      this.snake = new Snake({ x: spawn.x, y: spawn.y }, spawn.direction)
    } else {
      const startPos: Coordinates = {
        x: Math.floor(GAME_CONFIG.gridWidth / 2),
        y: Math.floor(GAME_CONFIG.gridHeight / 2)
      }
      this.snake = new Snake(startPos, 'right')
    }

    this.food = this.generateFood()
    this.moveBuffer = []
    this.headAnimationFrame = 0

    this.start()
  }
}
