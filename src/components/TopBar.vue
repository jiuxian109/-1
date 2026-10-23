<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

function back() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<template>
  <header class="topbar">
    <span v-if="route.name === 'discover'" class="logo">百团</span>
    <button v-else class="icon-btn" aria-label="返回" @click="back">‹</button>
    <span class="title">{{ route.meta.title }}</span>
    <router-link to="/me" class="avatar" aria-label="我的">我</router-link>
  </header>
</template>
