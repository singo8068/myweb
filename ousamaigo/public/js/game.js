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

    if (ISNET && fromNetwork) {
      console.log("受信パワー", roomId, x, y);
    }

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

  if (!gameNow) return false;
    if (changeTurn && !ISNET) {
      playerChange();
    }

  // =========================
  // 状態保存
  // =========================
  saveState();

  // =========================
  // ネット送信
  // =========================
  if (gameMode === "main") {

    if (ISNET && !fromNetwork) {

      console.log("送信", roomId, x, y);

      socket.emit("putStone", {
        roomId,
        x,
        y,
        color: stoneColor,
        gameState: undoHistory[undoHistory.length - 1]
      });
    }


  }

  // =========================
  // パワー送信
  // =========================
  if (gameMode === "pawa") {

    if (ISNET && !fromNetwork) {

      console.log("ぱわ送信", roomId, x, y);

      socket.emit("pawa", {
        roomId,
        x,
        y,
        color: stoneColor,
        gameState: undoHistory[undoHistory.length - 1]
      });
    }

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
    console.log("クリック判定", {
        ISNET,
        currentPlayer,
        myColor,
        gameNow,
        gameMode
    });
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

    if (ISNET) {
        socket.emit("reverse", {
            roomId,
            x: point.x,
            y: point.y,
            color: reverseColor,
            gameState: undoHistory[undoHistory.length - 1]
        });
    }

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

    if (ISNET && !fromNetwork) {
        console.log("ためる送信", roomId);

        socket.emit("tameru", {
            roomId,
            color: passColor,
            gameState: undoHistory[undoHistory.length - 1]
        });
    }

    await showEffectText("きあいを\nためるよ！", 1000);

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
updateTurnControls();
gameNow = true;
}

function playerChange(addByoyomi = true) {
    if (currentPlayer === "black") {
        currentPlayer = "white";
        if (addByoyomi) blackTime += 10000;
    } else {
        currentPlayer = "black";
        if (addByoyomi) whiteTime += 10000;
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
  syouhai("くろが"+blackCount+"ひき\nしろが"+whiteCount+"ひき\nねこがいるので",blackCount>whiteCount);
}
async function syouhai(maetext,isBlackWin, sendGameEnd = true){
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

 if (ISNET){backMati.style.display = "block";
  }else{
   document.getElementById("saigoControls").style.display = "block";
  }
 gameNow=false;
if (ISNET && sendGameEnd) {
    socket.emit("gameEnd", {
        roomId,
        winner: isBlackWin ? "black" : "white"
    });
}
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

    placeStone(data.x, data.y, true, false, data.color);

updateTurnControls();

    socket.emit("ack", {
        messageId: data.messageId
    });
});

socket.on("pawa", async data => {
    console.log("ぱわ受信", data);

    socket.emit("ack", {
        messageId: data.messageId
    });

    if (data.color === "black") blackTame--;
    if (data.color === "white") whiteTame--;

    gameMode = "pawa";

    placeStone(data.x, data.y, true, false, data.color);
    await showEffectText("パワーうち\nはつどう！", 1500);

    gameMode = "main";

    updateForbiddenPoints();
    updateDisplay();
    draw();
});


const receivedMessages = new Set();

socket.on("tameru", async data => {
    console.log("受信ためる", data);

    // 同じメッセージを2回受信しても、2回処理しない
    if (receivedMessages.has(data.messageId)) {
        console.log("ためる：重複受信なので無視", data.messageId);

        // ACKだけは返す
        socket.emit("ack", {
            messageId: data.messageId
        });

        return;
    }

    // このmessageIdは処理済みとして記録
    receivedMessages.add(data.messageId);

    // 受信確認を返す
    socket.emit("ack", {
        messageId: data.messageId
    });



    if (data.color === "black") {
        blackTame++;
    } else {
        whiteTame++;
    }
    await showEffectText("きあいを\nためるよ！", 1000);

    updateForbiddenPoints();
    updateDisplay();
    draw();
    saveState();
});



