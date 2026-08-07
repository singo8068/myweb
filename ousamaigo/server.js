const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const crypto = require("crypto");
const BYOYOMI_ADD = 10000;

app.use(express.static("public", {
    index: false
}));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "matiai.html"));
});


let rooms = [];

function sendGameData(socket, room,eventName, data) {
    if (!room) return;

const now = Date.now();
const elapsed = Math.max(0, now - room.lastUpdate);

if (room.turn === "black") {
    room.blackTime = room.blackTime - elapsed + BYOYOMI_ADD;
    room.turn = "white";
} else {
    room.whiteTime = room.whiteTime - elapsed + BYOYOMI_ADD;
    room.turn = "black";
}

room.lastUpdate = now;
io.to(room.roomId).emit("timeSync", {
    blackTime: room.blackTime,
    whiteTime: room.whiteTime,
    turn: room.turn
});
sendWithRetry(socket.to(data.roomId), eventName, data);
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

        rooms = rooms.filter(r => r.roomId !== room.roomId);
        io.emit("roomList", rooms);
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
const room = rooms.find(r => r.roomId === data.roomId);
        sendGameData(socket, room,eventName, data);
    });
});
});



const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server Start");
});