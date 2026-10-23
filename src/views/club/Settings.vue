<script setup>
import { ref, computed, onMounted } from 'vue'
import { useClubs } from '../../store/clubs'

const { state, fetchMembers, saveDepts, toast } = useClubs()

const loading = ref(true)
const saving = ref(false)
const err = ref('')
const rows = ref([])
const members = ref([])

const unassigned = computed(() => members.value.filter((m) => !m.dept).length)
const totalAssigned = computed(() => members.value.filter((m) => m.dept).length)

onMounted(async () => {
  try {
    const d = await fetchMembers(state.user.clubId)
    members.value = d.members
    rows.value = d.depts.map((name) => ({
      name,
      orig: name,
      count: d.members.filter((m) => m.dept === name).length
    }))
  } catch (e) {
    err.value = e.message
  } finally {
    loading.value = false
  }
})

function addRow() {
  if (rows.value.length >= 20) { toast('部门最多 20 个'); return }
  rows.value.push({ name: '', orig: null, count: 0 })
}

function removeRow(i) {
  rows.value.splice(i, 1)
}

async function save() {
  saving.value = true
  try {
    const names = rows.value.map((r) => r.name.trim()).filter(Boolean)
    const renames = rows.value
      .filter((r) => r.orig && r.name.trim() && r.name.trim() !== r.orig)
      .map((r) => ({ from: r.orig, to: r.name.trim() }))
    const d = await saveDepts(state.user.clubId, names, renames)
    const full = await fetchMembers(state.user.clubId)
    members.value = full.members
    rows.value = full.depts.map((name) => ({
      name,
      orig: name,
      count: full.members.filter((m) => m.dept === name).length
    }))
    toast(d.moved ? `已保存，${d.moved} 人移到未分配` : '部门已保存')
  } catch (e) {
    toast(e.message)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="view-anim">
    <div class="page-head">
      <h2 class="page-title">{{ state.user.clubName || '我的社团' }} · 社团设置</h2>
    </div>

    <p class="hint">部门是名册里的固定选项，成员只能从这些部门中挑选；改名会让该部门成员跟着改，删除会让他们的部门变成「未分配」。</p>

    <p v-if="loading" class="empty">正在加载…</p>
    <p v-else-if="err" class="empty">{{ err }}</p>

    <template v-else>
      <div class="section-title">部门（{{ rows.length }} 个 · 已分配 {{ totalAssigned }} 人 · 未分配 {{ unassigned }} 人）</div>

      <div v-if="!rows.length" class="empty">还没有部门。加一个，就能在名册里给成员分部门了。</div>

      <div v-else class="dept-list">
        <div v-for="(r, i) in rows" :key="i" class="dept-row">
          <input v-model="r.name" maxlength="20" placeholder="部门名称，如 宣传部" />
          <span class="dept-count">{{ r.orig ? r.count + ' 人' : '新增' }}</span>
          <button type="button" class="mini-btn" @click="removeRow(i)">删除</button>
        </div>
      </div>

      <div class="m-actions">
        <button type="button" class="btn ghost small" @click="addRow">＋ 新增部门</button>
        <router-link to="/club-admin/members" class="btn ghost small">去成员管理</router-link>
      </div>

      <button class="btn block" style="margin-top: 16px" :disabled="saving" @click="save">
        {{ saving ? '保存中…' : '保存部门设置' }}
      </button>
    </template>
  </div>
</template>
