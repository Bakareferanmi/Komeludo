// Core Ludo rules engine for Komeludo
// Board: standard 52-cell outer path, indices 0-51.
// Each player has a start offset on the outer path, a home-column entry point,
// and 6 home-column cells (52-57) before reaching FINISH (58).

export const PLAYERS = [
  { id: "rose", label: "Rose", emoji: "🌹", color: "#E85D75", startIndex: 0 },
  { id: "gold", label: "Gold", emoji: "💍", color: "#D4A574", startIndex: 13 },
  { id: "blush", label: "Blush", emoji: "💗", color: "#F7B2C4", startIndex: 26 },
  { id: "ivory", label: "Ivory", emoji: "🕊️", color: "#F5F0E8", startIndex: 39 },
];

const PATH_LENGTH = 52;
const HOME_COLUMN_LENGTH = 6;
export const FINISH = 58;

// Safe cells (star cells) — tokens here can't be captured
export const SAFE_CELLS = [0, 8, 13, 21, 26, 34, 39, 47];

export function createInitialTokens() {
  const tokens = {};
  PLAYERS.forEach((p) => {
    tokens[p.id] = [
      { id: 0, pos: -1 }, // -1 = still in base/yard
      { id: 1, pos: -1 },
      { id: 2, pos: -1 },
      { id: 3, pos: -1 },
    ];
  });
  return tokens;
}

// Convert a token's local progress (0..57) to its global board cell for rendering.
// pos: -1 = in yard, 0..50 = steps taken on the shared outer track relative to
// that player's own start, 51..56 = home column, 57 = finished.
export function localToGlobalCell(playerId, localPos) {
  const player = PLAYERS.find((p) => p.id === playerId);
  if (localPos < 0) return null; // in yard
  if (localPos >= 51) {
    return { type: "home-column", index: localPos - 51 }; // 0..6 (6 = finished)
  }
  const globalIndex = (player.startIndex + localPos) % PATH_LENGTH;
  return { type: "outer", index: globalIndex };
}

export function isSafeCell(globalIndex) {
  return SAFE_CELLS.includes(globalIndex);
}

export function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

// Returns true if a token can legally move `steps` given its current local pos
export function canMove(token, steps) {
  if (token.pos === -1) return steps === 6; // need a 6 to leave the yard
  const newPos = token.pos + steps;
  return newPos <= 57;
}

// Applies a move, returns { tokens, captured: [{playerId, tokenId}] }
export function applyMove(tokens, playerId, tokenId, steps) {
  const next = JSON.parse(JSON.stringify(tokens));
  const token = next[playerId].find((t) => t.id === tokenId);
  const captured = [];

  if (token.pos === -1) {
    if (steps !== 6) return { tokens: next, captured };
    token.pos = 0;
  } else {
    const newPos = token.pos + steps;
    if (newPos > 57) return { tokens: next, captured }; // overshoot, illegal
    token.pos = newPos;
  }

  // Check for captures if token landed on the outer (shared) track
  const cell = localToGlobalCell(playerId, token.pos);
  if (cell && cell.type === "outer" && !isSafeCell(cell.index)) {
    Object.keys(next).forEach((otherPlayerId) => {
      if (otherPlayerId === playerId) return;
      next[otherPlayerId].forEach((otherToken) => {
        if (otherToken.pos === -1) return;
        const otherCell = localToGlobalCell(otherPlayerId, otherToken.pos);
        if (otherCell && otherCell.type === "outer" && otherCell.index === cell.index) {
          captured.push({ playerId: otherPlayerId, tokenId: otherToken.id });
          otherToken.pos = -1; // send back to yard
        }
      });
    });
  }

  return { tokens: next, captured };
}

export function hasPlayerWon(tokens, playerId) {
  return tokens[playerId].every((t) => t.pos === 57);
}

export function getMovableTokens(tokens, playerId, steps) {
  return tokens[playerId].filter((t) => canMove(t, steps));
}