socket.on("reverse", async data => {

    socket.emit("ack", {
        messageId: data.messageId
    });
    await showEffectText("リバース\nはつどう！", 1500);

    board[data.y][data.x] = data.color;
    oseroGaesi(data.x, data.y, data.color);

    if (data.color === "black") {
        blackTame = blackTame - 2 - kaesisu * 2;
    } else {
        whiteTame = whiteTame - 2 - kaesisu * 2;
    }

    gameMode = "main";

    // ネット対戦では手番を変更しない
    // timeSyncのdata.turnを正とする

    updateForbiddenPoints();
    updateDisplay();
    draw();
saveState();
});
socket.on("kousan", async data => {
    console.log("受信こうさん", data);
 syouhai("こうさんで",currentPlayer === "white", false);
});
socket.on("gameEnd", async data => {

    console.log("サーバーからgameEnd受信", data);

    // =========================
    // 結果表示
    // =========================

    if (gameNow) {

        await syouhai(
            data.reason || "しょうぶがおわったよ",
            data.winner === "black",
            false
        );
    }
// =========================
// 会員のレベル・勝ち越し表示
// =========================

if (data.member && typeof levelInfo !== "undefined") {

    // 対戦開始前の実際の勝ち越し
    // startPlayer() で -1 されているので +1
    const beforeWinDiff = data.oldWinDiff + 1;

    // 自分が勝ったか
    const myWon =
        data.winner === myColor;

    // 対戦による実際の勝ち越し変動
    const gameDiff = myWon ? 1 : -1;

    const diffText =
        gameDiff > 0
            ? `＋${gameDiff}`
            : `${gameDiff}`;

    console.log("自分の最終結果", {
        winner: data.winner,
        myColor,
        myWon,
        oldLevel: data.oldLevel,
        oldWinDiff: data.oldWinDiff,
        beforeWinDiff,
        level: data.level,
        winDiff: data.winDiff,
        gameDiff
    });

    levelInfo.innerHTML =
        `レベル${data.oldLevel}　` +
        `かちこし${beforeWinDiff} ` +
        `${diffText}`;

    if (data.level > data.oldLevel) {

        levelInfo.innerHTML +=
            `<br>レベル${data.level}にあがったよ！`;

    } else if (data.level < data.oldLevel) {

        levelInfo.innerHTML +=
            `<br>レベル${data.level}にさがったよ…`;
    }
}
}); 
socket.on("timeSync", data => {
    blackTime = data.blackTime;
    whiteTime = data.whiteTime;
    currentPlayer = data.turn;

    updateTurnControls();

    blackTimeLibsDisplay.textContent = Math.ceil(blackTime / 100);
    whiteTimeLibsDisplay.textContent = Math.ceil(whiteTime / 100);
});
socket.on("restoreGame", data => {

    const state = data.gameState;

    board = state.board.map(row => [...row]);
    drawBoard = state.drawBoard.map(row => [...row]);

    // サーバーの手番を正とする
    currentPlayer = data.turn;

    blackKing = state.blackKing
        ? { ...state.blackKing }
        : null;

    whiteKing = state.whiteKing
        ? { ...state.whiteKing }
        : null;

    blackTame = state.blackTame;
    whiteTame = state.whiteTame;

    blackTime = data.blackTime;
    whiteTime = data.whiteTime;

    // ★これを追加
    updateTurnControls();

    updateForbiddenPoints();
    updateDisplay();
    draw();
});
}

if(!MAJI){
undoBtn.addEventListener("click", () => {

    // 初期状態しかない場合は、まったできない
    if (undoHistory.length <= 1) {
        uemsg = "まったはできないよ";
        turnDisplay.removeChild(turnDisplay.lastChild);
        turnDisplay.appendChild(document.createTextNode(uemsg));
        return;
    }

    // 現在の状態を捨てる
    undoHistory.pop();

    // 1手前の状態を取得
    const lastState = undoHistory[undoHistory.length - 1];

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

