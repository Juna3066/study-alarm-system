const { app, BrowserWindow, ipcMain, Tray, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs');

// 1. Squirrel 启动检查 (防止安装/卸载后多次启动)
if (require('electron-squirrel-startup')) {
    app.quit();
}

// 全局变量声明
let win;
let tray;
let floatWin; // 悬浮窗全局变量

// 用于存储 Dashboard.tsx 推送过来的最新排程数据
let scheduleDataCache = {};


// D. 悬浮窗配置持久化文件路径
const boundsFilePath = path.join(app.getPath('userData'), 'floating-bounds.json');

// E. 读取上次保存的窗口位置和尺寸
function loadFloatingWindowBounds() {
    try {
        if (fs.existsSync(boundsFilePath)) {
            const bounds = fs.readFileSync(boundsFilePath, 'utf-8');
            return JSON.parse(bounds);
        }
    } catch (e) {
        console.error("Failed to load floating window bounds:", e);
    }
    // 默认位置：屏幕右上角
    const primaryDisplay = screen.getPrimaryDisplay();
    return {
        width: 200,
        height: 100,
        x: primaryDisplay.workArea.width - 220, // 220 = 200 (width) + 20 (padding)
        y: 20,
    };
}

// F. 保存窗口位置和尺寸
function saveFloatingWindowBounds(bounds) {
    try {
        fs.writeFileSync(boundsFilePath, JSON.stringify(bounds));
    } catch (e) {
        console.error("Failed to save floating window bounds:", e);
    }
}

// 托盘和窗口加载图标的绝对路径
// 注意：在打包后，icon.ico 理论上在应用的根目录下（或 resources/app 目录下），但最稳健的方式是使用 files 包含它，并从主进程加载
// 在 dev 和 打包后的 dist 模式下，__dirname指向不同的位置
const ICON_PATH = path.join(__dirname, 'public/icon.ico'); 

// G. 主窗口创建函数
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
        icon: ICON_PATH,
        webPreferences: {
            nodeIntegration: false, // 现代 Electron 推荐关闭
            contextIsolation: true, // 现代 Electron 推荐开启
            webSecurity: true,
            preload: path.join(__dirname, 'preload.js')
        },
        autoHideMenuBar: true,
    });

    const isDev = !app.isPackaged;

    if (isDev) {
        win.loadURL('http://localhost:5173');
        win.webContents.openDevTools({ mode: 'detach' });
    } else {
        // app.getAppPath() 在打包后指向 resources/app.asar (或 resources/app 目录)
        win.loadFile(path.join(app.getAppPath(), 'dist/index.html'));        
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

// H. 悬浮窗创建函数
function createFloatingWindow() {
    const bounds = loadFloatingWindowBounds();

    floatWin = new BrowserWindow({
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        resizable: false,
        frame: false, // 无边框
        transparent: true, // 背景透明
        skipTaskbar: true, // 不显示在任务栏
        alwaysOnTop: true, // 保持在最前
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // 悬浮窗加载 HTML 文件
    const isDev = !app.isPackaged;
    if (isDev) {
        floatWin.loadURL('http://localhost:5173/floating.html');
        floatWin.webContents.openDevTools({ mode: 'detach' });
    } else {
        // floatWin.loadFile(path.join(__dirname, 'dist/floating.html'));
        // 【修正】使用 app.getAppPath() 确保打包后路径正确
        floatWin.loadFile(path.join(app.getAppPath(), 'dist/floating.html'));
    }

    // 监听移动事件，保存新位置
    floatWin.on('move', () => {
        if (floatWin && !floatWin.isDestroyed()) {
            saveFloatingWindowBounds(floatWin.getBounds());
        }
    });

    floatWin.on('closed', () => {
        floatWin = null;
    });
}

// I. 获取闹铃数据的核心函数
function getAlarmData() {
    // ⬇️ 【核心修正：直接返回缓存数据】 ⬇️
    return scheduleDataCache;
}

// 2. 单实例锁检查 (确保只有一个应用实例运行)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    // 监听第二次启动事件 (用户双击快捷方式)
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (win) {
            if (win.isMinimized()) win.restore();
            win.show();
            win.focus();
        }
    });

    // 3. 应用程序准备就绪，创建窗口和托盘 (原 app.whenReady())
    app.whenReady().then(() => {
        createWindow();
        // createFloatingWindow(); // 启动时也创建悬浮窗

        // ⬇️ 【新增：IPC 修正 - Dashboard 数据推送】 ⬇️
        // 监听 Dashboard.tsx 推送来的最新排程数据，并更新缓存
        ipcMain.on('DASHBOARD_DATA_UPDATE', (event, data) => {
            scheduleDataCache = data;
        });

        // ⬇️ 【新增：IPC 修正 - 浮窗初始数据拉取】 ⬇️
        // 监听浮窗请求初始数据
        ipcMain.on('REQUEST_FLOATING_DATA', (event) => {
            // 直接回复缓存中的数据
            event.sender.send('FLOATING_DATA_UPDATE', getAlarmData());
        });

        // 实时推送数据给悬浮窗 (每秒)
        setInterval(() => {
            // 使用 getAlarmData() 确保获取的是最新的缓存数据
            const data = getAlarmData();
            if (floatWin && !floatWin.isDestroyed()) {
                // 浮窗接收通道名为 'FLOATING_DATA_UPDATE'
                floatWin.webContents.send('FLOATING_DATA_UPDATE', data);
            }
        }, 1000); // 每秒推送一次

        // 监听窗口尺寸调整指令 (保持不变)
        ipcMain.on('resize-window', (event, width, height) => {
            if (win) {
                win.setSize(width, height, true);
            }
        });

        // 托盘设置
        tray = new Tray(path.join(ICON_PATH));
        const contextMenu = Menu.buildFromTemplate([
            {
                label: '显示/隐藏主窗口',
                click: () => {
                    if (!win) { createWindow(); }
                    if (win) {
                        win.isVisible() ? win.hide() : win.show();
                    }
                }
            },
            { type: 'separator' },
            {
                label: '显示/隐藏悬浮窗',
                click: () => {
                    if (!floatWin) { createFloatingWindow(); }
                    if (floatWin) {
                        floatWin.isVisible() ? floatWin.hide() : floatWin.show();
                    }
                }
            },
            { type: 'separator' },
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

        // 托盘点击逻辑：只唤醒主窗口
        tray.on('click', () => {
            if (!win) { createWindow(); } else { win.show(); win.focus(); }
        });
    });

    // ... 其他 app 事件处理
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
}