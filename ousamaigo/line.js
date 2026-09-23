// ============================================================
// LINE認証
// ============================================================

// LINEログイン開始
module.exports = function(app, pool, sessions) {
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


// ============================================================
// お友達紹介
// ============================================================

app.post("/api/referral", async (req, res) => {

    const { referrerId } = req.body;

    if (!referrerId) {
        return res.json({
            success: false,
            message: "紹介者のIDを入力してください"
        });
    }

    // --------------------------------
    // 現在ログインしているユーザーを確認
    // --------------------------------

    const cookie = req.headers.cookie || "";

    const match = cookie.match(/(?:^|;\s*)sessionId=([^;]+)/);

    if (!match) {
        return res.status(401).json({
            success: false,
            message: "ログインしてください"
        });
    }

    const sessionId = match[1];

    try {

        // --------------------------------
        // セッション確認
        // --------------------------------

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
            return res.status(401).json({
                success: false,
                message: "ログインしてください"
            });
        }

        const myUserId = sessionResult.rows[0].user_id;


        // --------------------------------
        // 自分自身を紹介者にはできない
        // --------------------------------

        if (myUserId === referrerId) {
            return res.json({
                success: false,
                message: "自分自身を紹介者にすることはできません"
            });
        }


// --------------------------------
// トランザクション開始
// --------------------------------

const client = await pool.connect();

try {

    await client.query("BEGIN");


    // --------------------------------
    // 自分の情報を取得
    // --------------------------------

    const myResult = await client.query(
        `
        SELECT
            user_id,
            line_id,
            referred_by
        FROM users
        WHERE user_id = $1
        FOR UPDATE
        `,
        [myUserId]
    );

    if (myResult.rows.length === 0) {

        await client.query("ROLLBACK");

        return res.json({
            success: false,
            message: "ユーザーが見つかりません"
        });
    }

    const me = myResult.rows[0];


    // --------------------------------
    // LINE認証済みか確認
    // --------------------------------

    if (!me.line_id) {

        await client.query("ROLLBACK");

        return res.json({
            success: false,
            message: "LINE認証済みの会員だけ利用できます"
        });
    }


    // --------------------------------
    // すでに紹介者が登録されているか確認
    // --------------------------------

    if (me.referred_by) {

        await client.query("ROLLBACK");

        return res.json({
            success: false,
            message: "紹介者はすでに登録されています"
        });
    }


    // --------------------------------
    // 紹介者を取得
    // --------------------------------

    const referrerResult = await client.query(
        `
        SELECT
            user_id,
            line_id
        FROM users
        WHERE user_id = $1
        FOR UPDATE
        `,
        [referrerId]
    );

    if (referrerResult.rows.length === 0) {

        await client.query("ROLLBACK");

        return res.json({
            success: false,
            message: "紹介者のIDが見つかりません"
        });
    }

    const referrer = referrerResult.rows[0];


    // --------------------------------
    // 紹介者もLINE認証済みか確認
    // --------------------------------

    if (!referrer.line_id) {

        await client.query("ROLLBACK");

        return res.json({
            success: false,
            message: "紹介者がLINE認証していません"
        });
    }


    // --------------------------------
    // 紹介された人に魔法の飴 +1
    // --------------------------------

    await client.query(
        `
        UPDATE users
        SET
            referred_by = $1,
            magical_candy = magical_candy + 1
        WHERE user_id = $2
        `,
        [referrerId, myUserId]
    );


    // --------------------------------
    // 紹介した人に魔法の飴 +1
    // --------------------------------

    await client.query(
        `
        UPDATE users
        SET
            magical_candy = magical_candy + 1
        WHERE user_id = $1
        `,
        [referrerId]
    );


    // --------------------------------
    // 確定
    // --------------------------------

    await client.query("COMMIT");


    console.log(
        "お友達紹介成立:",
        referrerId,
        "→",
        myUserId
    );


    return res.json({
        success: true,
        message:
            "お友達紹介が成立しました。2人にまほうの飴を1個プレゼントしました"
    });


} catch (error) {

    await client.query("ROLLBACK");

    console.error(
        "お友達紹介トランザクションエラー:",
        error
    );

    return res.status(500).json({
        success: false,
        message: "お友達紹介の処理に失敗しました"
    });

} finally {

    // DB接続を必ずプールへ返す
    client.release();
}


    } catch (error) {

        console.error(
            "お友達紹介エラー:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "お友達紹介の処理に失敗しました"
        });
    }
});
};