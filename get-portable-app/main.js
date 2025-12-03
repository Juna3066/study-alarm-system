// 1. 引入 ipcMain
const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 1000,
        maxWidth: 1200,
        maxHeight: 1000,
        minWidth: 390,
        minHeight: 710,
        resizable: true,
        maximizable: false,
        title: '校园闹铃系统',
        icon: path.join(__dirname, 'external-resources', 'icon.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            webSecurity: true,
            // 2. 关键配置：加载预加载脚本
            preload: path.join(__dirname, 'preload.js') 
        },
        autoHideMenuBar: true,
    });

    win.on('close', (event) => {
        event.preventDefault();
        win.hide();
    });

    win.loadFile('index.html');

    win.on('closed', () => {
        win = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    // 3. 监听前端发来的调整尺寸指令
    ipcMain.on('resize-window', (event, width, height) => {
        if (win) {
            // 设置窗口大小，第三个参数 true 表示尝试使用动画（macOS有效，Windows通常直接变化）
            win.setSize(width, height, true);
        }
    });

    // 托盘功能代码保持不变...
    tray = new Tray(path.join(__dirname, 'external-resources', 'icon.ico'));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: '显示窗口',
            click: () => {
                if (win) { win.show(); win.focus(); } else { createWindow(); }
            }
        },
        {
            label: '退出',
            click: () => { app.exit(0); }
        }
    ]);
    tray.setToolTip('校园闹铃系统');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        if (win) { win.show(); win.focus(); } else { createWindow(); }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') { }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    } else {
        if (win.isMinimized()) win.restore();
        win.show();
        win.focus();
    }
});