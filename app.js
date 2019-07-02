const { app, BrowserWindow, Menu, globalShortcut } = require('electron');

let url;
if (process.env.NODE_ENV === 'DEV') {
  url = 'http://localhost:8080/';
} else {
  url = `file://${process.cwd()}/dist/index.html`;
}

app.on('ready', () => {
  let window = new BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      nodeIntegration: true
    }
  });

  window.loadURL(url);

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
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
});
