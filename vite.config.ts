import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // 确保 electron 加载相对路径资源
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});