const WebSocket = require('ws');

const PORT = process.env.PORT || 4000;
const server = new WebSocket.Server({ port: PORT });

let messages = [];

server.on('connection', ws => {
  console.log("👤 Користувач підключився");

  // Відправляємо історію
  ws.send(JSON.stringify({ type: 'history', messages }));

  ws.on('message', message => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'new-message') {
        const msg = {
          id: Date.now(),
          text: data.text,
          nickname: data.nickname || 'Анонім',
          avatar: data.avatar || '🌱',
          reaction: null,
        };
        messages.push(msg);

        // Відправляємо всім
        server.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'new-message', message: msg }));
          }
        });
      }
    } catch (err) {
      console.error("❌ Parsing error:", err);
    }
  });
});
