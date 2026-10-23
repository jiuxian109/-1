import { Router } from 'express'
import { loadClubs, saveClubs, loadEvents, updateClubs } from '../db.js'
import { verifyToken, bearer } from '../auth.js'
import {
  applyTimeouts, decorate, sortRoster, pendingCount, rosterCounts, resolveRejectReason
} from '../signup-status.js'

const router = Router()

function publicClub(c) {
  return {
    id: c.id,
    name: c.name,
    category: c.category,
    art: c.art,
    intro: c.intro || '',
    wechat: c.wechat || '',
    status: c.status,
    bg: c.bg || '',
    activities: c.activities || [],
    rosterCount: (c.roster || []).length,
    pendingCount: pendingCount(c.roster || []),
    memberCount: (c.members || []).filter((m) => m.status !== 'quit').length
  }
}

function auth(req, res) {
  const p = verifyToken(bearer(req))
  if (!p) { res.status(401).json({ error: '请先登录' }); return null }
  return p
}

function requireClub(req, res) {
  const p = auth(req, res)
  if (!p) return null
  if (p.role !== 'club' || p.clubId !== req.params.id) {
    res.status(403).json({ error: '无权操作该社团' })
    return null
  }
  return p
}

// 公开：社团列表
router.get('/', (req, res) => {
  const { clubs } = loadClubs()
  res.json({ clubs: clubs.map(publicClub) })
})

// 公开：社团详情（浏览量走事件流口径，不再在这里 +1 写盘）
router.get('/:id', (req, res) => {
  const c = loadClubs().clubs.find((x) => x.id === req.params.id)
  if (!c) return res.status(404).json({ error: '社团不存在' })
  res.json({ club: publicClub(c) })
})

// 学生报名（需登录；仅学生、招新中、且未报名过）
router.post('/:id/signup', async (req, res) => {
  const p = auth(req, res)
  if (!p) return
  if (p.role !== 'student') return res.status(403).json({ error: '仅学生账号可以报名' })
  const { name, sid, phone, wechat, why } = req.body || {}
  if (!name || !sid || !phone || !wechat) return res.status(400).json({ error: '请填写所有必填项' })
  if (!/^1\d{10}$/.test(String(phone))) return res.status(400).json({ error: '请输入 11 位手机号' })
  try {
    const { row } = await updateClubs((data) => {
      const c = data.clubs.find((x) => x.id === req.params.id)
      if (!c) { const e = new Error('社团不存在'); e.status = 404; throw e }
      if (c.status !== 'open') { const e = new Error('该社团当前不在招新'); e.status = 409; throw e }
      c.roster = c.roster || []
      // 一票否决兜底：同一学生不能重复报名（按登录账号去重）
      if (c.roster.some((r) => r.userId === p.uid)) {
        const e = new Error('你已报名过该社团，无需重复提交'); e.status = 409; throw e
      }
      c.roster.push({
        id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name, sid, phone: String(phone), wechat, why: why || '',
        userId: p.uid, status: 'pending', t: Date.now()
      })
      return { row: c.roster.length }
    })
    res.json({ row })
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message })
    console.error('[signup]', e)
    res.status(500).json({ error: '提交失败，请稍后再试' })
  }
})

// 社团端：编辑主页
router.put('/:id', (req, res) => {
  if (!requireClub(req, res)) return
  const data = loadClubs()
  const c = data.clubs.find((x) => x.id === req.params.id)
  ;['name', 'category', 'art', 'intro', 'wechat', 'status', 'bg'].forEach((k) => {
    if (req.body && req.body[k] !== undefined) c[k] = req.body[k]
  })
  // 背景图只接受本服务上传接口产出的路径，或空值（清空回退封面插画）
  if (c.bg && !/^\/uploads\/[A-Za-z0-9._-]+$/.test(c.bg)) c.bg = ''
  saveClubs(data)
  res.json({ club: publicClub(c) })
})

