const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4000;
const server = new WebSocket.Server({ port: PORT });
const DB_PATH = path.join(__dirname, 'db.json');

// Завантаження повідомлень з файлу
let messages = [];
try {
  if (fs.existsSync(DB_PATH)) {
    messages = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } else {
    fs.writeFileSync(DB_PATH, JSON.stringify([]));
  }
} catch (err) {
  console.error('❌ Помилка при читанні db.json:', err);
}

// Функція збереження в файл
const saveMessages = () => {
  fs.writeFileSync(DB_PATH, JSON.stringify(messages, null, 2));
};

server.on('connection', ws => {
  console.log("🟢 Користувач підключився");

  // Надсилаємо всю історію
  ws.send(JSON.stringify({ type: 'history', messages }));

  ws.on('message', message => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'new-message') {
        const msg = {
          id: Date.now(),
          text: data.text,
          nickname: data.nickname || 'Анонім',
          avatar: data.avatar || '🧠',
          reaction: null,
        };

        messages.push(msg);
        saveMessages();

        // Розсилка всім клієнтам
        server.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'new-message', message: msg }));
          }
        });
      }

    } catch (err) {
      console.error("❌ Невірний формат JSON:", err);
    }
  });

  ws.on('close', () => {
    console.log("🔴 Користувач відключився");
  });
});

console.log(`✅ WebSocket сервер запущено на порту ${PORT}`);
