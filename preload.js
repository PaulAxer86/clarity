// Exposes a small, explicit API to the page. The page never gets direct access to Node or the file system.
const { contextBridge, ipcRenderer } = require('electron');

const info = ipcRenderer.sendSync('app:info');

contextBridge.exposeInMainWorld('clarityDesktop', {
  version: info.version,
  dataPath: info.dataPath,
  platform: info.platform,
  load: () => ipcRenderer.sendSync('ledger:load'),
  save: text => ipcRenderer.invoke('ledger:save', text),
  saveFile: (name, content) => ipcRenderer.invoke('file:save', { name, content }),
  openFile: () => ipcRenderer.invoke('file:open'),
  win: action => ipcRenderer.send('win', action)
});
