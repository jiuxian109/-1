// 数据层：响应式单例 store + localStorage 持久化（模拟后端）
// 身份：role = 'student' | 'club'，社团端记录当前 clubId
import { reactive, computed } from 'vue'
import { seed, CATEGORIES, STATUS_LABEL } from '../data/seed'

const DB_KEY = 'baituan.c.db'
const EV_KEY = 'baituan.c.events'
const ID_KEY = 'baituan.c.identity'

function safeGet(key) {
  try { return localStorage.getItem(key) } catch (e) { return null }
}
function safeSet(key, val) {
  try { localStorage.setItem(key, val) } catch (e) {}
}
function safeRemove(key) {
  try { localStorage.removeItem(key) } catch (e) {}
}

function loadDb() {
  const raw = safeGet(DB_KEY)
  if (raw) {
    try {
      const db = JSON.parse(raw)
      if (db && Array.isArray(db.clubs)) return db
    } catch (e) {}
  }
  return { clubs: JSON.parse(JSON.stringify(seed)), nextClub: 'c9' }
}
function persistDb() {
  safeSet(DB_KEY, JSON.stringify(state.db))
}

function loadEvents() {
  const raw = safeGet(EV_KEY)
  if (raw) {
    try { return JSON.parse(raw) } catch (e) {}
  }
  return []
}
function persistEvents() {
  safeSet(EV_KEY, JSON.stringify(state.events))
}

function loadIdentity() {
  const raw = safeGet(ID_KEY)
  if (raw) {
    try {
      const id = JSON.parse(raw)
      if (id && id.role) return id
    } catch (e) {}
  }
  return { role: 'student', clubId: null }
}

function uid(prefix) {
  return prefix + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36)
}

function maskPhone(p) {
  if (!p || p.length < 7) return p || ''
  return p.slice(0, 3) + '****' + p.slice(-4)
}

export const state = reactive({
  db: loadDb(),
  events: loadEvents(),
  identity: loadIdentity(),
  toast: ''
})

const clubs = computed(() => state.db.clubs)

function getClub(id) {
  return state.db.clubs.find((c) => c.id === id) || null
}

function exportCSV(clubId) {
  const c = getClub(clubId)
  if (!c) return ''
  const rows = ['\uFEFF姓名,学号,手机号,微信号,报名理由']
  ;(c.roster || []).forEach((r) => {
    rows.push([r.name, r.sid, r.phone, r.wechat, (r.why || '').replace(/,/g, '，')]
      .map((f) => '"' + f + '"').join(','))
  })
  return rows.join('\n')
}

function downloadCSV(clubId) {
  const csv = exportCSV(clubId)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = (getClub(clubId) ? getClub(clubId).name : 'club') + '-报名名单.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function persistIdentity() {
  safeSet(ID_KEY, JSON.stringify(state.identity))
}

function toast(msg) {
  state.toast = msg
  clearTimeout(toast._t)
  toast._t = setTimeout(() => { state.toast = '' }, 2200)
}

export function useClubs() {
  return {
    CATEGORIES,
    STATUS_LABEL,
    clubs,
    getClub,

    // ---- 身份 ----
    get identity() { return state.identity },
    setRole(role, clubId = null) {
      state.identity.role = role
      state.identity.clubId = clubId
      persistIdentity()
    },
    signOut() {
      state.identity.role = 'student'
      state.identity.clubId = null
      persistIdentity()
    },

    // ---- 社团 ----
    createClub(data) {
      const c = {
        id: state.db.nextClub, name: data.name, category: data.category || '兴趣',
        art: data.art || 'stage', intro: data.intro || '', wechat: data.wechat || '',
        status: 'soon', approved: true, activities: [], roster: []
      }
      state.db.nextClub = 'c' + (parseInt(state.db.nextClub.slice(1), 10) + 1)
      state.db.clubs.unshift(c)
      persistDb()
      return c
    },
    updateClub(id, fields) {
      const c = getClub(id)
      if (c) {
        ;['name', 'category', 'art', 'intro', 'wechat', 'status'].forEach((k) => {
          if (fields[k] !== undefined) c[k] = fields[k]
        })
        persistDb()
      }
      return c
    },
    addActivity(clubId, act) {
      const c = getClub(clubId)
      if (c) {
        act.id = uid('a')
        c.activities.unshift(act)
        persistDb()
      }
      return act
    },
    addSignup(clubId, data) {
      const c = getClub(clubId)
      if (!c) return 0
      c.roster = c.roster || []
      c.roster.push(data)
      persistDb()
      return c.roster.length
    },

    // ---- 报名名单导出 ----
    maskPhone,
    exportCSV,
    downloadCSV,

    // ---- 埋点（C 端保留：曝光/进主页/点报名/提交，供社团自查报名漏斗） ----
    track(type, clubId) {
      state.events.push({ type, clubId: clubId || null, t: Date.now() })
      persistEvents()
    },
    funnel(clubId) {
      const ev = state.events
      const count = (t) => ev.filter((e) => e.type === t && (!clubId || e.clubId === clubId)).length
      return {
        impression: count('impression'),
        view_club: count('view_club'),
        click_signup: count('click_signup'),
        submit_signup: count('submit_signup')
      }
    },
    clearEvents() {
      state.events = []
      persistEvents()
    },

    // ---- 工具 ----
    toast,
    resetAll() {
      safeRemove(DB_KEY)
      safeRemove(EV_KEY)
      location.reload()
    }
  }
}
