// 数据层：API client + 响应式会话状态（后端 server/，JSON 文件库 + HMAC token 鉴权）
import { reactive } from 'vue'
import { CATEGORIES, STATUS_LABEL, ART_OPTIONS } from '../data/constants'

const API = '/api'
const TOKEN_KEY = 'baituan.c.token'

export const state = reactive({
  token: localStorage.getItem(TOKEN_KEY) || '',
  user: null,
  clubs: [],
  club: null,
  roster: [],
  lastSignup: null,
  loading: false,
  toast: ''
})

function toast(msg) {
  state.toast = msg
  clearTimeout(toast._t)
  toast._t = setTimeout(() => { state.toast = '' }, 2200)
}

async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (state.token) headers.Authorization = 'Bearer ' + state.token
  const res = await fetch(API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || '请求失败（' + res.status + '）')
  return data
}

function maskPhone(p) {
  if (!p || p.length < 7) return p || ''
  return p.slice(0, 3) + '****' + p.slice(-4)
}

function downloadCSV(roster, clubName) {
  const rows = ['\uFEFF姓名,学号,手机号,微信号,报名理由']
  roster.forEach((r) => {
    const cells = [r.name, r.sid, r.phone, r.wechat, (r.why || '').replace(/,/g, '，')]
    rows.push(cells.map((f) => '"' + String(f) + '"').join(','))
  })
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = (clubName || 'club') + '-报名名单.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function useClubs() {
  return {
    state,
    CATEGORIES,
    STATUS_LABEL,
    ART_OPTIONS,

    // ---- 账号 ----
    get user() { return state.user },
    get isLoggedIn() { return !!state.user },

    async register(payload) {
      const d = await api('/auth/register', { method: 'POST', body: payload })
      state.token = d.token
      state.user = d.user
      localStorage.setItem(TOKEN_KEY, d.token)
      return d.user
    },

    async login(phone, password) {
      const d = await api('/auth/login', { method: 'POST', body: { phone, password } })
      state.token = d.token
      state.user = d.user
      localStorage.setItem(TOKEN_KEY, d.token)
      return d.user
    },

    async me() {
      if (!state.token) { state.user = null; return null }
      try {
        const d = await api('/auth/me')
        state.user = d.user
        return d.user
      } catch {
        state.token = ''
        state.user = null
        localStorage.removeItem(TOKEN_KEY)
        return null
      }
    },

    logout() {
      state.token = ''
      state.user = null
      state.club = null
      state.lastSignup = null
      localStorage.removeItem(TOKEN_KEY)
    },

    // ---- 社团 ----
    async fetchClubs() {
      const d = await api('/clubs')
      state.clubs = d.clubs
      return d.clubs
    },

    async fetchClub(id) {
      const d = await api('/clubs/' + id)
      state.club = d.club
      return d.club
    },

    async signup(id, body) {
      const d = await api('/clubs/' + id + '/signup', { method: 'POST', body })
      state.lastSignup = { row: d.row, name: body.name, sid: body.sid, phone: body.phone, why: body.why }
      return d.row
    },

    async updateClub(id, fields) {
      const d = await api('/clubs/' + id, { method: 'PUT', body: fields })
      state.club = d.club
      return d.club
    },

    async addActivity(id, body) {
      const d = await api('/clubs/' + id + '/activities', { method: 'POST', body })
      return d.activity
    },

    async fetchRoster(id) {
      const d = await api('/clubs/' + id + '/roster')
      state.roster = d.roster
      return d.roster
    },

    async fetchStats(id) {
      return api('/clubs/' + id + '/stats')
    },

    // ---- 埋点 ----
    track(type, clubId) {
      api('/events', { method: 'POST', body: { type, clubId: clubId || null } }).catch(() => {})
    },

    // ---- 工具 ----
    maskPhone,
    downloadCSV,
    toast
  }
}
