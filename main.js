const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');

// 处理 Windows 安装/卸载时的快捷方式创建 (避免安装后多次启动)
if (require('electron-squirrel-startup')) {
  app.quit();
}

let win;
let tray;

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 1000,
        maxWidth: 1200,
        maxHeight: 1000,
        minWidth: 390,
        minHeight: 440,
        resizable: true,
        maximizable: false,
        title: '校园闹铃系统',
        // 图标路径修正：开发和生产环境都尽量指向正确位置
        icon: path.join(__dirname, 'public/icon.ico'), 
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            webSecurity: true, // 生产环境建议开启
            preload: path.join(__dirname, 'preload.js') 
        },
        autoHideMenuBar: true,
    });

    // --- 关键修改：环境判断 ---
    const isDev = !app.isPackaged; // 判断是否是开发模式

    if (isDev) {
        // 开发模式：加载 Vite 服务，实现热更新
        win.loadURL('http://localhost:5173');
        win.webContents.openDevTools(); // 可选：开启调试控制台
    } else {
        // 生产模式：加载打包后的文件
        win.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }

    win.on('close', (event) => {
        if (!app.isQuiting) {
            event.preventDefault();
            win.hide();
        }
    });

    win.on('closed', () => {
        win = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    // 监听窗口尺寸调整指令
    ipcMain.on('resize-window', (event, width, height) => {
        if (win) {
            win.setSize(width, height, true);
        }
    });

    // 托盘设置
    // tray = new Tray(path.join(__dirname, 'public', 'icon.ico'));
    tray = new Tray(path.join(process.resourcesPath, 'icon.ico'));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: '显示窗口',
            click: () => {
                if (win) {
                    if (win.isMinimized()) win.restore();
                    win.show(); 
                    win.focus(); 
                } else { createWindow(); }
            }
        },
        {
            label: '退出',
            click: () => { 
                app.isQuiting = true;
                app.quit(); 
            }
        }
    ]);
    tray.setToolTip('校园闹铃系统');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        if (win) { 
            if (win.isMinimized()) win.restore();
            win.show(); 
            win.focus(); 
        } else { createWindow(); }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') { 
        // 保持后台运行，除非用户显式退出托盘
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});