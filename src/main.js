import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { useClubs } from './store/clubs'
import './assets/styles.css'

const { me } = useClubs()

async function boot() {
  await me() // 若本地有 token 则恢复会话，否则为游客
  createApp(App).use(router).mount('#app')
}

boot()
