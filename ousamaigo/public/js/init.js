async function initBoard() {
  undoHistory = [];
  document.getElementById("mainControls").style.display = "block";
  document.getElementById("saigoControls").style.display = "none";
  gameNow = true;
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  drawBoard = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  currentPlayer = "black";
  blackKing = null;
  whiteKing = null;
  
  if (LVDIF===0){blackTame=0;whiteTame=1;}else{whiteTame=0;}
  if (LVDIF===1)blackTame=0;
  if (LVDIF===2)blackTame=1;
  if (LVDIF===3)blackTame=0;
  if (LVDIF===4)blackTame=1;
  if (LVDIF===5)blackTame=0;
  if (LVDIF===6)blackTame=1;
  if (LVDIF===7)blackTame=0;
  if (LVDIF===8)blackTame=1;
  if (LVDIF===9)blackTame=0;
  if (LVDIF>9)blackTame=1;
  if (LVDIF>2){
   currentPlayer = "white";
   blackKing = { x: 5, y: 5 };
   board[5][3] = black;
  }
  if (LVDIF>4)board[5][7] = black;
  if (LVDIF>6)board[3][5] = black;
  if (LVDIF>8)board[7][5] = black;

  blackTime = 60000; 
  whiteTime = 60000;
  updateDisplay();
  updateForbiddenPoints();
  draw();
if (ISNET) {
    await showEffectText(
        myColor === "black"
            ? "きみは●くろ●だよ！"
            : "きみは〇しろ〇だよ！",
        3000
    );
}
}


initBoard();
