<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { state } from './store/clubs'
import TopBar from './components/TopBar.vue'
import TabBar from './components/TabBar.vue'

const route = useRoute()
const showTab = computed(() => !route.meta.hideTab)
</script>

<template>
  <div class="shell">
    <TopBar />
    <main class="view" :class="{ 'with-tab': showTab }">
      <router-view />
    </main>
    <TabBar v-if="showTab" />
    <transition name="toast">
      <div v-if="state.toast" class="toast">{{ state.toast }}</div>
    </transition>
  </div>
</template>
