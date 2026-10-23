<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useClubs } from '../../store/clubs'

const router = useRouter()
const { state, CATEGORIES, STATUS_LABEL, ART_OPTIONS, fetchClub, updateClub, toast } = useClubs()

const loading = ref(true)
const err = ref('')
const saving = ref(false)
const form = reactive({ name: '', category: '兴趣', art: 'stage', intro: '', wechat: '', status: 'soon' })

onMounted(async () => {
  try {
    const c = await fetchClub(state.user.clubId)
    Object.assign(form, {
      name: c.name, category: c.category, art: c.art, intro: c.intro, wechat: c.wechat, status: c.status
    })
  } catch (e) {
    err.value = e.message
  } finally {
    loading.value = false
  }
})

async function save() {
  if (!form.name) { toast('社团名称不能为空'); return }
  saving.value = true
  err.value = ''
  try {
    await updateClub(state.user.clubId, { ...form })
    toast('主页已更新')
    router.back()
  } catch (e) {
    err.value = e.message
    saving.value = false
  }
}
</script>

<template>
  <div class="view-anim">
    <p v-if="loading" class="empty">正在加载…</p>
    <p v-else-if="err" class="empty">{{ err }}</p>
    <form v-else @submit.prevent="save">
      <div class="field">
        <label for="e-name">社团名称</label>
        <input id="e-name" v-model="form.name" />
      </div>
      <div class="field">
        <label for="e-cat">分类</label>
        <select id="e-cat" v-model="form.category">
          <option v-for="c in CATEGORIES.filter((x) => x !== '全部')" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <div class="field">
        <label for="e-art">封面插画</label>
        <select id="e-art" v-model="form.art">
          <option v-for="a in ART_OPTIONS" :key="a.v" :value="a.v">{{ a.label }}</option>
        </select>
      </div>
      <div class="field">
        <label for="e-intro">社团简介</label>
        <textarea id="e-intro" v-model="form.intro" placeholder="一两句话说清楚你们是谁、做什么"></textarea>
      </div>
      <div class="field">
        <label for="e-wechat">微信号</label>
        <input id="e-wechat" v-model="form.wechat" placeholder="招新联系方式" />
      </div>
      <div class="field">
        <label for="e-status">招新状态</label>
        <select id="e-status" v-model="form.status">
          <option v-for="(label, v) in STATUS_LABEL" :key="v" :value="v">{{ label }}</option>
        </select>
      </div>
      <button type="submit" class="btn block" :disabled="saving">{{ saving ? '保存中…' : '保存主页' }}</button>
    </form>
  </div>
</template>