// 社团端：发布活动
router.post('/:id/activities', (req, res) => {
  if (!requireClub(req, res)) return
  const { title, date, intro, note, photos } = req.body || {}
  if (!title || !date) return res.status(400).json({ error: '请填写活动标题和日期' })
  if (intro && String(intro).length > 120) return res.status(400).json({ error: '活动简介不超过 120 字' })
  if (note && String(note).length > 200) return res.status(400).json({ error: '活动记录不超过 200 字' })

  // 只接受本服务上传接口产出的照片路径，最多 9 张
  const list = Array.isArray(photos)
    ? photos.filter((u) => typeof u === 'string' && /^\/uploads\/[A-Za-z0-9._-]+$/.test(u)).slice(0, 9)
    : []

  const data = loadClubs()
  const c = data.clubs.find((x) => x.id === req.params.id)
  if (!c) return res.status(404).json({ error: '社团不存在' })
  const act = {
    id: 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title,
    date,
    intro: intro || '',
    note: note || '',
    photos: list
  }
  c.activities = c.activities || []
  c.activities.unshift(act)
  saveClubs(data)
  res.json({ activity: act })
})

// 社团端：报名名单（读取时惰性执行 10 天超时自动拒绝；带状态与标红派生字段）
router.get('/:id/roster', async (req, res) => {
  if (!requireClub(req, res)) return
  try {
    const data = await updateClubs((db) => {
      const c = db.clubs.find((x) => x.id === req.params.id)
      if (!c) { const e = new Error('社团不存在'); e.status = 404; throw e }
      applyTimeouts(c.roster || [])
      return db
    })
    const c = data.clubs.find((x) => x.id === req.params.id)
    const roster = decorate(sortRoster((c.roster || []).map((r) => ({ ...r }))))
    res.json({ roster, counts: rosterCounts(c.roster || []) })
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message })
    console.error('[roster]', e)
    res.status(500).json({ error: '加载名单失败' })
  }
})

// 社团端：批量处理报名（Q3 状态机 + Q4 拒绝必选原因）
// body: { ids: [rosterId...], action: 'accept' | 'reject', reasonKey? | reason? }
router.post('/:id/roster/decide', async (req, res) => {
  if (!requireClub(req, res)) return
  const body = req.body || {}
  const ids = Array.isArray(body.ids) ? body.ids.map(String) : []
  if (!ids.length) return res.status(400).json({ error: '请选择要处理的报名' })
  if (!['accept', 'reject'].includes(body.action)) return res.status(400).json({ error: '操作类型不正确' })
  let reason = null
  if (body.action === 'reject') {
    reason = resolveRejectReason(body)
    if (!reason) return res.status(400).json({ error: '拒绝报名必须选择原因（或填写自定义原因）' })
  }
  try {
    const result = await updateClubs((db) => {
      const c = db.clubs.find((x) => x.id === req.params.id)
      if (!c) { const e = new Error('社团不存在'); e.status = 404; throw e }
      applyTimeouts(c.roster || [])
      const now = Date.now()
      let updated = 0
      for (const id of ids) {
        const r = (c.roster || []).find((x) => (x.id || ('r_' + (x.userId || 'na') + '_' + (x.t || 0))) === id)
        if (!r) { const e = new Error('报名不存在：' + id); e.status = 404; throw e }
        if (r.status !== 'pending') { const e = new Error('「' + r.name + '」的报名已被处理过'); e.status = 409; throw e }
        r.status = body.action === 'accept' ? 'accepted' : 'rejected'
        r.reviewedAt = now
        if (body.action === 'reject') r.rejectReason = reason
        updated++
      }
      return { updated, counts: rosterCounts(c.roster || []) }
    })
    res.json(result)
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message })
    console.error('[decide]', e)
    res.status(500).json({ error: '处理失败，请稍后再试' })
  }
})

// 社团端：报名漏斗统计
router.get('/:id/stats', (req, res) => {
  if (!requireClub(req, res)) return
  const events = loadEvents()
  const count = (t) => events.filter((e) => e.type === t && e.clubId === req.params.id).length
  const rosterCount = (loadClubs().clubs.find((x) => x.id === req.params.id)?.roster || []).length
  res.json({
    impression: count('impression'),
    view_club: count('view_club'),
    click_signup: count('click_signup'),
    submit_signup: rosterCount
  })
})

export default router
