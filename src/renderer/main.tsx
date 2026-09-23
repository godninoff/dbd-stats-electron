import React, { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { useGoals } from "./hooks/useGoals";
import { StatCard } from "./components/StatCard";
import { STATS } from "./constants/stats";
import { formatNumber, findStatByName, RawStat } from "./utils/stats";
import "./index.css";

type StatCard = {
  id: string;
  label: string;
  value: number | string;
};

const App = () => {
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [steamId, setSteamId] = useState<string | null>(null);

  const { goals, editingGoal, setEditingGoal, setGoal, addToGoal } = useGoals();

  const [stats, setStats] = useState<StatCard[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    if (!steamId) {
      return;
    }

    setLoading(true);

    try {
      const raw = (await window.dbd.getStats()) as RawStat[];
      // const stat = raw.find((stat) => stat.value === 3414);

      // console.log(stat);
      setStats(
        STATS.map(([id, label]) => ({
          id,
          label,
          value: findStatByName(raw, id)?.value ?? "—",
        })),
      );

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
            const isEditing = editingGoal === stat.id;

            return (
              <StatCard
                key={stat.id}
                id={stat.id}
                label={stat.label}
                value={stat.value}
                goal={goal}
                isEditing={isEditing}
                onEditGoal={() => setEditingGoal(stat.id)}
                onSetGoal={(value) => setGoal(stat.id, value)}
                onFinishEditing={() => setEditingGoal(null)}
                onAddToGoal={() => addToGoal(stat.id, stat.value)}
                formatNumber={formatNumber}
              />
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
