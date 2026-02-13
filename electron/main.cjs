const { app, BrowserWindow, Menu, session } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    icon: path.join(__dirname, '../public/pwa-icon-512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
    title: 'Sistema PDV',
  });

  const publishedURL = 'https://cloud-ponto-magico.lovable.app';

  // Clear ALL caches before loading to prevent stale SW/cache issues
  const ses = mainWindow.webContents.session;
  ses.clearCache().then(() => {
    return ses.clearStorageData({
      storages: ['serviceworkers', 'cachestorage'],
    });
  }).then(() => {
    loadApp();
  }).catch(() => {
    loadApp();
  });

  function loadApp() {
    if (app.isPackaged) {
      mainWindow.loadURL(publishedURL).catch(() => {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
      });
    } else {
      mainWindow.loadURL('http://localhost:5173');
      mainWindow.webContents.openDevTools();
    }
  }

  // Unregister SWs and add safety net after page loads
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(regs) {
          regs.forEach(function(r) { r.unregister(); });
        });
      }

      // Safety: if React hasn't rendered after 8s, reload once
      setTimeout(function() {
        var root = document.getElementById('root');
        if (root && root.innerHTML.length < 100 && !window.__pdv_reloaded) {
          window.__pdv_reloaded = true;
          location.reload();
        }
      }, 8000);
    `).catch(function() {});
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    mainWindow.webContents.executeJavaScript(
      'document.body.innerHTML = "<div style=\\'padding:40px;font:16px sans-serif\\'><h1>Erro ao carregar</h1><p>Erro: ' + errorDescription + ' (' + errorCode + ')</p><p>Verifique sua conexão com a internet.</p></div>";'
    ).catch(function() {});

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  if (app.isPackaged) {
    Menu.setApplicationMenu(null);
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
