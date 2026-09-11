import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { ref, onValue, update } from "firebase/database";
import { db, ensureAuth } from "../firebase";
import { PLAYERS, rollDice, getMovableTokens, applyMove, hasPlayerWon } from "../game/ludoLogic";
import Board from "../components/Board";
import Dice from "../components/Dice";

export default function Room() {
  const { code } = useParams();
  const [room, setRoom] = useState(null);
  const [uid, setUid] = useState(null);
  const [diceValue, setDiceValue] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [hasRolledThisTurn, setHasRolledThisTurn] = useState(false);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    ensureAuth().then(setUid);
  }, []);

  useEffect(() => {
    const roomRef = ref(db, `rooms/${code}`);
    const unsub = onValue(roomRef, (snap) => {
      setRoom(snap.val());
    });
    return () => unsub();
  }, [code]);

  const players = useMemo(() => (room?.players ? Object.entries(room.players) : []), [room]);
  const myEntry = players.find(([id]) => id === uid);
  const myPlayerId = myEntry?.[1]?.playerId;
  const isMyTurn = room?.turn === myPlayerId;

  const movableSet = useMemo(() => {
    if (!room?.tokens || !isMyTurn || !hasRolledThisTurn) return new Set();
    const movable = getMovableTokens(room.tokens, myPlayerId, diceValue);
    return new Set(movable.map((t) => `${myPlayerId}-${t.id}`));
  }, [room, isMyTurn, hasRolledThisTurn, diceValue, myPlayerId]);

  function nextTurnId(currentId) {
    const activeIds = players.map(([, p]) => p.playerId);
    const order = PLAYERS.map((p) => p.id).filter((id) => activeIds.includes(id));
    const idx = order.indexOf(currentId);
    return order[(idx + 1) % order.length];
  }

  async function handleRoll() {
    if (!isMyTurn || hasRolledThisTurn) return;
    setRolling(true);
    const val = rollDice();
    setTimeout(async () => {
      setDiceValue(val);
      setRolling(false);
      setHasRolledThisTurn(true);
      const movable = getMovableTokens(room.tokens, myPlayerId, val);
      if (movable.length === 0) {
        // no legal move — pass turn (unless it was a 6, classic rule: 6 always re-rolls if no move? keep simple: pass)
        await update(ref(db, `rooms/${code}`), { turn: nextTurnId(myPlayerId) });
        setHasRolledThisTurn(false);
      }
    }, 500);
  }

  async function handleTokenClick(playerId, tokenId) {
    if (!isMyTurn || !hasRolledThisTurn || playerId !== myPlayerId) return;
    const { tokens: newTokens } = applyMove(room.tokens, playerId, tokenId, diceValue);
    const won = hasPlayerWon(newTokens, playerId);
    const updates = { tokens: newTokens };
    if (won) {
      updates.status = "finished";
      updates.winner = playerId;
    } else {
      // extra turn on rolling a 6
      updates.turn = diceValue === 6 ? myPlayerId : nextTurnId(myPlayerId);
    }
    await update(ref(db, `rooms/${code}`), updates);
    setHasRolledThisTurn(false);
    if (won) setWinner(playerId);
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center text-plum">
        <p className="animate-pulse">Setting the table for two 💐...</p>
      </div>
    );
  }

  const myPlayer = PLAYERS.find((p) => p.id === myPlayerId);
  const turnPlayer = PLAYERS.find((p) => p.id === room.turn);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 text-plum">
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-plum/50">Room code</p>
          <p className="font-display text-xl tracking-widest text-roseDark">{code}</p>
        </div>
        <div className="flex -space-x-2">
          {players.map(([id, p]) => {
            const pl = PLAYERS.find((x) => x.id === p.playerId);
            return (
              <div
                key={id}
                title={p.name}
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-sm shadow"
                style={{ backgroundColor: pl?.color }}
              >
                {pl?.emoji}
              </div>
            );
          })}
        </div>
      </div>

      {room.status === "finished" ? (
        <div className="text-center py-10">
          <div className="text-5xl mb-2 heart-pulse">💍</div>
          <p className="font-display text-2xl text-roseDark">
            {PLAYERS.find((p) => p.id === room.winner)?.label} wins the heart!
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm mb-3">
            {isMyTurn ? (
              <span className="font-semibold text-roseDark">Your move, {myPlayer?.emoji}</span>
            ) : (
              <span>Waiting on {turnPlayer?.label} {turnPlayer?.emoji}...</span>
            )}
          </p>

          <Board tokens={room.tokens} onTokenClick={handleTokenClick} movableSet={movableSet} />

          <div className="mt-5 flex items-center gap-4">
            <Dice
              value={diceValue}
              rolling={rolling}
              onRoll={handleRoll}
              disabled={!isMyTurn || hasRolledThisTurn}
              color={myPlayer?.color}
            />
            <p className="text-xs text-plum/50 max-w-[160px]">
              {isMyTurn && !hasRolledThisTurn && "Tap the dice to roll"}
              {isMyTurn && hasRolledThisTurn && movableSet.size > 0 && "Tap a glowing piece to move it"}
              {isMyTurn && hasRolledThisTurn && movableSet.size === 0 && "No legal move — passing turn..."}
            </p>
          </div>

          {players.length < 2 && (
            <p className="mt-6 text-xs text-plum/40">Share code {code} with your date to begin 💌</p>
          )}
        </>
      )}
    </div>
  );
}
