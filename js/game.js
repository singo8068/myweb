
function saveState() {
  undoHistory.push({
    board: board.map(row => [...row]),
    drawBoard: drawBoard.map(row => [...row]),
    currentPlayer,
    blackKing: blackKing ? { ...blackKing } : null,
    whiteKing: whiteKing ? { ...whiteKing } : null,
    blackTame,
    whiteTame,
    koBlack: koBlack ? [...koBlack] : null,
    koWhite: koWhite ? [...koWhite] : null,
    koPoint: koPoint ? [...koPoint] : null,
    prevKoPoint: prevKoPoint ? [...prevKoPoint] : null,
    nitesu,
    blackYasumi,
    whiteYasumi
  });
}

function placeStone(x, y) {
  if (board[y][x] !== null) return false;

  if ((currentPlayer === "black" && koBlack && koBlack[0] === x && koBlack[1] === y) ||
      (currentPlayer === "white" && koWhite && koWhite[0] === x && koWhite[1] === y)) {
    return false;
  }
  if (gameMode === "main") {saveState();}

  koBlack = null;
  koWhite = null;

  board[y][x] = currentPlayer;

  if (!blackKing && currentPlayer === "black") blackKing = { x, y };
  if (!whiteKing && currentPlayer === "white") whiteKing = { x, y };

  koPoint = null;

  let captured = [];

  for (let [nx, ny] of getNeighbors(x, y)) {
    const target = board[ny][nx];
    if (target && target !== currentPlayer) {
      const koCandidate = removeDead(nx, ny, target);
      if (koCandidate) captured.push(koCandidate);
    }
  }

  if (!hasLiberties(x, y, currentPlayer, {})) {
    board[y][x] = null;
    return false;
  }

  if (captured.length === 1) {
    // このときだけコウの可能性を検討
    const [koX, koY] = captured[0];

    // 置いた石の連結数を調べる
    const visited = {};
    let ownCount = 0;
    function dfsCount(cx, cy) {
      const key = `${cx},${cy}`;
      if (visited[key]) return;
      visited[key] = true;
      ownCount++;
      for (let [nx, ny] of getNeighbors(cx, cy)) {
        if (board[ny][nx] === currentPlayer) dfsCount(nx, ny);
      }
    }
    dfsCount(x, y);

    if (ownCount === 1) {
      if (currentPlayer === "black") {
        koWhite = [koX, koY];
      } else {
        koBlack = [koX, koY];
      }
    }
  }

  if (!gameNow) return false;

  prevKoPoint = koPoint;

  if (gameMode === "main") {
    playerChange();
  }

  updateForbiddenPoints();
  updateDisplay();
  draw();

  return true;
}


function uteruka(x, y) {
  if (board[y][x] === null && drawBoard[y][x] === null) return true;
  return false;
}

canvas.addEventListener("click", async (e) => {
  if (!gameNow) return;
  const rect = canvas.getBoundingClientRect();
  const point = getClosest(e.clientX - rect.left, e.clientY - rect.top);

  if (point && gameMode === "main") {
    if (!placeStone(point.x, point.y)) {
      turnDisplay.removeChild(turnDisplay.lastChild);
      turnDisplay.appendChild(document.createTextNode("はそこにはうてないよ"));
    }
  }

  if (point && gameMode === "nite" && board[point.y][point.x] === null && nitesu < 2) {
    nitesu++;
    drawBoard[point.y][point.x] = "kouho_" + currentPlayer;
    draw();
  }

  if (
    point &&gameMode === "osero" &&
    (drawBoard[point.y][point.x] === "kouho_black" || drawBoard[point.y][point.x] === "kouho_white")
  ) {
    saveState();
    await showEffectText("ひっさつ\nリバース\nはつどう！", 1500);
    document.getElementById("mainControls").style.display = "none";
    board[point.y][point.x] = currentPlayer;
    oseroGaesi(point.x, point.y);
    currentPlayer = currentPlayer === "black" ? "white" : "black";
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (board[y][x] === currentPlayer) {
          board[y][x] = null;
          placeStone(x, y);
        }
      }
    }
    currentPlayer = currentPlayer === "black" ? "white" : "black";
    gameNow=false;
    await delay(1000);
    if (currentPlayer === "black") {
     blackTame -= 5;
     blackYasumi=kaesisu;
     await showEffectText(kaesisu+"つリバース\nしたので\nくろは"+kaesisu+"かい\nやすみます", 2000);
    }
    if (currentPlayer === "white") {
     whiteTame -= 5;
     whiteYasumi=kaesisu;
     await showEffectText(kaesisu+"つリバース\nしたので\nしろは"+kaesisu+"かい\nやすみます", 2000);
    }
    gameMode = "main";
    playerChange();
  }
});

function tekingka(x,y){
 if(currentPlayer==="black"){
  if(x===whiteKing.x&&y===whiteKing.y)return true;
 }else{
  if(x===blackKing.x&&y===blackKing.y)return true;
 }
 return false;
}

passBtn.addEventListener("click", async () => {
  if (!blackKing || !whiteKing) {
    turnDisplay.removeChild(turnDisplay.lastChild);
    turnDisplay.appendChild(document.createTextNode("１てめはためれないよ"));
    return;
  }
saveState();
  await showEffectText("きあいを\nためるよ！", 1000);

  if (currentPlayer === "black") blackTame++;
  else whiteTame++;

  playerChange();
  updateForbiddenPoints();
  updateDisplay();
  draw();
});

