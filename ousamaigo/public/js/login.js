console.log("login.js 読み込み成功");

async function login() {

    console.log("login関数が呼ばれました");

    const id = document.getElementById("userId").value.trim();
    const password = document.getElementById("password").value;

    console.log("入力ID:", id);
    console.log("パスワード入力:", password ? "あり" : "なし");

    try {

        console.log("/api/loginへ送信します");

        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: id,
                password: password
            })
        });

        console.log("サーバーから返事が来ました");
        console.log("status:", response.status);

        const data = await response.json();

        console.log("返ってきたデータ:", data);

        const message = document.getElementById("message");

        if (!response.ok) {
            message.textContent = data.message;
            return;
        }

        message.textContent = "ログインしました！";

    } catch (error) {

        console.error("ログインエラー:", error);

        document.getElementById("message").textContent =
            "通信エラーが発生しました";
    }
}