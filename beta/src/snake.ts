import { AnimatedSprite, Container, Sprite, Texture, filters } from "pixi.js";
import { MultiColorReplaceFilter } from "pixi-filters";
import {
  Boundaries,
  Coordinates,
  Direction,
  FruitType,
  PartType, PortalType
} from './types';
import {
  compareCoordinates,
  toAngle,
  toCoordinates,
  toPartType,
  toPosition
} from "./helpers";

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
      Texture.from(`sprites/snake-head-3.png`),
      Texture.from(`sprites/snake-head-2.png`),
      Texture.from(`sprites/snake-head-1.png`),
      Texture.from(`sprites/snake-head-2.png`),
    ]);
    this.animationSpeed = 1000
    this.play()
  }
}

export class SnakeTail extends SnakePart {
  constructor(options: SnakePartProps) {
    super('tail', options, [
      Texture.from(`sprites/snake-tail.png`),
      Texture.from(`sprites/snake-tail.png`),
    ]);
    this.animationSpeed = 1000
    this.play()
  }

  override onFrameChange = () => {
    this.scale.y *= -1
  }
}


export class Snake extends Container {
  private _food?: Coordinates
  public readonly color: number
  private readonly _mapBounds: Boundaries

  get direction(): Direction {
    return (this.children[0] as SnakePart).direction
  }

  get head(): SnakePart {
    return this.getChildAt(0) as SnakePart
  }

  get tail(): SnakePart {
    return this.getChildAt(this.children.length - 1) as SnakePart
  }

  constructor({
    color,
    parts,
    bounds
  }: { color: number, parts: SnakePart[], bounds: Boundaries }) {
    super();

    this._mapBounds = bounds
    this.color = color

    this.filters = [new MultiColorReplaceFilter([
      [0xFFFFFF, color],
      [0x999999, 0x222222],
    ])]
    this.position.set(50, 50)
    this.addChild(...parts)
  }

  public drawMove(direction: Direction): void {
    if (this.children.length > 2 && !this._food) {
      const lastPart = this.removeChildAt(this.children.length - 2) as SnakePart
      const tail = this.tail
      tail.move(lastPart.coordinates, lastPart.direction)
    }
    const head = this.head
    const bodyPart = toPartType(head.direction, direction)
    this.addChildAt(new SnakePart(this._food && bodyPart === 'body' ? 'food' : bodyPart, {
      direction,
      coordinates: { ...head.coordinates }
    }), 1)
    head.move(toCoordinates(head.coordinates, this._mapBounds, direction), direction)
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
  readonly type: FruitType
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
  public readonly type: FruitType = 'cannibal'

  get coordinates() {
    return { ...this.options.coordinates }
  }

  constructor(private readonly options: { coordinates: Coordinates, direction: Direction, color: number }) {
    super(Texture.from(`sprites/fruit-cannibal.png`));
    this.filters = [new MultiColorReplaceFilter([
      [0xFFFFFF, options.color],
      [0x999999, 0x222222],
    ])]
    this.anchor.set(.5, .5)
    this.angle = toAngle(options.direction)
    this.position.set(...toPosition(options.coordinates).map(p => p + 50))
  }
}

export class Portal extends Sprite {
  private _snake?: Snake
  private _wrong?: boolean

  constructor(public readonly go: PortalDoor, public readonly to: PortalDoor, backgroundColor: number) {
    super();
    this.position.set(50, 50)
    const goBackground = new Sprite(Texture.WHITE)
    goBackground.tint = backgroundColor
    goBackground.width = 100
    goBackground.height = 100
    goBackground.position.set(...toPosition(go.coordinates).map(p => p - 50))
    goBackground.addChild(go)
    const toBackground = new Sprite(Texture.WHITE)
    toBackground.tint = backgroundColor
    toBackground.width = 100
    toBackground.height = 100
    toBackground.position.set(...toPosition(to.coordinates).map(p => p - 50))
    toBackground.addChild(to)
    this.addChild(goBackground, toBackground, go, to)
  }

  public beginJump(snake: Snake, wrong: boolean = false) {
    this.filters = [new MultiColorReplaceFilter([
      [0xFFFFFF, snake.color],
      [0x999999, 0x222222],
    ])]
    this._snake = snake
    this._wrong = wrong
  }

  public redraw(): void {
    const part = !this._snake
      ? null
      : this._snake.children.find((p) => compareCoordinates((p as SnakePart).coordinates, this.to.coordinates)) as SnakePart

    if (!part || !this._snake) {
      this.go.texture = Texture.from(`sprites/portal-in.png`)
      this.to.texture = Texture.from(`sprites/portal-out.png`)
      delete this._snake
      return
    }

    if (this._wrong) {
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
      delete this._snake
      return
    }

    const nextPart = this._snake.children[this._snake.children.indexOf(part)] as SnakePart
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

export class Fruits extends Sprite {
  constructor() {
    super();
  }
}

export class Portals extends Sprite {
  constructor() {
    super();
  }
}
