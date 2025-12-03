const { app, BrowserWindow } = require('electron');
const path = require('path');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 1000,
        maxWidth: 1200,
        maxHeight: 1000,
        minWidth: 390,
        minHeight: 700,
        resizable: true,
        maximizable: false,
        title: '校园闹铃系统',
        icon: path.join(__dirname, 'external-resources', 'icon.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            webSecurity: true
        },
        autoHideMenuBar: true,
    });

    // 关键修复：当用户点击关闭按钮时隐藏窗口而不是销毁
    win.on('close', (event) => {
        // 阻止默认关闭行为
        event.preventDefault();
        // 隐藏窗口而不是关闭
        win.hide();
    });

    win.loadFile('index.html');

    // 确保窗口关闭时应用不会退出
    win.on('closed', () => {
        win = null;
    });
}

app.whenReady().then(createWindow);

// 修复：确保所有窗口关闭时应用不会退出
app.on('window-all-closed', () => {
    // 在macOS上应用通常即使没有窗口也继续运行
    if (process.platform !== 'darwin') {
        // 这里不调用app.quit()，让应用继续运行
    }
});

// 修复：当应用被激活时（点击任务栏图标），显示窗口
app.on('activate', () => {
    if (win === null) {
        createWindow();
    } else {
        // 如果窗口存在但被隐藏了，显示它
        if (win.isMinimized()) {
            win.restore();
        }
        win.show();
        win.focus();
    }
});

// 添加托盘图标功能（可选但推荐）
const { Tray, Menu } = require('electron');
let tray = null;

app.whenReady().then(() => {
    tray = new Tray(path.join(__dirname, 'external-resources', 'icon.ico'));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: '显示窗口',
            click: () => {
                if (win) {
                    win.show();
                    win.focus();
                } else {
                    createWindow();
                }
            }
        },
        {
            label: '退出',
            click: () => {
                app.exit(0);
            }
        }
    ]);
    tray.setToolTip('校园闹铃系统');
    tray.setContextMenu(contextMenu);

    // 点击托盘图标显示窗口
    tray.on('click', () => {
        if (win) {
            win.show();
            win.focus();
        } else {
            createWindow();
        }
    });
});
