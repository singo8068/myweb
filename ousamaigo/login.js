const crypto = require("crypto");
const bcrypt = require("bcrypt");

module.exports = function(app, pool, sessions) {


app.post("/api/register", async (req, res) => {

    const { user_id, password } = req.body;

    if (!user_id || !password) {
        return res.json({
            success: false,
            message: "IDとパスワードを入力してください"
        });
    }

    try {

        // 同じIDがあるか確認
        const check = await pool.query(
            "SELECT id FROM users WHERE user_id = $1",
            [user_id]
        );

        if (check.rows.length > 0) {
            return res.json({
                success: false,
                message: "そのIDはすでに使われています"
            });
        }

        // パスワードをハッシュ化
        const hashedPassword = await bcrypt.hash(password, 10);

        // 会員登録
        await pool.query(
            `INSERT INTO users
            (user_id, password_hash, level, win_diff, gems, magical_candy, candy_fragments, golden_candy)
            VALUES ($1, $2, 3, 0, 0, 0, 0, 0)`,
            [user_id, hashedPassword]
        );

        console.log("会員登録:", user_id);

        res.json({
            success: true,
            message: "会員登録が完了しました"
        });

    } catch (err) {

        console.error("会員登録エラー:", err);

        res.status(500).json({
            success: false,
            message: "登録中にエラーが発生しました"
        });

    }

});


// ==============================
// ログイン
// ==============================

app.post("/api/login", async (req, res) => {

    const { user_id, password } = req.body;

    if (!user_id || !password) {
        return res.json({
            success: false,
            message: "IDとパスワードを入力してください"
        });
    }

    try {

        // IDを検索
        const result = await pool.query(
            "SELECT * FROM users WHERE user_id = $1",
            [user_id]
        );

        // IDが存在しない
        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "IDまたはパスワードが違います"
            });
        }

        const user = result.rows[0];

        // パスワード確認
        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "IDまたはパスワードが違います"
            });
        }


        // ==============================
        // セッションIDを作成
        // ==============================

        const sessionId = crypto.randomBytes(32).toString("hex");


        // ==============================
        // セッション有効期限
        // 30日
        // ==============================

        const expiresAt = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
        );


        // ==============================
        // Neonにセッション保存
        // ==============================

        await pool.query(
            `
            INSERT INTO login_sessions
            (session_id, user_id, expires_at)
            VALUES ($1, $2, $3)
            `,
            [
                sessionId,
                user.user_id,
                expiresAt
            ]
        );


        // ==============================
        // CookieにセッションID保存
        // ブラウザを閉じても残る
        // ==============================

        res.setHeader(
            "Set-Cookie",
            `sessionId=${sessionId}; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax; Path=/`
        );


        console.log("ログイン:", user.user_id);

        res.json({
            success: true,
            message: "ログイン成功"
        });

    } catch (error) {

        console.error("ログインエラー:", error);

        res.status(500).json({
            success: false,
            message: "ログイン中にエラーが発生しました"
        });
    }
});


// ==============================
// ログインユーザー情報
// ==============================

app.get("/api/me", async (req, res) => {

    try {

        const cookie = req.headers.cookie || "";

        const match = cookie.match(/(?:^|;\s*)sessionId=([^;]+)/);

        if (!match) {
            return res.status(401).json({
                success: false,
                message: "ログインしていません"
            });
        }

        const sessionId = match[1];


        // ==============================
        // Neonからセッションを検索
        // ==============================

        const sessionResult = await pool.query(
            `
            SELECT user_id
            FROM login_sessions
            WHERE session_id = $1
              AND expires_at > NOW()
            `,
            [sessionId]
        );


        // セッションがない・期限切れ
        if (sessionResult.rows.length === 0) {

            // 期限切れセッションをCookieから削除
            res.setHeader(
                "Set-Cookie",
                "sessionId=; Max-Age=0; HttpOnly; Secure; SameSite=Lax; Path=/"
            );

            return res.status(401).json({
                success: false,
                message: "ログインしていません"
            });
        }


        const userId = sessionResult.rows[0].user_id;


        // ==============================
        // Neonから最新データを取得
        // ==============================

        const result = await pool.query(
            `
            SELECT
                user_id,
                level,
                win_diff,
                gems,
                magical_candy,
                candy_fragments,
                golden_candy
            FROM users
            WHERE user_id = $1
            `,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "ユーザーが見つかりません"
            });
        }

        const user = result.rows[0];

        res.json({
            success: true,
            user: {
                userId: user.user_id,
                level: user.level,
                winDiff: user.win_diff,
                gems: user.gems,
                magicalCandy: user.magical_candy,
                candyFragments: user.candy_fragments,
                goldenCandy: user.golden_candy
            }
        });

    } catch (error) {

        console.error("ユーザー情報取得エラー:", error);

        res.status(500).json({
            success: false,
            message: "ユーザー情報の取得に失敗しました"
        });
    }
});


// ==============================
// ログアウト
// ==============================

app.post("/api/logout", async (req, res) => {

    try {

        const cookie = req.headers.cookie || "";

        const match = cookie.match(/(?:^|;\s*)sessionId=([^;]+)/);

        if (match) {

            const sessionId = match[1];

            // Neonからセッション削除
            await pool.query(
                "DELETE FROM login_sessions WHERE session_id = $1",
                [sessionId]
            );
        }


        // Cookie削除
        res.setHeader(
            "Set-Cookie",
            "sessionId=; Max-Age=0; HttpOnly; Secure; SameSite=Lax; Path=/"
        );


        res.json({
            success: true,
            message: "ログアウトしました"
        });

    } catch (error) {

        console.error("ログアウトエラー:", error);

        res.status(500).json({
            success: false,
            message: "ログアウト中にエラーが発生しました"
        });
    }
});


};
