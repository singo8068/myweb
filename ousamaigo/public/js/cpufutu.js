

async function tuyosaBetu() {//奇数路盤
 const tengen=Math.floor(SIZE / 2);
  const candidates = [];      
     for (let y = tengen-1; y <= tengen+1; y++) {//天元の上下左右で１：１調べる
       for (let x = tengen-1; x <= tengen+1; x++) {
         if(x===tengen||y===tengen){
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
      

    for (let y = 1; y < SIZE-1; y++) {
      for (let x = 1; x < SIZE-1; x++) {
         if (!uteruka(x, y)) continue;
           countAround(x, y);
           if (blackCount === 0 && whiteCount === 0)candidates.push({ x, y });
           if (whiteCount === 1 && blackCount >0 &&blackCount <4)candidates.push({ x, y });
           if (whiteCount === 2 && blackCount >0 &&blackCount <4)candidates.push({ x, y });
       }
     }

 for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
     if (!uteruka(x, y)) continue;
     if (henhaneAround(x, y)) candidates.push({ x, y });
     if (hencountAround(x, y))candidates.push({ x, y });
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
