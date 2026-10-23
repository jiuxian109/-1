<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useClubs } from '../../store/clubs'

const router = useRouter()
const { CATEGORIES, createClub, setRole, toast } = useClubs()

const ART_OPTIONS = [
  { v: 'dance', label: '街舞' }, { v: 'music', label: '音乐' },
  { v: 'photo', label: '摄影' }, { v: 'debate', label: '辩论' },
  { v: 'sport', label: '运动' }, { v: 'volunteer', label: '公益' },
  { v: 'science', label: '天文' }, { v: 'hanfu', label: '汉服' },
  { v: 'stage', label: '舞台' }
]

const form = reactive({ name: '', category: '兴趣', art: 'stage', intro: '', wechat: '' })
const err = ref('')

function submit() {
  if (!form.name) { err.value = '请填写社团名称'; return }
  const c = createClub({ ...form })
  setRole('club', c.id)
  toast('社团已创建')
  router.push('/club-admin')
}
</script>

<template>
  <form class="view-anim" @submit.prevent="submit">
    <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 4px">创建我的社团</h2>
    <p style="font-size: 13px; color: var(--muted); margin-bottom: 18px">创建后即可维护主页、发布活动、查看名单。</p>

    <div class="field">
      <label for="n-name">社团名称</label>
      <input id="n-name" v-model="form.name" placeholder="如 轮滑社" />
    </div>
    <div class="field">
      <label for="n-cat">分类</label>
      <select id="n-cat" v-model="form.category">
        <option v-for="c in CATEGORIES.filter((x) => x !== '全部')" :key="c" :value="c">{{ c }}</option>
      </select>
    </div>
    <div class="field">
      <label for="n-art">封面插画</label>
      <select id="n-art" v-model="form.art">
        <option v-for="a in ART_OPTIONS" :key="a.v" :value="a.v">{{ a.label }}</option>
      </select>
    </div>
    <div class="field">
      <label for="n-intro">社团简介</label>
      <textarea id="n-intro" v-model="form.intro" placeholder="一两句话说清楚你们是谁、做什么"></textarea>
    </div>
    <div class="field">
      <label for="n-wechat">微信号</label>
      <input id="n-wechat" v-model="form.wechat" placeholder="招新联系方式" />
    </div>

    <p v-if="err" class="err">{{ err }}</p>
    <button type="submit" class="btn block">创建社团</button>
  </form>
</template>
