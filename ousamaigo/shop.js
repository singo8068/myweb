module.exports = function(app, pool, sessions) {

    app.post("/api/buy-golden-candy", async (req, res) => {

        try {

            // ==============================
            // ログイン確認
            // ==============================

            const sessionId = req.headers.cookie
                ?.match(/sessionId=([^;]+)/)?.[1];

            const userId = sessions.get(sessionId);

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "ログインしてください"
                });
            }


            // ==============================
            // ユーザー情報取得
            // ==============================

            const result = await pool.query(
                `
                SELECT level, gems, golden_candy
                FROM users
                WHERE user_id = $1
                `,
                [userId]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: "ユーザーが見つかりません"
                });
            }

            const user = result.rows[0];

            const level = user.level;
            const gems = user.gems;
            const goldenCandy = user.golden_candy;


            // ==============================
            // きんのあめ所持数チェック
            // ==============================

            if (goldenCandy >= 3) {

                return res.status(400).json({
                    success: false,
                    message: "きんのあめは3つまでしか持てません"
                });

            }


            // ==============================
            // 価格計算
            // ==============================

            let price;

            if (level <= 5) {

                price = 150;

            } else {

                price = (level - 2) * 50;

            }


            // ==============================
            // ジェム不足チェック
            // ==============================

            if (gems < price) {

                return res.status(400).json({
                    success: false,
                    message: `ジェムが足りません（必要：${price}ジェム）`
                });

            }


            // ==============================
            // 購入処理
            // ==============================

            const updateResult = await pool.query(
                `
                UPDATE users
                SET
                    gems = gems - $1,
                    golden_candy = golden_candy + 1
                WHERE user_id = $2
                  AND golden_candy < 3
                  AND gems >= $1
                RETURNING gems, golden_candy
                `,
                [price, userId]
            );


            if (updateResult.rowCount === 0) {

                return res.status(400).json({
                    success: false,
                    message: "購入できませんでした"
                });
            }

            const updatedUser = updateResult.rows[0];


            // ==============================
            // 成功
            // ==============================

            res.json({
                success: true,
                price: price,
                gems: updatedUser.gems,
                goldenCandy: updatedUser.golden_candy
            });


        } catch (error) {

            console.error("きんのあめ購入エラー:", error);

            res.status(500).json({
                success: false,
                message: "購入処理に失敗しました"
            });

        }

    });


app.post("/api/use-candy", async (req, res) => {

    try {

        // ==============================
        // あめの種類
        // ==============================

        const { type } = req.body;

        let candyColumn;
        let candyName;

        if (type === "golden") {

            candyColumn = "golden_candy";
            candyName = "きんのあめ";

        } else if (type === "magic") {

            candyColumn = "magical_candy";
            candyName = "まほうのあめ";

        } else {

            return res.status(400).json({
                success: false,
                message: "使用するあめが不正です"
            });

        }


        // ==============================
        // ログイン確認
        // ==============================

        const sessionId = req.headers.cookie
            ?.match(/sessionId=([^;]+)/)?.[1];

        const userId = sessions.get(sessionId);

        if (!userId) {

            return res.status(401).json({
                success: false,
                message: "ログインしてください"
            });

        }


        // ==============================
        // あめを1個消費して
        // かちこしを+1
        // ==============================

        const result = await pool.query(
            `
            UPDATE users
            SET
                ${candyColumn} = ${candyColumn} - 1,
                win_diff = win_diff + 1
            WHERE user_id = $1
              AND ${candyColumn} > 0
              AND win_diff < 0
            RETURNING ${candyColumn}, win_diff
            `,
            [userId]
        );


        // ==============================
        // 使用できなかった
        // ==============================

        if (result.rowCount === 0) {

            // 現在の状態を取得
            const userResult = await pool.query(
                `
                SELECT
                    golden_candy,
                    magical_candy,
                    win_diff
                FROM users
                WHERE user_id = $1
                `,
                [userId]
            );


            if (userResult.rowCount === 0) {

                return res.status(404).json({
                    success: false,
                    message: "ユーザーが見つかりません"
                });

            }


            const user = userResult.rows[0];


            // ==============================
            // あめを持っていない
            // ==============================

            if (Number(user[candyColumn]) <= 0) {

                return res.status(400).json({
                    success: false,
                    message: `${candyName}を持っていません`
                });

            }


            // ==============================
            // かちこしがマイナスではない
            // ==============================

            if (user.win_diff >= 0) {

                return res.status(400).json({
                    success: false,
                    message: "かちこしがマイナスのときだけ使えます"
                });

            }


            return res.status(400).json({
                success: false,
                message: `${candyName}を使えません`
            });

        }


        // ==============================
        // 成功
        // ==============================

        const user = result.rows[0];

        res.json({
            success: true,
            candy: user[candyColumn],
            winDiff: user.win_diff
        });


    } catch (error) {

        console.error("あめ使用エラー:", error);

        res.status(500).json({
            success: false,
            message: "使用処理に失敗しました"
        });

    }

});

};