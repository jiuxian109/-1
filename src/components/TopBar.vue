<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useClubs } from '../store/clubs'

const router = useRouter()
const route = useRoute()
const { state } = useClubs()
const avatar = computed(() => (state.user && state.user.avatar) || '')

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
    <router-link to="/me" class="avatar" aria-label="我的">
      <img v-if="avatar" :src="avatar" alt="" />
      <template v-else>我</template>
    </router-link>
  </header>
</template>