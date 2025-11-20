const { app, BrowserWindow } = require('electron');
const path = require('path');

// 处理 Windows 安装/卸载时的快捷方式创建
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: '校园闹铃系统',
    icon: path.join(__dirname, 'public/icon.png'), // 需确保 public 文件夹下有图标，否则可注释掉
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // 为了简化 IndexedDB 访问，允许渲染进程使用部分 Node 功能
      webSecurity: false // 允许读取本地 blob/file 协议
    },
    autoHideMenuBar: true, // 隐藏默认菜单栏，更像原生应用
  });

  // 开发环境下加载 localhost，生产环境下加载打包后的 html
  const isDev = !app.isPackaged;
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools(); // 开发模式打开控制台
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

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