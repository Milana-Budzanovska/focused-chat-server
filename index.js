const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 4000 });

let messages = [];

server.on('connection', ws => {
  console.log("👤 Користувач підключився");

  // Надсилаємо попередні повідомлення новому клієнту
  ws.send(JSON.stringify({ type: 'history', messages }));

  // Прийом повідомлення
  ws.on('message', message => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'new-message') {
        const msg = {
          id: Date.now(),
          text: data.text,
          nickname: data.nickname || 'Анонім',
          avatar: data.avatar || '🧠',
          reaction: null
        };
        messages.push(msg);
        // Розсилаємо всім клієнтам
        server.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'new-message', message: msg }));
          }
        });
      }
      if (data.type === 'reaction') {
        const msg = messages.find(m => m.id === data.id);
        if (msg) {
          msg.reaction = data.reaction;
          server.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'update-reaction', id: msg.id, reaction: msg.reaction }));
            }
          });
        }
      }
    } catch (err) {
      console.error("❌ Помилка обробки повідомлення:", err);
    }
  });

  ws.on('close', () => {
    console.log("🚪 Користувач вийшов");
  });
});
console.log("🚀 WebSocket сервер запущено на порту 4000");