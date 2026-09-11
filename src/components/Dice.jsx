const PIPS = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

export default function Dice({ value, rolling, onRoll, disabled, color = "#E85D75" }) {
  return (
    <button
      onClick={onRoll}
      disabled={disabled}
      className={`relative w-16 h-16 rounded-2xl bg-white shadow-lg border-2 transition
        ${disabled ? "opacity-40" : "active:scale-90"}
        ${rolling ? "animate-bounce" : ""}`}
      style={{ borderColor: color }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full p-2">
        {(PIPS[value] || PIPS[1]).map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="8" fill={color} />
        ))}
      </svg>
    </button>
  );
}
