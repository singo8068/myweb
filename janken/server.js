const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public'));
// ルートにアクセスされたら janken.html を返す
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'janken.html'));
});

let players = [];
let hands = {};

io.on('connection', (socket) => {
  if (players.length >= 2) {
    socket.emit('message', '満員です。');
    socket.disconnect();
    return;
  }

  players.push(socket.id);
  console.log('接続:', socket.id);

  socket.on('hand', (hand) => {
    hands[socket.id] = hand;
    if (Object.keys(hands).length === 2) {
      const [id1, id2] = players;
      const result = judge(hands[id1], hands[id2]);
      io.to(id1).emit('result', { yourHand: hands[id1], oppHand: hands[id2], result: result[0] });
      io.to(id2).emit('result', { yourHand: hands[id2], oppHand: hands[id1], result: result[1] });
      hands = {};
    }
  });

  socket.on('disconnect', () => {
    console.log('切断:', socket.id);
    players = players.filter(id => id !== socket.id);
    delete hands[socket.id];
  });
});

function judge(hand1, hand2) {
  if (hand1 === hand2) return ['引き分け', '引き分け'];
  const win = {
    'グー': 'チョキ',
    'チョキ': 'パー',
    'パー': 'グー'
  };
  if (win[hand1] === hand2) return ['勝ち', '負け'];
  else return ['負け', '勝ち'];
}

server.listen(3000, () => {
  console.log('http://localhost:3000');
});
