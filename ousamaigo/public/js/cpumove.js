let blackCount = 0;
let whiteCount = 0;
async function aiMove() {
 updateForbiddenPoints();
 updateDisplay();
 draw();
 if (currentPlayer === "white" || !gameNow) return;
await delay(300);
const center = (SIZE - 1) / 2;
// 白石を取れる場所があれば、最優先で取る
// 天元から外側へ向かって調べる
for (let d = 0; d < center+0.7; d++) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {

    if (board[y][x] !== null) continue;
    if (Math.max(Math.abs(x - center),Math.abs(y - center)) > d) continue;

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
}
// ========================================
// パワーが4以上ならリバース
// ========================================
if (blackTame >= 4) {
  const su = Math.floor(blackTame / 2) - 1;
for (let d = 0; d < center+0.7; d++) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (board[y][x] !== null) continue;
      if (Math.max(Math.abs(x - center),Math.abs(y - center)) > d) continue;
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

async function ban4ro() {//４路盤
 const tengen=2;
     const candidates = [];      
for(let i=1; i<=tengen; i++){
  for (let y = tengen-i; y < tengen+i; y++) {
    for (let x = tengen-i; x < tengen+i; x++) {
      if (uteruka(x, y) &&
        !(x === 0 && y === 0) &&
        !(x === 0 && y === 3) &&
        !(x === 3 && y === 0) &&
        !(x === 3 && y === 3)
      ) {
        candidates.push({ x, y });
      }
    }
  }

  if (candidates.length > 0) {
    const i = Math.floor(Math.random() * candidates.length);
    const { x, y } = candidates.splice(i, 1)[0];
    await placeStone(x, y);
    return;
  }
}
 aiTame();
}
async function ban6ro() {//６路盤
 const tengen=3;
 const candidates = [];
 for(let x=2; x<=tengen; x++){
  for(let y=2; y<=tengen; y++){
   if (uteruka(x, y)) {
     await placeStone(x, y);
     return;
   }
  }
 }//中央４マスここまで
 for (let y = 1; y < 5; y++) {
   for (let x = 1; x < 5; x++) {
    if (!uteruka(x, y)) continue;
    countAround(x, y);
    if (blackCount === 1 && whiteCount === 1) {
      candidates.push({ x, y });
    }
   }
 }
if (candidates.length === 0) {
 for (let y = 1; y < 5; y++) {
    for (let x = 1; x < 5; x++) {
     if (!uteruka(x, y)) continue;
     countAround(x, y);
     if (blackCount === 1 && whiteCount === 2) {
       candidates.push({ x, y });
     }
     if (blackCount === 2 && whiteCount === 1) {
       candidates.push({ x, y });
     }
     if (blackCount === 2 && whiteCount === 2) {
       candidates.push({ x, y });
     }
     if (blackCount === 2 && whiteCount === 3) {
       candidates.push({ x, y });
     }

    }
  }
 }
if (candidates.length === 0) {
 for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 6; x++) {
     if (!uteruka(x, y)) continue;
     if (hencountAround(x, y)) {
       candidates.push({ x, y });
     }
    }
  }
 }

 if (candidates.length > 0) {
   const i = Math.floor(Math.random() * candidates.length);
   const { x, y } = candidates.splice(i, 1)[0];
   await placeStone(x, y);
   return;
 }
 aiTame();
}

