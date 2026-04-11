const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreText = document.getElementById("score");

const GRID_SIZE = 8;

let CELL_SIZE;

if (window.innerWidth < 600) {
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  // 🔥 usa só 60% da altura pra grid
  const maxGridHeight = screenH * 0.6;

  CELL_SIZE = Math.floor(maxGridHeight / GRID_SIZE);
} else {
  CELL_SIZE = 60;
}

const GRID_PIXEL_SIZE = GRID_SIZE * CELL_SIZE;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const OFFSET_X = (canvas.width - GRID_PIXEL_SIZE) / 2;
const OFFSET_Y = 80;

let grid;
let dragging = null;
let offsetX = 0;
let offsetY = 0;
let score = 0;

// 🎨 PALETAS
let palettes = {
  rosa: { pieces:["#ff4d6d","#ff8fa3"], bg:"#222", menu:"pink" },
  azul: { pieces:["#4d96ff","#8fd3ff"], bg:"#1a1a2e", menu:"blue" },
  neon: { pieces:["#39ff14","#00ffcc"], bg:"#000", menu:"black" },
  dark: { pieces:["#777","#aaa"], bg:"#111", menu:"gray" },
  rainbow: { pieces:["red","orange","yellow","green","blue","purple"], bg:"#111", menu:"linear-gradient(45deg, red, orange, yellow, green, blue, purple)" }
};

let current = palettes.rosa;

const shapes = [
  [[1]], [[1,1]], [[1],[1]],
  [[1,1,1]], [[1],[1],[1]],
  [[1,1],[1,1]]
];

let pieces = [];

// MENU
function applyPalettePreview(){
  const v = document.getElementById("paletteSelect").value;
  document.body.style.background = palettes[v].menu;
}

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

// 🔥 POSICIONAMENTO CORRIGIDO
function spawnPieces(){
  pieces = [];

  const spacing = CELL_SIZE * 3;
  const totalWidth = spacing * 2;
  const startX = (canvas.width - totalWidth) / 2;

  for(let i=0;i<3;i++){
    let x = startX + i * spacing;
    let y = OFFSET_Y + GRID_PIXEL_SIZE + 40;

    pieces.push({
      shape: shapes[Math.floor(Math.random()*shapes.length)],
      color: current.pieces[Math.floor(Math.random()*current.pieces.length)],
      x, y,
      ox: x,
      oy: y
    });
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
    dragging.shape.forEach((r,i)=>{
      r.forEach((v,j)=>{
        if(v){
          grid[gy+i][gx+j]=dragging.color;
          score++;
        }
      });
    });

    updateScore();

    pieces = pieces.filter(p=>p!==dragging);
    if(pieces.length===0) spawnPieces();
  }else{
    dragging.x=dragging.ox;
    dragging.y=dragging.oy;
  }

  dragging=null;
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

// GRID
function drawGrid(){
  for(let y=0;y<GRID_SIZE;y++){
    for(let x=0;x<GRID_SIZE;x++){
      ctx.strokeRect(OFFSET_X+x*CELL_SIZE,OFFSET_Y+y*CELL_SIZE,CELL_SIZE,CELL_SIZE);

      if(grid[y][x]){
        ctx.fillStyle=grid[y][x];
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

// PEÇAS
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

// LOOP
function loop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawGrid();
  drawPieces();
  requestAnimationFrame(loop);
}

applyPalettePreview();