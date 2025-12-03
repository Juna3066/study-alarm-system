const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // 暴露一个 resizeWindow 方法给前端
    resizeWindow: (width, height) => ipcRenderer.send('resize-window', width, height)
});