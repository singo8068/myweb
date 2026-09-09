const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
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

app.use(
    "/api/stripe-webhook",
    express.raw({ type: "application/json" })
);

app.use(express.json());

require("./stripe")(app, stripe, pool, sessions);
require("./shop")(app, pool, sessions);
require("./login")(app, pool, sessions);

const createRating = require("./rating");
const rating = createRating(pool, sessions);

app.use(express.static("public", {
    index: false
}));

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
function getUserIdFromSocket(socket) {

    const cookie = socket.handshake.headers.cookie || "";

    const match = cookie.match(
        /(?:^|;\s*)sessionId=([^;]+)/
    );

    if (!match) {
        return null;
    }

    const sessionId = match[1];

    return sessions.get(sessionId) || null;
}
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
socket.on("createRoom", async data => {

    const userId = getUserIdFromSocket(socket);

    let level;
    let member = false;

    // =========================
    // 会員
    // =========================

    if (userId) {

        try {

            const result = await pool.query(
                `
                SELECT level
                FROM users
                WHERE user_id = $1
                `,
                [userId]
            );

            if (result.rows.length === 0) {
                console.error("会員が見つかりません:", userId);
                return;
            }

            level = Number(result.rows[0].level);
            member = true;

        } catch (err) {

            console.error(
                "募集時の会員情報取得エラー:",
                err
            );

            return;
        }

    // =========================
    // ゲスト
    // =========================

    } else {

        level = 0;
    }


    const room = {

        roomId: socket.id,
        hostId: socket.id,

        hostUserId: userId,

        name: member
            ? userId
            : "ゲスト",

        level: level,

        hostLevel: level,

        hostMember: member,

        size: data.size,

        blackTime: 60000,
        whiteTime: 60000,
        turn: "black"
    };


    rooms.push(room);

    console.log("募集開始:", {
        roomId: room.roomId,
        userId: userId,
        level: level,
        member: member
    });

    io.emit("roomList", rooms);
});
socket.on("joinRoom", async data => {

    const room = rooms.find(r => r.roomId === data.id);

    if (!room) return;


    // =========================
    // ゲスト側の会員判定
    // =========================

    const guestUserId = getUserIdFromSocket(socket);

    let guestLevel;
    let guestMember = false;


    // =========================
    // 会員
    // =========================

    if (guestUserId) {

        try {

            const result = await pool.query(
                `
                SELECT level
                FROM users
                WHERE user_id = $1
                `,
                [guestUserId]
            );

            if (result.rows.length === 0) {
                console.error(
                    "参加者の会員情報が見つかりません:",
                    guestUserId
                );
                return;
            }

            guestLevel = Number(result.rows[0].level);
            guestMember = true;

        } catch (err) {

            console.error(
                "参加者の会員情報取得エラー:",
                err
            );

            return;
        }

    // =========================
    // ゲスト
    // =========================

    } else {

        guestLevel = 0;
    }


    // =========================
    // ホスト情報
    // =========================

    const hostLevel = Number(room.level) || 0;


    // =========================
    // Socket
    // =========================

    room.guestId = socket.id;
    room.guestUserId = guestUserId;

    room.guestLevel = guestLevel;
    room.guestMember = guestMember;

    socket.join(room.roomId);

    const hostSocket =
        io.sockets.sockets.get(room.hostId);

    hostSocket?.join(room.roomId);


    // =========================
    // 対戦開始
    // =========================
        let hostColor;
        let guestColor;
    try {

 // =========================
// 対戦開始時のレーティング処理
// =========================

// 会員 vs 会員のときだけレーティングを変動させる
const memberVsMember =
    !!room.hostUserId &&
    !!guestUserId;


if (memberVsMember) {

    // -------------------------
    // 会員 vs 会員
    // -------------------------

    room.hostPlayer =
        await rating.startPlayer({
            userId: room.hostUserId
        });

    room.guestPlayer =
        await rating.startPlayer({
            userId: guestUserId
        });

} else {

    // -------------------------
    // ゲストがいる対戦
    // -------------------------
    // レーティングは一切変動させない

    room.hostPlayer = {
        member: !!room.hostUserId,
        level: hostLevel,
        winDiff: 0
    };

    room.guestPlayer = {
        member: false,
        level: 0,
        winDiff: 0
    };

    // ホストが会員なら、DBから取得済みの hostLevel を使用
}


        // =========================
        // 対戦開始後のレベル
        // =========================

        room.hostLevel =
            room.hostPlayer.level;

        room.guestLevel =
            room.guestPlayer.level;


        // =========================
        // 色を決める
        // =========================



if (room.hostLevel === 0 || room.guestLevel === 0) {

    // ゲストがいる対戦はハンデなし
    hostColor =
        Math.random() < 0.5
            ? "black"
            : "white";

    guestColor =
        hostColor === "black"
            ? "white"
            : "black";

    room.turn = "black";

} else if (room.hostLevel === room.guestLevel) {

            // 同レベルならランダム

            hostColor =
                Math.random() < 0.5
                    ? "black"
                    : "white";

            guestColor =
                hostColor === "black"
                    ? "white"
                    : "black";

        } else {

            // レベルが低い方を黒

            if (room.hostLevel < room.guestLevel) {

                hostColor = "black";
                guestColor = "white";

            } else {

                hostColor = "white";
                guestColor = "black";
            }


            // レベル差3以上なら白番から

            if (
                Math.abs(
                    room.hostLevel -
                    room.guestLevel
                ) > 2
            ) {

                room.turn = "white";
            }
        }


        room.hostColor = hostColor;
        room.guestColor = guestColor;


        console.log("対戦開始", {
            roomId: room.roomId,

            host: {
                userId: room.hostUserId,
                member: room.hostPlayer.member,
                level: room.hostPlayer.level,
                winDiff: room.hostPlayer.winDiff
            },

            guest: {
                userId: room.guestUserId,
                member: room.guestPlayer.member,
                level: room.guestPlayer.level,
                winDiff: room.guestPlayer.winDiff
            }
        });


    } catch (err) {

        console.error(
            "対戦開始時のレーティング処理エラー:",
            err
        );

        return;
    }


    // =========================
    // 時計
    // =========================

    room.lastUpdate =
        Date.now() + 3000;


    // =========================
    // 募集中から削除
    // =========================

    rooms =
        rooms.filter(
            r => r.roomId !== room.roomId
        );


    // =========================
    // 対戦中へ
    // =========================

    gameRooms.push(room);


    io.emit("roomList", rooms);


    // =========================
    // ホストへ開始通知
    // =========================

hostSocket?.emit("startGame", {
    roomId: room.roomId,
    size: room.size,
    color: hostColor,
    mylv: room.hostPlayer.level,
    enlv: room.guestPlayer.level,
    member: room.hostPlayer.member
});


    // =========================
    // ゲストへ開始通知
    // =========================

socket.emit("startGame", {
    roomId: room.roomId,
    size: room.size,
    color: guestColor,
    mylv: room.guestPlayer.level,
    enlv: room.hostPlayer.level,
    member: room.guestPlayer.member
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
        if (!room) return;

        if (data.gameState) {
            room.gameState = data.gameState;
        }

        sendGameData(socket, room, eventName, data);
    });
});
socket.on("kousan", data => {
    const room = gameRooms.find(r => r.roomId === data.roomId);
    if (!room) return;

    io.to(room.roomId).emit("kousan", {
        color: data.color
    });
});

