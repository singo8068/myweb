async function placeStone(
  x,
  y,
  fromNetwork = false,
  changeTurn = true,
  stoneColor = currentPlayer
) {
  if (board[y][x] !== null) return false;

  if (
    gameMode === "main" &&
    !hasLiberties(x, y, stoneColor, {})
  ) {
    uemsg = "はそこにはうてないよ";
    return false;
  }

  board[y][x] = stoneColor;

  if (!blackKing && stoneColor === "black") {
    blackKing = { x, y };
  }

  if (!whiteKing && stoneColor === "white") {
    whiteKing = { x, y };
  }

  // =========================
  // パワーうち
  // =========================
  if (gameMode === "pawa") {

    let extraStone = null;
    let singleCaptureCount = 0;

    for (let [nx, ny] of getNeighbors(x, y)) {

      const target = board[ny][nx];

      if (target && target !== stoneColor) {

        const pos = removeDead(nx, ny, target);

        if (pos) {
          singleCaptureCount++;
          extraStone = pos;
        }
      }
    }

    // 1個だけ取った場合は、取った場所にも置く
    if (singleCaptureCount === 1) {
      const [rx, ry] = extraStone;
      board[ry][rx] = stoneColor;
    }
  }

  // =========================
  // 自殺手チェック
  // =========================
  if (!hasLiberties(x, y, stoneColor, {})) {
    board[y][x] = null;
    return false;
  }

  const enemy =
    stoneColor === "black" ? "white" : "black";

  // =========================
  // 通常の石取り
  // =========================
  for (const [nx, ny] of getNeighbors(x, y)) {

    if (board[ny][nx] === enemy) {
      removeDead(nx, ny, enemy);
    }
  }

  if (!gameNow && !fromNetwork) return false;
    if (changeTurn && !ISNET) {
      playerChange();
    }

  // =========================
  // 状態保存
  // =========================
  saveState();



  // =========================
  // パワー送信
  // =========================
  if (gameMode === "pawa") {

    if (!fromNetwork) {
      await showEffectText("パワーうち\nはつどう！", 1500);
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
    console.log("クリック判定", {
        ISNET,
        currentPlayer,
        myColor,
        gameNow,
        gameMode
    });

  if (!gameNow) return;
  const rect = canvas.getBoundingClientRect();
  const point = getClosest(e.clientX - rect.left, e.clientY - rect.top);

if (point && gameMode === "main") {
    if (!placeStone(point.x, point.y,false)) {
        turnDisplay.removeChild(turnDisplay.lastChild);
        turnDisplay.appendChild(document.createTextNode(uemsg));
    } 
}



  if (point && gameMode === "pawa" &&
     (drawBoard[point.y][point.x] === "kouho_black" || drawBoard[point.y][point.x] === "kouho_white")
  ) {
pawatorisu = 0;

await placeStone(point.x, point.y, false, false);

draw();

if (currentPlayer === "black") blackTame = blackTame - 1;
if (currentPlayer === "white") whiteTame = whiteTame - 1;

gameMode = "main";

if (!ISNET) {
    playerChange();
}

updateDisplay();
  }

if (point && gameMode === "osero" &&
    (drawBoard[point.y][point.x] === "kouho_black" ||
     drawBoard[point.y][point.x] === "kouho_white")
) {

    const reverseColor = currentPlayer;

    await showEffectText("リバース\nはつどう！", 1500);

    board[point.y][point.x] = reverseColor;
    oseroGaesi(point.x, point.y, reverseColor);

    if (reverseColor === "black") {
        blackTame = blackTame - 2 - kaesisu * 2;
    } else {
        whiteTame = whiteTame - 2 - kaesisu * 2;
    }

    gameMode = "main";

    // リバース後の状態を保存
    saveState();

    playerChange();
    updateForbiddenPoints();
    updateDisplay();
    draw();
}
});

function tekingka(x, y, playerColor = currentPlayer) {
    if (playerColor === "black") {
        if (x === whiteKing.x && y === whiteKing.y) return true;
    } else {
        if (x === blackKing.x && y === blackKing.y) return true;
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
        uemsg = "１てめはためれないよ";
        turnDisplay.removeChild(turnDisplay.lastChild);
        turnDisplay.appendChild(document.createTextNode(uemsg));
        return;
    }

    const passColor = currentPlayer;

    if (passColor === "black") {
        blackTame++;
    } else {
        whiteTame++;
    }


    await showEffectText("パワーを\nためるよ！", 1000);
    // 手番変更
    playerChange();

    // 手番変更後の状態を保存
    saveState();
    updateForbiddenPoints();
    updateDisplay();
    draw();
}


resetBtn.addEventListener("click", async function () {
    if (ISNET) {
        console.log("こうさん送信", roomId);
        socket.emit("kousan", {
    roomId,
    color: currentPlayer,
 gameState: undoHistory[undoHistory.length - 1]
        });
    }
 syouhai(
    "こうさんで",
    currentPlayer === "white",
    true,
    "kousan"
);
 });
resetBtn2.addEventListener("click", async function () {
 document.getElementById("effectText").style.display = "none";
 initBoard();
aiMove()
});

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
gameNow = true;
}

