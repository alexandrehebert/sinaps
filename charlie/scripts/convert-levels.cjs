// Script to convert alpha levels to charlie YAML format
const fs = require('fs');
const path = require('path');

const alphaLevelsDir = '../../alpha/client/levels';
const charlieLevelsDir = '../public/levels';

// Parse alpha level format
function parseAlphaLevel(content, filename) {
  const lines = content.split('\n').filter(line => line.trim());
  const level = {
    name: filename.replace(/\.(txt|csv)$/, ''),
    width: 30,
    height: 20,
    snakes: [],
    walls: [],
    portals: [],
    foodSpawns: []
  };

  lines.forEach((line, y) => {
    const cells = line.split(';');
    cells.forEach((cell, x) => {
      const c = cell.trim();

      // Wall corners (+)
      if (c === '+') {
        level.walls.push({ x, y, type: 'corner' });
      }
      // Wall sections - horizontal (-)
      else if (c === '-') {
        level.walls.push({ x, y, type: 'horizontal' });
      }
      // Wall sections - vertical (|)
      else if (c === '|') {
        level.walls.push({ x, y, type: 'vertical' });
      }
      // Snake spawns (>N, <N, ^N, vN, #N)
      else if (c.match(/^[><^v#]\d+$/)) {
        const dir = c[0];
        const id = parseInt(c.substring(1));
        const dirMap = {
          '>': 'right',
          '<': 'left',
          '^': 'up',
          'v': 'down',
          '#': 'right' // Default for #
        };
        level.snakes.push({
          id,
          x,
          y,
          direction: dirMap[dir]
        });
      }
      // Portals (@N)
      else if (c.match(/^@\d+$/)) {
        const id = parseInt(c.substring(1));
        level.portals.push({
          id,
          x,
          y
        });
      }
      // Food spawns (§N)
      else if (c.match(/^§\d+$/)) {
        const id = parseInt(c.substring(1));
        level.foodSpawns.push({
          id,
          x,
          y
        });
      }
      // Fruit spawns (*) - generic fruit
      else if (c === '*') {
        level.foodSpawns.push({
          id: 0, // Generic
          x,
          y
        });
      }
    });
  });

  return level;
}

// Convert to YAML
function toYAML(level) {
  let yaml = `name: "${level.name}"\n`;
  yaml += `width: ${level.width}\n`;
  yaml += `height: ${level.height}\n`;
  yaml += `snakes:\n`;

  if (level.snakes.length === 0) {
    yaml += `  []\n`;
  } else {
    level.snakes.forEach(snake => {
      yaml += `  - id: ${snake.id}\n`;
      yaml += `    x: ${snake.x}\n`;
      yaml += `    y: ${snake.y}\n`;
      yaml += `    direction: ${snake.direction}\n`;
    });
  }

  yaml += `walls:\n`;
  if (level.walls.length === 0) {
    yaml += `  []\n`;
  } else {
    level.walls.forEach(wall => {
      yaml += `  - { x: ${wall.x}, y: ${wall.y}, type: ${wall.type} }\n`;
    });
  }

  yaml += `portals:\n`;
  if (level.portals.length === 0) {
    yaml += `  []\n`;
  } else {
    level.portals.forEach(portal => {
      yaml += `  - { id: ${portal.id}, x: ${portal.x}, y: ${portal.y} }\n`;
    });
  }

  yaml += `foodSpawns:\n`;
  if (level.foodSpawns.length === 0) {
    yaml += `  []\n`;
  } else {
    level.foodSpawns.forEach(food => {
      yaml += `  - { id: ${food.id}, x: ${food.x}, y: ${food.y} }\n`;
    });
  }

  return yaml;
}

// Main conversion
try {
  const files = fs.readdirSync(path.join(__dirname, alphaLevelsDir));

  files.forEach(file => {
    if (file.endsWith('.txt') || file.endsWith('.csv')) {
      const content = fs.readFileSync(
        path.join(__dirname, alphaLevelsDir, file),
        'utf-8'
      );

      const level = parseAlphaLevel(content, file);
      const yaml = toYAML(level);

      const outputFile = file.replace(/\.(txt|csv)$/, '.yaml');
      fs.writeFileSync(
        path.join(__dirname, charlieLevelsDir, outputFile),
        yaml
      );

      console.log(`Converted ${file} -> ${outputFile}`);
    }
  });

  console.log('Conversion complete!');
} catch (error) {
  console.error('Error:', error.message);
}
