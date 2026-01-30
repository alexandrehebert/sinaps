import { Game } from './game'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
if (!canvas) {
  throw new Error('Canvas element not found')
}

// Get level from URL parameter or default to 1
const urlParams = new URLSearchParams(window.location.search)
const levelNumber = parseInt(urlParams.get('level') || '1', 10)

const game = new Game(canvas, levelNumber)
game.start()
