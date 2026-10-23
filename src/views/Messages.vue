<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useClubs } from '../store/clubs'

const route = useRoute()
const { state, fetchThreads, fetchThread, sendMessage, markRead } = useClubs()

const selected = ref(null) // 当前会话 {clubId, studentId, clubName, stuName}
const msgs = ref([])
const input = ref('')
const box = ref(null)
const otherName = computed(() => {
  if (!selected.value) return ''
  return state.user?.role === 'club'
    ? (selected.value.stuName || selected.value.studentId)
    : (selected.value.clubName || '社团')
})

async function openThread(t) {
  selected.value = t
  await fetchThread(t.clubId, t.studentId)
  msgs.value = state.thread.msgs || []
  await markRead({ clubId: t.clubId, studentId: t.studentId })
  await fetchThreads()
  await nextTick()
  scrollBottom()
}

async function send() {
  const text = input.value.trim()
  if (!text || !selected.value) return
  input.value = ''
  const isClub = state.user?.role === 'club'
  const payload = isClub
    ? { studentId: selected.value.studentId, text, stuName: selected.value.stuName }
    : { clubId: selected.value.clubId, text, clubName: selected.value.clubName }
  await sendMessage(payload)
  await fetchThread(selected.value.clubId, selected.value.studentId)
  msgs.value = state.thread.msgs || []
  await fetchThreads()
  await nextTick()
  scrollBottom()
}

function scrollBottom() {
  if (box.value) box.value.scrollTop = box.value.scrollHeight
}

function fmt(t) {
  const d = new Date(t)
  const p = (n) => String(n).padStart(2, '0')
  return (d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
}

onMounted(async () => {
  await fetchThreads()
  // 带参进入（社团主页「私信社团」/ 名单行「私信」）：直接定位会话
  if (route.query.club && state.user?.role === 'student') {
    const t = state.messages.find((x) => x.clubId === route.query.club)
    if (t) await openThread(t)
    else {
      selected.value = { clubId: route.query.club, studentId: state.user.id, clubName: route.query.name || '' }
      msgs.value = []
    }
  } else if (route.query.sid && state.user?.role === 'club') {
    const t = state.messages.find((x) => x.studentId === route.query.sid)
    if (t) await openThread(t)
    else {
      selected.value = { clubId: state.user.clubId, studentId: route.query.sid, stuName: route.query.sname || '' }
      msgs.value = []
    }
  }
})
</script>

<template>
  <div class="msg-wrap">
    <div class="msg-head">{{ selected ? otherName : '私信' }}</div>
    <template v-if="!selected">
      <div v-if="!state.messages.length" class="empty">还没有私信。学生可在社团主页「私信社团」，社团可在报名名单里「私信」。</div>
      <button
        v-for="t in state.messages" :key="t.id" class="thread"
        @click="openThread(t)"
      >
        <div class="th-main">
          <div class="th-name">{{ state.user?.role === 'club' ? (t.stuName || t.studentId) : t.clubName }}</div>
          <div class="th-last">{{ t.last ? t.last.text.slice(0, 40) : '开始对话' }}</div>
        </div>
        <div class="th-meta">
          <span class="th-time">{{ t.lastT ? fmt(t.lastT) : '' }}</span>
        </div>
      </button>
    </template>
    <template v-else>
      <button class="back" @click="selected = null; msgs = []">‹ 全部私信</button>
      <div ref="box" class="chat">
        <div v-for="(m, i) in msgs" :key="i" class="bubble-row" :class="m.from === (state.user?.role === 'club' ? 'c' : 's') ? 'me' : 'them'">
          <div class="bubble">{{ m.text }}</div>
          <div class="b-time">{{ fmt(m.t) }}</div>
        </div>
      </div>
      <div class="composer">
        <input v-model="input" maxlength="200" placeholder="输入消息…" @keyup.enter="send" />
        <button class="send" @click="send" :disabled="!input.trim()">发送</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.msg-wrap { padding: 14px 16px 110px; }
.msg-head { font-size: 17px; font-weight: 800; margin-bottom: 12px; }
.empty { color: var(--muted); font-size: 14px; padding: 24px 0; }
.thread { display: flex; align-items: center; justify-content: space-between; width: 100%; text-align: left; background: var(--surface); border: none; border-radius: 14px; padding: 13px 14px; margin-bottom: 10px; cursor: pointer; }
.th-name { font-weight: 700; font-size: 15px; }
.th-last { font-size: 13px; color: var(--muted); margin-top: 2px; }
.th-time { font-size: 12px; color: var(--muted); }
.back { background: none; border: none; color: var(--accent); font-weight: 700; font-size: 14px; padding: 0; margin-bottom: 10px; cursor: pointer; }
.chat { display: flex; flex-direction: column; gap: 10px; max-height: 52vh; overflow-y: auto; }
.bubble-row { display: flex; flex-direction: column; align-items: flex-start; }
.bubble-row.me { align-items: flex-end; }
.bubble { max-width: 78%; padding: 9px 12px; border-radius: 14px; font-size: 14px; background: var(--field); white-space: pre-wrap; word-break: break-word; }
.me .bubble { background: var(--accent); color: #fff; }
.b-time { font-size: 11px; color: var(--muted); margin-top: 2px; }
.composer { position: fixed; bottom: 66px; left: 50%; transform: translateX(-50%); width: min(430px, 100%); display: flex; gap: 8px; padding: 10px 12px; background: var(--ground); border-top: 1px solid var(--field-2); }
.composer input { flex: 1; border: 1px solid var(--field-2); border-radius: 999px; padding: 10px 14px; font-size: 14px; background: var(--surface); }
.send { border: none; background: var(--accent); color: #fff; border-radius: 999px; padding: 10px 18px; font-weight: 700; cursor: pointer; }
.send:disabled { opacity: .5; }
</style>