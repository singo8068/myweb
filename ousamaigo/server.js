const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);


app.use(express.static("public", {
    index: false
}));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "matiai.html"));
});


let rooms = [];

io.on("connection", (socket) => {
console.log("connect:", socket.id);
    // 接続したら募集一覧を送る
    socket.emit("roomList", rooms);

    // 募集する
    socket.on("createRoom", room => {
        room.roomId = socket.id;
        room.hostId = socket.id;
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
//ねこうち
   socket.on("putStone", data => {
    console.log("putStone:", socket.id, data);
    socket.to(data.roomId).emit("putStone", data);
   });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server Start");
});