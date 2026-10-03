async function tuyosaBetu() {
 const tengen=Math.floor(SIZE / 2);
  const candidates = [];      

 for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
     if (uteruka(x, y)) candidates.push({ x, y });
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
