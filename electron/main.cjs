const { app, BrowserWindow, Menu, dialog } = require('electron');
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
      webSecurity: true,
    },
    autoHideMenuBar: true,
    title: 'Sistema PDV',
  });

  const publishedURL = 'https://cloud-ponto-magico.lovable.app';

  // Unregister any service workers to prevent blank screen in Electron
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(r => r.unregister());
        });
      }
    `).catch(() => {});
  });

  // Log any page errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    dialog.showErrorBox('Erro ao carregar', 
      'URL: ' + validatedURL + '\nErro: ' + errorDescription + ' (' + errorCode + ')');
    // Fallback to local
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch(() => {});
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    dialog.showErrorBox('Processo encerrado', 'Razão: ' + details.reason);
  });

  if (app.isPackaged) {
    mainWindow.loadURL(publishedURL).catch((err) => {
      dialog.showErrorBox('Falha na conexão', err.message);
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch(() => {});
    });
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Remove default menu in production
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
