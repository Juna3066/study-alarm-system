const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');

// ------------------------------------------------------------------
// 1. Squirrel 启动检查 (防止安装/卸载后多次启动)
// ------------------------------------------------------------------
if (require('electron-squirrel-startup')) {
  app.quit();
}

let win;
let tray;

// ------------------------------------------------------------------
// 2. 单实例锁检查 (确保只有一个应用实例运行)
// ------------------------------------------------------------------
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    // 如果锁失败，说明已有实例在运行，直接退出当前尝试启动的进程
    app.quit();
} else {
    // 如果成功获得锁，说明这是主实例

    // 监听第二次启动事件 (用户双击快捷方式)
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // 有人尝试运行第二个实例，将现有窗口唤醒
        if (win) { 
            if (win.isMinimized()) win.restore(); // 恢复最小化的窗口
            win.show(); // 确保窗口是显示的 (针对 win.hide() 的情况)
            win.focus(); // 聚焦到窗口
        }
    });

    // ------------------------------------------------------------------
    // 3. 应用程序准备就绪，创建窗口和托盘 (原 app.whenReady())
    // ------------------------------------------------------------------
    app.whenReady().then(() => {
        createWindow();

        // 监听窗口尺寸调整指令 (保持不变)
        ipcMain.on('resize-window', (event, width, height) => {
            if (win) {
                win.setSize(width, height, true);
            }
        });

        // ⬇️ 修正后的托盘设置，使用 process.resourcesPath 解决打包路径问题
        const iconFileName = 'icon.ico';
        // 托盘图标路径：无论是开发环境还是生产环境，都指向 resources/icon.ico
        const iconPath = path.join(process.resourcesPath, iconFileName);
        
        tray = new Tray(iconPath);
        
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
                    app.isQuiting = true; // 设置退出标志，跳过 win.on('close') 的 hide 逻辑
                    app.quit(); 
                }
            }
        ]);
        tray.setToolTip('校园闹铃系统');
        tray.setContextMenu(contextMenu);
        
        // 双击托盘图标，显示/聚焦窗口
        tray.on('click', () => {
            if (win) { 
                if (win.isMinimized()) win.restore();
                win.show(); 
                win.focus(); 
            } else { createWindow(); }
        });
    });

    // ------------------------------------------------------------------
    // 4. 窗口和应用关闭逻辑 (保持不变)
    // ------------------------------------------------------------------

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') { 
            // 在 Windows/Linux 上，主窗口关闭后，允许 Electron 保持运行 (托盘图标)
        }
    });

    app.on('activate', () => {
        if (win === null) {
            createWindow();
        }
    });

} // 结束 Single-Instance 核心逻辑


// ===================================================================
// ⬇️ 【createWindow 函数，路径已修正】 ⬇️
// ===================================================================

function createWindow() {
    // 窗口图标路径修正，与托盘图标路径一致，指向 resources/icon.ico
    const windowIconPath = path.join(process.resourcesPath, 'icon.ico'); 
    const isDev = !app.isPackaged;

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
        icon: windowIconPath, // <--- 修正后的图标路径
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            webSecurity: true, 
            preload: path.join(__dirname, 'preload.js') 
        },
        autoHideMenuBar: true,
    });

    if (isDev) {
        // 开发模式：加载 Vite 服务，实现热更新
    } else {
        win.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }

    // 窗口关闭逻辑：关闭到托盘
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
    tray = new Tray(path.join(__dirname, 'public', 'icon.ico'));
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