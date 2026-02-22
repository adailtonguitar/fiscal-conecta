const { app, BrowserWindow, Menu, session, dialog, globalShortcut } = require('electron');
const path = require('path');

// Disable GPU acceleration to prevent white screen on some machines
app.disableHardwareAcceleration();

let mainWindow;

// ── Auto-Updater ──────────────────────────────────────────────
function setupAutoUpdater() {
  try {
    const { autoUpdater } = require('electron-updater');

    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('update-available', (info) => {
      if (mainWindow) {
        mainWindow.webContents.executeJavaScript(`
          (function() {
            var d = document.createElement('div');
            d.id = 'electron-update-banner';
            d.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#1d4ed8;color:#fff;text-align:center;padding:6px 12px;font:bold 13px sans-serif;';
            d.textContent = '⬇️ Nova versão ${info.version || ""} disponível. Baixando atualização...';
            document.body.appendChild(d);
          })();
        `).catch(() => {});
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      if (mainWindow) {
        mainWindow.webContents.executeJavaScript(`
          (function() {
            var el = document.getElementById('electron-update-banner');
            if (el) {
              el.style.background = '#15803d';
              el.textContent = '✅ Atualização pronta! Reinicie o app para aplicar.';
              el.style.cursor = 'pointer';
              el.onclick = function() { window.__electronRestart && window.__electronRestart(); };
            }
          })();
        `).catch(() => {});
      }

      // Show native dialog as fallback
      const response = dialog.showMessageBoxSync(mainWindow, {
        type: 'info',
        title: 'Atualização disponível',
        message: `Versão ${info.version || 'nova'} foi baixada. Deseja reiniciar agora para aplicar?`,
        buttons: ['Reiniciar agora', 'Mais tarde'],
        defaultId: 0,
      });
      if (response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });

    autoUpdater.on('error', (err) => {
      console.log('[AutoUpdater] Erro:', err.message);
    });

    // Check for updates after a short delay
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify().catch(() => {});
    }, 5000);

    // Check periodically (every 4 hours)
    setInterval(() => {
      autoUpdater.checkForUpdatesAndNotify().catch(() => {});
    }, 4 * 60 * 60 * 1000);

  } catch (err) {
    console.log('[AutoUpdater] electron-updater não disponível:', err.message);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    icon: path.join(__dirname, '../public/logo-as.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
    title: 'AnthoSystem',
  });

  const publishedURL = 'https://cloud-ponto-magico.lovable.app';

  loadApp();

  function loadApp() {
    if (app.isPackaged) {
      mainWindow.loadURL(publishedURL).catch(() => {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
      });
    } else {
      mainWindow.loadURL('http://localhost:8080');
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
    dialog.showErrorBox(
      'Erro ao carregar',
      'Não foi possível conectar ao servidor.\nErro: ' + errorDescription + ' (' + errorCode + ')\n\nVerifique sua conexão com a internet.'
    );
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch(function() {});
  });

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

  // Start auto-updater (only in production)
  if (app.isPackaged) {
    setupAutoUpdater();
  }

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
