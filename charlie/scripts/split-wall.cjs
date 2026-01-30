const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function splitWallSprite() {
  try {
    // Load the wall sprite
    const image = await loadImage('./public/static/sprites/wall.png');

    const width = image.width;
    const height = image.height;

    console.log(`Wall sprite dimensions: ${width}x${height}`);

    // The wall sprite is 30x10 (three 10x10 squares)
    // First square (0-10): corner (filled square)
    // Second square (10-20): section (small dot)
    // Third square (20-30): might be another variant
    const squareSize = 10;

    // Create canvas for corner (first square - 10x10)
    const cornerCanvas = createCanvas(squareSize, squareSize);
    const cornerCtx = cornerCanvas.getContext('2d');
    cornerCtx.drawImage(image, 0, 0, squareSize, squareSize, 0, 0, squareSize, squareSize);

    // Create canvas for section (second square - 10x10)
    const sectionCanvas = createCanvas(squareSize, squareSize);
    const sectionCtx = sectionCanvas.getContext('2d');
    sectionCtx.drawImage(image, squareSize, 0, squareSize, squareSize, 0, 0, squareSize, squareSize);

    console.log(`Extracting corner from x=0, section from x=${squareSize}`);

    // Save the split images
    const cornerBuffer = cornerCanvas.toBuffer('image/png');
    const sectionBuffer = sectionCanvas.toBuffer('image/png');

    fs.writeFileSync('./public/static/sprites/wall-corner.png', cornerBuffer);
    fs.writeFileSync('./public/static/sprites/wall-section.png', sectionBuffer);

    console.log('Successfully split wall.png into:');
    console.log('  - wall-corner.png (left half)');
    console.log('  - wall-section.png (right half)');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

splitWallSprite();
