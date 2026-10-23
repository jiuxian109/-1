<script setup>
import { ref, computed, onMounted } from 'vue'
import { useClubs } from '../../store/clubs'

const {
  state, MEMBER_STATUS, fetchMembers, createMember, updateMember,
  bulkMembers, removeMember, downloadMemberCSV, toast
} = useClubs()

const loading = ref(true)
const err = ref('')

// 筛选
const q = ref('')
const status = ref('')
const dept = ref('')

const members = computed(() => state.members)
const counts = computed(() => state.memberCounts)
const depts = computed(() => state.memberDepts)

// 手动新增
const showAdd = ref(false)
const addErr = ref('')
const addForm = ref({ name: '', phone: '', sid: '', wechat: '', dept: '', role: '', status: 'active' })

// 行内编辑
const openId = ref('')
const editForm = ref({ dept: '', role: '', status: 'active', note: '' })
const editErr = ref('')

// 批量
const selected = ref([])
const bulkRole = ref('')
const bulkDept = ref('')

const allChecked = computed(() => members.value.length > 0 && selected.value.length === members.value.length)

async function load() {
  loading.value = true
  err.value = ''
  try {
    await fetchMembers(state.user.clubId, { q: q.value, status: status.value, dept: dept.value })
  } catch (e) {
    err.value = e.message
  } finally {
    loading.value = false
  }
}
onMounted(load)

let timer = null
function onSearch() {
  clearTimeout(timer)
  timer = setTimeout(load, 260)
}

function setStatus(s) {
  status.value = status.value === s ? '' : s
  load()
}

function setDept(d) {
  dept.value = dept.value === d ? '' : d
  load()
}

function resetFilters() {
  q.value = ''
  status.value = ''
  dept.value = ''
  load()
}

async function submitAdd() {
  addErr.value = ''
  if (!addForm.value.name.trim()) { addErr.value = '请填写姓名'; return }
  if (!/^1\d{10}$/.test(addForm.value.phone)) { addErr.value = '请输入 11 位手机号'; return }
  try {
    await createMember(state.user.clubId, { ...addForm.value })
    addForm.value = { name: '', phone: '', sid: '', wechat: '', dept: '', role: '', status: 'active' }
    showAdd.value = false
    toast('已加入名册')
    await load()
  } catch (e) {
    addErr.value = e.message
  }
}

function startEdit(m) {
  if (openId.value === m.id) { openId.value = ''; return }
  openId.value = m.id
  editErr.value = ''
  editForm.value = { dept: m.dept || '', role: m.role || '', status: m.status, note: m.note || '' }
}

async function saveEdit(m) {
  editErr.value = ''
  try {
    await updateMember(state.user.clubId, m.id, { ...editForm.value })
    toast('已更新')
    openId.value = ''
    await load()
  } catch (e) {
    editErr.value = e.message
  }
}

async function quitOne(m) {
  try {
    await removeMember(state.user.clubId, m.id)
    toast('已移出（记录保留，可恢复）')
    openId.value = ''
    await load()
  } catch (e) {
    editErr.value = e.message
  }
}

async function restoreOne(m) {
  try {
    await updateMember(state.user.clubId, m.id, { status: 'active' })
    toast('已恢复为在册')
    await load()
  } catch (e) {
    editErr.value = e.message
  }
}

function toggle(m) {
  const i = selected.value.indexOf(m.id)
  if (i >= 0) selected.value.splice(i, 1)
  else selected.value.push(m.id)
}

function toggleAll() {
  selected.value = allChecked.value ? [] : members.value.map((m) => m.id)
}

async function runBulk(patch, label) {
  if (!selected.value.length) return
  try {
    const d = await bulkMembers(state.user.clubId, selected.value.slice(), patch)
    toast(`已${label} ${d.updated} 人`)
    selected.value = []
    bulkRole.value = ''
    bulkDept.value = ''
    await load()
  } catch (e) {
    toast(e.message)
  }
}

function bulkSetDept() {
  if (!bulkDept.value) return
  runBulk({ dept: bulkDept.value }, '调整部门')
}

