async function login() {

const id = document.getElementById("userId").value.trim();
const password = document.getElementById("password").value;

const message = document.getElementById("message");

if (!id || !password) {
    message.textContent =
        "IDとパスワードを入力してください";
    return;
}

try {

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

    const data = await response.json();

    if (!response.ok) {
        message.textContent = data.message;
        return;
    }

    message.textContent = "ログインしました！";

    console.log("ログインした会員:", data.user);

    // 後で待合室などへ移動
    // location.href = "/matiai.html";

} catch (error) {

    console.error(error);

    message.textContent =
        "通信エラーが発生しました";
}
```

}
