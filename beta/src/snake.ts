import { AnimatedSprite, Container, Sprite, Texture, filters } from "pixi.js";
import { MultiColorReplaceFilter } from "pixi-filters";
import {
  Boundaries,
  Coordinates,
  Direction, EdibleType,
  FruitType,
  PartType, PortalType
} from './types';
import {
  compareCoordinates,
  randInt,
  toAngle,
  toCoordinates,
  toPartType,
  toPosition
} from "./helpers";

export class WorldMap extends Container {
  private land: { [coords: string]: boolean } = {}
  private _edibles = new Container()
  private _portals = new Container()
  private _snakes = new Container()

  get edibles() {
    return this._edibles.children as Edible[]
  }
  get portals() {
    return this._portals.children as Portal[]
  }
  get snakes() {
    return this._snakes.children as Snake[]
  }

  constructor(
    public readonly bounds: Boundaries,
    public readonly backgroundColor: number,
    public readonly borderColor: number,
  ) {
    super();
    for (let i = 0; i < bounds.width; i++) {
      for (let j = 0; j < bounds.height; j++)
        this.land[`${i}-${j}`] = false
    }
    this.addChild(this._snakes, this._edibles, this._portals)
  }

  enterLand = (coordinates: Coordinates) => {
    const occupied = this.land[`${coordinates.x}-${coordinates.y}`]
    if (occupied) return false
    this.land[`${coordinates.x}-${coordinates.y}`] = true
    return true
  }

  leaveLand = (coordinates: Coordinates) => {
    const occupied = this.land[`${coordinates.x}-${coordinates.y}`]
    if (!occupied) return false
    this.land[`${coordinates.x}-${coordinates.y}`] = false
    return true
  }

  addSnake = (...snakes: Snake[]) => {
    for (const snake of snakes)
      for (const part of snake.parts)
        this.enterLand(part.coordinates)
    this._snakes.addChild(...snakes)
  }

  addEdible = (...edibles: Edible[]) => {
    for (const edible of edibles)
      this.enterLand(edible.coordinates)
    this._edibles.addChild(...edibles)
  }

  eat = (edible: Edible) => {
    this.leaveLand(edible.coordinates)
    this._edibles.removeChild(edible)
  }

  produce = () => {
    const freeLand = Object.entries(this.land)
      .filter(([_, occupied]) => !occupied)
    const [freeSpot] = freeLand[randInt(freeLand.length)]
    if (!freeLand) return
    const [x, y] = freeSpot.split('-').map(Number)
    this.addEdible(new Fruit('banana', { coordinates: { x, y } }))
  }

  addPortal = (...portals: Portal[]) => {
    for (const portal of portals) {
      this.enterLand(portal.go.coordinates)
      this.enterLand(portal.to.coordinates)
    }
    this._portals.addChild(...portals)
  }
}

type SnakePartProps = {
  direction: Direction,
  coordinates: Coordinates,
}

export class SnakePart extends AnimatedSprite {
  private _coordinates: Coordinates
  private _direction: Direction

  get coordinates(): Coordinates {
    return { ...this._coordinates }
  }

  get direction(): Direction {
    return this._direction
  }

  constructor(public readonly type: PartType, {
    direction,
    coordinates,
  }: SnakePartProps, textures: Texture[] = [
    Texture.from(`sprites/snake-${type}.png`)
  ]) {
    super(textures);
    this._coordinates = coordinates
    this._direction = direction
    this.type = type
    this.anchor.set(.5, .5)
    this.angle = toAngle(direction)
    this.position.set(...toPosition(coordinates))
  }

  public move(coordinates: Coordinates, direction?: Direction) {
    this._coordinates = coordinates
    this.position.set(...toPosition(coordinates))
    if (direction) {
      this._direction = direction
      this.angle = toAngle(direction)
    }
  }
}

export class SnakeHead extends SnakePart {
  constructor(options: SnakePartProps) {
    super('head', { ...options }, [
      Texture.from(`sprites/snake-head-1.png`),
      Texture.from(`sprites/snake-head-1.png`),
      Texture.from(`sprites/snake-head-1.png`),
      Texture.from(`sprites/snake-head-2.png`),
      Texture.from(`sprites/snake-head-3.png`),
      Texture.from(`sprites/snake-head-2.png`),
      Texture.from(`sprites/snake-head-1.png`),
      Texture.from(`sprites/snake-head-2.png`),
    ]);
    this.animationSpeed = .05
    this.play()
  }
  override onFrameChange = () => {}
}

export class SnakeTail extends SnakePart {
  constructor(options: SnakePartProps) {
    super('tail', options, [
      Texture.from(`sprites/snake-tail.png`),
      Texture.from(`sprites/snake-tail.png`),
    ]);
    this.animationSpeed = .04
    this.play()
  }
  override onFrameChange = () => {
    this.scale.y *= -1
  }
}


export class Snake extends Container {
  private _food?: Coordinates

  get direction(): Direction {
    return (this.children[0] as SnakePart).direction
  }

  get head(): SnakePart {
    return this.getChildAt(0) as SnakePart
  }

  get tail(): SnakePart {
    return this.getChildAt(this.children.length - 1) as SnakePart
  }

  get parts(): SnakePart[] {
    return this.children as SnakePart[]
  }

  constructor(
    private readonly worldMap: WorldMap,
    public readonly color: number,
    parts: SnakePart[]
  ) {
    super();
    this.filters = [new MultiColorReplaceFilter([
      [0xFFFFFF, color],
      [0x999999, worldMap.borderColor],
    ])]
    this.position.set(50, 50)
    this.addChild(...parts)
  }

