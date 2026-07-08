function initBoard() {
  undoHistory = [];
  document.getElementById("mainControls").style.display = "block";
  document.getElementById("saigoControls").style.display = "none";
  gameNow = true;
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  drawBoard = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  currentPlayer = "black";
  blackKing = null;
  whiteKing = null;
  blackTame=0;
  whiteTame=1;
  updateDisplay();
  updateForbiddenPoints();
  draw();
}


initBoard();
