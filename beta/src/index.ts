import { Application } from 'pixi.js'
import {
  Fruit,
  Cannibal,
  Portal,
  PortalDoor,
  Snake,
  SnakeHead,
  SnakePart,
  SnakeTail,
  WorldMap
} from "./snake";
import {
  KeyCodes,
  SnakeColors
} from "./constants";
import { Direction } from "./types";
import { compareCoordinates, isValidMove } from "./helpers";

export const backgroundColor = 0x353444
export const borderColor = 0x3F2F05

export const boundaries = {
  width: 30,
  height: 20,
}

export const ratio = .3

const worldMap = new WorldMap(boundaries, backgroundColor, borderColor)

const app = new Application({
  view: document.getElementById("canvas") as HTMLCanvasElement,
  resolution: 1,
  autoDensity: true,
  antialias: false,
  backgroundColor,
  width: worldMap.bounds.width * ratio * 100,
  height: worldMap.bounds.height * ratio * 100,
});

const greenSnake: Snake = new Snake(
  worldMap,
  SnakeColors.GREEN,
  [
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
  ]
);

const orangeSnake: Snake = new Snake(
  worldMap,
  SnakeColors.ORANGE,
  [
    new SnakeHead({ direction: 'up', coordinates: { x: 2, y: 4 } }),
    new SnakePart('turn-right', {
      direction: 'up',
      coordinates: { x: 2, y: 5 }
    }),
    new SnakeTail({ direction: 'left', coordinates: { x: 3, y: 5 } })
  ],
);

const blueSnake: Snake = new Snake(
  worldMap,
  SnakeColors.BLUE,
  [
    new SnakeHead({ direction: 'up', coordinates: { x: 11, y: 11 } }),
    new SnakePart('body', {
      direction: 'up',
      coordinates: { x: 11, y: 12 }
    }),
    new SnakeTail({ direction: 'up', coordinates: { x: 11, y: 13 } })
  ],
);

const purpleSnake: Snake = new Snake(
  worldMap,
  SnakeColors.PURPLE,
  [
    new SnakeHead({ direction: 'right', coordinates: { x: 4, y: 10 } }),
    new SnakePart('body', {
      direction: 'right',
      coordinates: { x: 3, y: 10 }
    }),
    new SnakeTail({ direction: 'right', coordinates: { x: 2, y: 10 } })
  ],
);

worldMap.addSnake(blueSnake, greenSnake, orangeSnake, purpleSnake)

const cherry = new Fruit('cherry', { coordinates: { x: 5, y: 5 } })
const kiwi = new Fruit('kiwi', { coordinates: { x: 5, y: 4 } })
const strawberry = new Fruit('strawberry', { coordinates: { x: 4, y: 5 } })
const banana = new Fruit( 'banana', { coordinates: { x: 4, y: 4 } })
const cannibal = new Cannibal(worldMap,{ coordinates: { x: 2, y: 15 }, direction: 'right', color: SnakeColors.ORANGE })

worldMap.addEdible(cherry, kiwi, strawberry, banana, cannibal)

const portalIn = new PortalDoor({ type: 'in', coordinates: { x: 4, y: 10 }})
const portalOut = new PortalDoor({ type: 'out', coordinates: { x: 7, y: 10 }})

worldMap.addPortal(new Portal(worldMap, portalIn, portalOut))

app.stage.addChild(worldMap)
app.stage.scale.set(ratio, ratio)

const moves: Direction[] = []

document.addEventListener("keydown", (event) => {
  const action = KeyCodes[event.key]
  if (!action) return
  event.preventDefault()
  if (moves.length == 2) moves.pop()
  moves.splice(0, 0, action)
});

setInterval(() => {

  for (const snake of worldMap.snakes) {
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

    for (const edible of worldMap.edibles) {
      if (compareCoordinates(snake.head.coordinates, edible.coordinates)) {
        snake.drawEat()
        worldMap.eat(edible)
      }
    }
    for (const portal of worldMap.portals) {
      if (compareCoordinates(snake.head.coordinates, portal.go.coordinates)) {
        portal.beginJump(snake)
        snake.jump(portal)
      }
      else if (compareCoordinates(snake.head.coordinates, portal.to.coordinates)) {
        portal.beginJump(snake, true)
      }
    }
  }
  for (const portal of worldMap.portals) {
    portal.redraw()
  }
}, 250)
