<script setup>
import { ref, computed, onMounted } from 'vue'
import { useClubs } from '../../store/clubs'

const { state, fetchRoster, decideRoster, importMembers, downloadCSV, SIGNUP_STATUS, REJECT_REASONS, toast } = useClubs()
const loading = ref(true)
const err = ref('')
const busy = ref(false)
const filter = ref('pending')
const selected = ref(new Set())

// 拒绝原因弹窗
const dlg = ref(null) // { ids: [], mode: 'single' | 'batch' }
const dlgKey = ref('full')
const dlgCustom = ref('')
const dlgBusy = ref(false)

const pending = computed(() => state.roster.filter((r) => r.status === 'pending'))
const filtered = computed(() => {
  if (filter.value === 'all') return state.roster
  return state.roster.filter((r) => r.status === filter.value)
})

const tabDefs = [
  { key: 'pending', label: '待处理', n: () => state.rosterCounts.pending },
  { key: 'accepted', label: '已通过', n: () => state.rosterCounts.accepted },
  { key: 'rejected', label: '已拒绝', n: () => state.rosterCounts.rejected },
  { key: 'all', label: '全部', n: () => state.roster.length }
]

async function reload() {
  try {
    const list = await fetchRoster(state.user.clubId)
    // 已选中的行若已被处理则自动清出
    const alive = new Set(list.map((r) => r.id))
    selected.value = new Set([...selected.value].filter((id) => alive.has(id)))
  } catch (e) {
    err.value = e.message
  }
}

onMounted(async () => {
  try { await reload() } catch {} finally { loading.value = false }
})

function toggleAll(e) {
  selected.value = e.target.checked ? new Set(pending.value.map((r) => r.id)) : new Set()
}
function toggleOne(id, e) {
  const s = new Set(selected.value)
  e.target.checked ? s.add(id) : s.delete(id)
  selected.value = s
}

function openReject(ids, mode) {
  dlg.value = { ids, mode }
  dlgKey.value = 'full'
  dlgCustom.value = ''
}
function closeDlg() { dlg.value = null }

async function confirmReject() {
  const reason = dlgKey.value === 'custom'
    ? { reason: dlgCustom.value }
    : { reasonKey: dlgKey.value }
  if (dlgKey.value === 'custom' && !dlgCustom.value.trim()) { toast('请填写拒绝原因'); return }
  dlgBusy.value = true
  try {
    const d = await decideRoster(state.user.clubId, { ids: dlg.value.ids, action: 'reject', ...reason })
    toast(d.updated ? `已拒绝 ${d.updated} 条报名` : '这些报名已被处理')
    dlg.value = null
    await reload()
  } catch (e) { toast(e.message) } finally { dlgBusy.value = false }
}

async function accept(ids) {
  busy.value = true
  try {
    const d = await decideRoster(state.user.clubId, { ids, action: 'accept' })
    toast(d.updated ? `已通过 ${d.updated} 人` : '这些报名已被处理')
    await reload()
  } catch (e) { toast(e.message) } finally { busy.value = false }
}

async function importOne(r) {
  busy.value = true
  try {
    const i = state.roster.indexOf(r)
    const d = await importMembers(state.user.clubId, { rows: [i] })
    toast(d.added ? '已加入名册' : '该手机号已在名册中')
  } catch (e) { toast(e.message) } finally { busy.value = false }
}

async function importAll() {
  busy.value = true
  try {
    const d = await importMembers(state.user.clubId, { all: true })
    toast(d.added ? `已通过的报名全部加入名册（新增 ${d.added}，跳过 ${d.skipped}）` : '没有可导入的报名')
  } catch (e) { toast(e.message) } finally { busy.value = false }
}

function exportCsv() {
  if (!state.roster.length) { toast('暂无可导出的名单'); return }
  downloadCSV(state.roster, state.user.clubName || 'club')
  toast('名单已导出')
}

const ageText = (r) => (r.ageDays <= 0 ? '今天' : r.ageDays + ' 天前')
</script>

