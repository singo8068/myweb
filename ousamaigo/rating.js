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

module.exports = function(pool, sessions) {


    // =========================
    // レベルアップ・ダウン判定
    // =========================

    function checkLevel(level, winDiff) {

        const oldLevel = level;

        if (level < 9) {

            const rule = LEVEL_RULES[level];

            // レベルアップ
            if (rule.up !== null && winDiff >= rule.up) {
                level++;
                winDiff = 0;
            }

            // レベルダウン
            else if (
                rule.down !== null &&
                winDiff <= -rule.down
            ) {
                level--;
                winDiff = 0;
            }

        } else {

            // レベル9以上
            if (winDiff >= level - 3) {
                level++;
                winDiff = 0;
            }

            else if (winDiff <= -4) {
                level--;
                winDiff = 0;
            }
        }


        return {
            level,
            winDiff,
            levelChanged: level !== oldLevel
        };
    }



    // =========================
    // 対戦開始
    // =========================

    async function startPlayer(player) {

        // -------------------------
        // 会員
        // -------------------------

        if (player.userId) {

            const result = await pool.query(
                `
                UPDATE users
                SET win_diff = win_diff - 1
                WHERE user_id = $1
                RETURNING level, win_diff
                `,
                [player.userId]
            );


            if (result.rows.length === 0) {
                throw new Error(
                    `ユーザーが見つかりません: ${player.userId}`
                );
            }


            const user = result.rows[0];

            console.log(
                "会員：対戦開始 -1",
                player.userId,
                "level:",
                user.level,
                "winDiff:",
                user.win_diff
            );


            return {
                member: true,
                level: Number(user.level),
                winDiff: Number(user.win_diff)
            };
        }


// -------------------------
// ゲスト
// -------------------------

const level = 0;

console.log(
    "ゲスト：対戦開始",
    "level:"
);

return {
    member: false,
    level: 0
};
    }



    // =========================
    // 対戦終了
    // =========================

    async function finishPlayer(player, won) {


        // -------------------------
        // 会員
        // -------------------------

        if (player.userId) {

            const client = await pool.connect();

            try {

                await client.query("BEGIN");


                const result = await client.query(
                    `
                    SELECT level, win_diff
                    FROM users
                    WHERE user_id = $1
                    FOR UPDATE
                    `,
                    [player.userId]
                );


                if (result.rows.length === 0) {
                    throw new Error(
                        `ユーザーが見つかりません: ${player.userId}`
                    );
                }


                let level = Number(result.rows[0].level);
                let winDiff = Number(result.rows[0].win_diff);


// 勝者は +2
if (won) {
    winDiff += 2;

// レベル3以下で、勝ち越しがマイナスなら
// 敗北しても +1
} else if (level <= 3 && winDiff < 0) {
    winDiff += 1;
}


                const oldLevel = level;
                const oldWinDiff = winDiff - (won ? 2 : 0);


                const checked = checkLevel(
                    level,
                    winDiff
                );


                level = checked.level;
                winDiff = checked.winDiff;


                await client.query(
                    `
                    UPDATE users
                    SET level = $1,
                        win_diff = $2
                    WHERE user_id = $3
                    `,
                    [
                        level,
                        winDiff,
                        player.userId
                    ]
                );


                await client.query("COMMIT");


                console.log(
                    won ? "会員：勝利 +2" : "会員：敗北",
                    player.userId,
                    "level:",
                    level,
                    "winDiff:",
                    winDiff
                );


                return {
                    member: true,
                    won,
                    oldLevel,
                    level,
                    oldWinDiff,
                    winDiff
                };


            } catch (err) {

                await client.query("ROLLBACK");

                throw err;

            } finally {

                client.release();
            }
        }


// -------------------------
// ゲスト
// -------------------------

console.log(
    won ? "ゲスト：勝利" : "ゲスト：敗北"
);

return {
    member: false,
    won,
    level: 0
};
    }



    return {
        startPlayer,
        finishPlayer
    };
};