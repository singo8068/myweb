async function tuyosaBetu() {
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
async function ban6ro() {//６路盤弱い
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
    if (uteruka(x, y)) candidates.push({ x, y });
   }
 }
if (candidates.length === 0) {
 for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 6; x++) {
     if (uteruka(x, y)) candidates.push({ x, y });
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
     for (let y = tengen-1; y <= tengen+1; y++) {//天元の上下左右で調べる
       for (let x = tengen-1; x <= tengen+1; x++) {
         if(x===tengen||y===tengen){
           if (uteruka(x, y)) candidates.push({ x, y });
         }
        }
       }
if (candidates.length === 0) {
    for (let y = 1; y < SIZE-1; y++) {
      for (let x = 1; x < SIZE-1; x++) {
         if (uteruka(x, y)) candidates.push({ x, y });
       }
     }
}
if (candidates.length === 0) {
 for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
     if (uteruka(x, y)) candidates.push({ x, y });
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
