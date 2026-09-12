import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { ensureAuth, subscribeRoom, updateRoom } from "../socket";
import { PLAYERS, rollDice, getMovableTokens, applyMove, hasPlayerWon } from "../game/ludoLogic";
import Board from "../components/Board";
import DicePair from "../components/Dice";

export default function Room() {
  const { code } = useParams();
  const [room, setRoom] = useState(null);
  const [uid, setUid] = useState(null);

  const [diceValues, setDiceValues] = useState([null, null]);
  const [dieStatus, setDieStatus] = useState(["available", "available"]);
  const [selectedDie, setSelectedDie] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [hasRolledThisTurn, setHasRolledThisTurn] = useState(false);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    ensureAuth().then(setUid);
  }, []);

  useEffect(() => {
    const unsub = subscribeRoom(code, setRoom);
    return unsub;
  }, [code]);

  const players = useMemo(() => (room?.players ? Object.entries(room.players) : []), [room]);
  const myEntry = players.find(([id]) => id === uid);
  const myPlayerId = myEntry?.[1]?.playerId;
  const isMyTurn = room?.turn === myPlayerId;

  function nextTurnId(currentId) {
    const activeIds = players.map(([, p]) => p.playerId);
    const order = PLAYERS.map((p) => p.id).filter((id) => activeIds.includes(id));
    const idx = order.indexOf(currentId);
    return order[(idx + 1) % order.length];
  }

  // Auto-skip a die if the player has no legal move for its value
  useEffect(() => {
    if (!isMyTurn || !hasRolledThisTurn || !room?.tokens) return;
    const newStatus = [...dieStatus];
    let changed = false;
    diceValues.forEach((val, i) => {
      if (newStatus[i] === "available" && val != null) {
        const movable = getMovableTokens(room.tokens, myPlayerId, val);
        if (movable.length === 0) {
          newStatus[i] = "used";
          changed = true;
        }
      }
    });
    if (changed) setDieStatus(newStatus);
  }, [diceValues, room?.tokens, hasRolledThisTurn, isMyTurn]);

  // When both dice are used, pass the turn (unless doubles — bonus turn)
  useEffect(() => {
    if (!isMyTurn || !hasRolledThisTurn) return;
    if (dieStatus.every((s) => s === "used")) {
      const isDouble = diceValues[0] != null && diceValues[0] === diceValues[1];
      (async () => {
        if (!isDouble) {
          await updateRoom(code, { turn: nextTurnId(myPlayerId) });
        }
        setDiceValues([null, null]);
        setDieStatus(["available", "available"]);
        setSelectedDie(null);
        setHasRolledThisTurn(false);
      })();
    }
  }, [dieStatus]);

  const movableSet = useMemo(() => {
    if (!room?.tokens || !isMyTurn || selectedDie === null) return new Set();
    const val = diceValues[selectedDie];
    const movable = getMovableTokens(room.tokens, myPlayerId, val);
    return new Set(movable.map((t) => `${myPlayerId}-${t.id}`));
  }, [room, isMyTurn, selectedDie, diceValues, myPlayerId]);

  function handleRoll() {
    if (!isMyTurn || hasRolledThisTurn) return;
    setRolling(true);
    const d1 = rollDice();
    const d2 = rollDice();
    setTimeout(() => {
      setDiceValues([d1, d2]);
      setDieStatus(["available", "available"]);
      setSelectedDie(null);
      setRolling(false);
      setHasRolledThisTurn(true);
    }, 500);
  }

  function handleSelectDie(i) {
    if (dieStatus[i] !== "available") return;
    setSelectedDie(i);
  }

  async function handleTokenClick(playerId, tokenId) {
    if (!isMyTurn || selectedDie === null || playerId !== myPlayerId) return;
    const steps = diceValues[selectedDie];
    const { tokens: newTokens } = applyMove(room.tokens, playerId, tokenId, steps);
    const won = hasPlayerWon(newTokens, playerId);
    const updates = { tokens: newTokens };
    if (won) {
      updates.status = "finished";
      updates.winner = playerId;
    }
    await updateRoom(code, updates);
    const newStatus = [...dieStatus];
    newStatus[selectedDie] = "used";
    setDieStatus(newStatus);
    setSelectedDie(null);
    if (won) setWinner(playerId);
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink font-body">
        <p className="animate-pulse">Setting up the board...</p>
      </div>
    );
  }

  const myPlayer = PLAYERS.find((p) => p.id === myPlayerId);
  const turnPlayer = PLAYERS.find((p) => p.id === room.turn);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 text-ink font-body">
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-ink/40 font-medium">Room code</p>
          <p className="font-display font-extrabold text-xl tracking-widest text-tomato">{code}</p>
        </div>
        <div className="flex -space-x-2">
          {players.map(([id, p]) => {
            const pl = PLAYERS.find((x) => x.id === p.playerId);
            return (
              <div
                key={id}
                title={p.name}
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow"
                style={{ backgroundColor: pl?.color }}
              >
                {p.name?.[0]?.toUpperCase()}
              </div>
            );
          })}
        </div>
      </div>

      {room.status === "finished" ? (
        <div className="text-center py-10">
          <div className="text-5xl mb-2">🏆</div>
          <p className="font-display font-extrabold text-2xl text-tomato">
            {PLAYERS.find((p) => p.id === room.winner)?.label} wins!
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm mb-3 font-medium">
            {isMyTurn ? (
              <span className="font-bold text-tomato">Your move</span>
            ) : (
              <span className="text-ink/50">Waiting on {turnPlayer?.label}...</span>
            )}
          </p>

          <Board tokens={room.tokens} onTokenClick={handleTokenClick} movableSet={movableSet} />

          <div className="mt-5 flex items-center gap-4">
            <DicePair
              values={diceValues}
              dieStatus={dieStatus}
              selectedDie={selectedDie}
              rolling={rolling}
              hasRolled={hasRolledThisTurn}
              onRoll={handleRoll}
              onSelectDie={handleSelectDie}
              disabled={!isMyTurn}
              color={myPlayer?.color}
            />
            <p className="text-xs text-ink/50 max-w-[160px]">
              {isMyTurn && !hasRolledThisTurn && "Tap the dice to roll"}
              {isMyTurn && hasRolledThisTurn && selectedDie === null && "Tap an available die, then a piece"}
              {isMyTurn && hasRolledThisTurn && selectedDie !== null && "Tap a glowing piece to move it"}
            </p>
          </div>

          {players.length < 2 && (
            <p className="mt-6 text-xs text-ink/40">Share code {code} to begin</p>
          )}
        </>
      )}
    </div>
  );
}
