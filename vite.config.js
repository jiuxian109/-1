import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base 用 './' 让 build 产物也能 file:// 直开；hash 路由 + localStorage 模拟后端
export default defineConfig({
  base: './',
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    open: false
  }
})
