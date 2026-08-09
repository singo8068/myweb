const LEVEL_RULES = {
    1:  { up: 3, down: null },
    2:  { up: 4, down: null },
    3:  { up: 5, down: null },
    4:  { up: 5, down: 8 },
    5:  { up: 5, down: 7 },
    6:  { up: 5, down: 6 },
    7:  { up: 5, down: 5 },
    8:  { up: 5, down: 4 }
};

function getCookie(name) {
    const cookies = document.cookie.split("; ");

    for (const cookie of cookies) {
        const [key, value] = cookie.split("=");

        if (key === name) {
            return decodeURIComponent(value);
        }
    }

    return null;
}

socket.on("gameEnd", data => {
    console.log("勝敗受信", data);

    let winDiff = Number(getCookie("winDiff")) || 0;
    let level = Number(getCookie("level")) || 1;

    if (data.winner === myColor) {
        winDiff++;
        console.log("勝ち +1", winDiff);
    } else {
        if (level > 3 || winDiff > 0) {
            winDiff--;
            console.log("負け -1", winDiff);
        }
    }

    const rule = LEVEL_RULES[level];

  if(level<9){
    // レベルアップ
    if (rule.up !== null && winDiff >= rule.up) {
        level++;
        winDiff = 0;
        console.log("レベルアップ！", level);
    }

    // レベルダウン
    if (rule.down !== null && winDiff <= -rule.down) {
        level--;
        winDiff = 0;
        console.log("レベルダウン！", level);
    }
  }else{
    // レベルアップ
    if (winDiff >= level-3) {
        level++;
        winDiff = 0;
        console.log("レベルアップ！", level);
    }

    // レベルダウン
    if (winDiff <= -4) {
        level--;
        winDiff = 0;
        console.log("レベルダウン！", level);
    }
  }

    document.cookie =
        `level=${level}; max-age=31536000; path=/`;

    document.cookie =
        `winDiff=${winDiff}; max-age=31536000; path=/`;

    console.log("現在レベル", level);
    console.log("現在かちこし", winDiff);
});