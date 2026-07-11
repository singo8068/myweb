function getClosest(x, y) {
  for (let iy = 0; iy < SIZE; iy++) {
    for (let ix = 0; ix < SIZE; ix++) {
      const px = OFFSET + ix * CELL;
      const py = OFFSET + iy * CELL;
      if (Math.hypot(x - px, y - py) < CELL * 0.4) {
        return { x: ix, y: iy };
      }
    }
  }
  return null;
}

function getNeighbors(x, y) {
  return [
    [x - 1, y], [x + 1, y],
    [x, y - 1], [x, y + 1],
  ].filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE);
}

function hasLiberties(x, y, color, visited = {}) {
  const key = `${x},${y}`;
  if (visited[key]) return false;
  visited[key] = true;

  for (let [nx, ny] of getNeighbors(x, y)) {
    const val = board[ny][nx];
    if (val === null) return true;
    if (val === color && hasLiberties(nx, ny, color, visited)) return true;
  }
  return;
}

function countLiberties(x, y, visited = {}) {
  const color = board[y][x];
  const checked = {};
  let count = 0;

  function dfs(cx, cy) {
    const key = `${cx},${cy}`;
    if (visited[key]) return;
    visited[key] = true;
    for (let [nx, ny] of getNeighbors(cx, cy)) {
      const nkey = `${nx},${ny}`;
      if (board[ny][nx] === null && !checked[nkey]) {
        checked[nkey] = true;
        count++;
      } else if (board[ny][nx] === color && !visited[`${nx},${ny}`]) {
        dfs(nx, ny);
      }
    }
  }
  dfs(x, y);
  return count;
}

function removeDead(x, y, color) {
  const toRemove = [];
  const visited = {};
  let lastRemoved = null;
  let kingCaptured = null;

  function dfs(cx, cy) {
    const key = `${cx},${cy}`;
    if (visited[key]) return;
    visited[key] = true;
    toRemove.push([cx, cy]);
    for (let [nx, ny] of getNeighbors(cx, cy)) {
      if (board[ny][nx] === color) dfs(nx, ny);
    }
  }

  dfs(x, y);

  if (!hasLiberties(x, y, color, {})) {
    for (let [rx, ry] of toRemove) {
      if (blackKing && blackKing.x === rx && blackKing.y === ry) kingCaptured = "black";
      if (whiteKing && whiteKing.x === rx && whiteKing.y === ry) kingCaptured = "white";
      board[ry][rx] = null;
      drawBoard[ry][rx] = null;
      lastRemoved = [rx, ry];
    }

    draw();

    if (kingCaptured) {
      gameNow = false;
      requestAnimationFrame(() => {
        setTimeout(async () => {
　　　　  syouhai(kingCaptured === "white");
        }, 100);
      });
    }

    return toRemove.length === 1 ? lastRemoved : null;
  }

  return null;
}
