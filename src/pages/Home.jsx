import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ensureAuth, createRoom, getRoom, setPlayer } from "../socket";
import { createInitialTokens, PLAYERS } from "../game/ludoLogic";

function makeRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

function GroupIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 20c0-3.5 3-5.5 6-5.5s6 2 6 5.5" />
      <path d="M15 15c2.3 0 4.5 1.6 4.5 4.5" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 6 3 12 8 18" />
      <polyline points="16 6 21 12 16 18" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function Die() {
  const dots = [
    "top-1.5 left-1.5", "top-1.5 right-1.5",
    "top-1/2 left-1.5 -translate-y-1/2", "top-1/2 right-1.5 -translate-y-1/2",
    "bottom-1.5 left-1.5", "bottom-1.5 right-1.5",
  ];
  return (
    <div className="relative w-12 h-12 bg-white rounded-xl shadow-md border-2 border-ink/5 -rotate-6">
      {dots.map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-2 h-2 rounded-full bg-tomato`} />
      ))}
    </div>
  );
}

function Pawn({ color }) {
  return (
    <div className="relative w-9 h-13">
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 w-6 h-6 rounded-full shadow-md border-2 border-white"
        style={{ backgroundColor: color }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-0 w-8 h-7 rounded-t-full shadow-md border-2 border-white"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

export default function Home() {
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleCreate() {
    if (!name.trim()) return setError("Enter your name first");
    setBusy(true);
    setError("");
    try {
      await ensureAuth();
      const code = makeRoomCode();
      await createRoom(code, {
        name,
        playerId: PLAYERS[0].id,
        turn: PLAYERS[0].id,
        tokens: createInitialTokens(),
      });
      navigate(`/room/${code}`, { state: { name } });
    } catch (e) {
      setError("Couldn't create the room. Check your connection.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  async funct
