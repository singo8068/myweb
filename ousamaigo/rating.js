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
    // 対戦開始
    // =========================

    async function startPlayer(player) {

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
                userId: player.userId,
                level: Number(user.level),
                winDiff: Number(user.win_diff)
            };
        }


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


                let level =
                    Number(result.rows[0].level);

                let winDiff =
                    Number(result.rows[0].win_diff);


                // -------------------------
                // 勝者
                // -------------------------

                if (won) {

                    winDiff += 2;


                // -------------------------
                // 敗者
                // -------------------------
                // レベル3以下で、
                // 勝ち越しがマイナスなら +1
                // -------------------------

                } else if (
                    level <= 3 &&
                    winDiff < 0
                ) {

                    winDiff += 1;
                }


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
                    won
                        ? "会員：勝利 +2"
                        : "会員：敗北",
                    player.userId,
                    "level:",
                    level,
                    "winDiff:",
                    winDiff
                );


                return {
                    member: true,
                    won,
                    level,
                    winDiff
                };


            } catch (err) {

                await client.query("ROLLBACK");

                throw err;

            } finally {

                client.release();
            }
        }


        console.log(
            won
                ? "ゲスト：勝利"
                : "ゲスト：敗北"
        );


        return {
            member: false,
            won,
            level: 0
        };
    }


    // =========================
    // 待合室へ入る前のレベル判定
    // =========================

    async function checkLevel(userId) {

        const result = await pool.query(
            `
            SELECT level, win_diff
            FROM users
            WHERE user_id = $1
            `,
            [userId]
        );


        if (result.rows.length === 0) {

            throw new Error(
                `ユーザーが見つかりません: ${userId}`
            );
        }


        const level =
            Number(result.rows[0].level);

        const winDiff =
            Number(result.rows[0].win_diff);

        const rule =
            LEVEL_RULES[level];


        if (!rule) {

            return {
                type: "none"
            };
        }


        // =========================
        // 昇格
        // =========================

        if (
            level < 8 &&
            winDiff >= rule.up
        ) {

            const newLevel =
                level + 1;


            await pool.query(
                `
                UPDATE users
                SET level = $1,
                    win_diff = 0
                WHERE user_id = $2
                `,
                [
                    newLevel,
                    userId
                ]
            );


            console.log(
                "昇格:",
                userId,
                `Lv${level} → Lv${newLevel}`,
                "winDiff: 0"
            );


            return {
                type: "up",
                oldLevel: level,
                newLevel: newLevel
            };
        }


        // =========================
        // 降格条件
        // =========================

        if (
            level > 1 &&
            rule.down !== null &&
            winDiff <= -rule.down
        ) {

            console.log(
                "降格条件:",
                userId,
                "level:",
                level,
                "winDiff:",
                winDiff
            );


            // ここではまだ降格しない
            return {
                type: "down",
                level,
                winDiff
            };
        }


        // =========================
        // 問題なし
        // =========================

        return {
            type: "none",
            level,
            winDiff
        };
    }


    // =========================
    // 降格確定
    // =========================

    async function confirmDemotion(userId) {

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
                [userId]
            );


            if (result.rows.length === 0) {

                throw new Error(
                    `ユーザーが見つかりません: ${userId}`
                );
            }


            const level =
                Number(result.rows[0].level);

            const winDiff =
                Number(result.rows[0].win_diff);

            const rule =
                LEVEL_RULES[level];


            // =========================
            // 現在も降格条件を満たしているか確認
            // =========================

            if (
                level <= 1 ||
                !rule ||
                rule.down === null ||
                winDiff > -rule.down
            ) {

                await client.query("COMMIT");

                return {
                    success: false,
                    message: "降格条件を満たしていません"
                };
            }


            // =========================
            // 降格
            // =========================

            const newLevel =
                level - 1;


            // ★レベルが変わるので win_diff は必ず0
            await client.query(
                `
                UPDATE users
                SET level = $1,
                    win_diff = 0
                WHERE user_id = $2
                `,
                [
                    newLevel,
                    userId
                ]
            );


            await client.query("COMMIT");


            console.log(
                "降格:",
                userId,
                `Lv${level} → Lv${newLevel}`,
                "winDiff: 0"
            );


            return {
                success: true,
                oldLevel: level,
                newLevel: newLevel,
                winDiff: 0
            };


        } catch (err) {

            await client.query("ROLLBACK");

            throw err;

        } finally {

            client.release();
        }
    }


    // =========================
    // 外部公開
    // =========================

    return {
        startPlayer,
        finishPlayer,
        checkLevel,
        confirmDemotion
    };
};