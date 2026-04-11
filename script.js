const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const GRID_SIZE = 8;

let CELL_SIZE = window.innerWidth < 600
  ? Math.floor(window.innerWidth / 5.5)
  : 60;

const GRID_PIXEL_SIZE = GRID_SIZE * CELL_SIZE;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const OFFSET_X = (canvas.width - GRID_PIXEL_SIZE) / 2;
const OFFSET_Y = (canvas.height - GRID_PIXEL_SIZE) / 2 - 50;

let grid;
let gameRunning = false;

// 🎨 PALETAS
let palettes = {
  rosa: {
    pieces: ["#ff4d6d","#ff758f","#ff8fa3"],
    gameBg: "#222",
    menuBg: "linear-gradient(45deg,#ff9a9e,#fad0c4)"
  },
  azul: {
    pieces: ["#4d96ff","#6bc1ff"],
    gameBg: "#1a1a2e",
    menuBg: "linear-gradient(45deg,#2193b0,#6dd5ed)"
  },
  neon: {
    pieces: ["#39ff14","#00ffcc"],
    gameBg: "#000",
    menuBg: "linear-gradient(45deg,#000,#333)"
  },
  dark: {
    pieces: ["#777","#aaa"],
    gameBg: "#111",
    menuBg: "linear-gradient(45deg,#232526,#414345)"
  },
  rainbow: {
    pieces: ["red","orange","yellow","green","blue","indigo","violet"],
    gameBg: "#111",
    menuBg: "linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)"
  }
};

let currentPalette = palettes.rosa;
let colors = currentPalette.pieces;

const shapes = [
  [[1]], [[1,1]], [[1],[1]],
  [[1,1,1]], [[1],[1],[1]],
  [[1,1],[1,1]]
];

let availableShapes = [];
let dragging = null;
let offsetX = 0;
let offsetY = 0;

// MENU
function applyPalettePreview() {
  const selected = document.getElementById("paletteSelect").value;
  document.body.style.background = palettes[selected].menuBg;
}

function startGame() {
  const selected = document.getElementById("paletteSelect").value;
  currentPalette = palettes[selected];
  colors = currentPalette.pieces;

  canvas.style.background = currentPalette.gameBg;
  document.body.style.background = currentPalette.menuBg;

  document.getElementById("menu").style.display = "none";
  canvas.style.display = "block";

  grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
  gameRunning = true;

  generateShapes();
  gameLoop();
}

// GERAR PEÇAS
function generateShapes() {
  availableShapes = [];

  const spacing = CELL_SIZE * 3;
  const startX = (canvas.width - spacing * 2) / 2;

  for (let i = 0; i < 3; i++) {
    let x = startX + i * spacing;
    let y = OFFSET_Y + GRID_PIXEL_SIZE + 40;

    availableShapes.push({
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      x, y,
      originalX: x,
      originalY: y
    });
  }
}

// POSIÇÃO
function getPosition(e) {
  const rect = canvas.getBoundingClientRect();
  return e.touches
    ? { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    : { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

// DRAG
canvas.addEventListener("mousedown", startDrag);
canvas.addEventListener("mousemove", moveDrag);
canvas.addEventListener("mouseup", endDrag);

canvas.addEventListener("touchstart", e => { e.preventDefault(); startDrag(e); });
canvas.addEventListener("touchmove", e => { e.preventDefault(); moveDrag(e); });
canvas.addEventListener("touchend", e => { e.preventDefault(); endDrag(); });

function startDrag(e) {
  if (!gameRunning) return;
  let pos = getPosition(e);

  availableShapes.forEach(obj => {
    let w = obj.shape[0].length * CELL_SIZE;
    let h = obj.shape.length * CELL_SIZE;

    if (pos.x > obj.x && pos.x < obj.x + w &&
        pos.y > obj.y && pos.y < obj.y + h) {
      dragging = obj;
      offsetX = pos.x - obj.x;
      offsetY = pos.y - obj.y;
    }
  });
}

function moveDrag(e) {
  if (!dragging) return;
  let pos = getPosition(e);
  dragging.x = pos.x - offsetX;
  dragging.y = pos.y - offsetY;
}

function endDrag() {
  if (!dragging) return;

  let snap = getSnapPosition(dragging);

  if (snap && canPlace(dragging.shape, snap.x, snap.y)) {
    placeShapeAt(dragging, snap.x, snap.y);
    availableShapes = availableShapes.filter(s => s !== dragging);
    if (availableShapes.length === 0) generateShapes();
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

  let cx = obj.x + w / 2;
  let cy = obj.y + h / 2;

  let gx = Math.round((cx - OFFSET_X) / CELL_SIZE - obj.shape[0].length / 2);
  let gy = Math.round((cy - OFFSET_Y) / CELL_SIZE - obj.shape.length / 2);

  return { x: gx, y: gy };
}

// GRID (CORREÇÃO AQUI)
function drawGrid() {
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {

      ctx.strokeStyle = "#555";
      ctx.strokeRect(
        OFFSET_X + x * CELL_SIZE,
        OFFSET_Y + y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );

      // 🔥 CORREÇÃO: desenhar peças
      if (grid[y][x]) {
        ctx.fillStyle = grid[y][x];
        ctx.fillRect(
          OFFSET_X + x * CELL_SIZE + 2,
          OFFSET_Y + y * CELL_SIZE + 2,
          CELL_SIZE - 4,
          CELL_SIZE - 4
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

// LÓGICA
function canPlace(shape, x, y) {
  for (let i = 0; i < shape.length; i++) {
    for (let j = 0; j < shape[i].length; j++) {
      if (shape[i][j]) {
        let nx = x + j;
        let ny = y + i;

        if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE || grid[ny][nx])
          return false;
      }
    }
  }
  return true;
}

function placeShapeAt(obj, gx, gy) {
  obj.shape.forEach((row, i) => {
    row.forEach((val, j) => {
      if (val) grid[gy + i][gx + j] = obj.color;
    });
  });
}

// LOOP
function gameLoop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGrid();
  drawPreview();
  drawShapes();

  requestAnimationFrame(gameLoop);
}

// INIT
applyPalettePreview();