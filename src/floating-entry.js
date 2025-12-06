// src/floating-entry.js (合并了浮动窗的逻辑和样式导入)

// 1. 引入全局样式（包含 Tailwind 指令）
import './index.css'; 

// 2. 实时更新UI的函数
const updateUI = (data) => {
    // 1. 日期
    document.getElementById('current-date').innerText = data.currentDate || '';
    // 2. 系统时间
    document.getElementById('system-time').innerText = data.systemTime || '';
    // 3. 当前阶段
    document.getElementById('current-phase').innerText = data.currentPhaseDisplay || '';
    // 4. 下一阶段
    document.getElementById('next-phase').innerText = data.nextPhaseDisplay || '';
};


// 监听主进程推送的数据
window.addEventListener('DOMContentLoaded', () => {
    if (window.electronAPI) {
        // 监听主进程推送的实时数据
        window.electronAPI.onFloatingDataUpdate((event, data) => {
            //console.log('Received floating data:', data);
            updateUI(data);
        });
        // 初始化时请求一次数据
        window.electronAPI.requestInitialData();
    } else {
        console.error("Electron API 未暴露。请检查 preload.js 或窗口加载顺序。");
    }
});