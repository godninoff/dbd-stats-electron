import http from "node:http";
import { URL } from "node:url";

const OPENID_IDENTITY = "http://specs.openid.net/auth/2.0/identifier_select";

const OPENID_CLAIMED = "http://specs.openid.net/auth/2.0/identifier_select";

const OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";

const APP_ID = "381210";

const UNCLOAK_STAT = "DBD_UncloakAttack";
const CHEST_STAT = "DBD_DLC7_Camper_Stat1";
const LOCK_ON_STAT = "DBD_Chapter27_Slasher_Stat1";

export type SteamStat = {
  name: string;
  displayName: string;
  value: number;
};

type SchemaResponse = {
  game?: {
    gameName?: string;
    availableGameStats?: {
      stats?: Array<{
        name: string;
        displayName?: string;
      }>;
    };
  };
};

type UserStatsResponse = {
  playerstats?: {
    steamID?: string;
    gameName?: string;
    stats?: Array<{
      name: string;
      value: number;
    }>;
  };
};

const requestJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Steam API: ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const prepareSteamLogin = async () => {
  const server = http.createServer();

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);

    server.listen(0, "127.0.0.1", () => {
      resolve();
    });
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    server.close();

    throw new Error("Failed to create Steam callback server");
  }

  const callback = `http://127.0.0.1:${address.port}/steam/callback`;

  const loginUrl = new URL(OPENID_ENDPOINT);

  loginUrl.searchParams.set("openid.ns", "http://specs.openid.net/auth/2.0");

  loginUrl.searchParams.set("openid.mode", "checkid_setup");
  loginUrl.searchParams.set("openid.return_to", callback);
  loginUrl.searchParams.set("openid.realm", `http://127.0.0.1:${address.port}`);

  loginUrl.searchParams.set("openid.identity", OPENID_IDENTITY);

  loginUrl.searchParams.set("openid.claimed_id", OPENID_CLAIMED);

  const resultPromise = new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(
      () => {
        server.close();

        reject(new Error("Steam login timed out"));
      },
      5 * 60 * 1000,
    );

    server.on("request", (req, res) => {
      if (!req.url?.startsWith("/steam/callback")) {
        res.writeHead(404);
        res.end();

        return;
      }

      const callbackUrl = new URL(req.url, callback);

      const claimedId = callbackUrl.searchParams.get("openid.claimed_id") ?? "";

      const match = claimedId.match(/\/id\/(\d+)$/);

      clearTimeout(timeout);
      server.close();

      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
      });

      res.end(`
        <h2>
          Steam авторизация завершена.
          Вернитесь в приложение.
        </h2>
      `);

      if (!match) {
        reject(new Error("SteamID was not returned by Steam"));

        return;
      }

      resolve(match[1]);
    });
  });

  return {
    loginUrl: loginUrl.toString(),
    resultPromise,
  };
};

export const getStats = async (
  apiKey: string,
  steamId: string,
): Promise<SteamStat[]> => {
  const schemaUrl = new URL(
    "https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/",
  );

  schemaUrl.searchParams.set("key", apiKey);
  schemaUrl.searchParams.set("appid", APP_ID);
  schemaUrl.searchParams.set("l", "en");

  const userUrl = new URL(
    "https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/",
  );

  userUrl.searchParams.set("key", apiKey);
  userUrl.searchParams.set("steamid", steamId);
  userUrl.searchParams.set("appid", APP_ID);

  const [schema, user] = await Promise.all([
    requestJson<SchemaResponse>(schemaUrl.toString()),
    requestJson<UserStatsResponse>(userUrl.toString()),
  ]);

  const schemaStats = schema.game?.availableGameStats?.stats ?? [];

  const userStats = user.playerstats?.stats ?? [];

  const values = new Map(userStats.map((stat) => [stat.name, stat.value]));

  /*
   * Берём ВСЕ статы из schema.
   *
   * Если Steam не прислал значение пользователя,
   * считаем его равным 0.
   *
   * Поэтому статы со значением 0 тоже попадут
   * в результат.
   */
  return schemaStats.map((stat) => ({
    name: stat.name,
    displayName: stat.displayName ?? stat.name,
    value: values.get(stat.name) ?? 0,
  }));
};

const normalize = (value: string): string => {
  return value.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "");
};

export const findStat = (
  stats: SteamStat[],
  terms: string[],
): SteamStat | undefined => {
  const normalizedTerms = terms.map(normalize);

  return stats.find((stat) => {
    const haystack = normalize(`${stat.name} ${stat.displayName}`);

    return normalizedTerms.every((term) => haystack.includes(term));
  });
};

export const getImportantStats = (stats: SteamStat[]) => {
  const uncloak =
    stats.find((stat) => stat.name === UNCLOAK_STAT) ??
    findStat(stats, ["uncloak", "wraith"]);

  const chest =
    stats.find((stat) => stat.name === CHEST_STAT) ??
    findStat(stats, ["chest", "searched"]);

  const lockOn =
    stats.find((stat) => stat.name === LOCK_ON_STAT) ??
    findStat(stats, ["lock", "on"]);

  return {
    uncloak,
    chest,
    lockOn,
  };
};
