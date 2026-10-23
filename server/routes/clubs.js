import { Router } from 'express'
import { loadClubs, saveClubs, loadEvents } from '../db.js'
import { verifyToken, bearer } from '../auth.js'

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

// 公开：社团详情（浏览量 +1）
router.get('/:id', (req, res) => {
  const data = loadClubs()
  const c = data.clubs.find((x) => x.id === req.params.id)
  if (!c) return res.status(404).json({ error: '社团不存在' })
  c.viewCount = (c.viewCount || 0) + 1
  saveClubs(data)
  res.json({ club: publicClub(c) })
})

// 学生报名（需登录；前端限制学生身份）
router.post('/:id/signup', (req, res) => {
  const p = auth(req, res)
  if (!p) return
  const { name, sid, phone, wechat, why } = req.body || {}
  if (!name || !sid || !phone || !wechat) return res.status(400).json({ error: '请填写所有必填项' })
  if (!/^1\d{10}$/.test(String(phone))) return res.status(400).json({ error: '请输入 11 位手机号' })
  const data = loadClubs()
  const c = data.clubs.find((x) => x.id === req.params.id)
  if (!c) return res.status(404).json({ error: '社团不存在' })
  c.roster = c.roster || []
  c.roster.push({ name, sid, phone: String(phone), wechat, why: why || '', userId: p.uid, t: Date.now() })
  saveClubs(data)
  res.json({ row: c.roster.length })
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

// 社团端：报名名单
router.get('/:id/roster', (req, res) => {
  if (!requireClub(req, res)) return
  const c = loadClubs().clubs.find((x) => x.id === req.params.id)
  res.json({ roster: c.roster || [] })
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
