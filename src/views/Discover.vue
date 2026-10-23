<script setup>
import { ref, computed, onMounted } from 'vue'
import { useClubs } from '../store/clubs'
import ClubCard from '../components/ClubCard.vue'

const { clubs, CATEGORIES, track } = useClubs()
const cat = ref('全部')
const q = ref('')

const filtered = computed(() => {
  const kw = q.value.trim()
  return clubs.value.filter((c) => {
    const okCat = cat.value === '全部' || c.category === cat.value
    const okKw = !kw || c.name.includes(kw) || c.intro.includes(kw)
    return okCat && okKw
  })
})

onMounted(() => track('impression'))
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
      <ClubCard
        v-for="(club, i) in filtered"
        :key="club.id"
        :club="club"
        :style="{ animationDelay: (i * 55) + 'ms' }"
      />
      <p v-if="!filtered.length" class="empty">没有找到匹配的社团。</p>
    </section>
  </div>
</template>
