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

function Spinner() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function Die({ delay = "0s" }) {
  const dots = [
    "top-1.5 left-1.5", "top-1.5 right-1.5",
    "top-1/2 left-1.5 -translate-y-1/2", "top-1/2 right-1.5 -translate-y-1/2",
    "bottom-1.5 left-1.5", "bottom-1.5 right-1.5",
  ];
  return (
    <div
      className="relative w-12 h-12 bg-white rounded-xl shadow-lg border-2 border-ink/5 -rotate-6 animate-float"
      style={{ animationDelay: delay }}
    >
      {dots.map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-2 h-2 rounded-full bg-tomato`} />
      ))}
    </div>
  );
}

function Pawn({ color, delay = "0s" }) {
  return (
    <div className="relative w-9 h-13 animate-float" style={{ animationDelay: delay }}>
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 w-6 h-6 rounded-full shadow-lg border-2 border-white"
        style={{ backgroundColor: color }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-0 w-8 h-7 rounded-t-full shadow-lg border-2 border-white"
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

  async function handleJoin() {
    if (!name.trim()) return setError("Enter your name first");
    if (!joinCode.trim()) return setError("Enter a room code");
    setBusy(true);
    setError("");
    try {
      await ensureAuth();
      const code = joinCode.trim().toUpperCase();
      const room = await getRoom(code);
      if (!room) {
        setError("That room doesn't exist");
        setBusy(false);
        return;
      }
      const existingPlayers = room.players ? Object.values(room.players) : [];
      if (existingPlayers.length >= 4) {
        setError("Room is full (max 4 players)");
        setBusy(false);
        return;
      }
      const takenColors = existingPlayers.map((p) => p.playerId);
      const nextColor = PLAYERS.find((p) => !takenColors.includes(p.id))?.id || PLAYERS[0].id;
      await setPlayer(code, name, nextColor);
      navigate(`/room/${code}`, { state: { name } });
    } catch (e) {
      setError("Couldn't join that room.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-10 bg-white text-ink font-body overflow-hidden relative">
      <div className="flex flex-col items-center mt-6 mb-8 z-10 animate-fadeInUp">
        <span className="font-display text-6xl font-black text-tomato leading-none mb-1">K</span>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Komeludo</h1>
        <p className="text-sm text-ink/50 font-medium mt-1">Fast, simple, online Ludo</p>
      </div>

      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-ink/5 p-6 space-y-5 z-10 animate-popIn"
        style={{ animationDelay: "120ms" }}
      >
        <div>
          <label className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Your name</label>
          <div className="relative mt-1.5">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30">
              <PersonIcon />
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wale"
              className="w-full rounded-xl border-2 border-ink/10 bg-white pl-11 pr-4 py-3 outline-none focus:border-tomato focus:ring-4 focus:ring-tomato/10 transition font-medium"
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={busy}
          className="group relative w-full overflow-hidden flex items-center justify-between rounded-2xl bg-tomato-gradient text-white font-bold px-5 py-3.5 shadow-lg shadow-tomato/25 active:scale-[0.97] transition-transform disabled:opacity-50"
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <span className="relative flex items-center gap-2">
            {busy ? <Spinner /> : <GroupIcon />}
            Create a room
          </span>
          <span className="relative">
            <ArrowIcon />
          </span>
        </button>

        <div className="flex items-center gap-3 text-xs font-medium text-ink/30">
          <div className="h-px flex-1 bg-ink/10" />
          or join one
          <div className="h-px flex-1 bg-ink/10" />
        </div>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-tomato">
            <CodeIcon />
          </span>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Room code"
            maxLength={5}
            className="w-full rounded-2xl border-2 border-ink/10 bg-white pl-11 pr-11 py-3.5 outline-none focus:border-tomato focus:ring-4 focus:ring-tomato/10 tracking-widest font-semibold transition"
          />
          <button
            onClick={handleJoin}
            disabled={busy}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-tomato disabled:opacity-30 active:scale-90 transition-transform"
          >
            {busy ? <Spinner /> : <ArrowIcon />}
          </button>
        </div>

        {error && (
          <p className="text-xs text-tomatoDark font-medium text-center animate-fadeInUp">{error}</p>
        )}
      </div>

      <div
        className="flex items-center gap-2 mt-6 text-xs text-ink/40 font-medium z-10 animate-fadeInUp"
        style={{ animationDelay: "260ms" }}
      >
        <GroupIcon />
        <span>2–4 players · same rules, faster games</span>
      </div>

      <div
        className="mt-auto pt-10 w-full max-w-sm flex items-end justify-between px-4 z-0 animate-fadeInUp"
        style={{ animationDelay: "380ms" }}
      >
        <Pawn color="#FF6347" delay="0s" />
        <Die delay="0.4s" />
        <Pawn color="#3B82F6" delay="0.8s" />
      </div>
    </div>
  );
}
