<script setup>
import { computed } from 'vue'
import { useClubs } from '../../store/clubs'

const { identity, getClub, downloadCSV, toast } = useClubs()
const club = computed(() => getClub(identity.clubId))

function exportCsv() {
  if (!club.value || !club.value.roster.length) { toast('暂无可导出的名单'); return }
  downloadCSV(club.value.id)
  toast('名单已导出')
}
</script>

<template>
  <div v-if="club" class="view-anim">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px">
      <h2 style="font-size: 18px; font-weight: 800">{{ club.name }} · 报名名单</h2>
      <button class="btn" style="padding: 9px 16px; font-size: 13px" @click="exportCsv">导出 CSV</button>
    </div>

    <p v-if="!club.roster.length" class="empty">还没有人报名。</p>
    <div v-else class="roster-list">
      <div v-for="(r, i) in club.roster" :key="i" class="roster-item">
        <span class="no">{{ i + 1 }}</span>
        <div class="who">
          <b>{{ r.name }}</b>
          <span>学号 {{ r.sid }} · 手机 {{ r.phone }} · 微信 {{ r.wechat }}</span>
          <div v-if="r.why" style="font-size: 13px; color: var(--ink-soft); margin-top: 4px">「{{ r.why }}」</div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="empty">还没有绑定社团。</div>
</template>
