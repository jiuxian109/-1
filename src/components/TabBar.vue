<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <nav class="tabbar">
    <router-link to="/" :class="{ on: route.name === 'discover' }">
      <span class="t-ico">⌂</span><span>发现</span>
    </router-link>
    <router-link to="/me" :class="{ on: route.name === 'me' }">
      <span class="t-ico">●</span><span>我的</span>
    </router-link>
  </nav>
</template>

<style scoped>
.tabbar {
  position: sticky; bottom: 0; z-index: 20;
  display: flex; height: 60px; background: var(--surface);
}
.tabbar a {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px; font-size: 11px; color: var(--muted);
}
.tabbar a .t-ico { font-size: 17px; line-height: 1; }
.tabbar a.on { color: var(--accent); font-weight: 700; }
</style>
