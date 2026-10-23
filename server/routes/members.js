import { Router } from 'express'
import crypto from 'node:crypto'
import { loadClubs, saveClubs, loadUsers } from '../db.js'
import { verifyToken, bearer } from '../auth.js'

const router = Router()

export const MEMBER_STATUSES = ['active', 'pending', 'quit']
const MAX_MEMBERS = 500
const MAX_DEPTS = 20
const DEF_ROLE = '成员'

const newId = () => 'm' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex')
const cut = (v, n) => String(v == null ? '' : v).trim().slice(0, n)

function needAuth(req, res) {
  const p = verifyToken(bearer(req))
  if (!p) { res.status(401).json({ error: '请先登录' }); return null }
  return p
}

function needClub(req, res) {
  const p = needAuth(req, res)
  if (!p) return null
  if (p.role !== 'club' || p.clubId !== req.params.id) {
    res.status(403).json({ error: '无权操作该社团' })
    return null
  }
  return p
}

// 读出社团并补齐 members/depts 结构（老数据没有这两个字段）
function ctx(req, res) {
  const data = loadClubs()
  const c = data.clubs.find((x) => x.id === req.params.id)
  if (!c) { res.status(404).json({ error: '社团不存在' }); return null }
  if (!Array.isArray(c.depts)) c.depts = []
  if (!Array.isArray(c.members)) c.members = []
  return { data, c }
}

function countsOf(members) {
  const out = { active: 0, pending: 0, quit: 0, total: members.length }
  members.forEach((m) => { if (out[m.status] !== undefined) out[m.status] += 1 })
  return out
}

function publicMember(m) {
  return {
    id: m.id,
    name: m.name,
    phone: m.phone,
    sid: m.sid || '',
    wechat: m.wechat || '',
    dept: m.dept || '',
    role: m.role || DEF_ROLE,
    status: MEMBER_STATUSES.includes(m.status) ? m.status : 'active',
    note: m.note || '',
    joinedAt: m.joinedAt || 0,
    userId: m.userId || null
  }
}

// 同一社团内手机号唯一（所有状态都算）
function takenPhone(c, phone, exceptId) {
  return (c.members || []).find((m) => m.phone === phone && m.id !== exceptId)
}

function phoneOwner(c, phone) {
  const hit = takenPhone(c, phone)
  if (!hit) return ''
  return hit.status === 'quit'
    ? '该手机号在名册中（已退出），可在名册里恢复为在册'
    : '该手机号已在名册中'
}

// 新生效的成员字段；partial=false 时按「新增」校验必填项
function validate(body, depts, { partial = false } = {}) {
  const out = {}
  const has = (k) => body && body[k] !== undefined

  if (!partial || has('name')) {
    const name = cut(body && body.name, 20)
    if (!name) return { error: '请填写姓名' }
    out.name = name
  }
  if (!partial || has('phone')) {
    const phone = cut(body && body.phone, 11)
    if (!/^1\d{10}$/.test(phone)) return { error: '请输入 11 位手机号' }
    out.phone = phone
  }
  if (has('sid')) out.sid = cut(body.sid, 30)
  if (has('wechat')) out.wechat = cut(body.wechat, 40)
  if (has('note')) out.note = cut(body.note, 200)

  if (!partial || has('dept')) {
    const dept = cut(body && body.dept, 20)
    if (dept && !depts.includes(dept)) return { error: '部门不存在，请先在社团设置里添加' }
    out.dept = dept
  }
  if (!partial || has('role')) {
    const role = cut(body && body.role, 12)
    out.role = role || DEF_ROLE
  }
  if (!partial || has('status')) {
    const status = cut(body && body.status, 10) || 'active'
    if (!MEMBER_STATUSES.includes(status)) return { error: '状态只能是 active / pending / quit' }
    out.status = status
  }
  return { value: out }
}

// 学生账号兜底匹配：手机号命中已注册学生就绑定 userId，学生端才能看到自己的社团身份
function linkUser(phone, fallbackUserId) {
  if (fallbackUserId) {
    const u = loadUsers().find((x) => x.id === fallbackUserId)
    if (u && (!phone || u.phone === phone)) return u.id
  }
  const u = loadUsers().find((x) => x.phone === phone && x.role === 'student')
  return u ? u.id : null
}

// 社团端：成员列表（可搜索/按状态与部门筛选）
router.get('/:id/members', (req, res) => {
  if (!needClub(req, res)) return
  const c0 = ctx(req, res)
  if (!c0) return
  const c = c0.c
  const q = cut(req.query.q, 30).toLowerCase()
  const status = cut(req.query.status, 10)
  const dept = cut(req.query.dept, 20)

  let list = c.members.slice()
  if (status && MEMBER_STATUSES.includes(status)) list = list.filter((m) => m.status === status)
  if (dept) list = list.filter((m) => (m.dept || '') === dept)
  if (q) {
    list = list.filter((m) =>
      [m.name, m.sid, m.phone, m.wechat, m.role, m.dept]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    )
  }
  // 新加入的排前面（joinedAt 是 ISO 字符串，必须转时间戳再比）
  list.sort((a, b) => {
    const ta = Date.parse(a.joinedAt) || 0
    const tb = Date.parse(b.joinedAt) || 0
    return tb - ta || String(a.name).localeCompare(String(b.name), 'zh')
  })

  res.json({
    members: list.map(publicMember),
    depts: c.depts,
    counts: countsOf(c.members)
  })
})

