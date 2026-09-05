async function initBoard() {

    if (ISNET) {
        history.pushState(null, "", location.href);

        window.addEventListener("popstate", () => {
            history.pushState(null, "", location.href);
        });
    }

console.log("initBoard", {
    SIZE,
    LVDIF,
    ISNET,
    myColor
});

    if (ISNET) {


        const data = await new Promise(resolve => {
            socket.emit("restoreGame", { roomId }, resolve);
        });

        if (data.exists) {

            console.log("途中のゲームを復元します");

            const state = data.gameState;

            board = state.board.map(row => [...row]);
            drawBoard = state.drawBoard.map(row => [...row]);

            currentPlayer = data.turn;

            blackKing = state.blackKing
                ? { ...state.blackKing }
                : null;

            whiteKing = state.whiteKing
                ? { ...state.whiteKing }
                : null;

            blackTame = state.blackTame;
            whiteTame = state.whiteTame;

            blackTime = data.blackTime;
            whiteTime = data.whiteTime;

            undoHistory = [state];

            gameNow = true;

            updateForbiddenPoints();
            updateDisplay();
            draw();
            updateTurnControls();

            console.log("復元完了");

            return;
        }

        console.log("途中状態なし → 通常の初期化");
    }

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
   board[4][4] = "black";
   blackKing = { x: 4, y: 4 };
   board[4][2] = "black";
  }
  if (LVDIF>4)board[4][6] = "black";
  if (LVDIF>6)board[2][4] = "black";
  if (LVDIF>8)board[2][4] = "black";

  blackTime = 60000; 
  whiteTime = 60000;
  saveState();
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
