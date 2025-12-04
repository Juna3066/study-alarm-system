// preload.js (最终版本)

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // 暴露给主窗口的现有接口
    resizeWindow: (width, height) => ipcRenderer.send('resize-window', width, height),
    
    // ⬇️ 1. Dashboard (Renderer) -> Main Process Push Channel ⬇️
    // Dashboard.tsx 调用此接口推送最新数据给主进程缓存
    sendDashboardDataUpdate: (data) => ipcRenderer.send('DASHBOARD_DATA_UPDATE', data), 

    // ⬇️ 2. Floating Window (Renderer) Interfaces ⬇️
    // 悬浮窗启动时请求初始数据
    requestInitialData: () => ipcRenderer.send('REQUEST_FLOATING_DATA'),
    // 悬浮窗接收主进程推送的实时数据
    onFloatingDataUpdate: (callback) => ipcRenderer.on('FLOATING_DATA_UPDATE', callback)
});