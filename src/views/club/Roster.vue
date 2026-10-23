<script setup>
import { ref, onMounted } from 'vue'
import { useClubs } from '../../store/clubs'

const { state, fetchRoster, downloadCSV, toast } = useClubs()
const loading = ref(true)
const err = ref('')

onMounted(async () => {
  try { await fetchRoster(state.user.clubId) } catch (e) { err.value = e.message } finally { loading.value = false }
})

function exportCsv() {
  if (!state.roster.length) { toast('暂无可导出的名单'); return }
  downloadCSV(state.roster, state.user.clubName || 'club')
  toast('名单已导出')
}
</script>

<template>
  <div class="view-anim">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px">
      <h2 style="font-size: 18px; font-weight: 800">{{ state.user.clubName || '我的社团' }} · 报名名单</h2>
      <button class="btn" style="padding: 9px 16px; font-size: 13px" @click="exportCsv">导出 CSV</button>
    </div>

    <p v-if="loading" class="empty">正在加载名单…</p>
    <p v-else-if="err" class="empty">{{ err }}</p>
    <p v-else-if="!state.roster.length" class="empty">还没有人报名。</p>
    <div v-else class="roster-list">
      <div v-for="(r, i) in state.roster" :key="i" class="roster-item">
        <span class="no">{{ i + 1 }}</span>
        <div class="who">
          <b>{{ r.name }}</b>
          <span>学号 {{ r.sid }} · 手机 {{ r.phone }} · 微信 {{ r.wechat }}</span>
          <div v-if="r.why" style="font-size: 13px; color: var(--ink-soft); margin-top: 4px">「{{ r.why }}」</div>
        </div>
      </div>
    </div>
  </div>
</template>
