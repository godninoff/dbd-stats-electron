import { useEffect, useState } from "react";

type Goals = Record<string, number>;

const GOALS_STORAGE_KEY = "dbd-stat-goals";

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

const getGoalStep = (statId: string) => {
  if (statId === "DBD_BloodwebPoints") {
    return 1_000_000;
  }

  if (statId === "DBD_SkillCheckSuccess") {
    return 1_000;
  }

  return 30;
};

export const useGoals = () => {
  const [goals, setGoals] = useState<Goals>(() => loadGoals());
  const [editingGoal, setEditingGoal] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
  }, [goals]);

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

  const addToGoal = (statId: string, currentValue: number | string) => {
    const step = getGoalStep(statId);

    const baseValue =
      goals[statId] ?? (typeof currentValue === "number" ? currentValue : 0);

    setGoals((prev) => ({
      ...prev,
      [statId]: baseValue + step,
    }));
  };

  return {
    goals,
    editingGoal,
    setEditingGoal,
    setGoal,
    addToGoal,
  };
};
