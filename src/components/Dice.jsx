import { useState, useEffect, useRef } from "react";

const PIPS = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

function Die({ value, status, selected, rolling, clickable, onClick, color }) {
  const [justLanded, setJustLanded] = useState(false);
  const wasRolling = useRef(rolling);

  useEffect(() => {
    if (wasRolling.current && !rolling && value != null) {
      setJustLanded(true);
      const t = setTimeout(() => setJustLanded(false), 650);
      wasRolling.current = rolling;
      return () => clearTimeout(t);
    }
    wasRolling.current = rolling;
  }, [rolling, value]);

  function handleClick() {
    if (!clickable) return;
    if (navigator.vibrate) navigator.vibrate(12);
    onClick();
  }

  const particles = justLanded
    ? Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const dist = 24 + (i % 2) * 10;
        return { id: i, tx: Math.cos(angle) * dist, ty: Math.sin(angle) * dist };
      })
    : [];

  return (
    <div className="relative">
      <div
        className={`absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-9 h-2.5 rounded-full bg-black/30 blur-[2px] transition-opacity
          ${rolling ? "dice-shadow-rolling" : ""}`}
      />

      {particles.map((p) => (
        <span
          key={p.id}
          className="confetti-dot w-1.5 h-1.5"
          style={{
            left: "50%",
            top: "50%",
            backgroundColor: color,
            "--tx": `${p.tx}px`,
            "--ty": `${p.ty}px`,
          }}
        />
      ))}

      <button
        onClick={handleClick}
        disabled={!clickable}
        style={justLanded ? { "--glow-color": `${color}99` } : undefined}
        className={`relative w-14 h-14 rounded-2xl bg-white shadow-md border-2 flex items-center justify-center transition-transform
          ${selected ? "border-tomato ring-4 ring-tomato/25 scale-105" : "border-ink/10"}
          ${status === "used" ? "opacity-30" : ""}
          ${rolling ? "dice-rolling" : value == null && clickable ? "dice-idle" : ""}
          ${justLanded ? "dice-glow" : ""}
          ${clickable ? "active:scale-90 cursor-pointer" : "cursor-default"}`}
      >
        {value == null ? (
          <span className="text-ink/20 text-2xl font-bold">?</span>
        ) : (
          <svg viewBox="0 0 100 100" className="w-full h-full p-2.5">
            {(PIPS[value] || PIPS[1]).map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="9" fill={color} />
            ))}
          </svg>
        )}
      </button>
    </div>
  );
}

export default function DicePair({
  values,
  dieStatus,
  selectedDie,
  rolling,
  hasRolled,
  onRoll,
  onSelectDie,
  disabled,
  color = "#FF6347",
}) {
  return (
    <div className="flex items-center gap-4">
      {[0, 1].map((i) => (
        <Die
          key={i}
          value={values[i]}
          status={dieStatus[i]}
          selected={selectedDie === i}
          rolling={rolling}
          clickable={hasRolled ? dieStatus[i] === "available" && !disabled : !disabled}
          onClick={hasRolled ? () => onSelectDie(i) : onRoll}
          color={color}
        />
      ))}
    </div>
  );
}
