async function placeStone(x, y, fromNetwork = false, changeTurn = true){
  if (board[y][x] !== null) return false;
  if (gameMode === "main") {saveState();}

  board[y][x] = currentPlayer;

  if (!blackKing && currentPlayer === "black") blackKing = { x, y };
  if (!whiteKing && currentPlayer === "white") whiteKing = { x, y };

 if (gameMode === "pawa") {
if (ISNET && fromNetwork)console.log("受信パワー", roomId, x, y);
  let extraStone = null;
  let singleCaptureCount = 0;
  for (let [nx, ny] of getNeighbors(x, y)) {
    const target = board[ny][nx];
    if (target && target !== currentPlayer) {
        const pos = removeDead(nx, ny, target);
        if (pos) {
            singleCaptureCount++;
            extraStone = pos;
        }
    }
  }
 if (singleCaptureCount === 1) {
    const [rx, ry] = extraStone;
    board[ry][rx] = currentPlayer;
 }
}

  if (!hasLiberties(x, y, currentPlayer, {})) {
    board[y][x] = null;
    return false;
  }

  const enemy = currentPlayer === "black" ? "white" : "black";

  for (const [nx, ny] of getNeighbors(x, y)) {
    if (board[ny][nx] === enemy) {
        removeDead(nx, ny, enemy);
    }
}

  if (!gameNow) return false;

if (gameMode === "main") {
    if (ISNET && !fromNetwork) {
console.log("送信", roomId, x, y);
        socket.emit("putStone", {
            roomId,
            x,
            y
        });
    }
    if (changeTurn) {
        playerChange();
    }
}
if (gameMode === "pawa") {
    if (ISNET && !fromNetwork) {
console.log("ぱわ送信", roomId, x, y);
        socket.emit("pawa", {
            roomId,
            x,
            y
        });
    }
    await showEffectText("パワーうち\nはつどう！", 1500);
    if (changeTurn) {
        playerChange();
    }
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
if (ISNET && currentPlayer !== myColor) {
  uemsg="あいてのばんだよ";
return;
}
  if (!gameNow) return;
  const rect = canvas.getBoundingClientRect();
  const point = getClosest(e.clientX - rect.left, e.clientY - rect.top);

if (point && gameMode === "main") {
    if (!placeStone(point.x, point.y,false)) {
        turnDisplay.removeChild(turnDisplay.lastChild);
        turnDisplay.appendChild(document.createTextNode(uemsg));
    } 
}
 if (!ISNET)uemsg="はそこにはうてないよ";
 if (ISNET && currentPlayer === myColor)uemsg="はそこにはうてないよ";


  if (point && gameMode === "pawa" &&
     (drawBoard[point.y][point.x] === "kouho_black" || drawBoard[point.y][point.x] === "kouho_white")
  ) {
    saveState();
    pawatorisu=0;
    placeStone(point.x, point.y,false,false);
    draw();
    if (currentPlayer === "black") blackTame = blackTame - 1;
    if (currentPlayer === "white") whiteTame = whiteTame - 1;

    gameMode = "main";
    playerChange();
    updateDisplay();

  }

  if (point &&gameMode === "osero" &&
    (drawBoard[point.y][point.x] === "kouho_black" || drawBoard[point.y][point.x] === "kouho_white")
  ) {
    saveState();


if (ISNET) {
socket.emit("reverse", {
  roomId,
  x: point.x,
  y: point.y,
  color: currentPlayer
});
}
    await showEffectText("リバース\nはつどう！", 1500);
    board[point.y][point.x] = currentPlayer;
    oseroGaesi(point.x, point.y);
//リバースした後、リバースした側のプレイヤーの石が取り上げられないか調べる。
    currentPlayer = currentPlayer === "black" ? "white" : "black";
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (board[y][x] === currentPlayer) {
          board[y][x] = null;
          placeStone(x, y,false,false);
        }
      }
    }
    currentPlayer = currentPlayer === "black" ? "white" : "black";
    if (currentPlayer === "black") {
     blackTame = blackTame - 2 - kaesisu * 2;
    }
    if (currentPlayer === "white") {
     whiteTame = whiteTame - 2 - kaesisu * 2;
    }
    gameMode = "main";
    playerChange();
    updateDisplay();
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

passBtn.addEventListener("click", () => {
    passMove();
});
async function passMove(fromNetwork = false) {
console.log("passMove実行", {
  ISNET,
  fromNetwork,
  roomId
});

  if (!blackKing || !whiteKing) {
    uemsg="１てめはためれないよ";
    turnDisplay.removeChild(turnDisplay.lastChild);
    turnDisplay.appendChild(document.createTextNode(uemsg));
    return;
  }
　saveState();
  if (currentPlayer === "black") blackTame++;
  else whiteTame++;
    if (ISNET && !fromNetwork) {
console.log("ためる送信", roomId);
        socket.emit("tameru", {
            roomId
        });
    }
  await showEffectText("きあいを\nためるよ！", 1000);
  playerChange();
  updateForbiddenPoints();
  updateDisplay();
  draw();
}



resetBtn.addEventListener("click", async function () {
 syouhai("こうさんで",currentPlayer === "white");
 });
resetBtn2.addEventListener("click", async function () {
 document.getElementById("effectText").style.display = "none";
 initBoard()});

document.getElementById("cancelBtn").addEventListener("click", function () {
    document.getElementById("confirmControls").style.display = "none";
    document.getElementById("mainControls").style.display = "block";
    updateForbiddenPoints();
    draw();
    gameMode="main";
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
function playerChange(){
 if(currentPlayer === "black"){
  currentPlayer =  "white";
  blackTime=blackTime+10000;
 }else{
  currentPlayer =  "black";
  whiteTime=whiteTime+10000;
 }
if(ISNET){
  document.getElementById("mainControls").style.display = "block";
 if(myColor===currentPlayer){uemsg="じぶんのばんだよ";
 }else{
  document.getElementById("mainControls").style.display = "none";
uemsg="あいてのばんだよ";
 }
}else{
　uemsg="のばんだよ";
}

}
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function hantei(){
//console.log=MAXTEKAZU;
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
  //await showEffectText( 3000);
  syouhai("くろが"+blackCount+"ひき\nしろが"+whiteCount+"ひき\nねこがいるので",blackCount>whiteCount);
}
async function syouhai(maetext,isBlackWin){
 while (turnDisplay.firstChild) turnDisplay.removeChild(turnDisplay.firstChild);
 const winImg = document.createElement("img");

 winImg.src = isBlackWin ? kurokingImg.src : sirokingImg.src;
 winImg.alt = isBlackWin ? "くろのかち！" : "しろのかち！";
 winImg.style.height = "50px";
 winImg.style.verticalAlign = "middle";
 turnDisplay.appendChild(winImg);
 turnDisplay.appendChild(winText);
if(ISNET){
  if(myColor==="black"){
  winMessage = isBlackWin ? "きみのかち！" : "きみのまけ";
 }else{
  winMessage = isBlackWin ? "きみのまけ" : "きみのかち！";

 }
}else{
 winMessage = isBlackWin ? "くろのかち！" : "しろのかち！";
}
  const effectDiv = document.getElementById("effectText");
  effectDiv.textContent = maetext+"\n"+winMessage;
  effectDiv.style.display = "block";
 effectDiv.style.opacity = "0.7";

 document.getElementById("mainControls").style.display = "none";
 document.getElementById("saigoControls").style.display = "block";
 gameNow=false;
}

function saveState() {
  undoHistory.push({
    board: board.map(row => [...row]),
    drawBoard: drawBoard.map(row => [...row]),
    currentPlayer,
    blackKing: blackKing ? { ...blackKing } : null,
    whiteKing: whiteKing ? { ...whiteKing } : null,
    blackTame,
    whiteTame
  });
}
setInterval(() => {
 if(!MAJI)return;
 if(!gameNow)return;
    if (currentPlayer === "black") {
   blackTime -= 100;
 } else {
   whiteTime -= 100;
 }
 blackTimeLibsDisplay.textContent = Math.ceil(blackTime / 100);
 whiteTimeLibsDisplay.textContent = Math.ceil(whiteTime / 100);
    if (blackTime <= 0) {
         syouhai("じかんぎれで",false);
    }
    if (whiteTime <= 0) {
         syouhai("じかんぎれで",true);
    }
}, 100);


if (ISNET) {
    socket.on("putStone", data => {
        console.log("受信", data);
        placeStone(data.x, data.y,true);
socket.emit("ack", {
    messageId: data.messageId
});
    });
    socket.on("pawa", async data=>{
        console.log("ぱわ受信", data);
    if (currentPlayer === "black") blackTame = blackTame - 1;
    if (currentPlayer === "white") whiteTame = whiteTame - 1;
	gameMode="pawa";
        placeStone(data.x, data.y,true);
socket.emit("ack", {
    messageId: data.messageId
});
    });
    socket.on("tameru", data => {
        console.log("受信", data);
        passMove(true);
socket.emit("ack", {
    messageId: data.messageId
});
    });
socket.on("reverse", async data=>{
    await showEffectText("リバース\nはつどう！", 1500);
   board[data.y][data.x] = data.color;
   oseroGaesi(data.x,data.y);
    if (currentPlayer === "black") {
     blackTame = blackTame - 2 - kaesisu * 2;
    }
    if (currentPlayer === "white") {
     whiteTame = whiteTame - 2 - kaesisu * 2;
    }
   gameMode = "main";
   playerChange();
   updateForbiddenPoints();
   updateDisplay();
   draw();
socket.emit("ack", {
    messageId: data.messageId
});
});

socket.on("timeSync", data => {
    blackTime = data.blackTime;
    whiteTime = data.whiteTime;
    currentPlayer = data.turn;

    blackTimeLibsDisplay.textContent = Math.ceil(blackTime / 100);
    whiteTimeLibsDisplay.textContent = Math.ceil(whiteTime / 100);
});

}

if(!MAJI){
undoBtn.addEventListener("click", () => {
  if (undoHistory.length === 0) {
    uemsg="まったはできないよ";
    turnDisplay.removeChild(turnDisplay.lastChild);
    turnDisplay.appendChild(document.createTextNode(uemsg));
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
  updateForbiddenPoints();
  updateDisplay();
  draw();
});
}

