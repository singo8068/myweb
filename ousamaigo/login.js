const crypto = require("crypto");
const bcrypt = require("bcrypt");
const querystring = require("querystring");

module.exports = function(app, pool, sessions) {


app.post("/api/register", async (req, res) => {

    const { user_id, password, igoExperienced } = req.body;

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

// 初期レベル
const initialLevel = igoExperienced ? 4 : 1;

// 会員登録
await pool.query(
    `INSERT INTO users
    (user_id, password_hash, level, win_diff, gems, magical_candy, candy_fragments, golden_candy)
    VALUES ($1, $2, $3, 0, 0, 0, 0, 0)`,
    [user_id, hashedPassword, initialLevel]
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
// 既存のshop.jsなどとの互換性用
sessions.set(sessionId, user.user_id);

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
// Neonから復元したログイン情報をメモリにも戻す
sessions.set(sessionId, userId);

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
                golden_candy,
                line_id
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
                goldenCandy: user.golden_candy,
  		lineId: user.line_id
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
// ============================================================
// LINE認証
// ============================================================

// LINEログイン開始
app.get("/api/line/login", async (req, res) => {

    try {

        // --------------------------------
        // 現在ログインしている会員を確認
        // --------------------------------

        const cookie = req.headers.cookie || "";

        const match = cookie.match(/(?:^|;\s*)sessionId=([^;]+)/);

        if (!match) {
            return res.status(401).send("先にログインしてください");
        }

        const sessionId = match[1];

        const sessionResult = await pool.query(
            `
            SELECT user_id
            FROM login_sessions
            WHERE session_id = $1
              AND expires_at > NOW()
            `,
            [sessionId]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(401).send("ログインしてください");
        }

        const userId = sessionResult.rows[0].user_id;


        // --------------------------------
        // CSRF対策用 state
        // --------------------------------

        const state = crypto.randomBytes(32).toString("hex");


        // stateと会員IDを一時保存
        // 10分後に自動的に消す
        sessions.set(
            "line_state_" + state,
            {
                userId: userId,
                sessionId: sessionId,
                expiresAt: Date.now() + 10 * 60 * 1000
            }
        );


        // --------------------------------
        // LINEログインURL
        // --------------------------------

        const channelId = process.env.LINE_CHANNEL_ID;

        const callbackUrl =
            "https://myweb-qcr3.onrender.com/api/line/callback";

        const params = new URLSearchParams({
            response_type: "code",
            client_id: channelId,
            redirect_uri: callbackUrl,
            state: state,
            scope: "profile openid"
        });

        const lineLoginUrl =
            "https://access.line.me/oauth2/v2.1/authorize?" +
            params.toString();


        // LINEへ移動
        res.redirect(lineLoginUrl);

    } catch (error) {

        console.error("LINEログイン開始エラー:", error);

        res.status(500).send("LINEログインを開始できませんでした");
    }
});


// ============================================================
// LINE認証コールバック
// ============================================================

app.get("/api/line/callback", async (req, res) => {

    try {

        const { code, state, error } = req.query;


        // --------------------------------
        // LINE側でキャンセルした場合
        // --------------------------------

        if (error) {

            console.log("LINE認証キャンセル:", error);

            return res.redirect("/line.html?error=cancel");
        }


        if (!code || !state) {
            return res.status(400).send("LINE認証情報がありません");
        }


        // --------------------------------
        // state確認
        // --------------------------------

        const stateKey = "line_state_" + state;

        const stateData = sessions.get(stateKey);

        if (!stateData) {
            return res.status(400).send("不正な認証です");
        }


        // 有効期限確認
        if (Date.now() > stateData.expiresAt) {

            sessions.delete(stateKey);

            return res.status(400).send("認証の有効期限が切れています");
        }


        // stateは一度使ったら削除
        sessions.delete(stateKey);


        const channelId = process.env.LINE_CHANNEL_ID;
        const channelSecret = process.env.LINE_CHANNEL_SECRET;

        const callbackUrl =
            "https://myweb-qcr3.onrender.com/api/line/callback";


        // --------------------------------
        // 認証コード → アクセストークン
        // --------------------------------

        const tokenResponse = await fetch(
            "https://api.line.me/oauth2/v2.1/token",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },

                body: new URLSearchParams({
                    grant_type: "authorization_code",
                    code: code,
                    redirect_uri: callbackUrl,
                    client_id: channelId,
                    client_secret: channelSecret
                })
            }
        );


        const tokenData = await tokenResponse.json();


        if (!tokenResponse.ok) {

            console.error(
                "LINEアクセストークン取得エラー:",
                tokenData
            );

            return res.status(500).send(
                "LINE認証に失敗しました"
            );
        }


        // --------------------------------
        // LINEプロフィール取得
        // --------------------------------

        const profileResponse = await fetch(
            "https://api.line.me/v2/profile",
            {
                headers: {
                    Authorization:
                        "Bearer " + tokenData.access_token
                }
            }
        );


        const profile = await profileResponse.json();


        if (!profileResponse.ok || !profile.userId) {

            console.error(
                "LINEプロフィール取得エラー:",
                profile
            );

            return res.status(500).send(
                "LINEユーザー情報を取得できませんでした"
            );
        }


        const lineId = profile.userId;

        console.log(
            "LINE認証:",
            stateData.userId,
            lineId
        );


        // --------------------------------
        // すでに別の会員がこのLINE IDを
        // 使用していないか確認
        // --------------------------------

        const duplicate = await pool.query(
            `
            SELECT user_id
            FROM users
            WHERE line_id = $1
            `,
            [lineId]
        );


        if (
            duplicate.rows.length > 0 &&
            duplicate.rows[0].user_id !== stateData.userId
        ) {

            return res.redirect(
                "/line.html?error=already_used"
            );
        }


        // --------------------------------
        // 現在の会員情報を確認
        // --------------------------------

        const userResult = await pool.query(
            `
            SELECT
                user_id,
                line_id
            FROM users
            WHERE user_id = $1
            `,
            [stateData.userId]
        );


        if (userResult.rows.length === 0) {
            return res.status(404).send(
                "ユーザーが見つかりません"
            );
        }


        const user = userResult.rows[0];


        // --------------------------------
        // 初回LINE認証か確認
        // --------------------------------

        const firstLineAuth = !user.line_id;


        if (firstLineAuth) {

            // LINE IDを登録
            // 初回なので魔法の飴を1個プレゼント

            await pool.query(
                `
                UPDATE users
                SET
                    line_id = $1,
                    magical_candy = magical_candy + 1
                WHERE user_id = $2
                `,
                [
                    lineId,
                    stateData.userId
                ]
            );

            console.log(
                "LINE認証特典：魔法の飴 +1",
                stateData.userId
            );

        } else {

            // すでにLINE認証済みなら
            // LINE IDだけ更新
            // （通常は同じLINE IDなので実質何もしない）

            await pool.query(
                `
                UPDATE users
                SET line_id = $1
                WHERE user_id = $2
                `,
                [
                    lineId,
                    stateData.userId
                ]
            );
        }


        // --------------------------------
        // LINE認証完了
        // --------------------------------

        res.redirect("/line.html?success=1");

    } catch (error) {

        console.error(
            "LINE認証エラー:",
            error
        );

        res.status(500).send(
            "LINE認証中にエラーが発生しました"
        );
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
// メモリからも削除
    sessions.delete(sessionId);

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
