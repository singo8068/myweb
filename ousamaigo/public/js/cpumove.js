let blackCount = 0;
let whiteCount = 0;
async function aiMove() {
if(gameNow === false)return;
 updateForbiddenPoints();
 updateDisplay();

 if (currentPlayer === "white" || !gameNow) return;
await delay(300);
// draw();
if (gameNow === false) return;
if (currentPlayer !== "black") return;

// 白石を取れる場所があれば、最優先で取る
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {

    if (board[y][x] !== null) continue;

    const isForbid =
      drawBoard[y][x] === "forbid_black" ||
      drawBoard[y][x] === "forbid_both";

    // 周囲に、あと1呼吸で取れる白石があるか
    let canCapture = false;

    for (const [nx, ny] of getNeighbors(x, y)) {
      if (
        board[ny][nx] === "white" &&
        countLiberties(nx, ny) === 1
      ) {
        canCapture = true;
        break;
      }
    }
    if (!canCapture) continue;
    // 通常着手できるなら普通に取る
    if (!isForbid) {
      await placeStone(x, y, true);
      return;
    }
    // 着手禁止点でも、黒のパワーがあればパワーうち
    if (blackTame > 0) {
      gameMode = "pawa";
await showEffectText("パワーうち\nはつどう！", 1500);
      await placeStone(x, y, true);
      blackTame--;
      gameMode = "main";
      draw();
      return;
    }
  }
}
// ========================================
// パワーが4以上ならリバース
// ========================================
if (blackTame >= 4) {
 const su = Math.floor(blackTame / 2) - 1;
const center = (SIZE - 1) / 2;
for (let d = 2; d < SIZE; d++) {// 天元から外側へ向かって調べる
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (board[y][x] !== null) continue;
      if (Math.abs(x - center)+Math.abs(y - center) > d) continue;
      if (oseroCheck(x, y, su) === "kouho_black") {
        const reverseColor = "black";
        await showEffectText("リバース\nはつどう！", 1500);
        board[y][x] = reverseColor;
        oseroGaesi(x, y, reverseColor);
        blackTame = blackTame - 2 - kaesisu * 2;
        gameMode = "main";
        playerChange();
        saveState();
updateForbiddenPoints();
      updateDisplay();
      draw();
        return;
      }
    }
  }
}
}
 const tengen=Math.floor((SIZE-1) / 2);//天元に打つ
 if (uteruka(tengen,tengen)){await placeStone(tengen,tengen,true);return;}
  if (SIZE === 4) {
    await ban4ro();
    return;
  }
  if (SIZE === 6) {
    await ban6ro();
    return;
  }
 await ban5ro();
}

async function aiTame() {
 blackTame++;
 await showEffectText("パワーを\nためるよ！", 1000);
playerChange();
saveState();
updateForbiddenPoints();
      updateDisplay();
      draw();
}

function countAround(x, y) {
  blackCount = 0;
  whiteCount = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      // 自分自身は除外
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      // 盤外は除外
      if (nx < 0 || nx >= SIZE || ny < 0 || ny >= SIZE) continue;
      if (board[ny][nx] === "black") {
        blackCount++;
      }
      if (board[ny][nx] === "white") {
        whiteCount++;
      }
    }
  }
}
function henhaneAround(x, y) {//上と隣に白が１つで周囲に黒が１つ以上
  // 第一線でなければ対象外
  if ( x !== 0 && x !== SIZE - 1 && y !== 0 && y !== SIZE - 1 ) return false;
// １の１も対象外
  if (x === 0 && y === 0) return false;
  if (x === 0 && y === SIZE - 1) return false;
  if (x === SIZE - 1 && y === 0) return false;
  if (x === SIZE - 1 && y === SIZE - 1) return false;

  let whiteCount = 0;
if(x!==0&&board[y][x-1] === "white")whiteCount++;
if(y!==0&&board[y-1][x] === "white")whiteCount++;
if(x!==SIZE - 1&&board[y][x+1] === "white")whiteCount++;
if(y!==SIZE - 1&&board[y+1][x] === "white")whiteCount++;
if(whiteCount!==1)return false;
  let blackCount = 0;
  // 周囲8マス
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      // 盤外は無視
      if (nx < 0 || nx >= SIZE || ny < 0 || ny >= SIZE) continue;
      if (board[ny][nx] === "black") {
        blackCount++;
      }
    }
  }
  // 黒があれば打つ
  return blackCount >0;
}
function hencountAround(x, y) {//上と隣に黒が１つで周囲に白が１つ以上
  // 第一線でなければ対象外
  if ( x !== 0 && x !== SIZE - 1 && y !== 0 && y !== SIZE - 1 ) return false;
// １の１も対象外
  if (x === 0 && y === 0) return false;
  if (x === 0 && y === SIZE - 1) return false;
  if (x === SIZE - 1 && y === 0) return false;
  if (x === SIZE - 1 && y === SIZE - 1) return false;

  let blackCount = 0;
if(x!==0&&board[y][x-1] === "black")blackCount++;
if(y!==0&&board[y-1][x] === "black")blackCount++;
if(x!==SIZE - 1&&board[y][x+1] === "black")blackCount++;
if(y!==SIZE - 1&&board[y+1][x] === "black")blackCount++;
if(blackCount===0)return false;
  let whiteCount = 0;
  // 周囲8マス
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      // 盤外は無視
      if (nx < 0 || nx >= SIZE || ny < 0 || ny >= SIZE) continue;
      if (board[ny][nx] === "white") {
        whiteCount++;
      }
    }
  }
  // 白があれば打つ
  return whiteCount >0;
}
