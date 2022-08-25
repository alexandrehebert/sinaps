import { Application } from 'pixi.js'
import {
  Fruit,
  Cannibal,
  Fruits,
  Portal,
  PortalDoor,
  Portals,
  Snake,
  SnakeHead,
  SnakePart,
  SnakeTail
} from "./snake";
import { KeyCodes, SnakeColors } from "./constants";
import { Direction } from "./types";
import { compareCoordinates, isValidMove } from "./helpers";

const backgroundColor = 0x111111
const boundaries = {
  width: 30,
  height: 20,
}

const app = new Application({
  view: document.getElementById("canvas") as HTMLCanvasElement,
  resolution: 1,
  autoDensity: true,
  antialias: false,
  backgroundColor,
  width: boundaries.width * 20,
  height: boundaries.height * 20,
});

const greenSnake: Snake = new Snake({
  color: SnakeColors.GREEN,
  parts: [
    new SnakeHead({
      direction: 'down',
      coordinates: { x: 1, y: 4 }
    }),
    new SnakePart('body', {
      direction: 'down',
      coordinates: { x: 1, y: 3 }
    }),
    new SnakePart( 'food',{
      direction: 'down',
      coordinates: { x: 1, y: 2 }
    }),
    new SnakePart('turn-right',{
      direction: 'down',
      coordinates: { x: 1, y: 1 }
    }),
    new SnakePart('turn-left',{
      direction: 'right',
      coordinates: { x: 0, y: 1 }
    }),
    new SnakeTail({ direction: 'down', coordinates: { x: 0, y: 0 } })
  ],
  bounds: boundaries
});

const orangeSnake: Snake = new Snake({
  color: SnakeColors.ORANGE,
  parts: [
    new SnakeHead({ direction: 'up', coordinates: { x: 2, y: 4 } }),
    new SnakePart('turn-right', {
      direction: 'up',
      coordinates: { x: 2, y: 5 }
    }),
    new SnakeTail({ direction: 'left', coordinates: { x: 3, y: 5 } })
  ],
  bounds: boundaries
});

const blueSnake: Snake = new Snake({
  color: SnakeColors.BLUE,
  parts: [
    new SnakeHead({ direction: 'up', coordinates: { x: 11, y: 11 } }),
    new SnakePart('body', {
      direction: 'up',
      coordinates: { x: 11, y: 12 }
    }),
    new SnakeTail({ direction: 'up', coordinates: { x: 11, y: 13 } })
  ],
  bounds: boundaries
});

const purpleSnake: Snake = new Snake({
  color: SnakeColors.PURPLE,
  parts: [
    new SnakeHead({ direction: 'right', coordinates: { x: 4, y: 10 } }),
    new SnakePart('body', {
      direction: 'right',
      coordinates: { x: 3, y: 10 }
    }),
    new SnakeTail({ direction: 'right', coordinates: { x: 2, y: 10 } })
  ],
  bounds: boundaries
});
const snakes = [orangeSnake, greenSnake, purpleSnake, blueSnake]

const cherry = new Fruit('cherry', { coordinates: { x: 5, y: 5 } })
const kiwi = new Fruit('kiwi', { coordinates: { x: 5, y: 4 } })
const strawberry = new Fruit('strawberry', { coordinates: { x: 4, y: 5 } })
const banana = new Fruit( 'banana', { coordinates: { x: 4, y: 4 } })
const cannibal = new Cannibal({ coordinates: { x: 2, y: 15 }, direction: 'right', color: SnakeColors.ORANGE })
const fruits = new Fruits()
fruits.addChild(cherry, kiwi, strawberry, banana, cannibal)

const portalIn = new PortalDoor({ type: 'in', coordinates: { x: 4, y: 10 }})
const portalOut = new PortalDoor({ type: 'out', coordinates: { x: 7, y: 10 }})
const portals = new Portals()
portals.addChild(new Portal(portalIn, portalOut, backgroundColor))

app.stage.addChild(...snakes)
app.stage.addChild(fruits)
app.stage.addChild(portals)
app.stage.scale.set(.2, .2)

const moves: Direction[] = []

document.addEventListener("keydown", (event) => {
  const action = KeyCodes[event.key]
  if (!action) return
  event.preventDefault()
  if (moves.length == 2) moves.pop()
  moves.splice(0, 0, action)
});

setInterval(() => {

  for (const snake of snakes) {
    if (snake === purpleSnake) {
      if (!moves.length) {
        purpleSnake.drawMove(purpleSnake.direction)
      } else {
        let move
        do {
          move = moves.pop()
        } while (move && !isValidMove(purpleSnake.direction, move))
        purpleSnake.drawMove(move || purpleSnake.direction)
      }
    } else {
      snake.drawMove(snake.direction)
    }

    for (const fruit of fruits.children as Fruit[]) {
      if (compareCoordinates(snake.head.coordinates, fruit.coordinates)) {
        snake.drawEat()
        fruits.removeChild(fruit)
      }
    }
    for (const portal of portals.children as Portal[]) {
      if (compareCoordinates(snake.head.coordinates, portal.go.coordinates)) {
        portal.beginJump(snake)
        snake.jump(portal)
      }
      else if (compareCoordinates(snake.head.coordinates, portal.to.coordinates)) {
        portal.beginJump(snake, true)
      }
    }
  }
  for (const portal of portals.children as Portal[]) {
    portal.redraw()
  }
}, 300)
