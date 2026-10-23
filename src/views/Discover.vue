<script setup>
import { ref, computed, onMounted } from 'vue'
import { useClubs } from '../store/clubs'
import ClubCard from '../components/ClubCard.vue'

const { state, fetchClubs, CATEGORIES, track } = useClubs()
const cat = ref('全部')
const q = ref('')
const loading = ref(true)
const err = ref('')

const filtered = computed(() => {
  const kw = q.value.trim()
  return state.clubs.filter((c) => {
    const okCat = cat.value === '全部' || c.category === cat.value
    const okKw = !kw || c.name.includes(kw) || c.intro.includes(kw)
    return okCat && okKw
  })
})

onMounted(async () => {
  track('impression')
  try {
    await fetchClubs()
  } catch (e) {
    err.value = e.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="view-anim">
    <div class="search">
      <input v-model="q" type="search" placeholder="搜索社团或关键词" aria-label="搜索社团" />
    </div>
    <div class="cats">
      <button v-for="c in CATEGORIES" :key="c" :class="{ on: cat === c }" @click="cat = c">{{ c }}</button>
    </div>

    <section class="booths">
      <p v-if="loading" class="empty">正在加载社团…</p>
      <p v-else-if="err" class="empty">{{ err }}</p>
      <template v-else>
        <ClubCard
          v-for="(club, i) in filtered"
          :key="club.id"
          :club="club"
          :style="{ animationDelay: (i * 55) + 'ms' }"
        />
        <p v-if="!filtered.length" class="empty">{{ state.clubs.length ? '没有找到匹配的社团。' : '还没有社团入驻，快去注册一个吧。' }}</p>
      </template>
    </section>
  </div>
</template>
