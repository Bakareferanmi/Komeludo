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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function Pawn({ color }) {
  return (
    <div className="relative w-10 h-14">
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 w-7 h-7 rounded-full shadow-md"
        style={{ backgroundColor: color }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-0 w-9 h-8 rounded-t-full shadow-md"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

function Die() {
  const dots = [
    "top-1 left-1", "top-1 right-1",
    "top-1/2 left-1 -translate-y-1/2", "top-1/2 right-1 -translate-y-1/2",
    "bottom-1 left-1", "bottom-1 right-1",
  ];
  return (
    <div className="relative w-12 h-12 bg-white rounded-lg shadow-md rotate-6">
      {dots.map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-2 h-2 rounded-full bg-rose`} />
      ))}
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
    if (!name.trim()) return setError("Tell us your name first 💗");
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
      setError("Couldn't create the room. Check your server connection.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (!name.trim()) return setError("Tell us your name first 💗");
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
        setError("Room is full (max 4 sweethearts)");
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
    <div className="min-h-screen flex flex-col items-center px-6 py-10 text-plum overflow-hidden relative">
      {/* decorative blob */}
      <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-blush/60 pointer-events-none" />

      <div className="flex flex-col items-center mt-6 mb-8">
        <span className="font-display text-6xl font-black text-rose leading-none mb-1">K</span>
        <h1 className="font-display text-4xl font-extrabold text-plum">Komeludo</h1>
      </div>

      <div className="w-full max-w-sm bg-white/80 backdrop-blur rounded-3xl shadow-xl p-6 space-y-5 z-10">
        <div>
          <label className="text-xs font-medium text-plum/60">Your name</label>
          <div className="relative mt-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-plum/40">
              <PersonIcon />
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wale"
              className="w-full rounded-xl border border-rose/30 bg-white pl-11 pr-4 py-2.5 outline-none focus:border-rose"
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={busy}
          className="w-full flex items-center justify-between rounded-2xl bg-rose text-white font-semibold px-5 py-3.5 shadow-md active:scale-[0.98] transition disabled:opacity-50"
        >
          <span className="flex items-center gap-2">
            <GroupIcon />
            Create a room
          </span>
          <ArrowIcon />
        </button>

        <div className="flex items-center gap-3 text-xs text-plum/40">
          <div className="h-px flex-1 bg-plum/10" />
          or join one
          <div className="h-px flex-1 bg-plum/10" />
        </div>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose">
            <CodeIcon />
          </span>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Room code"
            maxLength={5}
            className="w-full rounded-2xl border border-rose/30 bg-white pl-11 pr-11 py-3.5 outline-none focus:border-rose tracking-widest"
          />
          <button
            onClick={handleJoin}
            disabled={busy}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-rose disabled:opacity-40"
          >
            <ArrowIcon />
          </button>
        </div>

        {error && <p className="text-xs text-roseDark text-center">{error}</p>}
      </div>

      <div className="flex items-center gap-2 mt-6 text-xs text-plum/50 z-10">
        <GroupIcon />
        <span>2–4 players · same rules, extra heart</span>
      </div>

      <div className="mt-auto pt-10 w-full max-w-sm flex items-end justify-between px-4 z-0">
        <Pawn color="#E85D75" />
        <Die />
        <Pawn color="#F7B2C4" />
      </div>
    </div>
  );
}
