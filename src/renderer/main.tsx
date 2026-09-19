import React, { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

type RawStat = {
  name: string;
  displayName: string;
  value: number;
};

type StatCard = {
  id: string;
  label: string;
  value: number | string;
};

type Goals = Record<string, number>;

const STAT_IDS = {
  uncloak: "DBD_UncloakAttack",
  chest: "DBD_DLC7_Camper_Stat1",
  lockOn: "DBD_Chapter27_Slasher_Stat1",
  skillChecks: "DBD_SkillCheckSuccess",
  generators: "DBD_GeneratorPct_float",
  healed: "DBD_HealPct_float",
  sacrifices: "DBD_SacrificedCampers",
} as const;

const GOALS_STORAGE_KEY = "dbd-stat-goals";

const formatNumber = (value: number | string) => {
  if (typeof value !== "number") {
    return value;
  }

  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
};

const findStatByName = (
  stats: RawStat[],
  name: string,
): RawStat | undefined => {
  return stats.find((stat) => stat.name === name);
};

const loadGoals = (): Goals => {
  try {
    const savedGoals = localStorage.getItem(GOALS_STORAGE_KEY);

    if (!savedGoals) {
      return {};
    }

    return JSON.parse(savedGoals) as Goals;
  } catch {
    return {};
  }
};

const App = () => {
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [steamId, setSteamId] = useState<string | null>(null);

  const [goals, setGoals] = useState<Goals>(() => loadGoals());
  const [openGoals, setOpenGoals] = useState<Record<string, boolean>>({});

  const [stats, setStats] = useState<StatCard[]>([
    { id: STAT_IDS.uncloak, label: "Uncloak attacks", value: "—" },
    { id: STAT_IDS.chest, label: "Chest searched", value: "—" },
    { id: STAT_IDS.lockOn, label: "Lock-on mechanic", value: "—" },
    { id: STAT_IDS.skillChecks, label: "Skill checks", value: "—" },
    { id: STAT_IDS.generators, label: "Generators repaired", value: "—" },
    { id: STAT_IDS.healed, label: "Survivors healed", value: "—" },
    { id: STAT_IDS.sacrifices, label: "Survivor sacrifice", value: "—" },
  ]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    if (!steamId) {
      return;
    }

    setLoading(true);

    try {
      const raw = (await window.dbd.getStats()) as RawStat[];

      const uncloak = findStatByName(raw, STAT_IDS.uncloak);
      const chest = findStatByName(raw, STAT_IDS.chest);
      const lockOn = findStatByName(raw, STAT_IDS.lockOn);
      const skillChecks = findStatByName(raw, STAT_IDS.skillChecks);
      const generators = findStatByName(raw, STAT_IDS.generators);
      const healed = findStatByName(raw, STAT_IDS.healed);
      const sacrifices = findStatByName(raw, STAT_IDS.sacrifices);

      setStats([
        {
          id: STAT_IDS.uncloak,
          label: "Uncloak attacks",
          value: uncloak?.value ?? "—",
        },
        {
          id: STAT_IDS.chest,
          label: "Chest searched",
          value: chest?.value ?? "—",
        },
        {
          id: STAT_IDS.lockOn,
          label: "Lock-on mechanic",
          value: lockOn?.value ?? "—",
        },
        {
          id: STAT_IDS.skillChecks,
          label: "Skill checks",
          value: skillChecks?.value ?? "—",
        },
        {
          id: STAT_IDS.generators,
          label: "Generators repaired",
          value: generators?.value ?? "—",
        },
        {
          id: STAT_IDS.healed,
          label: "Survivors healed",
          value: healed?.value ?? "—",
        },
        {
          id: STAT_IDS.sacrifices,
          label: "Survivor sacrifice",
          value: sacrifices?.value ?? "—",
        },
      ]);

      setMessage(`Обновлено ${new Date().toLocaleTimeString("ru-RU")}`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Ошибка получения статистики",
      );
    } finally {
      setLoading(false);
    }
  }, [steamId]);

  useEffect(() => {
    void window.dbd.getSettings().then((settings) => {
      setHasKey(settings.hasApiKey);
      setSteamId(settings.steamId);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    if (!steamId || !hasKey) {
      return;
    }

    void refresh();

    const timer = window.setInterval(() => {
      void refresh();
    }, 60_000);

    return () => {
      window.clearInterval(timer);
    };
  }, [hasKey, refresh, steamId]);

  const saveKey = async () => {
    setMessage("");

    try {
      await window.dbd.setApiKey(apiKey);

      setHasKey(true);
      setApiKey("");
      setMessage("API key сохранён.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка сохранения");
    }
  };

  const login = async () => {
    setLoading(true);
    setMessage("");

    try {
      const result = await window.dbd.login();

      setSteamId(result.steamId);
      setMessage("Steam подключён.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  const setGoal = (statId: string, value: string) => {
    if (value === "") {
      setGoals((prev) => {
        const next = { ...prev };
        delete next[statId];
        return next;
      });

      return;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue < 0) {
      return;
    }

    setGoals((prev) => ({
      ...prev,
      [statId]: numericValue,
    }));
  };

  return (
    <main className="min-h-screen bg-[#0a0b0d] p-5 text-white">
      <div className="min-h-[calc(100vh-40px)]">
        {!hasKey && (
          <section className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
            <div className="mb-1 text-base font-medium">Steam Web API Key</div>

            <div className="mb-4 text-sm text-zinc-500">
              Ключ нужен для получения статистики DBD через Steam API.
            </div>

            <div className="flex gap-3">
              <input
                className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="Вставь API key"
                type="password"
              />

              <button
                className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
                onClick={() => void saveKey()}
              >
                Сохранить
              </button>
            </div>
          </section>
        )}

        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!hasKey || loading || !!steamId}
              onClick={() => void login()}
            >
              {steamId
                ? "Steam подключён"
                : loading
                  ? "Подключение..."
                  : "Войти через Steam"}
            </button>

            {message && (
              <span className="text-xs text-zinc-500">{message}</span>
            )}
          </div>

          <button
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!steamId || loading}
            onClick={() => void refresh()}
          >
            {loading ? "Обновление..." : "Обновить"}
          </button>
        </div>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {stats.map((stat) => {
            const goal = goals[stat.id];
            const isGoalOpen = openGoals[stat.id];

            const numericValue =
              typeof stat.value === "number" ? stat.value : null;

            const remaining =
              goal !== undefined && numericValue !== null
                ? Math.max(goal - numericValue, 0)
                : null;

            const isCompleted =
              goal !== undefined &&
              numericValue !== null &&
              numericValue >= goal;

            return (
              <article
                key={stat.id}
                onClick={() =>
                  setOpenGoals((prev) => ({
                    ...prev,
                    [stat.id]: !prev[stat.id],
                  }))
                }
                className="cursor-pointer rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-600 hover:bg-zinc-800"
              >
                <div className="text-sm font-medium text-zinc-400">
                  {stat.label}
                </div>

                <div className="text-2xl font-semibold tracking-tight text-white">
                  {formatNumber(stat.value)}
                </div>

                {isGoalOpen && (
                  <div
                    className="mt-4"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="mb-1 text-xs text-zinc-500">Цель</div>

                    <input
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-zinc-400"
                      type="number"
                      min="0"
                      value={goal ?? ""}
                      onChange={(event) => setGoal(stat.id, event.target.value)}
                      placeholder="Не задана"
                    />

                    {remaining !== null && (
                      <div className="mt-3">
                        <div className="text-xs text-zinc-500">Осталось</div>

                        <div
                          className={`mt-1 text-lg font-semibold ${
                            isCompleted ? "text-emerald-400" : "text-white"
                          }`}
                        >
                          {formatNumber(remaining)}
                        </div>

                        {isCompleted && (
                          <div className="mt-1 text-xs text-emerald-400">
                            ✓ Цель достигнута
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
};

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
