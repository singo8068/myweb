
niteBtn.addEventListener("click", () => {
  if (currentPlayer === "black"&&blackTame<2){
    turnDisplay.removeChild(turnDisplay.lastChild);
    turnDisplay.appendChild(document.createTextNode("２てうつにはためが２いるよ"));
    return;
  }
  if (currentPlayer === "white"&&whiteTame<2){
    turnDisplay.removeChild(turnDisplay.lastChild);
    turnDisplay.appendChild(document.createTextNode("２てうつにはためが２いるよ"));
    return;
  }
  document.getElementById("mainControls").style.display = "none";
  document.getElementById("confirmControls").style.display = "block";
  gameMode="nite";
  nitesu=0;
});
oseBtn.addEventListener("click", () => {
  if (currentPlayer === "black"&&blackTame<5){
    turnDisplay.removeChild(turnDisplay.lastChild);
    turnDisplay.appendChild(document.createTextNode("リバースにはためが５いるよ"));
    return;
  }
  if (currentPlayer === "white"&&whiteTame<5){
    turnDisplay.removeChild(turnDisplay.lastChild);
    turnDisplay.appendChild(document.createTextNode("リバースにはためが５いるよ"));
    return;
  }
  document.getElementById("mainControls").style.display = "none";
  document.getElementById("confirmControls").style.display = "block";
  gameMode="osero";
  for (let y = 0; y < SIZE; y++) {
   for (let x = 0; x < SIZE; x++) {
    if(board[y][x]===null){
     drawBoard[y][x]=oseroCheck(x,y);
     draw();
    }
   }
  }
});

function oseroCheck(x,y){
 for (let [nx, ny] of getNeighbors(x, y)) {
  let isKing=tekingka(nx,ny);
  if(board[ny][nx]!==currentPlayer&&board[ny][nx]!==null&&isKing===false){
   for(let i = 1;i<SIZE;i++){
    let px=nx*(i+1)-x*i;
    let py=ny*(i+1)-y*i;
    if(px >= 0 && py >= 0 && px < SIZE && py < SIZE){
     if(board[py][px]===currentPlayer)return "kouho_"+currentPlayer;
     if(board[py][px]===null)break;
     if(tekingka(px,py))break;
    }
   }
  }
 }
 return null;
}
function oseroGaesi(x,y){
 kaesisu=0;
 for (let [nx, ny] of getNeighbors(x, y)) {
  let isKing=tekingka(nx,ny);
  if(board[ny][nx]!==currentPlayer&&board[ny][nx]!==null&&isKing===false){
   for(let i = 1;i<SIZE;i++){
    let px=nx*(i+1)-x*i;
    let py=ny*(i+1)-y*i;
    if(px >= 0 && py >= 0 && px < SIZE && py < SIZE){
     if(board[py][px]===currentPlayer)kaesiSyori(x,y,nx,ny);
     if(board[py][px]===null)break;
     if(tekingka(px,py))break;
    }
   }
  }
 }
}
function kaesiSyori(x,y,nx,ny){
 for(let i = 0;i<SIZE;i++){
  let px=nx*(i+1)-x*i;
  let py=ny*(i+1)-y*i;
   //alert(board[py][px]);
  if(board[py][px]===currentPlayer)return;
  board[py][px]=currentPlayer;
  kaesisu++;
 }
}
