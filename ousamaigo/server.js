const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "matiai.html"));
});

let rooms = [];

io.on("connection", (socket) => {

    // 接続したら募集一覧を送る
    socket.emit("roomList", rooms);

    // 募集する
    socket.on("createRoom", room => {
        room.id = socket.id;
        rooms.push(room);
        io.emit("roomList", rooms);
    });

    // 参加する
    socket.on("joinRoom", id => {

        const room = rooms.find(r => r.id === id);

        if (!room) return;

        socket.join(id);
        io.sockets.sockets.get(id)?.join(id);

        io.to(id).emit("startGame", room);

        rooms = rooms.filter(r => r.id !== id);
        io.emit("roomList", rooms);
    });

    // 切断
    socket.on("disconnect", () => {
        rooms = rooms.filter(r => r.id !== socket.id);
        io.emit("roomList", rooms);
    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server Start");
});