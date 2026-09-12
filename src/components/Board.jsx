import { PLAYERS, localToGlobalCell, SAFE_CELLS } from "../game/ludoLogic";

// 52-cell outer track, mapped to a 15x15 grid (row, col), 0-indexed.
export const TRACK = [
  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0],
];

const HOME_COLUMNS = {
  rose: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  gold: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  blush: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  ivory: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
};

const YARD_ORIGIN = {
  rose: [9, 1],
  gold: [1, 9],
  blush: [1, 1],
  ivory: [9, 9],
};

const YARD_COLOR = {
  rose: "bg-rosePlayer",
  gold: "bg-goldPlayer",
  blush: "bg-blushPlayer",
  ivory: "bg-ivoryPlayer",
};

const HOME_TRIANGLE = {
  rose: "border-t-rosePlayer",
  gold: "border-b-goldPlayer",
  blush: "border-r-blushPlayer",
  ivory: "border-l-ivoryPlayer",
};

function cellKey(r, c) {
  return `${r}-${c}`;
}

export default function Board({ tokens, onTokenClick, movableSet }) {
  const trackCells = {};
  TRACK.forEach(([r, c], i) => (trackCells[cellKey(r, c)] = i));

  const renderTokens = [];
  PLAYERS.forEach((player) => {
    (tokens?.[player.id] || []).forEach((token) => {
      let r, c;
      if (token.pos === -1) {
        const [yr, yc] = YARD_ORIGIN[player.id];
        r = yr + Math.floor(token.id / 2) * 2;
        c = yc + (token.id % 2) * 2;
      } else if (token.pos >= 51) {
        const idx = Math.min(token.pos - 51, 5);
        [r, c] = HOME_COLUMNS[player.id][idx];
      } else {
        const cell = localToGlobalCell(player.id, token.pos);
        [r, c] = TRACK[cell.index];
      }
      const key = `${player.id}-${token.id}`;
      const movable = movableSet?.has(key);
      renderTokens.push({ key, r, c, player, token, movable });
    });
  });

  return (
    <div className="relative w-full max-w-md aspect-square bg-white rounded-3xl shadow-xl border-2 border-ink/5 p-3">
      <div
        className="grid w-full h-full rounded-2xl overflow-hidden border-2 border-ink/10"
        style={{ gridTemplateColumns: "repeat(15, 1fr)", gridTemplateRows: "repeat(15, 1fr)" }}
      >
        {Array.from({ length: 15 * 15 }).map((_, i) => {
          const r = Math.floor(i / 15);
          const c = i % 15;
          const onTrack = trackCells[cellKey(r, c)] !== undefined;
          const isSafe = onTrack && SAFE_CELLS.includes(trackCells[cellKey(r, c)]);
          const isCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;

          let content = null;
          let extraClass = "bg-white";

          if (isCenter) {
            // 4 triangles meeting at center, each colored to a player's home lane
            if (r === 7 && c === 7) {
              extraClass = "bg-ink";
              content = <span className="text-white text-[10px]">★</span>;
            } else if (r < 7) extraClass = "bg-goldPlayer/90";
            else if (r > 7) extraClass = "bg-ivoryPlayer/90";
            else if (c < 7) extraClass = "bg-rosePlayer/90";
            else extraClass = "bg-blushPlayer/90";
          } else if (onTrack) {
            extraClass = isSafe ? "bg-tomatoLight" : "bg-white";
            if (isSafe) content = <span className="text-tomato text-[9px]">✦</span>;
          } else {
            // yard quadrants — solid color block with rounded inner white panel look
            let yardColor = null;
            if (r < 6 && c < 6) yardColor = "rose";
            else if (r < 6 && c > 8) yardColor = "gold";
            else if (r > 8 && c < 6) yardColor = "blush";
            else if (r > 8 && c > 8) yardColor = "ivory";

            if (yardColor) {
              extraClass = `${YARD_COLOR[yardColor]}`;
            } else {
              extraClass = "bg-white";
            }
          }

          return (
            <div
              key={i}
              className={`${extraClass} border border-ink/5 flex items-center justify-center`}
            >
              {content}
            </div>
          );
        })}
      </div>

      {/* Tokens */}
      {renderTokens.map(({ key, r, c, player, movable }) => (
        <button
          key={key}
          onClick={() => movable && onTokenClick?.(player.id, key.split("-")[1] * 1)}
          className={`absolute flex items-center justify-center rounded-full text-sm shadow-md border-2 border-white transition
            ${movable ? "ring-4 ring-tomato animate-pulse cursor-pointer scale-110 z-10" : ""}`}
          style={{
            width: "6.2%",
            height: "6.2%",
            left: `${(c / 15) * 100 + 0.5}%`,
            top: `${(r / 15) * 100 + 0.5}%`,
            backgroundColor: player.color,
          }}
          title={`${player.label} ${player.emoji}`}
        />
      ))}
    </div>
  );
}
