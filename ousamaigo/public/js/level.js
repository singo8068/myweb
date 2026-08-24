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

    // 対戦前のレベルを保存
    const oldLevel = level;
const oldWinDiff = winDiff;

    // 相手とのレベル差
    const params = new URLSearchParams(location.search);
    const opponentLevel = Number(params.get("enlv")) || level;
    const levelDiff = Math.abs(level - opponentLevel);

    // 勝ち越し変動
    if (levelDiff < 3 || level <= 2) {

        if (data.winner === myColor) {
            winDiff++;
            console.log("勝ち +1", winDiff);

        } else {
            if (level > 3 || winDiff > 0) {
                winDiff--;
                console.log("負け -1", winDiff);
            }
        }

    } else {
        console.log(
            `レベル差${levelDiff}のため、勝ち越し変動なし`
        );
    }

    // レベル判定
    const rule = LEVEL_RULES[level];

    if (level < 9) {

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

    } else {

        // レベルアップ
        if (winDiff >= level - 3) {
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

    // Cookie更新
    document.cookie =
        `level=${level}; max-age=31536000; path=/`;

    document.cookie =
        `winDiff=${winDiff}; max-age=31536000; path=/`;

    console.log("現在レベル", level);
    console.log("現在かちこし", winDiff);


    // =========================
    // 対戦後のレベル表示
    // =========================

if (typeof levelInfo !== "undefined") {


const resultDiff = winDiff - oldWinDiff;

const diffText = resultDiff >= 0
    ? `＋${resultDiff}`
    : `${resultDiff}`;

levelInfo.innerHTML =
    `レベル${oldLevel}　かちこし${oldWinDiff}${diffText}＝${winDiff}`;

if (level > oldLevel) {
    levelInfo.innerHTML =
        `<br>レベル${level}にアップ！`;
}

        // レベルダウン
        if (level < oldLevel) {
            levelInfo.innerHTML =
                `<br>レベル${level}にダウン`;
        }

        levelInfo.style.display = "block";
    }
});