async function ban5ro() {//奇数路盤
 const tengen=Math.floor(SIZE / 2);
     const candidates = [];      
     for(let i=1;i<tengen;i++){//１：１調べる
        for (let y = tengen-i; y <= tengen+i; y++) {
          for (let x = tengen-i; x <= tengen+i; x++) {
            if (uteruka(x,y)) {if(x===tengen||y===tengen){
              if (!uteruka(x, y)) continue;
              countAround(x, y);
              if (blackCount === 1 && whiteCount === 1) {
               candidates.push({ x, y });
             }
            }}
          }
        }
      if(candidates.length===0){
        for (let y = tengen-i; y <= tengen+i; y++) {
          for (let x = tengen-i; x <= tengen+i; x++) {
            if (!uteruka(x, y)) continue;
              countAround(x, y);
              if (blackCount === 1 && whiteCount === 1) {
               candidates.push({ x, y });
             }
          }
        }
       }
        if(candidates.length>0){
          const i = Math.floor(Math.random() * candidates.length);
          const { x, y } = candidates.splice(i, 1)[0];
          await placeStone(x, y);
          return;
        }
      }//next i
     for(let i=1;i<tengen;i++){//０調べる
        for (let y = tengen-i; y <= tengen+i; y++) {
          for (let x = tengen-i; x <= tengen+i; x++) {
            if (!uteruka(x, y)) continue;
              countAround(x, y);
              if (blackCount === 0 && whiteCount === 0) {
               candidates.push({ x, y });
             }
          }
        }
        if(candidates.length>0){
          const i = Math.floor(Math.random() * candidates.length);
          const { x, y } = candidates.splice(i, 1)[0];
          await placeStone(x, y);
          return;
        }
      }//next i

      for(let i=1;i<tengen;i++){//２調べる
       for (let y = tengen-i; y <= tengen+i; y++) {
        for (let x = tengen-i; x <= tengen+i; x++) {
         if (!uteruka(x, y)) continue;
         countAround(x, y);
         if (blackCount === 1 && whiteCount === 2) {
          candidates.push({ x, y });
         }
         if (blackCount === 2 && whiteCount === 1) {
          candidates.push({ x, y });
         }
         if (blackCount === 2 && whiteCount === 2) {
          candidates.push({ x, y });
         }
        }
       }       
      }//next i
/*
 if (candidates.length === 0) {
  for(let i=1;i<tengen;i++){//３調べる
       for (let y = tengen-i; y <= tengen+i; y++) {
        for (let x = tengen-i; x <= tengen+i; x++) {
         if (!uteruka(x, y)) continue;
         countAround(x, y);
         if (blackCount === 2 && whiteCount === 3) {
          candidates.push({ x, y });
         }
         if (blackCount === 3 && whiteCount === 2) {
          candidates.push({ x, y });
         }
         if (blackCount === 3 && whiteCount === 3) {
          candidates.push({ x, y });
         }
        }
       }       
      }//next i
  }
*/
if (candidates.length === 0) {
 for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
     if (!uteruka(x, y)) continue;
     if (hencountAround(x, y)) {
       candidates.push({ x, y });
     }
    }
  }
 }

   if(candidates.length>0){
     const i = Math.floor(Math.random() * candidates.length);
     const { x, y } = candidates.splice(i, 1)[0];
     await placeStone(x, y);
     return;
    }
 aiTame();
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
function hencountAround(x, y) {

  // 第一線でなければ対象外
  if (
    x !== 0 && x !== SIZE - 1 &&
    y !== 0 && y !== SIZE - 1
  ) {
    return false;
  }
// １の１も対象外
  if (x === 0 && y === 0) {return false;}
  if (x === 0 && y === SIZE - 1) {return false;}
  if (x === SIZE - 1 && y === 0) {return false;}
  if (x === SIZE - 1 && y === SIZE - 1) {return false;}

  let secondX = x;
  let secondY = y;

  // 第二線の座標
  if (x === 0) secondX = 1;
  if (x === SIZE - 1) secondX = SIZE - 2;
  if (y === 0) secondY = 1;
  if (y === SIZE - 1) secondY = SIZE - 2;

  // 自分の一つ上（盤の内側）の石が黒
  if (board[secondY][secondX] !== "black") {
    return false;
  }

  let whiteCount = 0;
  let blackCount = 0;

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

      if (board[ny][nx] === "black") {
        blackCount++;
      }
    }
  }

  // 白の方が多ければ打つ
  return whiteCount >= blackCount;
}
