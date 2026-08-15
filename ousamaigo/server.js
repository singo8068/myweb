const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const BYOYOMI_ADD = 10000;

const sessions = new Map();

const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.query("SELECT NOW()")
    .then(result => {
        console.log("Neon DB 接続成功！");
        console.log("DB時刻:", result.rows[0].now);
    })
    .catch(err => {
        console.error("Neon DB 接続エラー:", err);
    });

app.use(express.json());
app.use(express.static("public", {
    index: false
}));
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

        // セッションIDを作成
        const sessionId = crypto.randomBytes(32).toString("hex");

        // サーバー側に保存
        sessions.set(sessionId, user.user_id);

        // CookieにセッションIDだけ保存
        res.setHeader(
            "Set-Cookie",
            `sessionId=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/`
        );

        console.log("ログイン:", user.user_id);

        // ログイン成功
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

        // セッションIDからユーザーIDを取得
        const userId = sessions.get(sessionId);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "ログインしていません"
            });
        }

        // Neonから最新データを取得
        const result = await pool.query(
            `SELECT
                user_id,
                level,
                win_diff,
                gems,
                magical_candy,
                candy_fragments,
                golden_candy
             FROM users
             WHERE user_id = $1`,
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
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "matiai.html"));
});


let rooms = [];       // 募集中
let gameRooms = [];   // 対戦中

function sendGameData(socket, room, eventName, data) {
    if (!room) return;

    const now = Date.now();
    const elapsed = Math.max(0, now - room.lastUpdate);
    const moveColor = room.turn;

    if (room.turn === "black") {
        room.blackTime = room.blackTime - elapsed + BYOYOMI_ADD;
        room.turn = "white";
    } else {
        room.whiteTime = room.whiteTime - elapsed + BYOYOMI_ADD;
        room.turn = "black";
    }

    room.lastUpdate = now;

    console.log("Serverが処理");

    io.to(room.roomId).emit("timeSync", {
        blackTime: room.blackTime,
        whiteTime: room.whiteTime,
        turn: room.turn
    });

    sendWithRetry(
        socket.to(room.roomId),
        eventName,
        {
            roomId: room.roomId,
            x: data.x,
            y: data.y,
            color: moveColor
        }
    );
}
const waitingAck = new Map();

function sendWithRetry(target, eventName, data) {

    const sendData = {
        ...data,
        messageId: crypto.randomUUID()
    };

    // 初回送信
    target.emit(eventName, sendData);

    function retry(delay) {
        const timer = setTimeout(() => {

            if (!waitingAck.has(sendData.messageId)) return;

            target.emit(eventName, sendData);

            retry(delay + 300);

        }, delay);

        waitingAck.set(sendData.messageId, timer);
    }

    retry(300);
}



io.on("connection", (socket) => {
socket.on("ack", data => {
    const timer = waitingAck.get(data.messageId);

    if (!timer) return;

    clearTimeout(timer);
    waitingAck.delete(data.messageId);
});
console.log("connect:", socket.id);
    // 接続したら募集一覧を送る
    socket.emit("roomList", rooms);

    // 募集する
    socket.on("createRoom", room => {
        room.roomId = socket.id;
        room.hostId = socket.id;

room.blackTime = 60000;
room.whiteTime = 60000;
room.turn = "black";
        rooms.push(room);
        io.emit("roomList", rooms);
    });

    // 参加する
    socket.on("joinRoom", id => {

        const room = rooms.find(r => r.roomId === id);

        if (!room) return;

socket.join(room.roomId);
console.log(io.sockets.adapter.rooms.get(room.roomId));
const hostSocket = io.sockets.sockets.get(room.hostId);
hostSocket?.join(room.roomId);

// ランダムで色を決める
const hostColor = Math.random() < 0.5 ? "black" : "white";
const guestColor = hostColor === "black" ? "white" : "black";

// それぞれに違う情報を送る
room.lastUpdate=Date.now()+ 2000;
    // ★ 募集中から削除
    rooms = rooms.filter(r => r.roomId !== room.roomId);

    // ★ 対戦中へ移動
    gameRooms.push(room);

    // 募集一覧を更新
    io.emit("roomList", rooms);

hostSocket?.emit("startGame", {
    roomId: room.roomId,
    size: room.size,
    color: hostColor
});

socket.emit("startGame", {
    roomId: room.roomId,
    size: room.size,
    color: guestColor
});
    });

    // 切断
socket.on("disconnect", () => {
    console.log("disconnect:", socket.id);
    rooms = rooms.filter(r => r.hostId !== socket.id);
    io.emit("roomList", rooms);
});
socket.on("cancelRoom", () => {
    rooms = rooms.filter(room => room.hostId !== socket.id);
    io.emit("roomList", rooms);
});
socket.on("joinGameRoom", roomId => {
    socket.join(roomId);
    console.log("game join", socket.id, roomId);
});
const gameEvents = [
    "putStone",
    "tameru",
    "pawa",
    "reverse"
];
gameEvents.forEach(eventName => {
    socket.on(eventName, data => {
const room = gameRooms.find(r => r.roomId === data.roomId);
//console.log("Serverが受信");
//console.log("data.roomId =", data.roomId);
//console.log("gameRooms =", gameRooms);
//console.log("room =", room);
        sendGameData(socket, room,eventName, data);
    });
});
socket.on("kousan", data => {
    const room = gameRooms.find(r => r.roomId === data.roomId);
    if (!room) return;

    io.to(room.roomId).emit("kousan", {
        color: data.color
    });
});

socket.on("gameEnd", data => {
    const room = gameRooms.find(r => r.roomId === data.roomId);
    if (!room) return;

    io.to(room.roomId).emit("gameEnd", {
        winner: data.winner
    });
});
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server Start");
});