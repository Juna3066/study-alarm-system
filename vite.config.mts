// vite.config.mts (修正了 manualChunks 的结构，并确保了 path 的导入)

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'; // 导入 path 模块

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 核心修改：设置基础路径为相对路径，解决 Electron 找不到资源的问题
  base: './', 
  build: {
    rollupOptions: {
      // ⬇️ 【关键修改：配置多页应用 (MPA) 入口】 ⬇️
      input: {
        main: path.resolve(__dirname, 'index.html'), // 主窗口入口
        floating: path.resolve(__dirname, 'floating.html'), // 悬浮窗入口
      },
      // ----------------------------------------
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            
            // 修正后的结构：确保每个 if 块都正确处理了返回路径
            if (id.includes('xlsx')) {
              return 'excel-libs';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            
            // 如果是 node_modules，但不是以上任何一个，则打包为 vendor
            return 'vendor';
          }
          // 如果不是 node_modules，返回 undefined，让 Rollup 自己处理
          return undefined;
        }
      }
    }
  }
})