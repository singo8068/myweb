
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
     if (henhaneAround(x, y)) {
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
