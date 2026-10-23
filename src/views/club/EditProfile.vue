<script setup>
import { reactive, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useClubs } from '../../store/clubs'

const router = useRouter()
const { CATEGORIES, STATUS_LABEL, identity, getClub, updateClub, toast } = useClubs()

const club = computed(() => getClub(identity.clubId))

const ART_OPTIONS = [
  { v: 'dance', label: '街舞' }, { v: 'music', label: '音乐' },
  { v: 'photo', label: '摄影' }, { v: 'debate', label: '辩论' },
  { v: 'sport', label: '运动' }, { v: 'volunteer', label: '公益' },
  { v: 'science', label: '天文' }, { v: 'hanfu', label: '汉服' },
  { v: 'stage', label: '舞台' }
]

const form = reactive({ name: '', category: '兴趣', art: 'stage', intro: '', wechat: '', status: 'soon' })
const ready = ref(false)

// 首次进入用当前社团数据填充
if (club.value && !ready.value) {
  Object.assign(form, {
    name: club.value.name, category: club.value.category, art: club.value.art,
    intro: club.value.intro, wechat: club.value.wechat, status: club.value.status
  })
  ready.value = true
}

function save() {
  if (!club.value) return
  if (!form.name) { toast('社团名称不能为空'); return }
  updateClub(club.value.id, { ...form })
  toast('主页已更新')
  router.back()
}
</script>

<template>
  <form v-if="club" class="view-anim" @submit.prevent="save">
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
    <button type="submit" class="btn block">保存主页</button>
  </form>
  <div v-else class="empty">还没有绑定社团。</div>
</template>
