// Clarity desktop shell: one window, a ledger file in the user's data folder, and daily backups.
const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const SMOKE = process.env.CLARITY_SMOKE === '1';
if (SMOKE) app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'clarity-smoke-')));

const dataFile = () => path.join(app.getPath('userData'), 'ledger.json');
const backupDir = () => path.join(app.getPath('userData'), 'backups');
const KEEP_BACKUPS = 30;

function writeAtomic(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, text, 'utf8');
  fs.renameSync(tmp, file);
}

// One backup per day: the first save of the day copies the ledger, and the oldest copies are pruned.
function dailyBackup(text) {
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const file = path.join(backupDir(), `ledger-${stamp}.json`);
  if (fs.existsSync(file)) return;
  writeAtomic(file, text);
  const old = fs.readdirSync(backupDir()).filter(f => /^ledger-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  for (const f of old.slice(0, Math.max(0, old.length - KEEP_BACKUPS))) fs.rmSync(path.join(backupDir(), f), { force: true });
}

ipcMain.on('app:info', e => {
  e.returnValue = { dataPath: dataFile(), version: app.getVersion(), platform: process.platform };
});
ipcMain.on('ledger:load', e => {
  try { e.returnValue = fs.readFileSync(dataFile(), 'utf8'); } catch { e.returnValue = null; }
});
ipcMain.handle('ledger:save', (_e, text) => {
  if (typeof text !== 'string') throw new Error('Invalid ledger data');
  writeAtomic(dataFile(), text);
  dailyBackup(text);
  return true;
});
ipcMain.handle('file:save', async (e, { name, content }) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const ext = path.extname(String(name)).slice(1).toLowerCase();
  const filters = ext === 'csv' ? [{ name: 'CSV spreadsheet', extensions: ['csv'] }] : [{ name: 'Clarity backup', extensions: ['json'] }];
  const r = await dialog.showSaveDialog(win, { defaultPath: path.join(app.getPath('documents'), path.basename(String(name))), filters });
  if (r.canceled || !r.filePath) return null;
  fs.writeFileSync(r.filePath, String(content), 'utf8');
  return r.filePath;
});
ipcMain.handle('file:open', async e => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name: 'Clarity backup', extensions: ['json'] }] });
  if (r.canceled || !r.filePaths[0]) return null;
  return fs.readFileSync(r.filePaths[0], 'utf8');
});
ipcMain.on('win', (e, action) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (!w) return;
  if (action === 'minimize') w.minimize();
  else if (action === 'maximize') w.isMaximized() ? w.unmaximize() : w.maximize();
  else if (action === 'close') w.close();
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200, height: 800, minWidth: 760, minHeight: 520,
    frame: false, // Clarity draws its own classic title bar
    backgroundColor: '#d4d0c8',
    title: 'Clarity',
    icon: path.join(__dirname, 'build', 'icon.png'),
    show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.once('ready-to-show', () => { if (!SMOKE) win.show(); });
  win.webContents.on('will-navigate', e => e.preventDefault());
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));

  if (SMOKE) {
    const errors = [];
    win.webContents.on('console-message', e => { if (e.level === 'error') errors.push(e.message); });
    win.webContents.on('did-finish-load', async () => {
      await new Promise(r => setTimeout(r, 1500));
      const result = await win.webContents.executeJavaScript(`(async () => {
        await window.clarityDesktop.save(JSON.stringify({ tx: [], categories: [], members: [] }));
        return {
          desktop: document.documentElement.classList.contains('is-desktop'),
          views: document.querySelectorAll('#content fieldset').length,
          icons: document.querySelectorAll('.ticon svg').length,
          entries: document.querySelector('#sb1')?.textContent
        };
      })()`);
      result.saved = fs.existsSync(dataFile()) && fs.readdirSync(backupDir()).length === 1;
      if (process.env.CLARITY_SHOT) fs.writeFileSync(process.env.CLARITY_SHOT, (await win.webContents.capturePage()).toPNG());
      console.log('SMOKE', JSON.stringify(result), errors.length ? 'ERRORS ' + JSON.stringify(errors) : 'no errors');
      app.exit(result.desktop && result.views > 0 && result.saved && !errors.length ? 0 : 1);
    });
  }
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
  });
  app.whenReady().then(() => {
    // macOS needs an app menu for Quit and clipboard shortcuts; elsewhere the in-window menu bar is the menu.
    Menu.setApplicationMenu(process.platform === 'darwin' ? Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }]) : null);
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
