let ws;
let socketReady;
let uid = null;
const roomListeners = {};
const pending = {};

const SERVER_URL = "wss://komeludo.onrender.com";

function getSocket() {
  if (!ws || ws.readyState > 1) {
    ws = new WebSocket(SERVER_URL);
    socketReady = new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.reqId && pending[msg.reqId]) {
        pending[msg.reqId](msg);
        delete pending[msg.reqId];
      }
      if (msg.type === "room" && roomListeners[msg.code]) {
        roomListeners[msg.code].forEach((cb) => cb(msg.room));
      }
    };
  }
  return ws;
}

async function request(payload) {
  const socket = getSocket();
  if (socket.readyState !== WebSocket.OPEN) await socketReady;
  const reqId = Math.random().toString(36).slice(2);
  return new Promise((resolve) => {
    pending[reqId] = resolve;
    socket.send(JSON.stringify({ ...payload, reqId }));
  });
}

export async function ensureAuth() {
  if (uid) return uid;
  const res = await request({ type: "hello" });
  uid = res.uid;
  return uid;
}

export async function createRoom(code, data) {
  return request({ type: "create", code, uid, ...data });
}

export async function getRoom(code) {
  const res = await request({ type: "get", code });
  return res.room;
}

export async function setPlayer(code, name, playerId) {
  return request({ type: "setPlayer", code, uid, name, playerId });
}

export function subscribeRoom(code, callback) {
  roomListeners[code] ??= new Set();
  roomListeners[code].add(callback);
  getSocket().send(JSON.stringify({ type: "subscribe", code }));
  return () => roomListeners[code]?.delete(callback);
}

export function updateRoom(code, updates) {
  getSocket().send(JSON.stringify({ type: "update", code, updates }));
}
