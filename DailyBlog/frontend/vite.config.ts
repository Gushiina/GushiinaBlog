import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// GitHub Pages 仓库名称
// 通过环境变量控制，本地开发用 '/'，GitHub Pages 用 '/GushiinaBlog/'
const BASE = process.env.VITE_BASE_URL || '/'

export default defineConfig({
  base: BASE,
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      }
    }
  }
})
