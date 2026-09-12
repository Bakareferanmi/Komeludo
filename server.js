import { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });
console.log(`Server running on port ${PORT}`);

const rooms = {};

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw);
    console.log('Received:', msg.type, msg.code || '');
    const reply = (data) => ws.send(JSON.stringify({ ...data, reqId: msg.reqId }));

    if (msg.type === 'hello') {
      ws.uid = randomUUID();
      reply({ type: 'welcome', uid: ws.uid });
    }

    if (msg.type === 'create') {
      if (rooms[msg.code]) {
        reply({ type: 'error', message: 'Room already exists' });
        return;
      }
      rooms[msg.code] = {
        createdAt: Date.now(),
        status: 'waiting',
        turn: msg.turn,
        players: { [msg.uid]: { name: msg.name, playerId: msg.playerId, joinedAt: Date.now() } },
        tokens: msg.tokens,
      };
      reply({ type: 'created', code: msg.code });
    }

    if (msg.type === 'get') {
      reply({ type: 'snapshot', room: rooms[msg.code] || null });
    }

    if (msg.type === 'setPlayer') {
      const room = rooms[msg.code];
      if (!room) {
        reply({ type: 'error', message: "That room doesn't exist" });
        return;
      }
      room.players[msg.uid] = { name: msg.name, playerId: msg.playerId, joinedAt: Date.now() };
      reply({ type: 'ok' });
      broadcastRoom(msg.code);
    }

    if (msg.type === 'subscribe') {
      ws.code = msg.code;
      const room = rooms[msg.code];
      if (room) ws.send(JSON.stringify({ type: 'room', code: msg.code, room }));
    }

    if (msg.type === 'update') {
      const room = rooms[msg.code];
      if (!room) return;
      Object.assign(room, msg.updates);
      broadcastRoom(msg.code);
    }
  });
});

function broadcastRoom(code) {
  const room = rooms[code];
  const payload = JSON.stringify({ type: 'room', code, room });
  wss.clients.forEach((client) => {
    if (client.code === code && client.readyState === 1) client.send(payload);
  });
}
