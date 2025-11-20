import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 将 base 改为绝对路径 '/'。
  // 虽然 './' 对 Electron 有好，但在 Cloudflare 等 Web 环境下，它会导致 PWA 安装后路径解析错误（变成 /assets/）。
  // 如果需要同时兼容 Electron，建议通过环境变量区分配置。目前优先修复 Web 端 PWA 问题。
  base: '/', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});