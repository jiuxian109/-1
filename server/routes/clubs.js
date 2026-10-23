import { Router } from 'express'
import { loadClubs, saveClubs, loadEvents, updateClubs } from '../db.js'
import { verifyToken, bearer } from '../auth.js'
import {
  applyTimeouts, decorate, sortRoster, pendingCount, rosterCounts, resolveRejectReason, activeCount
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
    signupActive: activeCount(c.roster || []),
    quota: c.quota || 0,
    endAt: c.endAt || null,
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

// 公开：社团列表（F5 规则排序：招新中优先，其中截止临近优先、无截止最后；非招新保持原序）
router.get('/', (req, res) => {
  const { clubs } = loadClubs()
  const sorted = [...clubs].sort((a, b) => {
    const ao = a.status === 'open' ? 0 : 1
    const bo = b.status === 'open' ? 0 : 1
    if (ao !== bo) return ao - bo
    if (ao === 0) {
      const aEnd = a.endAt ? +a.endAt : Infinity
      const bEnd = b.endAt ? +b.endAt : Infinity
      if (aEnd !== bEnd) return aEnd - bEnd
    }
    return 0
  })
  res.json({ clubs: sorted.map(publicClub) })
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
      // Q6 报名窗口：截止后不能再报名（可被设置用例回拨）
      if (c.endAt && Date.now() > c.endAt) { const e = new Error('该社团报名已截止'); e.status = 409; throw e }
      c.roster = c.roster || []
      // Q6 名额：pending+accepted 占坑，满员拒绝报名
      if (c.quota > 0 && activeCount(c.roster) >= c.quota) {
        const e = new Error('该社团名额已满'); e.status = 409; throw e
      }
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

// 社团端：编辑主页（含 Q6 名额 quota / 报名截止 endAt）
router.put('/:id', (req, res) => {
  if (!requireClub(req, res)) return
  const data = loadClubs()
  const c = data.clubs.find((x) => x.id === req.params.id)
  ;['name', 'category', 'art', 'intro', 'wechat', 'status', 'bg'].forEach((k) => {
    if (req.body && req.body[k] !== undefined) c[k] = req.body[k]
  })
  // 名额：空/0 = 不限；否则 1–9999 的整数
  if (req.body && req.body.quota !== undefined) {
    const q = req.body.quota === '' || req.body.quota === null ? 0 : Number(req.body.quota)
    if (!Number.isInteger(q) || q < 0 || q > 9999) return res.status(400).json({ error: '名额需为 0（不限）或 1–9999 的整数' })
    c.quota = q
  }
  // 截止时间：空 = 不设截止；否则必须是毫秒时间戳
  if (req.body && req.body.endAt !== undefined) {
    const v = req.body.endAt === '' || req.body.endAt === null ? null : Number(req.body.endAt)
    if (v !== null && !Number.isFinite(v)) return res.status(400).json({ error: '报名截止时间格式不正确' })
    c.endAt = v
  }
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

// 学生端：退出报名（Q11 申请-确认：前端确认后调这里，把自己的 pending/accepted 置为 withdrawn）
router.post('/:id/signup/withdraw', async (req, res) => {
  const p = auth(req, res)
  if (!p) return
  if (p.role !== 'student') return res.status(403).json({ error: '仅学生账号可以退出报名' })
  try {
    const result = await updateClubs((db) => {
      const c = db.clubs.find((x) => x.id === req.params.id)
      if (!c) { const e = new Error('社团不存在'); e.status = 404; throw e }
      applyTimeouts(c.roster || [])
      const r = (c.roster || []).find((x) => x.userId === p.uid)
      if (!r) { const e = new Error('你没有报名该社团'); e.status = 404; throw e }
      if (r.status === 'withdrawn') { const e = new Error('你已经退出过该社团的报名'); e.status = 409; throw e }
      if (r.status === 'rejected') { const e = new Error('该报名已被拒绝，无法退出'); e.status = 409; throw e }
      r.status = 'withdrawn'
      r.reviewedAt = Date.now()
      return { updated: true, counts: rosterCounts(c.roster || []) }
    })
    res.json(result)
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message })
    console.error('[withdraw]', e)
    res.status(500).json({ error: '退出失败，请稍后再试' })
  }
})

// 社团端：报名漏斗统计 + 回执质量面板（Q2：回执率 / 处理中位时长）
router.get('/:id/stats', (req, res) => {
  if (!requireClub(req, res)) return
  const events = loadEvents()
  const count = (t) => events.filter((e) => e.type === t && e.clubId === req.params.id).length
  const club = loadClubs().clubs.find((x) => x.id === req.params.id)
  const roster = club?.roster || []
  applyTimeouts(roster)
  const processed = roster.filter((r) => r.status === 'accepted' || r.status === 'rejected')
  const medianMs = (() => {
    const arr = processed.map((r) => r.reviewedAt - r.t).sort((a, b) => a - b)
    if (!arr.length) return null
    const m = Math.floor(arr.length / 2)
    return arr.length % 2 ? arr[m] : Math.round((arr[m - 1] + arr[m]) / 2)
  })()
  res.json({
    impression: count('impression'),
    view_club: count('view_club'),
    click_signup: count('click_signup'),
    submit_signup: roster.length,
    receipt: {
      total: roster.length,
      processed: processed.length,
      rate: roster.length ? Math.round((processed.length / roster.length) * 100) : 0,
      medianMs,
      medianHours: medianMs === null ? null : Math.round(medianMs / 360000) / 10
    }
  })
})

export default router
