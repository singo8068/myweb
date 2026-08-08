
pawaBtn.addEventListener("click", () => {
  if (currentPlayer === "black"&&blackTame<1){
    uemsg="パワーうちにはパワーが１いるよ";
    turnDisplay.removeChild(turnDisplay.lastChild);
    turnDisplay.appendChild(document.createTextNode(uemsg));
    return;
  }
  if (currentPlayer === "white"&&whiteTame<1){
    uemsg="パワーうちにはパワーが１いるよ";
    turnDisplay.removeChild(turnDisplay.lastChild);
    turnDisplay.appendChild(document.createTextNode(uemsg));
    return;
  }
  document.getElementById("mainControls").style.display = "none";
  document.getElementById("confirmControls").style.display = "block";
  gameMode="pawa";
  const enemy = currentPlayer === "black" ? "white" : "black";
  for (let y = 0; y < SIZE; y++) {
   for (let x = 0; x < SIZE; x++) {
    if(board[y][x]===null){
        for (let [nx, ny] of getNeighbors(x, y)) {
          if (board[ny][nx] === enemy && countLiberties(nx, ny) === 1) {
            blackSuicide = false;
            drawBoard[y][x]="kouho_" + currentPlayer;
            break;
          }
        }
    }
   }
  }
  draw();
});
oseBtn.addEventListener("click", () => {
  let su=0;
  if (currentPlayer === "black"){
   su=blackTame;
   if(su<4){
    uemsg="リバースにはパワーが４いるよ";
    turnDisplay.removeChild(turnDisplay.lastChild);
    turnDisplay.appendChild(document.createTextNode(uemsg));
    return;
   }
  }
  if (currentPlayer === "white"){
   su=whiteTame;
   if(su<4){
    uemsg="リバースにはパワーが４いるよ";
    turnDisplay.removeChild(turnDisplay.lastChild);
    turnDisplay.appendChild(document.createTextNode(uemsg));
    return;
   }
  }
  su=Math.floor(su / 2);
  su=su-1;
  document.getElementById("mainControls").style.display = "none";
  document.getElementById("confirmControls").style.display = "block";
  gameMode="osero";
  for (let y = 0; y < SIZE; y++) {
   for (let x = 0; x < SIZE; x++) {
    if(board[y][x]===null){
     drawBoard[y][x]=oseroCheck(x,y,su);
    }
   }
  }
  draw();
});

function oseroCheck(x, y, su) {
  let count = 0; 
  let counts = 0;
  for (let [nx, ny] of getNeighbors(x, y)) {
    let isKing = tekingka(nx, ny);
    if (board[ny][nx] !== currentPlayer &&
        board[ny][nx] !== null &&
        isKing === false) {
      count=counts;
      for (let i = 1; i < SIZE; i++) {
        counts++; // 相手の石を1枚追加
        let px = nx * (i + 1) - x * i;
        let py = ny * (i + 1) - y * i;
        if (px < 0 || py < 0 || px >= SIZE || py >= SIZE) {counts=count;break;}
        if (board[py][px] === currentPlayer)  {count=counts;break;}
        if (board[py][px] === null) {counts=count;break;}
        if (tekingka(px, py)) {counts=count;break;}
      }
    }
  }
 if (count > 0 && count <= su){return "kouho_" + currentPlayer;}
 return null;
}


function oseroGaesi(x, y, playerColor = currentPlayer) {
    kaesisu = 0;

    for (let [nx, ny] of getNeighbors(x, y)) {
        let isKing = tekingka(nx, ny, playerColor);

        if (
            board[ny][nx] !== playerColor &&
            board[ny][nx] !== null &&
            isKing === false
        ) {
            for (let i = 1; i < SIZE; i++) {
                let px = nx * (i + 1) - x * i;
                let py = ny * (i + 1) - y * i;

                if (px >= 0 && py >= 0 && px < SIZE && py < SIZE) {

                    if (board[py][px] === playerColor) {
                        kaesiSyori(x, y, nx, ny, playerColor);
                        break;
                    }

                    if (board[py][px] === null) break;
                    if (tekingka(px, py, playerColor)) break;

                }
            }
        }
    }
}

function kaesiSyori(x, y, nx, ny, playerColor = currentPlayer) {
    for (let i = 0; i < SIZE; i++) {
        let px = nx * (i + 1) - x * i;
        let py = ny * (i + 1) - y * i;

        if (board[py][px] === playerColor) return;

        board[py][px] = playerColor;
        kaesisu++;
    }
}