function playerChange(addByoyomi = true) {
    if (currentPlayer === "black") {
        currentPlayer = "white";
        if (addByoyomi) blackTime += 10000;

    } else {
      currentPlayer = "black";
      if (addByoyomi) whiteTime += 10000;
      //CPUは黒番
      aiMove();
      updateForbiddenPoints();
      updateDisplay();
      draw();
document.getElementById("mainControls").style.display = "block";
    }
}

async function aiMove() {
    updateForbiddenPoints();
    updateDisplay();
    draw();
     if (currentPlayer === "white" || !gameNow) return;
     const tengen=Math.floor(SIZE / 2);
     if (uteruka(tengen,tengen)){placeStone(tengen,tengen);return;}
     const candidates = [];

      
     for(let i=1;i<=tengen;i++){
      if (SIZE % 2 === 0) {
        for (let y = tengen-i; y < tengen+i; y++) {
          for (let x = tengen-i; x < tengen+i; x++) {
            if (uteruka(x,y)) {
              candidates.push({ x, y });
            }
          }
        }
       }else{//奇数の場合
        for (let y = tengen-i; y <= tengen+i; y++) {
          for (let x = tengen-i; x <= tengen+i; x++) {
            if (uteruka(x,y)) {if(x===tengen||y===tengen){
              candidates.push({ x, y });
            }}
          }
        }
      if(candidates.length===0){
        for (let y = tengen-i; y <= tengen+i; y++) {
          for (let x = tengen-i; x <= tengen+i; x++) {
            if (uteruka(x,y)) {
              candidates.push({ x, y });
            }
          }
        }
       }
      }//奇数終わり

        if(candidates.length>0){
          const i = Math.floor(Math.random() * candidates.length);
          const { x, y } = candidates.splice(i, 1)[0];
          placeStone(x, y);
          return;
        }
      }//next i
        blackTame++;
 await showEffectText("パワーを\nためるよ！", 1000);
playerChange();

}


function uteruka(x,y){
   if (board[y][x] === null&&drawBoard[y][x] === null)return true;
   return false;
}



function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function hantei(){
//console.log=MAXTEKAZU;
  if (undoHistory.length < MAXTEKAZU)return;
  MAXTEKAZU=MAXTEKAZU-1;
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
  syouhai(
    "くろが"+blackCount+"ひき\nしろが"+whiteCount+"ひき\nねこがいるので",
    blackCount > whiteCount,
    true,
    "hantei"
);
}


async function syouhai(maetext, isBlackWin, sendGameEnd = true, reason = "other") {

    while (turnDisplay.firstChild) {
        turnDisplay.removeChild(turnDisplay.lastChild);
    }

    const winImg = document.createElement("img");

    winImg.src = isBlackWin ? kurokingImg.src : sirokingImg.src;
    winImg.alt = isBlackWin ? "くろのかち！" : "しろのかち！";
    winImg.style.height = "50px";
    winImg.style.verticalAlign = "middle";

    turnDisplay.appendChild(winImg);
    turnDisplay.appendChild(winText);

    if (ISNET) {

        if (myColor === "black") {
            winMessage =
                isBlackWin
                    ? "きみのかち！"
                    : "きみのまけ";
        } else {
            winMessage =
                isBlackWin
                    ? "きみのまけ"
                    : "きみのかち！";
        }

    } else {

        winMessage =
            isBlackWin
                ? "くろのかち！"
                : "しろのかち！";
    }

    const effectDiv =
        document.getElementById("effectText");

    effectDiv.textContent =
        maetext + "\n" + winMessage;

    effectDiv.style.display = "block";
    effectDiv.style.opacity = "0.7";

    document.getElementById("mainControls").style.display = "none";

    if (ISNET) {
        backMati.style.display = "block";
    } else {
        document.getElementById("saigoControls").style.display = "block";
    }

    gameNow = false;
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
    syouhai(
        "じかんぎれで",
        false,
        true,
        "time"
    );
}

if (whiteTime <= 0) {
    syouhai(
        "じかんぎれで",
        true,
        true,
        "time"
    );
}
}, 100);

if(!MAJI){
undoBtn.addEventListener("click", () => {

    // 初期状態しかない場合は、まったできない
    if (undoHistory.length <= 2) {
        uemsg = "まったはできないよ";
        turnDisplay.removeChild(turnDisplay.lastChild);
        turnDisplay.appendChild(document.createTextNode(uemsg));
        return;
    }

    // 現在の状態を捨てる
    undoHistory.pop();
    undoHistory.pop();
    // 2手前の状態を取得
    const lastState = undoHistory[undoHistory.length - 2];

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


function saveState() {
//if (undoHistory.length<1) {aiMove();}
    undoHistory.push({
        board: board.map(row => [...row]),
        drawBoard: drawBoard.map(row => [...row]),
        currentPlayer: currentPlayer,
        blackKing: blackKing ? { ...blackKing } : null,
        whiteKing: whiteKing ? { ...whiteKing } : null,
        blackTame: blackTame,
        whiteTame: whiteTame
    });
}

function getGameState() {
    return {
        board: board.map(row => [...row]),
        drawBoard: drawBoard.map(row => [...row]),
        currentPlayer: currentPlayer,
        blackKing: blackKing ? { ...blackKing } : null,
        whiteKing: whiteKing ? { ...whiteKing } : null,
        blackTame: blackTame,
        whiteTame: whiteTame
    };
}

