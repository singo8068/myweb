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
if (!ISNET)await showEffectText("パワーうち\nはつどう！", 1500);
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
  // 埋めた結果、自分の呼吸点がなくなるなら埋めない
  if (!hasLiberties(rx, ry, stoneColor, {})) {
    board[ry][rx] = null;
  }
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

    if (changeTurn) {
      if (!ISNET) {
        playerChange();
      }
    }
  }

  updateForbiddenPoints();
  updateDisplay();
  draw();

  return true;
}

function updateTurnControls() {
    if (!ISNET) {
        document.getElementById("mainControls").style.display = "block";
        uemsg = "のばんだよ";
        return;
    }

    if (myColor === currentPlayer) {
        document.getElementById("mainControls").style.display = "block";
        uemsg = "じぶんのばんだよ";
    } else {
        document.getElementById("mainControls").style.display = "none";
        uemsg = "あいてのばんだよ";
    }

    while (turnDisplay.firstChild) {
        turnDisplay.removeChild(turnDisplay.lastChild);
    }

    // 今の手番の王様ねこを表示
    const turnImg = document.createElement("img");

    turnImg.src =
        currentPlayer === "black"
            ? kurokingImg.src
            : sirokingImg.src;

    turnImg.alt =
        currentPlayer === "black"
            ? "くろ"
            : "しろ";

    turnImg.style.height = "50px";
    turnImg.style.verticalAlign = "middle";

    turnDisplay.appendChild(turnImg);
    turnDisplay.appendChild(document.createTextNode(uemsg));

}

function uteruka(x, y) {
  if (board[y][x] === null && drawBoard[y][x] === null) return true;
  return false;
}

canvas.addEventListener("click", async (e) => {

  if (!gameNow) return;
  const rect = canvas.getBoundingClientRect();
  const point = getClosest(e.clientX - rect.left, e.clientY - rect.top);
  if (point.x!==akax) return;
  if (point.y!==akay) return;

if (point && gameMode === "main") {
    if (!placeStone(point.x, point.y,false)) {
        turnDisplay.removeChild(turnDisplay.lastChild);
        turnDisplay.appendChild(document.createTextNode(uemsg));
    } 
}
  if (point && gameMode === "pawa" &&
     (drawBoard[point.y][point.x] === "kouho_black" || drawBoard[point.y][point.x] === "kouho_white")
  ) {
    pawatorisu=0;
    placeStone(point.x, point.y,false,false);
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

    // ネット対戦では playerChange() しない
    if (!ISNET) {
        playerChange();
    }

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
  if (!enTa) return;
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

    // 手番変更
    if (!ISNET) {
        playerChange();
    } else {
        currentPlayer =
            currentPlayer === "black"
                ? "white"
                : "black";

        updateTurnControls();
    }

    // 手番変更後の状態を保存
    saveState();

    await showEffectText("パワーを\nためるよ！", 1000);
　
    updateForbiddenPoints();
    updateDisplay();
    draw();
}


resetBtn.addEventListener("click", async function () {
  if (!enKo) return;
 syouhai(
    "こうさんで",
    currentPlayer === "white",
    true,
    "kousan"
);
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
updateTurnControls();
gameNow = true;
}

function playerChange(addByoyomi = true) {
    if (currentPlayer === "black") {
        currentPlayer = "white";
        if (addByoyomi&&SIZE===9) blackTime += 10000;
        if (addByoyomi&&SIZE===11) blackTime += 15000;
    } else {
        currentPlayer = "black";
        if (addByoyomi&&SIZE===9) whiteTime += 10000;
        if (addByoyomi&&SIZE===11) whiteTime += 15000;
    }

    updateTurnControls();
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

    // =========================
    // ゲーム終了をサーバーへ送信
    // =========================

    if (ISNET && sendGameEnd) {

        socket.emit("gameEnd", {

            roomId,

            winner:
                isBlackWin
                    ? "black"
                    : "white",

            reason,

            gameState:
                getGameState(),

            blackTime,
            whiteTime,

            turn: currentPlayer
        });
    }
}

	


function saveState() {
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

