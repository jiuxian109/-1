<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClubs } from './store/clubs'
import TopBar from './components/TopBar.vue'
import TabBar from './components/TabBar.vue'

const route = useRoute()
const router = useRouter()
const { state, fetchMySignups } = useClubs()
const showTab = computed(() => !route.meta.hideTab)
const showBanner = ref(true)

// Q7 站内通知：登录首屏横幅（学生）+「我的报名」入口红点
const banner = computed(() => {
  if (!state.user || state.user.role !== 'student') return null
  const list = state.mySignups || []
  const pending = list.filter((s) => s.status === 'pending').length
  const fresh = list.filter((s) => {
    const t = s.t || 0
    return Date.now() - t < 36e5 && (s.status === 'accepted' || s.status === 'rejected')
  }).length
  if (pending > 0) return { text: '你有 ' + pending + ' 条报名等待社团处理，去看看吧', to: '/my-signups' }
  if (fresh > 0) return { text: '你有 ' + fresh + ' 条报名有了新结果，去看看吧', to: '/my-signups' }
  return null
})

onMounted(() => { refreshNotify() })
watch(() => state.user, () => refreshNotify())
async function refreshNotify() {
  if (state.user && state.user.role === 'student') {
    try { await fetchMySignups() } catch { /* 静默失败，横幅不出来即可 */ }
  }
  showBanner.value = true
}
function goBanner() {
  showBanner.value = false
  if (banner.value) router.push(banner.value.to)
}
</script>

<template>
  <div class="shell">
    <TopBar />
    <transition name="drop">
      <button
        v-if="banner && showBanner && banner.text"
        class="notify-banner"
        @click="goBanner"
      >🔔 {{ banner.text }}</button>
    </transition>
    <main class="view" :class="{ 'with-tab': showTab }">
      <router-view />
    </main>
    <TabBar v-if="showTab" />
    <transition name="toast">
      <div v-if="state.toast" class="toast">{{ state.toast }}</div>
    </transition>
  </div>
</template>