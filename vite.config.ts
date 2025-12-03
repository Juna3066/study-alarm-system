import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // 手动分包配置
        manualChunks(id) {
          // 如果文件位于 node_modules 中
          if (id.includes('node_modules')) {
            // 1. 单独拆分 xlsx 库 (它是导致体积过大的主要原因)
            if (id.includes('xlsx')) {
              return 'excel-libs';
            }
            // 2. 将 React 核心库单独拆分 (可选，有助于缓存)
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // 3. 其他所有第三方库打包成一个 vendor 文件
            return 'vendor';
          }
        }
      }
    },
    // 可选：稍微调大警告阈值 (例如 1000kB)，防止以后因为一点点超标就报警
    // chunkSizeWarningLimit: 1000
  }
})