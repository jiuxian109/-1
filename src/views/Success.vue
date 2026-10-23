<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useClubs } from '../store/clubs'

const route = useRoute()
const { state, fetchClub, maskPhone } = useClubs()

onMounted(() => { if (!state.club) fetchClub(route.params.id).catch(() => {}) })

const club = computed(() => state.club)
const row = computed(() => Number(route.query.row) || (state.lastSignup ? state.lastSignup.row : 1))
const entry = computed(() => state.lastSignup
  ? { name: state.lastSignup.name, sid: state.lastSignup.sid, phone: state.lastSignup.phone, why: state.lastSignup.why }
  : null)
</script>

<template>
  <div class="view-anim">
    <div class="success-card">
      <div class="success-mark">✓</div>
      <h2 style="font-size: 20px; font-weight: 800">报名成功</h2>
      <p style="font-size: 14px; color: var(--muted); margin-top: 6px">
        你是「{{ club ? club.name : '' }}」花名册上的第 {{ row }} 位同学
      </p>

      <div v-if="entry" class="roster-entry">
        <span class="row-no">第 {{ row }} 行</span>
        <div><b>{{ entry.name }}</b> · 学号 {{ entry.sid }}</div>
        <div>手机号 {{ maskPhone(entry.phone) }}</div>
        <div v-if="entry.why">「{{ entry.why }}」</div>
      </div>
    </div>

    <div style="display: flex; gap: 10px; margin-top: 16px">
      <router-link to="/" class="btn ghost block">回到发现</router-link>
      <router-link v-if="club" :to="'/club/' + club.id" class="btn block">查看社团主页</router-link>
    </div>
  </div>
</template>
