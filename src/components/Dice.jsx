const PIPS = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

function Die({ value, status, selected, rolling, clickable, onClick, color }) {
  return (
    <button
      onClick={() => clickable && onClick()}
      disabled={!clickable}
      className={`relative w-14 h-14 rounded-2xl bg-white shadow-md border-2 flex items-center justify-center transition
        ${selected ? "border-tomato ring-4 ring-tomato/25 scale-105" : "border-ink/10"}
        ${status === "used" ? "opacity-30" : ""}
        ${rolling ? "animate-bounce" : ""}
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
    <div className="flex items-center gap-3">
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
