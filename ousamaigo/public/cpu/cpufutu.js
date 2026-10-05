

async function tuyosaBetu() {//奇数路盤
 const tengen=Math.floor(SIZE / 2);
  const candidates = [];      
     for (let y = tengen-1; y <= tengen+1; y++) {//天元の上下左右で１：１調べる
       for (let x = tengen-1; x <= tengen+1; x++) {
         if(x===tengen||y===tengen){
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
      
   for(let i=1;i<tengen;i++){
      for (let y = tengen-i; y <= tengen+i; y++) {
        for (let x = tengen-i; x <= tengen+i; x++) {
         if (!uteruka(x, y)) continue;
           countAround(x, y);
           if (comCount === 0 && myCount === 0)candidates.push({ x, y });
           if (myCount === 1 && comCount >0 &&comCount <4)candidates.push({ x, y });
           if (myCount === 2 && comCount >0 &&comCount <4)candidates.push({ x, y });
     }
   }
   if (candidates.length>4) break;
  }
if (candidates.length<4){
 for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
     if (!uteruka(x, y)) continue;
     if (henhaneAround(x, y)) candidates.push({ x, y });
     if (hencountAround(x, y))candidates.push({ x, y });
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