socket.on("restoreGame", ({ roomId }, callback) => {

    console.log("restoreGame受信", roomId);

    const room = gameRooms.find(r => r.roomId === roomId);

    if (!room || !room.gameState) {
        callback({
            exists: false
        });
        return;
    }

    callback({
        exists: true,
        gameState: room.gameState,
        blackTime: room.blackTime,
        whiteTime: room.whiteTime,
        turn: room.turn,
        hostLevel: room.hostLevel,
        guestLevel: room.guestLevel
    });

});
socket.on("gameEnd", async data => {

    const room =
        gameRooms.find(
            r => r.roomId === data.roomId
        );

    if (!room) return;


    // =========================
    // 二重処理防止
    // =========================

    if (room.ratingFinished) {
        return;
    }

    room.ratingFinished = true;


    // =========================
    // 勝者判定
    // =========================

    const hostWon =
        data.winner === room.hostColor;

    const guestWon =
        data.winner === room.guestColor;
console.log("ゲーム終了判定:", {
    winner: data.winner,
    hostColor: room.hostColor,
    guestColor: room.guestColor,
    hostWon,
    guestWon
});

    try {

       // =========================
// レーティング処理
// =========================

const memberVsMember =
    !!room.hostUserId &&
    !!room.guestUserId;


let hostResult;
let guestResult;


if (memberVsMember) {

    // =========================
    // 会員 vs 会員
    // =========================

    hostResult =
        await rating.finishPlayer(
            room.hostPlayer,
            hostWon
        );

    guestResult =
        await rating.finishPlayer(
            room.guestPlayer,
            guestWon
        );

} else {

    // =========================
    // ゲストがいる対戦
    // =========================
    // レーティングは一切変動させない

    hostResult = {
        member: !!room.hostUserId,
        won: hostWon,
        level: room.hostLevel,
        winDiff: 0,
        oldLevel: room.hostLevel,
        oldWinDiff: 0
    };

    guestResult = {
        member: false,
        won: guestWon,
        level: 0,
        winDiff: 0
    };
}


        // =========================
        // ホストへ「ホスト自身の結果」
        // =========================

        io.to(room.hostId).emit(
            "gameEnd",
            {
                winner: data.winner,

                level: hostResult.level,
                winDiff: hostResult.winDiff,

                member: hostResult.member,

                oldLevel: hostResult.oldLevel,
                oldWinDiff: hostResult.oldWinDiff
            }
        );


        // =========================
        // ゲストへ「ゲスト自身の結果」
        // =========================

io.to(room.guestId).emit(
    "gameEnd",
    {
        winner: data.winner,

        level: guestResult.level,

        member: guestResult.member
    }
);


    } catch (err) {

        console.error(
            "対戦終了時のレーティング処理エラー:",
            err
        );


        // エラーなら再処理可能

        room.ratingFinished = false;
    }

});
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server Start");
});