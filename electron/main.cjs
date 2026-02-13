const { app, BrowserWindow, Menu } = require('electron');
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

  // Inject debug overlay after page loads
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(r => r.unregister());
        });
      }

      // Create visible debug panel
      var debugDiv = document.createElement('div');
      debugDiv.id = 'electron-debug';
      debugDiv.style.cssText = 'position:fixed;bottom:0;left:0;right:0;max-height:200px;overflow:auto;background:#111;color:#0f0;font:12px monospace;padding:8px;z-index:999999;';
      debugDiv.innerHTML = '<b>DEBUG ELECTRON</b><br>';
      document.body.appendChild(debugDiv);

      function log(msg) {
        var d = document.getElementById('electron-debug');
        if (d) d.innerHTML += msg + '<br>';
      }

      log('URL: ' + location.href);
      log('Root element: ' + (document.getElementById('root') ? 'FOUND' : 'NOT FOUND'));
      log('Root children: ' + (document.getElementById('root') ? document.getElementById('root').childNodes.length : 0));
      log('Body children: ' + document.body.childNodes.length);

      // Capture JS errors
      window.onerror = function(msg, src, line, col, err) {
        log('<span style="color:red">ERROR: ' + msg + ' at ' + src + ':' + line + '</span>');
      };

      // Check after 3 seconds if content rendered
      setTimeout(function() {
        var root = document.getElementById('root');
        log('After 3s - Root children: ' + (root ? root.childNodes.length : 0));
        if (root && root.innerHTML.length < 100) {
          log('<span style="color:yellow">Root HTML is nearly empty (' + root.innerHTML.length + ' chars)</span>');
        } else if (root) {
          log('Root HTML length: ' + root.innerHTML.length + ' chars - App seems loaded');
        }
      }, 3000);
    `).catch(function(e) {});
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    mainWindow.webContents.executeJavaScript(
      'document.body.innerHTML = "<div style=\\'padding:40px;font:16px sans-serif\\'><h1>Erro ao carregar</h1><p>URL: ' + publishedURL + '</p><p>Erro: ' + errorDescription + ' (' + errorCode + ')</p></div>";'
    ).catch(function() {});
  });

  if (app.isPackaged) {
    mainWindow.loadURL(publishedURL).catch(() => {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    });
  } else {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }

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