  public drawMove(direction: Direction): void {
    if (this.children.length > 2 && !this._food) {
      const lastPart = this.removeChildAt(this.children.length - 2) as SnakePart
      const tail = this.tail
      tail.move(lastPart.coordinates, lastPart.direction)
      this.worldMap.leaveLand(lastPart.coordinates)
    }
    const head = this.head
    const bodyPart = toPartType(head.direction, direction)
    const to = toCoordinates(head.coordinates, this.worldMap.bounds, direction)
    this.addChildAt(new SnakePart(this._food && bodyPart === 'body' ? 'food' : bodyPart, {
      direction,
      coordinates: { ...head.coordinates }
    }), 1)
    head.move(to, direction)
    this.worldMap.enterLand(to)
    delete this._food
  }

  public drawEat(): void {
    const head = this.head
    this._food = head.coordinates
  }

  public drawDeath(): void {
    this.filters = [new MultiColorReplaceFilter([
      [0xFFFFFF, 0x666666],
      [0xFF0000, this.color],
      [0x999999, 0x333333],
    ])]
  }

  public jump(portal: Portal): void {
    this.head.move(portal.to.coordinates)
  }
}

export interface Edible extends Sprite {
  readonly type: EdibleType
  get coordinates(): Coordinates
}

export class Fruit extends Sprite implements Edible {
  get coordinates() {
    return { ...this.options.coordinates }
  }

  constructor(public readonly type: FruitType, private readonly options: { coordinates: Coordinates }) {
    super(Texture.from(`sprites/fruit-${type}.png`));
    const contrast = new filters.ColorMatrixFilter()
    this.filters = [contrast]
    contrast.saturate(1.5)
    contrast.brightness(1, true)
    this.position.set(...toPosition(options.coordinates).map(p => p + 10))
    this.scale.set(.75, .75)
  }
}

export class Cannibal extends Sprite implements Edible {
  public readonly type: EdibleType = 'cannibal'

  get coordinates() {
    return { ...this.options.coordinates }
  }

  constructor(
    worldMap: WorldMap,
    private readonly options: { coordinates: Coordinates, direction: Direction, color: number }
  ) {
    super(Texture.from(`sprites/fruit-cannibal.png`));
    this.filters = [new MultiColorReplaceFilter([
      [0xFFFFFF, options.color],
      [0x999999, worldMap.borderColor],
    ])]
    this.anchor.set(.5, .5)
    this.angle = toAngle(options.direction)
    this.position.set(...toPosition(options.coordinates).map(p => p + 50))
  }
}

export class Portal extends Sprite {
  private jumping?: Snake
  private wrongSide?: boolean

  private toBackground = new Sprite(Texture.WHITE)
  private goBackground = new Sprite(Texture.WHITE)

  constructor(
    private readonly worldMap: WorldMap,
    public readonly go: PortalDoor,
    public readonly to: PortalDoor,
  ) {
    super();
    this.position.set(50, 50)
    this.goBackground.tint = worldMap.backgroundColor
    this.goBackground.width = 100
    this.goBackground.height = 100
    this.goBackground.position.set(...toPosition(go.coordinates).map(p => p - 50))
    this.goBackground.addChild(go)
    this.toBackground.tint = worldMap.backgroundColor
    this.toBackground.width = 100
    this.toBackground.height = 100
    this.toBackground.position.set(...toPosition(to.coordinates).map(p => p - 50))
    this.toBackground.addChild(to)
    this.addChild(this.goBackground, this.toBackground, go, to)
  }

  public beginJump(snake: Snake, wrong: boolean = false) {
    this.filters = [new MultiColorReplaceFilter([
      [0xFFFFFF, snake.color],
      [0x999999, this.worldMap.borderColor],
    ])]
    this.jumping = snake
    this.wrongSide = wrong
  }

  public redraw(): void {
    const part = !this.jumping
      ? null
      : this.jumping.children.find((p) => compareCoordinates((p as SnakePart).coordinates, this.to.coordinates)) as SnakePart

    if (!part || !this.jumping) {
      this.go.texture = Texture.from(`sprites/portal-in.png`)
      this.to.texture = Texture.from(`sprites/portal-out.png`)
      delete this.jumping
      return
    }

    if (this.wrongSide) {
      this.to.texture = Texture.from(`sprites/portal-out-${part.type}.png`)
      this.to.angle = toAngle(part.direction)
      return
    }

    const outType = part.type === 'head' ? 'head' : part.type === 'tail' ? 'tail' : 'body'
    this.to.texture = Texture.from(`sprites/portal-out-${outType}.png`)
    this.to.angle = toAngle(part.direction)

    if (part.type == 'head') {
      this.go.angle = toAngle(part.direction)
    }

    if (part.type === 'tail') {
      this.go.texture = Texture.from(`sprites/portal-in-tail.png`)
      delete this.jumping
      return
    }

    const nextPart = this.jumping.children[this.jumping.children.indexOf(part)] as SnakePart
    if (nextPart) {
      const inType = nextPart.type === 'tail' ? 'tail' : 'body'
      this.go.texture = Texture.from(`sprites/portal-in-${inType}.png`)
    }
  }
}

export class PortalDoor extends Sprite {
  private readonly _type: PortalType
  private readonly _coordinates: Coordinates

  get coordinates(): Coordinates {
    return { ...this._coordinates }
  }

  get type(): PortalType {
    return this._type
  }

  constructor({
    type,
    coordinates
  }: { type: PortalType, coordinates: Coordinates }) {
    super(Texture.from(`sprites/portal-${type}.png`));
    this._type = type
    this._coordinates = coordinates
    this.anchor.set(.5, .5)
    this.position.set(...toPosition(coordinates))
  }
}
