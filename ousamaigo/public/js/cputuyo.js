async function tuyosaBetu() {//奇数路盤
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
     for(let i=1;i<tengen-1;i++){//０調べる
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
      if (blackCount === 1 && whiteCount === 2)candidates.push({ x, y });
      if (blackCount === 2 && whiteCount === 1)candidates.push({ x, y });
      if (blackCount === 2 && whiteCount === 2)candidates.push({ x, y });
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
      if (blackCount === 3 && whiteCount === 2)candidates.push({ x, y });
      if (blackCount === 3 && whiteCount === 1)candidates.push({ x, y });
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
