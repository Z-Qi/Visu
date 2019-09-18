'use strict';

import { app, globalShortcut, ipcMain, protocol, BrowserWindow, Menu } from 'electron';
import { createProtocol, installVueDevtools } from 'vue-cli-plugin-electron-builder/lib';
import * as ProgressBar from 'electron-progressbar';
const isDev = process.env.NODE_ENV !== 'production';

// Global reference so object is not garbage collected.
let window;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }]);

function createWindow() {
  // Create the browser window.
  window = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
    },
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    window.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) window.webContents.openDevTools();
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    window.loadURL('app://./index.html');
  }

  function openVideo() {
    window.webContents.send('open-video-file');
  }

  globalShortcut.register('CmdOrCtrl+O', openVideo);

  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Video',
          click: () => {
            openVideo();
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  let progressBar;

  ipcMain.on('start-progress', (event, info) => {
    progressBar = new ProgressBar({
      title: info.title,
      text: info.text,
      detail: info.detail,
      browserWindow: {
        frame: false,
        closeable: false,
        parent: window,
        webPreferences: {
          nodeIntegration: true,
        },
      },
    });
    progressBar.on('completed', () => {
      progressBar.detail = info.completedDetail;
    });
  });

  ipcMain.on('stop-progress', () => {
    if (progressBar) {
      progressBar.setCompleted();
    }
  });

  window.on('closed', () => {
    window = null;
  });
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (window === null) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDev && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installVueDevtools();
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString());
    }
  }
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDev) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}
