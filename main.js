const { app, BrowserWindow, ipcMain, Tray, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs'); 
let win = null;
let tray = null;
let floatWin = null;
let scheduleDataCache = {};

const isDev = !app.isPackaged;
const ICON_PATH = path.join(__dirname, 'public/icon.ico');
const BOUNDS_FILE_PATH = path.join(app.getPath('userData'), 'floating-bounds.json');

function loadFloatingWindowBounds() {
    try {
        if (fs.existsSync(BOUNDS_FILE_PATH)) {
            return JSON.parse(fs.readFileSync(BOUNDS_FILE_PATH, 'utf-8'));
        }
    } catch (e) {
        console.error("Failed to load bounds:", e);
    }
    const { workArea } = screen.getPrimaryDisplay();
    return { width: 200, height: 100, x: workArea.width - 220, y: 20 };
}

function saveFloatingWindowBounds(bounds) {
    try {
        fs.writeFileSync(BOUNDS_FILE_PATH, JSON.stringify(bounds));
    } catch (e) {
        console.error("Failed to save bounds:", e);
    }
}

function createWindow() {
    win = new BrowserWindow({
        width: 1200, height: 1000, maxWidth: 1200, maxHeight: 1000,
        minWidth: 390, minHeight: 440, resizable: true, maximizable: false,
        title: '校园闹铃系统', icon: ICON_PATH, show: false, 
        webPreferences: {
            nodeIntegration: false, contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        autoHideMenuBar: true,
    });

    const url = isDev ? 'http://localhost:5173' : path.join(app.getAppPath(), 'dist/index.html');
    isDev ? win.loadURL(url) : win.loadFile(url);

    win.once('ready-to-show', () => {
        setTimeout(() => {
            win.show();
            if (isDev) { win.webContents.openDevTools({ mode: 'detach' }); }
        }, 100); 
    });

    win.on('close', (e) => {
        if (!app.isQuiting) {
            e.preventDefault();
            win.hide();
        }
    });
    win.on('closed', () => { win = null; });
}

function createFloatingWindow() {

    const bounds = loadFloatingWindowBounds();

    const forcedWidth = 200;
    const forcedHeight = 100;

    floatWin = new BrowserWindow({
        show: false, 
        // width: bounds.width, height: bounds.height,
        width: forcedWidth, height: forcedHeight,
        x: bounds.x + (bounds.width - forcedWidth), 
        y: bounds.y + (bounds.height - forcedHeight),
        maximizable: false,
        resizable: false, frame: false, transparent: true, skipTaskbar: true, alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.js')
        }
    });

    const url = isDev ? 'http://localhost:5173/floating.html' : path.join(app.getAppPath(), 'dist/floating.html');
    isDev ? floatWin.loadURL(url) : floatWin.loadFile(url);

    floatWin.once('ready-to-show', () => {
        setTimeout(() => { 
            floatWin.show(); 
            if (isDev) { floatWin.webContents.openDevTools({ mode: 'detach' }); }
        }, 50);
    });

    floatWin.on('move', () => {
        if (floatWin && !floatWin.isDestroyed()) {
            saveFloatingWindowBounds(floatWin.getBounds());
        }
    });
    floatWin.on('closed', () => { floatWin = null; });
}

function getAlarmData() {
    return scheduleDataCache;
}

// ----------------------------------------------------
// 新增: IPC 和 托盘 逻辑的封装
// ----------------------------------------------------
function ipcSetup() {
    ipcMain.on('DASHBOARD_DATA_UPDATE', (event, data) => {
        scheduleDataCache = data;
    });

    ipcMain.on('REQUEST_FLOATING_DATA', (event) => {
        event.sender.send('FLOATING_DATA_UPDATE', getAlarmData());
    });

    setInterval(() => {
        const data = getAlarmData();
        if (floatWin && !floatWin.isDestroyed()) {
            floatWin.webContents.send('FLOATING_DATA_UPDATE', data);
        }
    }, 1000);

    ipcMain.on('resize-window', (event, width, height) => {
        if (win) {
            win.setSize(width, height, true);
        }
    });
}

function traySetup() {
    tray = new Tray(path.join(ICON_PATH));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: '显示/隐藏主窗口',
            click: () => {
                if (!win) { createWindow(); }
                if (win) { win.isVisible() ? win.hide() : win.show(); }
            }
        },
        { type: 'separator' },
        {
            label: '显示/隐藏悬浮窗',
            click: () => {
                if (!floatWin) { createFloatingWindow(); }
                if (floatWin) { floatWin.isVisible() ? floatWin.hide() : floatWin.show(); }
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

    tray.on('click', () => {
        if (!win) { createWindow(); } else { win.show(); win.focus(); }
    });
}

// ----------------------------------------------------
// 核心启动函数 (将所有 app.whenReady 逻辑封装)
// ----------------------------------------------------
function initialize() {
    app.whenReady().then(() => {
        createWindow();
        ipcSetup();
        traySetup();
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) { createWindow(); }
    });
}

// ----------------------------------------------------
// 单实例控制与主入口 (入口点)
// ----------------------------------------------------
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (win) {
            if (win.isMinimized()) win.restore();
            win.show();
            win.focus();
        }
    });

    initialize();
}