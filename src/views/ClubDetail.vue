<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClubs } from '../store/clubs'
import ClubArt from '../components/ClubArt.vue'
import StatusTag from '../components/StatusTag.vue'

const route = useRoute()
const router = useRouter()
const { state, fetchClub, track } = useClubs()

const loading = ref(true)
const err = ref('')

async function load() {
  loading.value = true
  err.value = ''
  try {
    const c = await fetchClub(route.params.id)
    track('view_club', c.id)
  } catch (e) {
    err.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.id, load)

const club = computed(() => state.club)

function photosOf(act) {
  return Array.isArray(act.photos) ? act.photos.filter(Boolean) : []
}

function monthOf(date) {
  const [y, m] = (date || '').split('-')
  return y && m ? `${Number(y)}年${Number(m)}月` : '往期活动'
}

const yearbook = computed(() => {
  const map = {}
  ;(club.value?.activities || []).forEach((a) => {
    const k = monthOf(a.date)
    ;(map[k] = map[k] || []).push(a)
  })
  return map
})

function join() {
  if (!club.value) return
  track('click_signup', club.value.id)
  router.push('/signup/' + club.value.id)
}
</script>

<template>
  <div class="view-anim">
    <p v-if="loading" class="empty">正在加载社团主页…</p>
    <p v-else-if="err" class="empty">{{ err }}</p>
    <template v-else-if="club">
      <div class="hero">
        <div v-if="club.bg" class="hero-bg" :style="{ backgroundImage: 'url(' + club.bg + ')' }"></div>
        <div v-else class="hero-bg hero-art"><ClubArt :type="club.art" :seed="club.id" /></div>
        <div class="hero-shade"></div>
        <div class="hero-inner">
          <h1 class="hero-name">{{ club.name }}</h1>
          <div class="hero-meta">
            <span class="hero-chip">{{ club.category }}</span>
            <StatusTag :status="club.status" />
            <span v-if="club.wechat" class="hero-chip">微信 {{ club.wechat }}</span>
          </div>
        </div>
      </div>
      <p class="intro">{{ club.intro || '这个社团还没有写简介。' }}</p>

      <button v-if="club.status === 'open'" class="btn block" style="margin-top: 18px" @click="join">我要报名</button>

      <section class="yearbook">
        <h2>活动年册</h2>
        <p v-if="!Object.keys(yearbook).length" class="empty">还没有活动记录。</p>
        <div v-for="(acts, month) in yearbook" :key="month" class="month">
          <div class="month-title">{{ month }}</div>
          <article v-for="act in acts" :key="act.id" class="act-card">
            <div v-if="photosOf(act).length" class="act-grid">
              <div v-for="(src, i) in photosOf(act)" :key="src + i" class="ph">
                <img :src="src" :alt="act.title + ' 活动照片 ' + (i + 1)" loading="lazy" />
              </div>
            </div>
            <div v-else class="act-fallback"><ClubArt :type="club.art" :seed="act.id" /></div>
            <div class="act-body">
              <h3>{{ act.title }}</h3>
              <div class="act-date">{{ act.date }}</div>
              <p v-if="act.intro" class="act-intro">{{ act.intro }}</p>
              <p v-if="act.note" class="act-note">{{ act.note }}</p>
            </div>
          </article>
        </div>
      </section>
    </template>
    <p v-else class="empty">社团不存在或已下架。</p>
  </div>
</template>
