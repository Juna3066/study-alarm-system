const { app, BrowserWindow } = require('electron');
const path = require('path');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 768,
        title: '校园闹铃系统',
        icon: path.join(__dirname, 'external-resources', 'icon.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            webSecurity: true
        },
        autoHideMenuBar: true, // 隐藏默认菜单栏，更像原生应用
    });

    win.loadFile('index.html'); // 确保加载本地的 HTML 文件
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
