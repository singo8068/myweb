
function updateDisplay() {
//上のメッセージ作成
  const blackImg = document.createElement("img");
  blackImg.src = kurokingImg.src;
  blackImg.alt = "くろ";
  blackImg.style.height = "50px";
  blackImg.style.verticalAlign = "middle";

  const whiteImg = document.createElement("img");
  whiteImg.src = sirokingImg.src;
  whiteImg.alt = "しろ";
  whiteImg.style.height = "50px";
  whiteImg.style.verticalAlign = "middle";

  while (turnDisplay.firstChild) turnDisplay.removeChild(turnDisplay.firstChild);
  if (currentPlayer === "black") {
    turnDisplay.appendChild(blackImg.cloneNode(true));
    turnDisplay.appendChild(document.createTextNode("のばんだよ"));
    if(blackTame>=1){pawaBtn.style.backgroundColor="#FF6666";}else{pawaBtn.style.backgroundColor="#BBBBBB";}
    if(blackTame>=4){oseBtn.style.backgroundColor="#FF6666";}else{oseBtn.style.backgroundColor="#BBBBBB";}
  } else {
    turnDisplay.appendChild(whiteImg.cloneNode(true));
    turnDisplay.appendChild(document.createTextNode("のばんだよ"));
    if(whiteTame>=1){pawaBtn.style.backgroundColor="#FF6666";}else{pawaBtn.style.backgroundColor="#BBBBBB";}
    if(whiteTame>=4){oseBtn.style.backgroundColor="#FF6666";}else{oseBtn.style.backgroundColor="#BBBBBB";}
  }

  const blackLabel = document.getElementById("blackLabel");
  const whiteLabel = document.getElementById("whiteLabel");
  while (blackLabel.firstChild) blackLabel.removeChild(blackLabel.firstChild);
  blackLabel.appendChild(blackImg);

  while (whiteLabel.firstChild) whiteLabel.removeChild(whiteLabel.firstChild);
  whiteLabel.appendChild(whiteImg);

  blackTameLibsDisplay.textContent = blackTame;
  whiteTameLibsDisplay.textContent = whiteTame;
  if (undoHistory.length > 0){undoBtn.style.backgroundColor="#FFFFFF";
  }else{undoBtn.style.backgroundColor="#BBBBBB";
  }
  if (undoHistory.length > 1){passBtn.style.backgroundColor="#66FF66";
  }else{passBtn.style.backgroundColor="#BBBBBB";
  }

}
//盤面描写
async function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#000";

  for (let i = 0; i < SIZE; i++) {
    let pos = OFFSET + i * CELL;
    ctx.beginPath();
    ctx.moveTo(OFFSET, pos);
    ctx.lineTo(OFFSET + (SIZE - 1) * CELL, pos);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pos, OFFSET);
    ctx.lineTo(pos, OFFSET + (SIZE - 1) * CELL);
    ctx.stroke();
  }

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const val = board[y][x];
      const mark = drawBoard[y][x];
      const cx = OFFSET + x * CELL;
      const cy = OFFSET + y * CELL;

      if (val === "black" || val === "white") {
        if ((blackKing && blackKing.x === x && blackKing.y === y) || (whiteKing && whiteKing.x === x && whiteKing.y === y)) {
          const img = (val === "black") ? kurokingImg : sirokingImg;
          ctx.drawImage(img, cx - CELL * 0.55, cy - CELL * 0.55, CELL*1.1, CELL*1.1);
        } else {
          const img = (val === "black") ? kuronekoImg : sironekoImg;
          ctx.drawImage(img, cx - CELL * 0.5, cy - CELL * 0.5, CELL, CELL);
        }
      } else if (mark === "forbid_black" || mark === "forbid_white") {
        ctx.strokeStyle = mark === "forbid_black" ? "#fff" : "#000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - CELL * 0.3, cy - CELL * 0.3);
        ctx.lineTo(cx + CELL * 0.3, cy + CELL * 0.3);
        ctx.moveTo(cx + CELL * 0.3, cy - CELL * 0.3);
        ctx.lineTo(cx - CELL * 0.3, cy + CELL * 0.3);
        ctx.stroke();
        ctx.lineWidth = 1;
      } else if (mark === "forbid_both") {
        ctx.strokeStyle = "#f00";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cx - CELL * 0.3, cy - CELL * 0.3);
        ctx.lineTo(cx + CELL * 0.3, cy + CELL * 0.3);
        ctx.moveTo(cx + CELL * 0.3, cy - CELL * 0.3);
        ctx.lineTo(cx - CELL * 0.3, cy + CELL * 0.3);
        ctx.stroke();
        ctx.lineWidth = 1;

      }else if (mark === "kouho_black" || mark === "kouho_white") {
        const cx = OFFSET + x * CELL;
        const cy = OFFSET + y * CELL;
        ctx.beginPath();
        ctx.arc(cx, cy, CELL * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = mark === "kouho_white" ? "#fff" : "#000";
        ctx.fill();
      }
    }
  }
 hantei();
}
function updateForbiddenPoints() {
  drawBoard = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
      let blackSuicide = true;
      let whiteSuicide = true;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (board[y][x] !== null) continue;



      board[y][x] = "black";
      blackSuicide = !hasLiberties(x, y, "black", {});
      board[y][x] = null;

      board[y][x] = "white";
      whiteSuicide = !hasLiberties(x, y, "white", {});
      board[y][x] = null;

      if (blackSuicide) drawBoard[y][x] = "forbid_black";
      if (whiteSuicide) drawBoard[y][x] = "forbid_white";
      if (blackSuicide&&whiteSuicide) drawBoard[y][x] = "forbid_both";

    }
  }
}


