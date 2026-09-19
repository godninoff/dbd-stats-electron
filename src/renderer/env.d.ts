interface Window {
  dbd: {
    getSettings: () => Promise<{
      hasApiKey: boolean;
      steamId: string | null;
    }>;
    setApiKey: (apiKey: string) => Promise<{ ok: true }>;
    login: () => Promise<{ steamId: string }>;
    getStats: () => Promise<unknown>;
  };
}

declare module "*.css";
