module.exports = (app, stripe, pool, sessions) => {

app.post("/api/stripe-webhook", async (req, res) => {

    const signature = req.headers["stripe-signature"];

    let event;

    try {

        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );

    } catch (error) {

        console.error("Stripe Webhook署名エラー:", error.message);

        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    // 支払い完了
    if (event.type === "checkout.session.completed") {

        const session = event.data.object;

        // Stripeに保存していたユーザーID
        const userId = session.metadata?.userId;

        if (!userId) {
            console.error("Webhook: userIdがありません");
            return res.status(400).send("userIdがありません");
        }

        try {

            // ジェムを100個追加
            await pool.query(
                `UPDATE users
                 SET gems = gems + 100
                 WHERE user_id = $1`,
                [userId]
            );

            console.log(
                "ジェム購入成功:",
                userId,
                "+100ジェム"
            );

        } catch (error) {

            console.error(
                "ジェム追加エラー:",
                error
            );

            return res.status(500).send("DB更新エラー");
        }
    }

    res.json({ received: true });
});


app.post("/api/create-checkout-session", async (req, res) => {
    try {

        // CookieからセッションIDを取得
        const cookie = req.headers.cookie || "";

        const match = cookie.match(/(?:^|;\s*)sessionId=([^;]+)/);

        if (!match) {
            return res.status(401).json({
                success: false,
                message: "ログインしてください"
            });
        }

        const sessionId = match[1];

        // セッションIDからユーザーIDを取得
        const userId = sessions.get(sessionId);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "ログインしてください"
            });
        }

        const session = await stripe.checkout.sessions.create({

            mode: "payment",

            line_items: [
                {
                    price: "price_1U4XIgPh2txd175gtbvANjzv",
                    quantity: 1
                }
            ],

            // 誰が購入したかをStripeに保存
            metadata: {
                userId: userId
            },

            success_url:
                "https://myweb-qcr3.onrender.com/payment-success.html",

            cancel_url:
                "https://myweb-qcr3.onrender.com/matiai.html"
        });

        res.json({
            url: session.url
        });

    } catch (error) {

        console.error("Stripe Checkoutエラー:", error);

        res.status(500).json({
            success: false,
            message: "決済画面を作成できませんでした"
        });
    }
});



};