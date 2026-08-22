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
socket.on("joinRoom", data => {

    const room = rooms.find(r => r.roomId === data.id);

    if (!room) return;

    room.guestLevel = data.level;

    socket.join(room.roomId);

    console.log(io.sockets.adapter.rooms.get(room.roomId));

    const hostSocket = io.sockets.sockets.get(room.hostId);
    hostSocket?.join(room.roomId);

// 色を決める
let hostColor;
let guestColor;

if (room.level === room.guestLevel) {

    // レベルが同じならランダム
    hostColor = Math.random() < 0.5 ? "black" : "white";
    guestColor = hostColor === "black" ? "white" : "black";

} else {

    // レベルが低い方を黒にする
    if (room.level < room.guestLevel) {
        hostColor = "black";
        guestColor = "white";
    } else {
        hostColor = "white";
        guestColor = "black";
    }

}

    // それぞれに違う情報を送る
    room.lastUpdate = Date.now() + 3000;

    // ★ 募集中から削除
    rooms = rooms.filter(r => r.roomId !== room.roomId);

    // ★ 対戦中へ移動
    gameRooms.push(room);

    // 募集一覧を更新
    io.emit("roomList", rooms);

    hostSocket?.emit("startGame", {
        roomId: room.roomId,
        size: room.size,
        color: hostColor,
        mylv: room.level,
        enlv: room.guestLevel
    });

    socket.emit("startGame", {
        roomId: room.roomId,
        size: room.size,
        color: guestColor,
        mylv: room.guestLevel,
        enlv: room.level
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