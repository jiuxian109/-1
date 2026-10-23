import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// dev 时前端 5173，/api 代理到后端 3001；build 后由 server/index.js 托管 dist
export default defineConfig({
  base: './',
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    open: false,
    proxy: {
      '/api': { target: 'http://127.0.0.1:3001', changeOrigin: true }
    }
  }
})
