import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('dbd', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setApiKey: (apiKey: string) => ipcRenderer.invoke('settings:setApiKey', apiKey),
  login: () => ipcRenderer.invoke('steam:login'),
  getStats: () => ipcRenderer.invoke('stats:get'),
});
