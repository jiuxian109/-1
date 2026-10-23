<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useClubs } from '../../store/clubs'
import ClubArt from '../../components/ClubArt.vue'

const router = useRouter()
const { state, ART_OPTIONS, addActivity, toast } = useClubs()

const form = reactive({ title: '', date: '', note: '', type: 'dance' })
const photos = ref(3)
const err = ref('')
const busy = ref(false)

const preview = computed(() =>
  Array.from({ length: photos.value }, (_, i) => ({ type: form.type, seed: 'prev' + i }))
)

async function submit() {
  if (!form.title || !form.date) { err.value = '请填写活动标题和日期'; return }
  busy.value = true
  err.value = ''
  try {
    await addActivity(state.user.clubId, {
      title: form.title, date: form.date, note: form.note, type: form.type, photos: photos.value
    })
    toast('活动已发布')
    router.back()
  } catch (e) {
    err.value = e.message
    busy.value = false
  }
}
</script>

<template>
  <form class="view-anim" @submit.prevent="submit">
    <div class="field">
      <label for="a-title">活动标题</label>
      <input id="a-title" v-model="form.title" placeholder="如 迎新晚会开场齐舞" />
    </div>
    <div class="field">
      <label for="a-date">日期</label>
      <input id="a-date" v-model="form.date" type="date" />
    </div>
    <div class="field">
      <label for="a-type">活动画面</label>
      <select id="a-type" v-model="form.type">
        <option v-for="a in ART_OPTIONS" :key="a.v" :value="a.v">{{ a.label }}</option>
      </select>
    </div>
    <div class="field">
      <label for="a-note">活动记录（≤200 字）</label>
      <textarea id="a-note" v-model="form.note" maxlength="200" placeholder="这次活动发生了什么"></textarea>
    </div>
    <div class="field">
      <label>照片数量：{{ photos }}</label>
      <input v-model.number="photos" type="range" min="1" max="9" step="1" style="width: 100%" />
      <div class="act-grid" style="margin-top: 10px">
        <div v-for="p in preview" :key="p.seed" class="ph"><ClubArt :type="p.type" :seed="p.seed" /></div>
      </div>
    </div>

    <p v-if="err" class="err">{{ err }}</p>
    <button type="submit" class="btn block" :disabled="busy">{{ busy ? '发布中…' : '发布活动' }}</button>
  </form>
</template>
