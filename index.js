const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const PORT = process.env.PORT || 3000;

const server = new WebSocket.Server({ port: PORT }, () => {
  console.log('✅ Server started on port', PORT);
});

let messages = [];

server.on('connection', (ws) => {
  console.log('🟢 New connection');

  // Відправити поточну історію
  ws.send(JSON.stringify({ type: 'history', messages }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'new-message') {
        const newMsg = {
          id: uuidv4(),
          text: data.text,
          nickname: data.nickname,
          avatar: data.avatar,
          reaction: null,
          timestamp: new Date().toISOString(),
        };
        messages.push(newMsg);
        broadcast({ type: 'new-message', message: newMsg });
      }

      if (data.type === 'reaction') {
        messages = messages.map((m) =>
          m.id === data.id ? { ...m, reaction: data.reaction } : m
        );
        broadcast({ type: 'update-reaction', id: data.id, reaction: data.reaction });
      }

      if (data.type === 'delete-message') {
        messages = messages.filter((m) => m.id !== data.id);
        broadcast({ type: 'delete-message', id: data.id });
      }

      if (data.type === 'clear-history') {
        messages = [];
        broadcast({ type: 'clear-history' });
      }

    } catch (err) {
      console.error('❌ Error parsing message:', err);
    }
  });
});

function broadcast(data) {
  server.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}
