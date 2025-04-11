const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let messages = [];

wss.on('connection', (ws) => {
  console.log('🔌 Нове зʼєднання');

  // Надіслати історію
  ws.send(JSON.stringify({ type: 'history', messages }));

  // Обробка вхідних повідомлень
  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'new-message') {
        const msg = {
          id: Date.now(),
          text: parsed.text,
          nickname: parsed.nickname || 'Анонім',
          avatar: parsed.avatar || '🌱',
          reaction: null,
        };
        messages.push(msg);
        // Трансляція всім
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'new-message', message: msg }));
          }
        });
      }
    } catch (err) {
      console.error('❌ Помилка повідомлення:', err);
    }
  });
});

app.get('/', (req, res) => {
  res.send('🧠 Focused Chat Server працює!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Сервер запущено на порту ${PORT}`);
});
