const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const GRID_SIZE = 8;

// 📱 RESPONSIVO
let CELL_SIZE;
if (window.innerWidth < 600) {
  CELL_SIZE = Math.floor(window.innerWidth / 7);
} else {
  CELL_SIZE = 60;
}

const GRID_PIXEL_SIZE = GRID_SIZE * CELL_SIZE;

// DEFINE CANVAS
canvas.width = window.innerWidth;
canvas.height = GRID_PIXEL_SIZE + 300;

// CENTRALIZA
const OFFSET_X = (canvas.width - GRID_PIXEL_SIZE) / 2;
const OFFSET_Y = 50;

let grid;
let score;
let gameRunning = false;

// 🎨 PALETAS
let palettes = {
  rosa: {
    pieces: ["#ff4d6d", "#ff758f", "#ff8fa3", "#ffb3c1", "#ffc2d1"],
    gameBg: "#222",
    menuBg: "linear-gradient(45deg, #ff9a9e, #fad0c4)"
  },
  azul: {
    pieces: ["#4d96ff", "#6bc1ff", "#8fd3ff", "#b3e5ff", "#ccefff"],
    gameBg: "#1a1a2e",
    menuBg: "linear-gradient(45deg, #2193b0, #6dd5ed)"
  },
  neon: {
    pieces: ["#39ff14", "#00ffcc", "#00e5ff", "#66ff66"],
    gameBg: "#000",
    menuBg: "linear-gradient(45deg, #000000, #434343)"
  },
  dark: {
    pieces: ["#555", "#777", "#999", "#bbb"],
    gameBg: "#111",
    menuBg: "linear-gradient(45deg, #232526, #414345)"
  },
  rainbow: {
    pieces: ["#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff", "#4b0082", "#8f00ff"],
    gameBg: "#111",
    menuBg: "linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)"
  }
};

let currentPalette = palettes.rosa;
let colors = currentPalette.pieces;

// PEÇAS
const shapes = [
  [[1]],
  [[1,1]],
  [[1],[1]],
  [[1,1,1]],
  [[1],[1],[1]],
  [[1,1],[1,1]],
  [[1,0],[1,1]],
  [[0,1],[1,1]],
  [[1,1,1],[0,1,0]],
  [[1,1,0],[0,1,1]],
  [[0,1,1],[1,1,0]],
  [[1,1,1],[1,0,0]],
  [[1,1,1],[0,0,1]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]],
  [[1,1,1,1]],
  [[1],[1],[1],[1]]
];

let availableShapes = [];
let dragging = null;
let offsetX = 0;
let offsetY = 0;

// 🎨 PREVIEW MENU
function applyPalettePreview() {
  const selected = document.getElementById("paletteSelect").value;
  const palette = palettes[selected];
  document.body.style.background = palette.menuBg;
}

// MENU
function startGame() {
  const selected = document.getElementById("paletteSelect").value;
  currentPalette = palettes[selected];
  colors = currentPalette.pieces;

  canvas.style.background = currentPalette.gameBg;
  document.body.style.background = currentPalette.menuBg;

  document.getElementById("menu").style.display = "none";
  canvas.style.display = "block";

  grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
  score = 0;
  gameRunning = true;

  generateShapes();
  gameLoop();
}

// GERAR PEÇAS
function generateShapes() {
  availableShapes = [];

  const spacing = CELL_SIZE * 4;
  const startX = (canvas.width - spacing * 2) / 2;

  for (let i = 0; i < 3; i++) {
    let x = startX + i * spacing;
    let y = GRID_PIXEL_SIZE + 80;

    availableShapes.push({
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      x,
      y,
      originalX: x,
      originalY: y
    });
  }

  if (checkGameOver()) gameOver();
}

// POSIÇÃO
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

// DRAG
function startDrag(e) {
  if (!gameRunning) return;

  let pos = getPosition(e);

  availableShapes.forEach(obj => {
    let w = obj.shape[0].length * CELL_SIZE;
    let h = obj.shape.length * CELL_SIZE;

    if (
      pos.x > obj.x && pos.x < obj.x + w &&
      pos.y > obj.y && pos.y < obj.y + h
    ) {
      dragging = obj;
      offsetX = pos.x - obj.x;
      offsetY = pos.y - obj.y;
    }
  });
}

function moveDrag(e) {
  if (!dragging || !gameRunning) return;

  let pos = getPosition(e);

  dragging.x = pos.x - offsetX;
  dragging.y = pos.y - offsetY;
}

function endDrag() {
  if (!dragging || !gameRunning) return;

  let snap = getSnapPosition(dragging);

  if (snap && canPlace(dragging.shape, snap.x, snap.y)) {
    placeShapeAt(dragging, snap.x, snap.y);

    availableShapes = availableShapes.filter(s => s !== dragging);

    if (availableShapes.length === 0) {
      generateShapes();
    } else {
      if (checkGameOver()) gameOver();
    }
  } else {
    dragging.x = dragging.originalX;
    dragging.y = dragging.originalY;
  }

  dragging = null;
}

// SNAP
function getSnapPosition(obj) {
  let w = obj.shape[0].length * CELL_SIZE;
  let h = obj.shape.length * CELL_SIZE;

  let centerX = obj.x + w / 2;
  let centerY = obj.y + h / 2;

  let gridX = Math.round((centerX - OFFSET_X) / CELL_SIZE - obj.shape[0].length / 2);
  let gridY = Math.round((centerY - OFFSET_Y) / CELL_SIZE - obj.shape.length / 2);

  return { x: gridX, y: gridY };
}

// EVENTOS
canvas.addEventListener("mousedown", startDrag);
canvas.addEventListener("mousemove", moveDrag);
canvas.addEventListener("mouseup", endDrag);

canvas.addEventListener("touchstart", e => { e.preventDefault(); startDrag(e); });
canvas.addEventListener("touchmove", e => { e.preventDefault(); moveDrag(e); });
canvas.addEventListener("touchend", e => { e.preventDefault(); endDrag(); });

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

// PREVIEW
function drawPreview() {
  if (!dragging) return;

  let snap = getSnapPosition(dragging);
  let valid = canPlace(dragging.shape, snap.x, snap.y);

  ctx.globalAlpha = 0.5;
  ctx.fillStyle = valid ? "#00ff88" : "#ff4d6d";

  dragging.shape.forEach((row, i) => {
    row.forEach((val, j) => {
      if (val) {
        ctx.fillRect(
          OFFSET_X + (snap.x + j) * CELL_SIZE,
          OFFSET_Y + (snap.y + i) * CELL_SIZE,
          CELL_SIZE - 2,
          CELL_SIZE - 2
        );
      }
    });
  });

  ctx.globalAlpha = 1;
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
function placeShapeAt(obj, gridX, gridY) {
  const { shape, color } = obj;

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

// GAME OVER
function checkGameOver() {
  for (let obj of availableShapes) {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (canPlace(obj.shape, x, y)) return false;
      }
    }
  }
  return true;
}

function gameOver() {
  gameRunning = false;

  const screen = document.getElementById("gameOverScreen");
  const scoreText = document.getElementById("finalScore");

  scoreText.innerText = "Pontuação: " + score;

  screen.style.display = "flex";

  setTimeout(() => {
    screen.style.display = "none";
    document.getElementById("menu").style.display = "flex";
    canvas.style.display = "none";
  }, 3000);
}

// LOOP
function gameLoop() {
  if (!gameRunning) return;

  drawGrid();
  drawPreview();
  drawShapes();

  requestAnimationFrame(gameLoop);
}

// INICIA COM PALETA DO MENU
applyPalettePreview();