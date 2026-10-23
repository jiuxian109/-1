// 数据层：API client + 响应式会话状态（后端 server/，JSON 文件库 + HMAC token 鉴权）
import { reactive } from 'vue'
import { CATEGORIES, STATUS_LABEL, ART_OPTIONS, MEMBER_STATUS, SIGNUP_STATUS, REJECT_REASONS } from '../data/constants'

const API = '/api'
const TOKEN_KEY = 'baituan.c.token'

export const state = reactive({
  token: localStorage.getItem(TOKEN_KEY) || '',
  user: null,
  clubs: [],
  club: null,
  roster: [],
  rosterCounts: { pending: 0, accepted: 0, rejected: 0, withdrawn: 0 },
  members: [],
  memberDepts: [],
  memberCounts: { active: 0, pending: 0, quit: 0, total: 0 },
  lastSignup: null,
  mySignups: [],
  messages: [],
  thread: { msgs: [] },
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
  const rows = ['\uFEFF姓名,专业,学号,手机号,微信号,报名理由,状态']
  roster.forEach((r) => {
    const cells = [r.name, r.major || '', r.sid, r.phone, r.wechat, (r.why || '').replace(/,/g, '，'), SIGNUP_STATUS[r.status] || r.status || '']
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

function fmtDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const p = (n) => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
}

// 导出成员名册（含部门/职务/状态/加入时间）
function downloadMemberCSV(members, clubName) {
  const rows = ['\uFEFF姓名,专业,学号,手机号,微信号,部门,职务,状态,加入时间,备注']
  members.forEach((m) => {
    const cells = [
      m.name, m.major || '', m.sid, m.phone, m.wechat, m.dept || '未分配',
      m.role || '成员', MEMBER_STATUS[m.status] || m.status, fmtDate(m.joinedAt),
      (m.note || '').replace(/,/g, '，')
    ]
    rows.push(cells.map((f) => '"' + String(f == null ? '' : f) + '"').join(','))
  })
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = (clubName || 'club') + '-成员名册.csv'
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
    MEMBER_STATUS,
    SIGNUP_STATUS,
    REJECT_REASONS,

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
      state.rosterCounts = d.counts
      return d.roster
    },

    // ---- 我的报名（学生端）----
    async fetchMySignups() {
      const d = await api('/auth/me/signups')
      state.mySignups = d.signups
      return d.signups
    },

    // 退出报名：申请-确认后把报名置为已撤回
    async withdrawSignup(clubId) {
      const d = await api('/clubs/' + clubId + '/signup/withdraw', { method: 'POST' })
      const row = state.mySignups.find((s) => s.clubId === clubId)
      if (row) row.status = 'withdrawn'
      return d
    },

    // 批量处理报名：action = 'accept' | 'reject'，拒绝需 reasonKey 或 reason
    async decideRoster(id, payload) {
      const d = await api('/clubs/' + id + '/roster/decide', { method: 'POST', body: payload })
      state.rosterCounts = d.counts
      return d
    },

    async fetchStats(id) {
      return api('/clubs/' + id + '/stats')
    },

    // ---- 站内私信（Q1）----
    async fetchThreads() {
      const d = await api('/messages')
      state.messages = d.threads
      return d.threads
    },

    async fetchThread(clubId, studentId) {
      const qs = new URLSearchParams()
      if (clubId) qs.set('clubId', clubId)
      if (studentId) qs.set('studentId', studentId)
      const d = await api('/messages/msgs?' + qs.toString())
      state.thread = { ...d, clubId, studentId }
      return d
    },

    async sendMessage(payload) {
      const d = await api('/messages', { method: 'POST', body: payload })
      state.thread.msgs = d.msgs
      return d
    },

    async markRead(payload) {
      return api('/messages/read', { method: 'POST', body: payload })
    },

    // ---- 成员名册（社团端） ----
    async fetchMembers(id, query) {
      const qs = new URLSearchParams()
      Object.entries(query || {}).forEach(([k, v]) => { if (v) qs.set(k, v) })
      const suffix = qs.toString() ? '?' + qs.toString() : ''
      const d = await api('/clubs/' + id + '/members' + suffix)
      state.members = d.members
      state.memberDepts = d.depts
      state.memberCounts = d.counts
      return d
    },

    async createMember(id, body) {
      const d = await api('/clubs/' + id + '/members', { method: 'POST', body })
      state.memberCounts = d.counts
      return d.member
    },

    async importMembers(id, payload) {
      const d = await api('/clubs/' + id + '/members/import', { method: 'POST', body: payload })
      state.memberCounts = d.counts
      return d
    },

    async updateMember(id, mid, patch) {
      const d = await api('/clubs/' + id + '/members/' + mid, { method: 'PATCH', body: patch })
      state.memberCounts = d.counts
      return d.member
    },

    async bulkMembers(id, ids, patch) {
      const d = await api('/clubs/' + id + '/members/bulk', { method: 'POST', body: { ids, patch } })
      state.memberCounts = d.counts
      return d
    },

    async removeMember(id, mid) {
      const d = await api('/clubs/' + id + '/members/' + mid, { method: 'DELETE' })
      state.memberCounts = d.counts
      return d.member
    },

    async saveDepts(id, depts, renames) {
      const d = await api('/clubs/' + id + '/depts', { method: 'PUT', body: { depts, renames } })
      state.memberDepts = d.depts
      return d
    },

    // 上传一张活动照片（dataURL），返回可访问路径 /uploads/xxx.jpg
    async uploadPhoto(dataUrl) {
      const d = await api('/uploads', { method: 'POST', body: { data: dataUrl } })
      return d.url
    },

    // ---- 埋点 ----
    track(type, clubId) {
      api('/events', { method: 'POST', body: { type, clubId: clubId || null } }).catch(() => {})
    },

    // ---- 工具 ----
    maskPhone,
    downloadCSV,
    downloadMemberCSV,
    fmtDate,
    toast
  }
}
