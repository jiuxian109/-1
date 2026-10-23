<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClubs } from '../store/clubs'

const route = useRoute()
const router = useRouter()
const { state, fetchClub, signup } = useClubs()

const loading = ref(true)
const err = ref('')
const form = reactive({ name: '', sid: '', phone: '', wechat: '', major: '', why: '' })
const agree = ref(false)
const submitErr = ref('')
const busy = ref(false)

onMounted(async () => {
  try { await fetchClub(route.params.id) } catch (e) { err.value = e.message } finally { loading.value = false }
})

const club = computed(() => state.club)

const closedMsg = computed(() => {
  if (!club.value) return ''
  if (club.value.status !== 'open') return '该社团当前不在招新，暂不能报名。'
  if (club.value.endAt && Date.now() > +club.value.endAt) return '该社团报名已截止。'
  if (club.value.quota > 0 && club.value.signupActive >= club.value.quota) return '该社团名额已满，暂不能报名。'
  return ''
})

const quotaLeft = computed(() => {
  if (!club.value || club.value.quota <= 0) return 0
  return Math.max(0, club.value.quota - club.value.signupActive)
})

function fmtDeadline(ms) {
  if (!ms) return ''
  const d = new Date(+ms)
  const p = (n) => String(n).padStart(2, '0')
  return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
}

async function submit() {
  if (!club.value) return
  if (!form.name || !form.sid || !form.phone || !form.wechat || !form.major) { submitErr.value = '请填写所有必填项'; return }
  if (!/^1\d{10}$/.test(form.phone)) { submitErr.value = '请输入 11 位手机号'; return }
  if (!agree.value) { submitErr.value = '请先勾选同意'; return }
  busy.value = true
  submitErr.value = ''
  try {
    const row = await signup(club.value.id, { ...form })
    router.push('/success/' + club.value.id + '?row=' + row)
  } catch (e) {
    submitErr.value = e.message
    busy.value = false
  }
}
</script>

<template>
  <div class="view-anim">
    <p v-if="loading" class="empty">正在加载报名表…</p>
    <p v-else-if="err" class="empty">{{ err }}</p>
    <template v-else-if="club">
      <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 4px">加入 {{ club.name }}</h2>
      <p style="font-size: 13px; color: var(--muted); margin-bottom: 18px">提交后，你的名字会写入社团花名册。</p>

      <div class="signup-meta" v-if="!closedMsg">
        <span v-if="club.endAt" class="meta-chip">报名截止：{{ fmtDeadline(club.endAt) }}</span>
        <span v-if="club.quota > 0" class="meta-chip" :class="{ 'meta-full': quotaLeft === 0 }">剩余名额：{{ quotaLeft }}</span>
      </div>

      <form v-if="!closedMsg" @submit.prevent="submit">
        <div class="field">
          <label for="f-name">姓名</label>
          <input id="f-name" v-model="form.name" placeholder="你的真实姓名" />
        </div>
        <div class="field">
          <label for="f-sid">学号</label>
          <input id="f-sid" v-model="form.sid" placeholder="如 2025010101" />
        </div>
        <div class="field">
          <label for="f-major">专业</label>
          <input id="f-major" v-model="form.major" placeholder="如 计算机科学与技术" maxlength="30" />
        </div>
        <div class="field">
          <label for="f-phone">手机号</label>
          <input id="f-phone" v-model="form.phone" type="tel" maxlength="11" placeholder="11 位手机号" />
        </div>
        <div class="field">
          <label for="f-wechat">微信号</label>
          <input id="f-wechat" v-model="form.wechat" placeholder="方便社团联系你" />
        </div>
        <div class="field">
          <label for="f-why">一句话介绍自己</label>
          <textarea id="f-why" v-model="form.why" placeholder="为什么想加入？（选填）"></textarea>
        </div>

        <label class="check">
          <input v-model="agree" type="checkbox" /> 我同意社团通过手机号与我联系
        </label>

        <p v-if="submitErr" class="err">{{ submitErr }}</p>
        <button type="submit" class="btn block" :disabled="busy">{{ busy ? '提交中…' : '提交报名' }}</button>
      </form>
      <p v-else class="empty">{{ closedMsg }}</p>
    </template>
    <p v-else class="empty">社团不存在或已下架。</p>
  </div>
</template>

<style scoped>
.signup-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.meta-chip { font-size: 12px; padding: 3px 8px; border-radius: 999px; background: var(--field); color: var(--ink-soft); }
.meta-full { background: #f9e3de; color: #a63a2a; }
</style>