resetBtn.addEventListener("click", async function () {
 syouhai(currentPlayer === "white");
 });
resetBtn2.addEventListener("click", async function () {
 initBoard()});

document.getElementById("cancelBtn").addEventListener("click", function () {
    document.getElementById("confirmControls").style.display = "none";
    document.getElementById("mainControls").style.display = "block";
    updateForbiddenPoints();
    draw();
    gameMode="main";
  });

document.getElementById("confirmBtn").addEventListener("click", async function () {
 if(gameMode==="nite"){
  if(nitesu<2){
   turnDisplay.removeChild(turnDisplay.lastChild);
   turnDisplay.appendChild(document.createTextNode("２かしょえらんでね"));
   return;
  }
saveState();
  await showEffectText("ひっさつ\n２てうち\nはつどう！",2000);
  let p=1;
  if (currentPlayer === "black"){blackTame=blackTame-2;}
  if (currentPlayer === "white"){whiteTame=whiteTame-2;}
  for (let y = 0; y < SIZE; y++) {
   for (let x = 0; x < SIZE; x++) {
    if(drawBoard[y][x]==="kouho_"+currentPlayer){
     if(p===1){
      x1=x;
      y1=y;
      p++;
    }else{
      board[y][x]=currentPlayer;
      x2=x;
      y2=y;
     }
    }
   }
  }
 }
 nitesu=0;
 placeStone(x1, y1);
 board[y2][x2]=null;
 placeStone(x2, y2); 
 playerChange();
 gameMode="main";
 updateDisplay();
  });
async function showEffectText(text, duration) {
  gameNow=false;
  document.getElementById("confirmControls").style.display = "none";
  document.getElementById("mainControls").style.display = "none";
  const effectDiv = document.getElementById("effectText");
  effectDiv.textContent = text;
  effectDiv.style.display = "block";
effectDiv.style.opacity = "0.7";
  setTimeout(() => {
    effectDiv.style.display = "none";
  }, duration);
  await delay(duration);
  document.getElementById("mainControls").style.display = "block";
  gameNow=true;
}
async function playerChange(){
 if (currentPlayer === "white"&&blackYasumi>0) {
  await showEffectText("くろはあと\n"+blackYasumi+"かい\nやすみます", 1500);
  blackYasumi--;
  if(whiteYasumi>0){currentPlayer = "black";playerChange();}
  updateDisplay();
  return;
 }
 if (currentPlayer === "black"&&whiteYasumi>0) {
  await showEffectText("しろはあと\n"+whiteYasumi+"かい\nやすみます", 1500);
  whiteYasumi--;
  if(blackYasumi>0){currentPlayer = "white";playerChange();}
  updateDisplay();
  return;
 }
 currentPlayer = currentPlayer === "black" ? "white" : "black";
}
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function hantei(){
  if (undoHistory.length < MAXTEKAZU)return;
  await showEffectText(MAXTEKAZU+"てうっても\nしょうぶが\nつかないので\nはんていするよ", 3000);
  let blackCount=0;
  let whiteCount=0;
  for (let y = 0; y < SIZE; y++) {
   for (let x = 0; x < SIZE; x++) {
    if(board[y][x]==="black")blackCount++;
    if(board[y][x]==="white")whiteCount++;
   }
  }
  await showEffectText("くろが"+blackCount+"ひき\nしろが"+whiteCount+"ひき\nねこがいるので", 3000);
  syouhai(blackCount>whiteCount);
}
async function syouhai(isBlackWin){
 while (turnDisplay.firstChild) turnDisplay.removeChild(turnDisplay.firstChild);
 const winImg = document.createElement("img");
 winImg.src = isBlackWin ? kurokingImg.src : sirokingImg.src;
 winImg.alt = isBlackWin ? "くろのかち！" : "しろのかち！";
 winImg.style.height = "50px";
 winImg.style.verticalAlign = "middle";
 turnDisplay.appendChild(winImg);
 turnDisplay.appendChild(winText);
 winMessage = isBlackWin ? "くろのかち！" : "しろのかち！";
 await showEffectText(winMessage, 3000);
 document.getElementById("mainControls").style.display = "none";
 document.getElementById("saigoControls").style.display = "block";
 gameNow=false;
}
document.getElementById("undoBtn").addEventListener("click", () => {
  if (undoHistory.length === 0) {
    turnDisplay.removeChild(turnDisplay.lastChild);
    turnDisplay.appendChild(document.createTextNode("まったはできないよ"));
    return;
  }

  const lastState = undoHistory.pop();
  board = lastState.board.map(row => [...row]);
  drawBoard = lastState.drawBoard.map(row => [...row]);
  currentPlayer = lastState.currentPlayer;
  blackKing = lastState.blackKing ? { ...lastState.blackKing } : null;
  whiteKing = lastState.whiteKing ? { ...lastState.whiteKing } : null;
  blackTame = lastState.blackTame;
  whiteTame = lastState.whiteTame;
  koBlack = lastState.koBlack ? [...lastState.koBlack] : null;
  koWhite = lastState.koWhite ? [...lastState.koWhite] : null;
  koPoint = lastState.koPoint ? [...lastState.koPoint] : null;
  prevKoPoint = lastState.prevKoPoint ? [...lastState.prevKoPoint] : null;
  nitesu = lastState.nitesu;
  blackYasumi = lastState.blackYasumi;
  whiteYasumi = lastState.whiteYasumi;

  updateForbiddenPoints();
  updateDisplay();
  draw();
});