// 社团端：手动新增成员
router.post('/:id/members', (req, res) => {
  if (!needClub(req, res)) return
  const c0 = ctx(req, res)
  if (!c0) return
  const { c, data } = c0
  if (c.members.length >= MAX_MEMBERS) return res.status(400).json({ error: `名册最多 ${MAX_MEMBERS} 人` })

  const v = validate(req.body, c.depts)
  if (v.error) return res.status(400).json({ error: v.error })
  const dup = phoneOwner(c, v.value.phone)
  if (dup) return res.status(409).json({ error: dup })

  const m = {
    id: newId(),
    ...v.value,
    joinedAt: Date.now(),
    userId: linkUser(v.value.phone, null)
  }
  c.members.push(m)
  saveClubs(data)
  res.json({ member: publicMember(m), counts: countsOf(c.members) })
})

// 社团端：从报名名单导入（all:true 全部，或 rows:[下标...]）
router.post('/:id/members/import', (req, res) => {
  if (!needClub(req, res)) return
  const c0 = ctx(req, res)
  if (!c0) return
  const { c, data } = c0
  const roster = Array.isArray(c.roster) ? c.roster : []
  const body = req.body || {}
  let rows = []

  if (body.all === true) {
    rows = roster
  } else if (Array.isArray(body.rows)) {
    rows = body.rows.map((i) => roster[Number(i)]).filter(Boolean)
  } else {
    return res.status(400).json({ error: '请指定要导入的报名记录' })
  }

  // V2 状态机：只有「已通过」的报名才能转入名册（无 status 的历史数据兜底视为已通过）
  rows = rows.filter((r) => (r.status || 'accepted') === 'accepted')

  let added = 0
  let skipped = 0
  for (const r of rows) {
    const phone = cut(r.phone, 11)
    if (!/^1\d{10}$/.test(phone) || takenPhone(c, phone)) { skipped += 1; continue }
    if (c.members.length >= MAX_MEMBERS) { skipped += 1; continue }
    c.members.push({
      id: newId(),
      name: cut(r.name, 20) || '未填姓名',
      phone,
      sid: cut(r.sid, 30),
      wechat: cut(r.wechat, 40),
      dept: '',
      role: DEF_ROLE,
      status: 'active',
      note: '',
      joinedAt: Date.now(),
      userId: linkUser(phone, r.userId)
    })
    added += 1
  }
  saveClubs(data)
  res.json({ added, skipped, counts: countsOf(c.members), members: c.members.map(publicMember) })
})

// 社团端：批量修改（部门/职务/状态）
router.post('/:id/members/bulk', (req, res) => {
  if (!needClub(req, res)) return
  const c0 = ctx(req, res)
  if (!c0) return
  const { c, data } = c0
  const { ids, patch } = req.body || {}
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: '请选择要修改的成员' })

  const v = validate(patch || {}, c.depts, { partial: true })
  if (v.error) return res.status(400).json({ error: v.error })
  if (!Object.keys(v.value).length) return res.status(400).json({ error: '没有要修改的字段' })

  let updated = 0
  c.members.forEach((m) => {
    if (!ids.includes(m.id)) return
    Object.assign(m, v.value)
    updated += 1
  })
  saveClubs(data)
  res.json({ updated, counts: countsOf(c.members) })
})

// 社团端：修改单个成员
router.patch('/:id/members/:mid', (req, res) => {
  if (!needClub(req, res)) return
  const c0 = ctx(req, res)
  if (!c0) return
  const { c, data } = c0
  const m = c.members.find((x) => x.id === req.params.mid)
  if (!m) return res.status(404).json({ error: '成员不存在' })

  const v = validate(req.body, c.depts, { partial: true })
  if (v.error) return res.status(400).json({ error: v.error })
  if (v.value.phone && v.value.phone !== m.phone) {
    const dup = phoneOwner(c, v.value.phone)
    if (dup) return res.status(409).json({ error: dup })
    v.value.userId = linkUser(v.value.phone, m.userId)
  }
  Object.assign(m, v.value)
  saveClubs(data)
  res.json({ member: publicMember(m), counts: countsOf(c.members) })
})

// 社团端：移出（软删，状态改为已退出，可恢复）
router.delete('/:id/members/:mid', (req, res) => {
  if (!needClub(req, res)) return
  const c0 = ctx(req, res)
  if (!c0) return
  const { c, data } = c0
  const m = c.members.find((x) => x.id === req.params.mid)
  if (!m) return res.status(404).json({ error: '成员不存在' })
  m.status = 'quit'
  saveClubs(data)
  res.json({ member: publicMember(m), counts: countsOf(c.members) })
})

// 社团端：维护部门字典（支持重命名映射，删除的部门成员落到「未分配」）
router.put('/:id/depts', (req, res) => {
  if (!needClub(req, res)) return
  const c0 = ctx(req, res)
  if (!c0) return
  const { c, data } = c0
  const body = req.body || {}
  if (!Array.isArray(body.depts)) return res.status(400).json({ error: '部门列表格式不对' })

  const next = []
  for (const d of body.depts) {
    const v = cut(d, 20)
    if (v && !next.includes(v)) next.push(v)
  }
  if (next.length > MAX_DEPTS) return res.status(400).json({ error: `部门最多 ${MAX_DEPTS} 个` })

  if (Array.isArray(body.renames)) {
    for (const r of body.renames) {
      const from = cut(r && r.from, 20)
      const to = cut(r && r.to, 20)
      if (!from || from === to) continue
      c.members.forEach((m) => {
        if (m.dept === from) m.dept = to && next.includes(to) ? to : ''
      })
    }
  }

  let moved = 0
  c.members.forEach((m) => {
    if (m.dept && !next.includes(m.dept)) { m.dept = ''; moved += 1 }
  })
  c.depts = next
  saveClubs(data)
  res.json({ depts: next, moved, counts: countsOf(c.members) })
})

export default router
