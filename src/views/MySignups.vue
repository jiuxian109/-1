<template>
  <div class="ms-wrap">
    <div class="ms-head">
      <span>我的报名</span>
      <span class="ms-count" v-if="signed.length">共 {{ signed.length }} 条</span>
    </div>

    <div class="empty card" v-if="loading">加载中…</div>

    <div class="empty card" v-else-if="!signed.length">
      <p>你还没有报过名。</p>
      <router-link to="/" class="btn block" style="margin-top: 14px">去发现社团</router-link>
    </div>

    <template v-else>
      <div class="ms-item card" v-for="s in signed" :key="s.clubId">
        <div class="ms-row">
          <div class="thumb"><ClubArt :type="s.art || 'stage'" :seed="s.clubId" /></div>
          <div class="ms-main">
            <router-link :to="'/club/' + s.clubId" class="ms-club">{{ s.clubName }}</router-link>
            <div class="ms-sub">{{ CATEGORIES[s.category] || '未分类' }} · {{ fmtDate(s.t) }} 报名</div>
          </div>
          <span class="chip" :class="chipCls(s)">{{ SIGNUP_STATUS[s.status] || '待处理' }}</span>
        </div>

        <div class="ms-note" v-if="s.status === 'rejected' && s.rejectReason">
          未通过原因：{{ s.rejectReason }}
        </div>
        <div class="ms-note note-warn" v-else-if="s.status === 'pending' && s.ageDays >= 3">
          已等待 {{ s.ageDays }} 天，若超过 10 天未处理将被系统自动标记为「社团超时未处理」。
        </div>
        <div class="ms-note note-gray" v-else-if="s.status === 'withdrawn'">你已退出该报名。</div>

        <div class="ms-actions" v-if="s.status === 'pending' || s.status === 'accepted'">
          <button class="btn ghost small" @click="openConfirm(s)">退出报名</button>
        </div>
      </div>
    </template>

    <div class="mask" v-if="confirmRow" @click.self="cancel"></div>
    <div class="sheet" v-if="confirmRow">
      <div class="sheet-title">退出报名</div>
      <p class="sheet-text">
        确定退出「{{ confirmRow.clubName }}」的报名吗？<br />退出后社团将不再处理你的报名。
      </p>
      <div class="sheet-btns">
        <button class="btn ghost" @click="cancel">再想想</button>
        <button class="btn danger" :disabled="submitting" @click="confirmWithdraw">{{ submitting ? '提交中…' : '确认退出' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useClubs } from '../store/clubs'
import ClubArt from '../components/ClubArt.vue'

const { state, SIGNUP_STATUS, CATEGORIES, fetchMySignups, withdrawSignup, toast } = useClubs()

const loading = ref(true)
const signed = computed(() => state.mySignups || [])
const confirmRow = ref(null)
const submitting = ref(false)

function chipCls(s) {
  return {
    'ch-pending': s.status === 'pending',
    'ch-accepted': s.status === 'accepted',
    'ch-rejected': s.status === 'rejected',
    'ch-withdrawn': s.status === 'withdrawn'
  }
}

function fmtDate(t) {
  if (!t) return ''
  const d = new Date(t)
  return (d.getMonth() + 1) + '月' + d.getDate() + '日'
}

function openConfirm(s) { confirmRow.value = s }
function cancel() { confirmRow.value = null }

async function confirmWithdraw() {
  if (!confirmRow.value) return
  submitting.value = true
  try {
    await withdrawSignup(confirmRow.value.clubId)
    toast?.('已退出报名')
    cancel()
  } catch (e) {
    toast?.((e && e.message) || '退出失败，请稍后再试')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await fetchMySignups()
  } catch (e) {
    toast?.((e && e.message) || '加载我的报名失败')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.ms-wrap { padding: 16px; }
.ms-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.ms-head > span:first-child { font-size: 17px; font-weight: 700; color: var(--ink); }
.ms-count { font-size: 12px; color: var(--muted); }
.empty { padding: 26px 16px; text-align: center; color: var(--muted); }
.ms-item { padding: 14px; margin-bottom: 12px; }
.ms-row { display: flex; align-items: center; gap: 10px; }
.thumb { width: 42px; height: 42px; border-radius: 10px; flex: none; background: var(--field-2); }
.ms-main { flex: 1; min-width: 0; }
.ms-club { display: block; font-size: 15px; font-weight: 700; color: var(--ink); text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ms-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
.chip { flex: none; font-size: 12px; padding: 3px 8px; border-radius: 999px; font-weight: 600; }
.ch-pending { background: #f7ead2; color: #a96a16; }
.ch-accepted { background: #e2f2e9; color: #1c7a46; }
.ch-rejected { background: #f9e3de; color: #a63a2a; }
.ch-withdrawn { background: var(--field); color: var(--muted); }
.ms-note { margin-top: 10px; font-size: 12px; line-height: 1.5; color: var(--ink-soft); }
.note-warn { color: #a96a16; }
.note-gray { color: var(--muted); }
.ms-actions { margin-top: 10px; text-align: right; }
.mask { position: fixed; inset: 0; background: rgba(23, 21, 15, 0.45); z-index: 40; }
.sheet { position: fixed; left: 16px; right: 16px; bottom: 24px; background: var(--surface); border-radius: 16px; padding: 20px 16px 16px; z-index: 41; }
.sheet-title { font-size: 16px; font-weight: 700; color: var(--ink); margin-bottom: 8px; }
.sheet-text { font-size: 14px; line-height: 1.6; color: var(--ink-soft); margin: 0 0 16px; }
.sheet-btns { display: flex; gap: 10px; }
.sheet-btns .btn { flex: 1; }
</style>