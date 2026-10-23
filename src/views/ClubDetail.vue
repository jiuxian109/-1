<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClubs } from '../store/clubs'
import ClubArt from '../components/ClubArt.vue'
import StatusTag from '../components/StatusTag.vue'

const route = useRoute()
const router = useRouter()
const { getClub, track } = useClubs()

const club = computed(() => getClub(route.params.id))

onMounted(() => { if (club.value) track('view_club', club.value.id) })

function photoSeeds(act) {
  const n = Math.min(act.photos || 1, 9)
  return Array.from({ length: n }, (_, i) => ({ type: act.type, seed: (act.seed || 'x') + i }))
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
  <div v-if="club" class="view-anim">
    <div class="detail-hero">
      <div class="cover"><ClubArt :type="club.art" :seed="club.id" /></div>
    </div>
    <h1 class="detail-name">{{ club.name }}</h1>
    <div class="meta-row">
      <span class="meta-chip">{{ club.category }}</span>
      <StatusTag :status="club.status" />
      <span class="meta-chip">微信 {{ club.wechat }}</span>
    </div>
    <p class="intro">{{ club.intro }}</p>

    <button v-if="club.status === 'open'" class="btn block" style="margin-top: 18px" @click="join">我要报名</button>

    <section class="yearbook">
      <h2>活动年册</h2>
      <p v-if="!Object.keys(yearbook).length" class="empty">还没有活动记录。</p>
      <div v-for="(acts, month) in yearbook" :key="month" class="month">
        <div class="month-title">{{ month }}</div>
        <article v-for="act in acts" :key="act.id" class="act-card">
          <div class="act-grid">
            <div v-for="t in photoSeeds(act)" :key="t.seed" class="ph"><ClubArt :type="t.type" :seed="t.seed" /></div>
          </div>
          <div class="act-body">
            <h3>{{ act.title }}</h3>
            <div class="act-date">{{ act.date }}</div>
            <p class="act-note">{{ act.note }}</p>
          </div>
        </article>
      </div>
    </section>
  </div>
  <div v-else class="empty">社团不存在或已下架。</div>
</template>
