const { app, BrowserWindow, dialog, shell } = require('electron');
const { execSync } = require('child_process');
const path = require('path');
const http = require('http');

const APP_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:8080/api/pdp/health';

function isDockerRunning() {
  try {
    execSync('docker compose ps --status running', {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

function startDocker() {
  try {
    execSync('docker compose up -d', {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

function waitForService(url, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const req = http.get(url, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 500) {
          resolve();
        } else {
          retry();
        }
      });
      req.on('error', retry);
      req.setTimeout(2000, () => { req.destroy(); retry(); });
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error('Services did not start in time'));
      } else {
        setTimeout(check, 1500);
      }
    };
    check();
  });
}

let mainWindow;

async function createWindow() {
  const splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { nodeIntegration: false },
  });

  splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head><style>
      body {
        margin: 0; display: flex; align-items: center; justify-content: center;
        height: 100vh; background: linear-gradient(135deg, #1B6862, #134e4a);
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        color: white; flex-direction: column; border-radius: 16px; overflow: hidden;
        -webkit-app-region: drag;
      }
      .spinner { width: 28px; height: 28px; border: 3px solid rgba(255,255,255,0.2);
        border-top-color: #3CC2B1; border-radius: 50%;
        animation: spin 0.8s linear infinite; margin-top: 20px; }
      @keyframes spin { to { transform: rotate(360deg); } }
      h1 { font-size: 28px; font-weight: 800; margin: 0; }
      p { font-size: 13px; opacity: 0.6; margin-top: 6px; }
    </style></head>
    <body>
      <h1>Terion</h1>
      <p>Démarrage des services...</p>
      <div class="spinner"></div>
    </body>
    </html>
  `)}`);

  try {
    if (!isDockerRunning()) {
      startDocker();
    }
    await waitForService(APP_URL, 90000);
  } catch {
    splash.close();
    dialog.showErrorBox(
      'Terion — Erreur',
      'Impossible de démarrer les services Docker.\n\n' +
      'Vérifiez que Docker est installé et en cours d\'exécution,\n' +
      'puis relancez Terion.'
    );
    app.quit();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    icon: path.join(__dirname, 'build', 'icon.png'),
    title: 'Terion — Plan de Charge',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(APP_URL);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  splash.close();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
