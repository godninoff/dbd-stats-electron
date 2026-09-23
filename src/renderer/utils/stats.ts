export type RawStat = {
  name: string;
  displayName: string;
  value: number;
};

export const formatNumber = (value: number | string) => {
  if (typeof value !== "number") {
    return value;
  }

  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
};

export const findStatByName = (
  stats: RawStat[],
  name: string,
): RawStat | undefined => {
  return stats.find((stat) => stat.name === name);
};
