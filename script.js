const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const GRID_SIZE = 8;
const CELL_SIZE = 60;

const GRID_PIXEL_SIZE = GRID_SIZE * CELL_SIZE;

const OFFSET_X = (window.innerWidth - GRID_PIXEL_SIZE) / 2;
const OFFSET_Y = 50;

canvas.width = window.innerWidth;
canvas.height = GRID_PIXEL_SIZE + 250;

let grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));

let score = 0;

const colors = ["#ff4d6d", "#ff758f", "#ff8fa3", "#ffb3c1", "#ffc2d1"];

const shapes = [
  [[1,1],[1,1]],
  [[1,1,1]],
  [[1],[1],[1]],
  [[1,0],[1,1]]
];

let availableShapes = [];

let dragging = null;
let offsetX = 0;
let offsetY = 0;

// MENU
function startGame() {
  document.getElementById("menu").style.display = "none";
  canvas.style.display = "block";
  generateShapes();
  gameLoop();
}

// GERAR PEÇAS
function generateShapes() {
  availableShapes = [];

  const spacing = 180;
  const totalWidth = spacing * 2;
  const startX = (canvas.width - totalWidth) / 2;

  for (let i = 0; i < 3; i++) {
    availableShapes.push({
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      x: startX + i * spacing,
      y: GRID_PIXEL_SIZE + 80,
      originalX: startX + i * spacing,
      originalY: GRID_PIXEL_SIZE + 80
    });
  }
}

// PEGAR POSIÇÃO (FUNCIONA PRA MOUSE E TOQUE)
function getPosition(e) {
  const rect = canvas.getBoundingClientRect();

  if (e.touches) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  } else {
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }
}

// COMEÇAR DRAG
function startDrag(e) {
  let pos = getPosition(e);

  availableShapes.forEach(obj => {
    let width = obj.shape[0].length * CELL_SIZE;
    let height = obj.shape.length * CELL_SIZE;

    if (
      pos.x > obj.x && pos.x < obj.x + width &&
      pos.y > obj.y && pos.y < obj.y + height
    ) {
      dragging = obj;
      offsetX = pos.x - obj.x;
      offsetY = pos.y - obj.y;
    }
  });
}

// MOVER
function moveDrag(e) {
  if (!dragging) return;

  let pos = getPosition(e);

  dragging.x = pos.x - offsetX;
  dragging.y = pos.y - offsetY;
}

// SOLTAR
function endDrag() {
  if (!dragging) return;

  let gridX = Math.floor((dragging.x - OFFSET_X) / CELL_SIZE);
  let gridY = Math.floor((dragging.y - OFFSET_Y) / CELL_SIZE);

  if (canPlace(dragging.shape, gridX, gridY)) {
    placeShape(dragging);
    availableShapes = availableShapes.filter(s => s !== dragging);

    if (availableShapes.length === 0) generateShapes();
  } else {
    dragging.x = dragging.originalX;
    dragging.y = dragging.originalY;
  }

  dragging = null;
}

// EVENTOS MOUSE
canvas.addEventListener("mousedown", startDrag);
canvas.addEventListener("mousemove", moveDrag);
canvas.addEventListener("mouseup", endDrag);

// EVENTOS TOUCH 📱
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  startDrag(e);
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  moveDrag(e);
});

canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  endDrag();
});

// GRID
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {

      ctx.strokeStyle = "#555";
      ctx.strokeRect(
        OFFSET_X + x * CELL_SIZE,
        OFFSET_Y + y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );

      if (grid[y][x]) {
        ctx.fillStyle = grid[y][x];
        ctx.fillRect(
          OFFSET_X + x * CELL_SIZE,
          OFFSET_Y + y * CELL_SIZE,
          CELL_SIZE - 2,
          CELL_SIZE - 2
        );
      }
    }
  }
}

// PEÇAS
function drawShapes() {
  availableShapes.forEach(obj => {
    ctx.fillStyle = obj.color;

    obj.shape.forEach((row, y) => {
      row.forEach((val, x) => {
        if (val) {
          ctx.fillRect(
            obj.x + x * CELL_SIZE,
            obj.y + y * CELL_SIZE,
            CELL_SIZE - 2,
            CELL_SIZE - 2
          );
        }
      });
    });
  });
}

// VERIFICAR
function canPlace(shape, x, y) {
  for (let i = 0; i < shape.length; i++) {
    for (let j = 0; j < shape[i].length; j++) {
      if (shape[i][j]) {
        let nx = x + j;
        let ny = y + i;

        if (
          nx < 0 || ny < 0 ||
          nx >= GRID_SIZE ||
          ny >= GRID_SIZE ||
          grid[ny][nx]
        ) return false;
      }
    }
  }
  return true;
}

// COLOCAR
function placeShape(obj) {
  const { shape, color } = obj;

  let gridX = Math.floor((obj.x - OFFSET_X) / CELL_SIZE);
  let gridY = Math.floor((obj.y - OFFSET_Y) / CELL_SIZE);

  shape.forEach((row, i) => {
    row.forEach((val, j) => {
      if (val) {
        grid[gridY + i][gridX + j] = color;
      }
    });
  });

  clearLines();
}

// LIMPAR
function clearLines() {
  for (let y = 0; y < GRID_SIZE; y++) {
    if (grid[y].every(c => c)) {
      grid[y].fill(0);
      score += 10;
    }
  }

  for (let x = 0; x < GRID_SIZE; x++) {
    let full = true;
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!grid[y][x]) full = false;
    }
    if (full) {
      for (let y = 0; y < GRID_SIZE; y++) {
        grid[y][x] = 0;
      }
      score += 10;
    }
  }

  document.getElementById("score").innerText = "Pontuação: " + score;
}

// LOOP
function gameLoop() {
  drawGrid();
  drawShapes();
  requestAnimationFrame(gameLoop);
}