 const tengen=Math.floor(SIZE / 2);
async function tuyosaBetu() {//奇数路盤
   const candidates = [];  
if (countLiberties(tengen, tengen) <= 2) {
  const move = findKingBestLibertyMove();
  if (move) {
    await placeStone(move.x, move.y, false);
    return;
  }
}
     for(let i=1;i<tengen;i++){//１：１調べる
        for (let y = tengen-i; y <= tengen+i; y++) {
          for (let x = tengen-i; x <= tengen+i; x++) {
            if (uteruka(x,y)) {if(x===tengen||y===tengen){
              if (!uteruka(x, y)) continue;
              countAround(x, y);
              if (comCount === 1 && myCount === 1) {
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
              if (comCount === 1 && myCount === 1) {
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
if (countLiberties(tengen, tengen) <= 3) {
  const move = findKingBestLibertyMove();
  if (move) {
    await placeStone(move.x, move.y, false);
    return;
  }
}

     for(let i=1;i<tengen-1;i++){//０調べる
        for (let y = tengen-i; y <= tengen+i; y++) {
          for (let x = tengen-i; x <= tengen+i; x++) {
            if (!uteruka(x, y)) continue;
              countAround(x, y);
              if (comCount === 0 && myCount === 0) {
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
      if (comCount === 1 && myCount === 2)candidates.push({ x, y });
      if (comCount === 2 && myCount === 1)candidates.push({ x, y });
      if (comCount === 2 && myCount === 2)candidates.push({ x, y });
     }
    }
     if(candidates.length>0){
          const i = Math.floor(Math.random() * candidates.length);
          const { x, y } = candidates.splice(i, 1)[0];
          await placeStone(x, y);
          return;
        }
   }//next i
   for(let i=1;i<tengen;i++){//３調べる
    for (let y = tengen-i; y <= tengen+i; y++) {
     for (let x = tengen-i; x <= tengen+i; x++) {
      if (!uteruka(x, y)) continue;
      countAround(x, y);
      if (comCount === 3 && myCount === 2)candidates.push({ x, y });
      if (comCount === 3 && myCount === 1)candidates.push({ x, y });
     }
    }
     if(candidates.length>0){
          const i = Math.floor(Math.random() * candidates.length);
          const { x, y } = candidates.splice(i, 1)[0];
          await placeStone(x, y);
          return;
        }
   }//next i

if (candidates.length === 0) {
 for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
     if (!uteruka(x, y)) continue;
     if (henhaneAround(x, y)) {
       candidates.push({ x, y });
     }
    }
  }
 }
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
function findKingBestLibertyMove() {
  const kingX = tengen;
  const kingY = tengen;
  const before = countLiberties(kingX, kingY);
  let bestMove = null;
  let maxLiberties = before;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (board[y][x] !== null) continue;
      // 黒を仮置き
      board[y][x] = COMCOLOR;
      const liberties = countLiberties(kingX, kingY);
      // 元に戻す
      board[y][x] = null;
      if (liberties > maxLiberties) {
        maxLiberties = liberties;
        bestMove = { x, y };
      }
    }
  }

  return bestMove;
}