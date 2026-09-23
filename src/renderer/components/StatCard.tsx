type StatCardProps = {
  id: string;
  label: string;
  value: number | string;
  goal: number | undefined;
  isEditing: boolean;
  onEditGoal: () => void;
  onSetGoal: (value: string) => void;
  onFinishEditing: () => void;
  onAddToGoal: () => void;
  formatNumber: (value: number | string) => string | number;
};

export const StatCard = ({
  label,
  value,
  goal,
  isEditing,
  onEditGoal,
  onSetGoal,
  onFinishEditing,
  onAddToGoal,
  formatNumber,
}: StatCardProps) => {
  const numericValue = typeof value === "number" ? value : null;

  const remaining =
    goal !== undefined && numericValue !== null
      ? Math.max(goal - numericValue, 0)
      : null;

  const isCompleted =
    goal !== undefined && numericValue !== null && numericValue >= goal;

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-600 hover:bg-zinc-800">
      <div className="text-sm font-medium text-zinc-400">{label}</div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="min-w-0 text-2xl font-semibold tracking-tight text-white">
          {formatNumber(value)}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isEditing ? (
            <input
              autoFocus
              className="w-28 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-right text-sm text-white outline-none transition focus:border-zinc-400"
              type="number"
              min="0"
              value={goal ?? ""}
              onChange={(event) => onSetGoal(event.target.value)}
              onBlur={onFinishEditing}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onFinishEditing();
                }
              }}
            />
          ) : (
            <button
              className="text-sm text-zinc-400 transition hover:text-white"
              onClick={onEditGoal}
            >
              Цель:{" "}
              <span className="font-medium text-white">
                {goal !== undefined && formatNumber(goal)}
              </span>
            </button>
          )}

          <button
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950 text-sm font-medium text-white transition hover:border-zinc-500 hover:bg-zinc-800"
            onClick={onAddToGoal}
          >
            +
          </button>
        </div>
      </div>

      {remaining !== null && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="text-zinc-500">Осталось:</span>

          <span
            className={
              isCompleted
                ? "font-medium text-emerald-400"
                : "font-medium text-white"
            }
          >
            {formatNumber(remaining)}
          </span>

          {isCompleted && (
            <span className="text-emerald-400">✓ Цель достигнута</span>
          )}
        </div>
      )}
    </article>
  );
};
