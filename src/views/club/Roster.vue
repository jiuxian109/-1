<script setup>
import { ref, onMounted } from 'vue'
import { useClubs } from '../../store/clubs'

const { state, fetchRoster, importMembers, downloadCSV, toast } = useClubs()
const loading = ref(true)
const err = ref('')
const busy = ref(false)

onMounted(async () => {
  try { await fetchRoster(state.user.clubId) } catch (e) { err.value = e.message } finally { loading.value = false }
})

function exportCsv() {
  if (!state.roster.length) { toast('暂无可导出的名单'); return }
  downloadCSV(state.roster, state.user.clubName || 'club')
  toast('名单已导出')
}

async function importAll() {
  if (!state.roster.length) { toast('还没有报名记录'); return }
  busy.value = true
  try {
    const d = await importMembers(state.user.clubId, { all: true })
    toast(d.added ? `新增 ${d.added} 人，跳过 ${d.skipped} 人` : `全部已在名册中（跳过 ${d.skipped} 人）`)
  } catch (e) {
    toast(e.message)
  } finally {
    busy.value = false
  }
}

async function importOne(i) {
  busy.value = true
  try {
    const d = await importMembers(state.user.clubId, { rows: [i] })
    toast(d.added ? '已加入名册' : '该手机号已在名册中')
  } catch (e) {
    toast(e.message)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="view-anim">
    <div class="page-head">
      <h2 class="page-title">{{ state.user.clubName || '我的社团' }} · 报名名单</h2>
      <button class="btn small" @click="exportCsv">导出 CSV</button>
    </div>

    <p class="hint">报名是流水记录；点「加入名册」把报名的人转成正式成员（同一手机号不会重复加入）。</p>

    <div class="m-actions" v-if="state.roster.length">
      <button class="btn ghost small" :disabled="busy" @click="importAll">全部加入名册</button>
      <router-link to="/club-admin/members" class="btn ghost small">去成员管理</router-link>
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
          <button type="button" class="mini-btn" :disabled="busy" style="margin-top: 8px" @click="importOne(i)">加入名册</button>
        </div>
      </div>
    </div>
  </div>
</template>