<template>
  <div class="view-anim">
    <div class="page-head">
      <h2 class="page-title">{{ state.user.clubName || '我的社团' }} · 报名处理</h2>
      <button class="btn small" @click="exportCsv">导出 CSV</button>
    </div>

    <p class="hint">学生报名后进入「待处理」；逾期 10 天未处理会自动拒绝。通过后即可「加入名册」转为正式成员。</p>

    <div class="tabs small-tabs">
      <button
        v-for="t in tabDefs" :key="t.key" type="button"
        class="tab" :class="{ on: filter === t.key }"
        :data-dot="t.n() > 0 && t.key === 'pending' ? t.n() : null"
        @click="filter = t.key"
      >
        {{ t.label }}<i v-if="t.n() > 0" class="cnt">{{ t.n() }}</i>
      </button>
    </div>

    <div v-if="filter === 'pending' && pending.length" class="bulk-bar">
      <label class="check"><input type="checkbox" :checked="selected.size === pending.length && pending.length > 0" @change="toggleAll" /> 全选待处理（{{ selected.size }}）</label>
      <div class="bulk-actions">
        <button class="mini-btn ok" :disabled="busy || !selected.size" @click="accept([...selected])">批量通过</button>
        <button class="mini-btn no" :disabled="busy || !selected.size" @click="openReject([...selected], 'batch')">批量拒绝</button>
      </div>
    </div>

    <p v-if="loading" class="empty">正在加载名单…</p>
    <p v-else-if="err" class="empty">{{ err }}</p>
    <p v-else-if="!filtered.length" class="empty">{{ filter === 'pending' ? '太棒了，没有待处理的报名。' : '没有记录。' }}</p>
    <div v-else class="roster-list">
      <div v-for="r in filtered" :key="r.id" class="roster-item" :class="{ red: r.red }">
        <div class="who">
          <div class="row-head">
            <b>{{ r.name }}</b>
            <span class="chip" :class="'ch-' + r.status">{{ SIGNUP_STATUS[r.status] || r.status }}
              <template v-if="r.status === 'pending'">· {{ ageText(r) }}</template>
            </span>
            <span v-if="r.red" class="red-tag">已 {{ r.ageDays }} 天，请尽快处理</span>
          </div>
          <span>学号 {{ r.sid }} · 手机 {{ r.phone }} · 微信 {{ r.wechat }}</span>
          <div v-if="r.why" class="why">「{{ r.why }}」</div>
          <div v-if="r.status === 'rejected'" class="why red-text">拒绝原因：{{ r.rejectReason || '—' }}</div>

          <div class="row-actions">
            <template v-if="r.status === 'pending'">
              <label class="check"><input type="checkbox" :checked="selected.has(r.id)" @change="toggleOne(r.id, $event)" /> 选</label>
              <button type="button" class="mini-btn ok" :disabled="busy" @click="accept([r.id])">通过</button>
              <button type="button" class="mini-btn no" :disabled="busy" @click="openReject([r.id], 'single')">拒绝</button>
            </template>
            <button v-else-if="r.status === 'accepted'" type="button" class="mini-btn" :disabled="busy" @click="importOne(r)">加入名册</button>
            <router-link
              v-if="r.userId" class="mini-btn link"
              :to="'/messages?sid=' + r.userId + '&sname=' + encodeURIComponent(r.name)"
            >私信</router-link>
          </div>
        </div>
      </div>
    </div>

    <div v-if="state.rosterCounts.accepted && !loading" class="m-actions">
      <button class="btn ghost small" :disabled="busy" @click="importAll">已通过的报名全部加入名册</button>
      <router-link to="/club-admin/members" class="btn ghost small">去成员管理</router-link>
    </div>

    <div v-if="dlg" class="mask" @click.self="closeDlg">
      <div class="sheet">
        <h3 class="sheet-title">拒绝报名</h3>
        <p class="hint" style="margin-top: 2px">{{ dlg.mode === 'batch' ? '已选 ' + dlg.ids.length + ' 条报名，请选择拒绝原因（必填）。' : '请选择拒绝原因（必填）。' }}</p>
        <label v-for="p in REJECT_REASONS" :key="p.key" class="radio-row">
          <input type="radio" name="rejectKey" :value="p.key" v-model="dlgKey" />
          <span>{{ p.label }}</span>
        </label>
        <label class="radio-row">
          <input type="radio" name="rejectKey" value="custom" v-model="dlgKey" />
          <span>自定义原因</span>
        </label>
        <input v-if="dlgKey === 'custom'" v-model="dlgCustom" class="input" maxlength="30" placeholder="不超过 30 字，例如：需面试后再定" />
        <div class="sheet-actions">
          <button class="btn ghost small" :disabled="dlgBusy" @click="closeDlg">取消</button>
          <button class="btn small" :disabled="dlgBusy" @click="confirmReject">{{ dlgBusy ? '处理中…' : '确认拒绝' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tabs { display: flex; gap: 8px; margin-bottom: 12px; }
.tab { position: relative; padding: 6px 12px; border-radius: 999px; background: var(--field); border: 0; font-size: 13px; color: var(--ink-soft); cursor: pointer; }
.tab.on { background: var(--ink); color: var(--surface); }
.tab .cnt { font-style: normal; margin-left: 5px; font-weight: 700; }
.tab[data-dot] { box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--end); }
.bulk-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; background: var(--field); border-radius: 12px; padding: 9px 12px; margin-bottom: 12px; font-size: 13px; }
.bulk-actions { display: flex; gap: 6px; }
.check { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; color: var(--ink-soft); cursor: pointer; user-select: none; }
.row-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.chip { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: var(--field-2); color: var(--ink-soft); font-weight: 600; }
.ch-pending { background: #F4E4C8; color: var(--warn); }
.ch-accepted { background: #DCEBE0; color: var(--good); }
.ch-rejected { background: #F3DCD6; color: var(--end); }
.ch-withdrawn { background: var(--field-2); color: var(--muted); }
.red-tag { font-size: 11px; color: var(--end); font-weight: 700; }
.roster-item.red { border: 1px solid rgba(166, 58, 42, 0.45); }
.why { font-size: 13px; color: var(--ink-soft); margin-top: 4px; }
.red-text { color: var(--end); }
.row-actions { display: flex; align-items: center; gap: 6px; margin-top: 8px; }
.mini-btn.ok { background: #DCEBE0; color: var(--good); }
.mini-btn.no { background: #F3DCD6; color: var(--end); }
.mini-btn.link { background: #E4EBFA; color: var(--accent); text-decoration: none; }
.mini-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.mask { position: fixed; inset: 0; background: rgba(23, 21, 15, 0.4); display: flex; align-items: flex-end; justify-content: center; z-index: 60; }
.sheet { background: var(--surface); border-radius: 18px 18px 0 0; padding: 18px 18px 22px; width: 100%; max-width: 430px; }
.sheet-title { font-size: 16px; margin: 0 0 8px; }
.radio-row { display: flex; align-items: center; gap: 9px; padding: 9px 2px; font-size: 14px; cursor: pointer; border-bottom: 1px dashed var(--field-2); }
.radio-row:last-of-type { border-bottom: 0; }
.input { width: 100%; padding: 10px 12px; border-radius: 10px; background: var(--field); border: none; outline: none; font-size: 15px; margin-top: 8px; }
.input:focus { outline: 2px solid var(--accent); outline-offset: 2px; }
.sheet-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
</style>