function bulkSetRole() {
  const role = bulkRole.value.trim()
  if (!role) return
  runBulk({ role }, '调整职务')
}

function exportCsv() {
  if (!members.value.length) { toast('暂无可导出的成员'); return }
  downloadMemberCSV(members.value, state.user.clubName || 'club')
  toast('名册已导出')
}
</script>

<template>
  <div class="view-anim">
    <div class="page-head">
      <h2 class="page-title">{{ state.user.clubName || '我的社团' }} · 成员管理</h2>
      <button class="btn small" :disabled="!members.length" @click="exportCsv">导出 CSV</button>
    </div>

    <div class="m-counts">
      <div class="m-count"><b>{{ counts.active }}</b><span>在册</span></div>
      <div class="m-count"><b>{{ counts.pending }}</b><span>预备</span></div>
      <div class="m-count"><b>{{ counts.quit }}</b><span>已退出</span></div>
    </div>

    <div class="field" style="margin-top: 14px">
      <input v-model="q" placeholder="搜索姓名 / 学号 / 手机 / 微信" @input="onSearch" />
    </div>

    <div class="chip-row">
      <button class="chip" :class="{ on: !status }" @click="setStatus('')">全部</button>
      <button
        v-for="(label, key) in MEMBER_STATUS"
        :key="key"
        class="chip"
        :class="{ on: status === key }"
        @click="setStatus(key)"
      >{{ label }}</button>
    </div>

    <div class="chip-row" v-if="depts.length">
      <button class="chip" :class="{ on: !dept }" @click="setDept('')">所有部门</button>
      <button v-for="d in depts" :key="d" class="chip" :class="{ on: dept === d }" @click="setDept(d)">{{ d }}</button>
      <button class="chip" :class="{ on: dept === '未分配' }" @click="setDept('未分配')">未分配</button>
    </div>

    <div class="m-actions">
      <button class="btn ghost small" @click="showAdd = !showAdd">{{ showAdd ? '收起' : '＋ 添加成员' }}</button>
      <router-link to="/club-admin/roster" class="btn ghost small">从报名名单导入</router-link>
      <router-link to="/club-admin/settings" class="btn ghost small">管理部门</router-link>
    </div>

    <form v-if="showAdd" class="m-form" @submit.prevent="submitAdd">
      <div class="field">
        <label for="m-name">姓名 <span class="req">必填</span></label>
        <input id="m-name" v-model="addForm.name" maxlength="20" placeholder="成员姓名" />
      </div>
      <div class="field">
        <label for="m-phone">手机号 <span class="req">必填</span></label>
        <input id="m-phone" v-model="addForm.phone" type="tel" maxlength="11" placeholder="11 位手机号，名册内唯一" />
      </div>
      <div class="field-2">
        <div class="field">
          <label for="m-sid">学号</label>
          <input id="m-sid" v-model="addForm.sid" maxlength="30" placeholder="选填" />
        </div>
        <div class="field">
          <label for="m-wechat">微信号</label>
          <input id="m-wechat" v-model="addForm.wechat" maxlength="40" placeholder="选填" />
        </div>
      </div>
      <div class="field-2">
        <div class="field">
          <label for="m-dept">部门</label>
          <select id="m-dept" v-model="addForm.dept">
            <option value="">未分配</option>
            <option v-for="d in depts" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>
        <div class="field">
          <label for="m-status">状态</label>
          <select id="m-status" v-model="addForm.status">
            <option v-for="(label, key) in MEMBER_STATUS" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label for="m-role">职务</label>
        <input id="m-role" v-model="addForm.role" maxlength="12" placeholder="如 社长 / 部长 / 成员" />
      </div>
      <p v-if="addErr" class="err">{{ addErr }}</p>
      <button type="submit" class="btn block">加入名册</button>
    </form>

    <div v-if="selected.length" class="bulkbar">
      <div class="bulk-top">已选 {{ selected.length }} 人<span class="bulk-x" @click="selected = []">取消选择</span></div>
      <div class="bulk-row">
        <select v-model="bulkDept" @change="bulkSetDept">
          <option value="">改部门…</option>
          <option value="">未分配</option>
          <option v-for="d in depts" :key="d" :value="d">{{ d }}</option>
        </select>
        <input v-model="bulkRole" maxlength="12" placeholder="改职务…" @keyup.enter="bulkSetRole" />
        <button type="button" class="mini-btn" @click="bulkSetRole">应用</button>
      </div>
      <div class="bulk-row">
        <button type="button" class="mini-btn" @click="runBulk({ status: 'active' }, '设为在册')">设为在册</button>
        <button type="button" class="mini-btn" @click="runBulk({ status: 'pending' }, '设为预备')">设为预备</button>
        <button type="button" class="mini-btn" @click="runBulk({ status: 'quit' }, '移出')">移出</button>
      </div>
    </div>

    <p v-if="loading" class="empty">正在加载名册…</p>
    <p v-else-if="err" class="empty">{{ err }}</p>
    <div v-else-if="!members.length" class="empty">
      <template v-if="counts.total === 0">
        还没有成员。<br />到「报名名单」把报名的人导入，或直接添加成员。
      </template>
      <template v-else>没有符合条件的成员。<button class="link-btn" @click="resetFilters">清除筛选</button></template>
    </div>

    <div v-else class="m-list">
      <div class="m-bulk-head">
        <label class="m-check">
          <input type="checkbox" :checked="allChecked" @change="toggleAll" />
          <span>全选</span>
        </label>
        <span class="muted">{{ members.length }} 人</span>
      </div>

      <div v-for="m in members" :key="m.id" class="m-item" :class="{ open: openId === m.id }">
        <div class="m-row">
          <input class="m-check-input" type="checkbox" :checked="selected.includes(m.id)" @change="toggle(m)" />
          <div class="m-main" @click="startEdit(m)">
            <div class="m-name">
              {{ m.name }}
              <span class="m-tag" :class="'st-' + m.status">{{ MEMBER_STATUS[m.status] }}</span>
            </div>
            <div class="m-meta">{{ m.role || '成员' }}<template v-if="m.dept"> · {{ m.dept }}</template> · {{ m.phone }}</div>
            <div class="m-meta" v-if="m.sid || m.wechat || m.major">专业 {{ m.major || '—' }} · 学号 {{ m.sid || '—' }} · 微信 {{ m.wechat || '—' }}</div>
          </div>
          <button type="button" class="m-more" @click="startEdit(m)">{{ openId === m.id ? '收起' : '编辑' }}</button>
        </div>

        <div v-if="openId === m.id" class="m-edit">
          <div class="field-2">
            <div class="field">
              <label :for="'ed-dept-' + m.id">部门</label>
              <select :id="'ed-dept-' + m.id" v-model="editForm.dept">
                <option value="">未分配</option>
                <option v-for="d in depts" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
            <div class="field">
              <label :for="'ed-status-' + m.id">状态</label>
              <select :id="'ed-status-' + m.id" v-model="editForm.status">
                <option v-for="(label, key) in MEMBER_STATUS" :key="key" :value="key">{{ label }}</option>
              </select>
            </div>
          </div>
          <div class="field">
            <label :for="'ed-role-' + m.id">职务</label>
            <input :id="'ed-role-' + m.id" v-model="editForm.role" maxlength="12" placeholder="如 社长 / 部长 / 成员" />
          </div>
          <div class="field">
            <label :for="'ed-note-' + m.id">备注</label>
            <textarea :id="'ed-note-' + m.id" v-model="editForm.note" maxlength="200" placeholder="选填，例如 负责周三排练" />
          </div>
          <p v-if="editErr" class="err">{{ editErr }}</p>
          <div class="m-edit-actions">
            <button type="button" class="btn small" @click="saveEdit(m)">保存</button>
            <button v-if="m.status !== 'quit'" type="button" class="btn ghost small" @click="quitOne(m)">移出社团</button>
            <button v-else type="button" class="btn ghost small" @click="restoreOne(m)">恢复为在册</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
