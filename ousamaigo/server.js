const express = require('express');
const path = require('path');

const app = express();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'matiai.html'));
});

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT);