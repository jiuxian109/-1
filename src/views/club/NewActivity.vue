<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useClubs } from '../../store/clubs'

const router = useRouter()
const { state, addActivity, uploadPhoto, toast } = useClubs()

const form = reactive({ title: '', date: '', intro: '', note: '' })
const photos = ref([]) // 已选照片：{ name, data(dataURL) }
const err = ref('')
const busy = ref(false)
const busyText = ref('')

const MAX = 9
const MAX_SIDE = 1600

// 压缩到最长边 1600px 的 JPEG，避免手机原图过大
function shrink(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve('')
    }
    img.src = url
  })
}

async function pick(e) {
  const files = Array.from(e.target.files || [])
  e.target.value = ''
  const room = MAX - photos.value.length
  if (room <= 0) {
    err.value = `最多 ${MAX} 张照片`
    return
  }
  if (files.length > room) err.value = `最多 ${MAX} 张，已保留前 ${room} 张`
  for (const f of files.slice(0, room)) {
    if (!/^image\//.test(f.type)) continue
    const data = await shrink(f)
    if (data && photos.value.length < MAX) photos.value.push({ name: f.name, data })
  }
}

function removeAt(i) {
  photos.value.splice(i, 1)
}

async function submit() {
  if (!form.title || !form.date) {
    err.value = '请填写活动标题和日期'
    return
  }
  busy.value = true
  err.value = ''
  try {
    const urls = []
    for (let i = 0; i < photos.value.length; i++) {
      busyText.value = `上传照片 ${i + 1}/${photos.value.length}…`
      urls.push(await uploadPhoto(photos.value[i].data))
    }
    busyText.value = '发布中…'
    await addActivity(state.user.clubId, {
      title: form.title,
      date: form.date,
      intro: form.intro,
      note: form.note,
      photos: urls
    })
    toast('活动已发布')
    router.back()
  } catch (e) {
    err.value = e.message
    busy.value = false
    busyText.value = ''
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
      <label for="a-intro">活动简介（≤120 字）</label>
      <textarea id="a-intro" v-model="form.intro" maxlength="120" placeholder="一句话说清这场活动是什么"></textarea>
    </div>
    <div class="field">
      <label for="a-note">活动记录（≤200 字）</label>
      <textarea id="a-note" v-model="form.note" maxlength="200" placeholder="这次活动发生了什么"></textarea>
    </div>
    <div class="field">
      <label>活动照片（最多 {{ MAX }} 张，可多选）</label>
      <div class="photo-grid">
        <div v-for="(p, i) in photos" :key="p.name + i" class="photo-item">
          <img :src="p.data" :alt="p.name" />
          <button type="button" class="photo-del" :aria-label="'移除 ' + p.name" @click="removeAt(i)">×</button>
        </div>
        <label v-if="photos.length < MAX" class="photo-add">
          <input type="file" accept="image/*" multiple hidden @change="pick" />
          <span>＋</span>
        </label>
      </div>
      <p class="hint">支持 JPG / PNG / WebP，单张 4MB 以内；点 ＋ 从手机相册选择。</p>
    </div>

    <p v-if="err" class="err">{{ err }}</p>
    <button type="submit" class="btn block" :disabled="busy">{{ busy ? busyText || '处理中…' : '发布活动' }}</button>
  </form>
</template>
