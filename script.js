const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreText = document.getElementById("score");

const GRID_SIZE = 8;

// 📱 GRID RESPONSIVA
let CELL_SIZE = window.innerWidth < 600
  ? Math.floor(window.innerHeight * 0.45 / GRID_SIZE)
  : 55;

const GRID_PIXEL_SIZE = GRID_SIZE * CELL_SIZE;

// 🎨 canvas menor
canvas.width = GRID_PIXEL_SIZE + 40;
canvas.height = GRID_PIXEL_SIZE + 180;

let OFFSET_X = 20;
let OFFSET_Y = 20;

let grid;
let score = 0;

let dragging = null;
let offsetX = 0;
let offsetY = 0;

// 🎨 PALETAS
let palettes = {
  rosa: { pieces:["#ff4d6d","#ff8fa3"], bg:"#222", menu:"pink" },
  azul: { pieces:["#4d96ff","#8fd3ff"], bg:"#1a1a2e", menu:"blue" },
  neon: { pieces:["#39ff14","#00ffcc"], bg:"#000", menu:"black" },
  dark: { pieces:["#777","#aaa"], bg:"#111", menu:"gray" },
  rainbow: {
    pieces: ["#ff0000","#ff7f00","#ffff00","#00ff00","#0000ff","#4b0082","#9400d3"],
    bg: "linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)",
    menu: "linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)"
  }
};

let current = palettes.rosa;

const shapes = [
  [[1]], [[1,1]], [[1],[1]],
  [[1,1,1]], [[1],[1],[1]],
  [[1,1],[1,1]]
];

let pieces = [];

// 🎨 BACKGROUND MENU
function applyPalettePreview(){
  const v = document.getElementById("paletteSelect").value;
  const bg = palettes[v].menu;
  document.body.style.background = bg;
}

// START
function startGame(){
  const v = document.getElementById("paletteSelect").value;
  current = palettes[v];

  canvas.style.background = current.bg;

  document.getElementById("menu").style.display = "none";
  canvas.style.display = "block";

  grid = Array.from({length:GRID_SIZE},()=>Array(GRID_SIZE).fill(0));

  score = 0;
  updateScore();

  spawnPieces();
  loop();
}

// SPAWN (CORRIGIDO)
function spawnPieces(){
  pieces = [];

  let spacing = CELL_SIZE * 2;
  let currentX = 20;

  for(let i=0;i<3;i++){
    let shape = shapes[Math.floor(Math.random()*shapes.length)];

    let pieceWidth = shape[0].length * CELL_SIZE;

    let x = currentX;
    let y = GRID_PIXEL_SIZE + 40;

    pieces.push({
      shape,
      color: current.pieces[Math.floor(Math.random()*current.pieces.length)],
      x, y,
      ox: x,
      oy: y
    });

    currentX += pieceWidth + spacing;
  }
}

// POSIÇÃO
function getPos(e){
  const r = canvas.getBoundingClientRect();
  return e.touches
    ? {x:e.touches[0].clientX-r.left,y:e.touches[0].clientY-r.top}
    : {x:e.clientX-r.left,y:e.clientY-r.top};
}

// EVENTOS
canvas.onmousedown = startDrag;
canvas.onmousemove = moveDrag;
canvas.onmouseup = endDrag;

canvas.ontouchstart = e=>{e.preventDefault();startDrag(e);}
canvas.ontouchmove = e=>{e.preventDefault();moveDrag(e);}
canvas.ontouchend = e=>{e.preventDefault();endDrag(e);}

// DRAG
function startDrag(e){
  let p=getPos(e);

  pieces.forEach(o=>{
    let w=o.shape[0].length*CELL_SIZE;
    let h=o.shape.length*CELL_SIZE;

    if(p.x>o.x&&p.x<o.x+w&&p.y>o.y&&p.y<o.y+h){
      dragging=o;
      offsetX=p.x-o.x;
      offsetY=p.y-o.y;
    }
  });
}

function moveDrag(e){
  if(!dragging)return;
  let p=getPos(e);
  dragging.x=p.x-offsetX;
  dragging.y=p.y-offsetY;
}

function endDrag(){
  if(!dragging)return;

  let gx=Math.round((dragging.x-OFFSET_X)/CELL_SIZE);
  let gy=Math.round((dragging.y-OFFSET_Y)/CELL_SIZE);

  if(canPlace(dragging.shape,gx,gy)){
    placeShape(dragging.shape,gx,gy,dragging.color);
    clearLines();

    pieces = pieces.filter(p=>p!==dragging);
    if(pieces.length===0) spawnPieces();
  }else{
    dragging.x=dragging.ox;
    dragging.y=dragging.oy;
  }

  dragging=null;
}

// COLOCAR
function placeShape(shape,x,y,color){
  shape.forEach((r,i)=>{
    r.forEach((v,j)=>{
      if(v) grid[y+i][x+j] = color;
    });
  });
}

// LIMPAR LINHAS
function clearLines(){
  let cleared = 0;

  for(let y=0;y<GRID_SIZE;y++){
    if(grid[y].every(v=>v)){
      grid[y].fill(0);
      cleared++;
    }
  }

  for(let x=0;x<GRID_SIZE;x++){
    let full = true;
    for(let y=0;y<GRID_SIZE;y++){
      if(!grid[y][x]) full=false;
    }
    if(full){
      for(let y=0;y<GRID_SIZE;y++){
        grid[y][x]=0;
      }
      cleared++;
    }
  }

  if(cleared>0){
    score += cleared * 10;
    updateScore();
  }
}

// SCORE
function updateScore(){
  scoreText.innerText = "Pontuação: " + score;
}

// LÓGICA
function canPlace(s,x,y){
  for(let i=0;i<s.length;i++){
    for(let j=0;j<s[i].length;j++){
      if(s[i][j]){
        let nx=x+j,ny=y+i;
        if(nx<0||ny<0||nx>=GRID_SIZE||ny>=GRID_SIZE||grid[ny][nx]) return false;
      }
    }
  }
  return true;
}

// DESENHO
function drawGrid(){
  for(let y=0;y<GRID_SIZE;y++){
    for(let x=0;x<GRID_SIZE;x++){
      ctx.strokeRect(OFFSET_X+x*CELL_SIZE,OFFSET_Y+y*CELL_SIZE,CELL_SIZE,CELL_SIZE);

      if(grid[y][x]){
        ctx.fillStyle = grid[y][x];
        ctx.fillRect(
          OFFSET_X+x*CELL_SIZE+2,
          OFFSET_Y+y*CELL_SIZE+2,
          CELL_SIZE-4,
          CELL_SIZE-4
        );
      }
    }
  }
}

function drawPieces(){
  pieces.forEach(o=>{
    ctx.fillStyle=o.color;
    o.shape.forEach((r,y)=>{
      r.forEach((v,x)=>{
        if(v){
          ctx.fillRect(o.x+x*CELL_SIZE,o.y+y*CELL_SIZE,CELL_SIZE-2,CELL_SIZE-2);
        }
      });
    });
  });
}

function loop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawGrid();
  drawPieces();
  requestAnimationFrame(loop);
}

applyPalettePreview();