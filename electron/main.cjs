const { app, BrowserWindow, Menu, session, dialog, globalShortcut } = require('electron');
const path = require('path');

// Disable GPU acceleration to prevent white screen on some machines
app.disableHardwareAcceleration();

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

  // Unregister SWs, disable backdrop-blur, and add safety net after page loads
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(regs) {
          regs.forEach(function(r) { r.unregister(); });
        });
      }

      // Disable backdrop-filter which can cause white screen on some GPUs
      var style = document.createElement('style');
      style.textContent = '* { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }';
      document.head.appendChild(style);

      // Remove update modal localStorage entry to prevent it from showing
      localStorage.removeItem('update-notice-version-dismissed');

      // Debug overlay — shows diagnostic info on screen
      var dbg = document.createElement('div');
      dbg.id = 'electron-debug';
      dbg.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:black;color:lime;font:12px monospace;padding:8px;z-index:999999;max-height:200px;overflow:auto;';
      document.body.appendChild(dbg);
      function log(msg) { dbg.innerHTML += msg + '<br>'; }
      log('URL: ' + location.href);
      log('Root: ' + (document.getElementById('root') ? document.getElementById('root').innerHTML.length + ' chars' : 'NOT FOUND'));

      // Capture JS errors
      window.addEventListener('error', function(e) { log('ERR: ' + e.message); });
      window.addEventListener('unhandledrejection', function(e) { log('REJECT: ' + (e.reason && e.reason.message || e.reason)); });

      // Safety: if React hasn't rendered after 8s, reload once
      setTimeout(function() {
        var root = document.getElementById('root');
        log('8s check — root length: ' + (root ? root.innerHTML.length : 'null'));
        if (root && root.innerHTML.length < 100 && !window.__pdv_reloaded) {
          window.__pdv_reloaded = true;
          log('Reloading...');
          location.reload();
        }
      }, 8000);
    `).catch(function() {});
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    dialog.showErrorBox(
      'Erro ao carregar',
      'Não foi possível conectar ao servidor.\nErro: ' + errorDescription + ' (' + errorCode + ')\n\nVerifique sua conexão com a internet.'
    );
    // Try local fallback
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch(function() {});
  });

  // Render process crashed
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    dialog.showErrorBox('Erro', 'O processo de renderização falhou: ' + details.reason);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  if (app.isPackaged) {
    Menu.setApplicationMenu(null);
  }
  createWindow();

  // Register F12 and Ctrl+Shift+I to open DevTools in production
  globalShortcut.register('F12', () => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.toggleDevTools();
    }
  });
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // Auto-open DevTools for 30s to capture errors on startup
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.openDevTools();
  }
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
