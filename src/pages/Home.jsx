import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ref, set, get } from "firebase/database";
import { db, ensureAuth } from "../firebase";
import { createInitialTokens, PLAYERS } from "../game/ludoLogic";

function makeRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
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
      const uid = await ensureAuth();
      const code = makeRoomCode();
      await set(ref(db, `rooms/${code}`), {
        createdAt: Date.now(),
        status: "waiting",
        turn: PLAYERS[0].id,
        players: {
          [uid]: { name, playerId: PLAYERS[0].id, joinedAt: Date.now() },
        },
        tokens: createInitialTokens(),
      });
      navigate(`/room/${code}`, { state: { name } });
    } catch (e) {
      setError("Couldn't create the room. Check your Firebase config.");
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
      const uid = await ensureAuth();
      const code = joinCode.trim().toUpperCase();
      const snap = await get(ref(db, `rooms/${code}`));
      if (!snap.exists()) {
        setError("That room doesn't exist");
        setBusy(false);
        return;
      }
      const room = snap.val();
      const existingPlayers = room.players ? Object.values(room.players) : [];
      if (existingPlayers.length >= 4) {
        setError("Room is full (max 4 sweethearts)");
        setBusy(false);
        return;
      }
      const takenColors = existingPlayers.map((p) => p.playerId);
      const nextColor = PLAYERS.find((p) => !takenColors.includes(p.id))?.id || PLAYERS[0].id;
      await set(ref(db, `rooms/${code}/players/${uid}`), {
        name,
        playerId: nextColor,
        joinedAt: Date.now(),
      });
      navigate(`/room/${code}`, { state: { name } });
    } catch (e) {
      setError("Couldn't join that room.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 text-plum">
      <div className="text-5xl mb-2 heart-pulse">💘</div>
      <h1 className="font-display text-4xl text-roseDark mb-1">Komeludo</h1>
      <p className="text-sm text-plum/70 mb-8">A little Ludo, a little romance</p>

      <div className="w-full max-w-sm bg-white/70 backdrop-blur rounded-3xl shadow-xl p-6 space-y-5">
        <div>
          <label className="text-xs font-medium text-plum/60">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Wale"
            className="mt-1 w-full rounded-xl border border-rose/30 bg-white px-4 py-2.5 outline-none focus:border-rose"
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={busy}
          className="w-full rounded-xl bg-rose text-white font-semibold py-3 shadow-md active:scale-[0.98] transition disabled:opacity-50"
        >
          💌 Create a room
        </button>

        <div className="flex items-center gap-3 text-xs text-plum/40">
          <div className="h-px flex-1 bg-plum/10" />
          or join one
          <div className="h-px flex-1 bg-plum/10" />
        </div>

        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ROOM CODE"
            maxLength={5}
            className="flex-1 rounded-xl border border-goldrose/40 bg-white px-4 py-2.5 outline-none focus:border-goldrose tracking-widest text-center"
          />
          <button
            onClick={handleJoin}
            disabled={busy}
            className="rounded-xl bg-goldrose text-white font-semibold px-5 shadow-md active:scale-[0.98] transition disabled:opacity-50"
          >
            Join
          </button>
        </div>

        {error && <p className="text-xs text-roseDark text-center">{error}</p>}
      </div>

      <p className="mt-8 text-xs text-plum/40">2–4 players · same rules, extra heart</p>
    </div>
  );
}
