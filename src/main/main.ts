import { app, BrowserWindow, ipcMain, safeStorage, session } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { getStats, prepareSteamLogin } from "./steam";
import { autoUpdater } from "electron-updater";

type Store = {
  steamId: string | null;
  apiKey: string | null;
};

let mainWindow: BrowserWindow | null = null;
let steamWindow: BrowserWindow | null = null;
let store: Store = { steamId: null, apiKey: null };

const storePath = () => path.join(app.getPath("userData"), "settings.json");

const loadStore = async () => {
  try {
    const raw = await fs.readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<Store>;
    store = {
      steamId: parsed.steamId ?? null,
      apiKey: parsed.apiKey ?? null,
    };
  } catch {
    store = { steamId: null, apiKey: null };
  }
};

const saveStore = async () => {
  await fs.mkdir(app.getPath("userData"), { recursive: true });
  await fs.writeFile(storePath(), JSON.stringify(store, null, 2), "utf8");
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 720,
    minWidth: 760,
    minHeight: 560,
    backgroundColor: "#0d0e10",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl) void mainWindow.loadURL(devUrl);
  else void mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
};

ipcMain.handle("settings:get", () => ({
  hasApiKey: Boolean(store.apiKey),
  steamId: store.steamId,
}));

ipcMain.handle("settings:setApiKey", async (_event, apiKey: string) => {
  const value = String(apiKey ?? "").trim();
  if (!value) throw new Error("API key is empty");
  store.apiKey = value;
  await saveStore();
  return { ok: true };
});

ipcMain.handle("steam:login", async () => {
  const { loginUrl, resultPromise } = await prepareSteamLogin();

  steamWindow = new BrowserWindow({
    width: 1000,
    height: 760,
    parent: mainWindow ?? undefined,
    modal: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  steamWindow.on("closed", () => {
    steamWindow = null;
  });

  void steamWindow.loadURL(loginUrl);

  const steamId = await resultPromise;
  store.steamId = steamId;
  await saveStore();

  if (steamWindow && !steamWindow.isDestroyed()) steamWindow.close();
  steamWindow = null;

  return { steamId };
});

ipcMain.handle("stats:get", async () => {
  if (!store.apiKey) throw new Error("Steam Web API key is not configured");
  if (!store.steamId) throw new Error("Steam login required");
  return getStats(store.apiKey, store.steamId);
});

app.whenReady().then(async () => {
  await loadStore();
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, _permission, callback) => callback(false),
  );
  createWindow();
  if (app.isPackaged) {
    void autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
