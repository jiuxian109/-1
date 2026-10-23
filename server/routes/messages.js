// 站内私信（Q1=B）：学生 ↔ 社团一对一对话；messages.json { threads: [{id, clubId, studentId, msgs:[{from,text,t}]}] }
import express from 'express'
import { loadMessages, updateMessages, loadClubs, loadUsers } from '../db.js'
import { verifyToken, bearer } from '../auth.js'

const router = express.Router()

function auth(req, res) {
  const p = verifyToken(bearer(req))
  if (!p) { res.status(401).json({ error: '请先登录' }); return null }
  return p
}

// 会话列表：学生看自己的全部对话，社团看自己社团的全部对话
router.get('/', (req, res) => {
  const p = auth(req, res)
  if (!p) return
  const { threads } = loadMessages()
  const mine = p.role === 'club'
    ? threads.filter((t) => t.clubId === p.clubId)
    : p.role === 'student'
      ? threads.filter((t) => t.studentId === p.uid)
      : []
  const clubs = loadClubs().clubs
  const users = loadUsers()
  const out = mine.map((t) => {
    const club = clubs.find((c) => c.id === t.clubId)
    const stu = users.find((u) => u.id === t.studentId)
    const last = t.msgs[t.msgs.length - 1] || null
    const clubName = club ? club.name : (t.meta?.clubName || '未知社团')
    const stuName = stu?.studentName || stu?.name || ''
    return {
      id: t.id,
      clubId: t.clubId,
      studentId: t.studentId,
      clubName,
      stuName,
      last: last || null,
      lastT: last ? last.t : 0
    }
  }).sort((a, b) => b.lastT - a.lastT)
  res.json({ threads: out })
})

// 发消息：学生发 {clubId,text}；社团发 {studentId,text}
router.post('/', async (req, res) => {
  const p = auth(req, res)
  if (!p) return
  const { clubId, studentId, text, clubName, stuName } = req.body || {}
  const content = String(text || '').trim()
  if (!content) return res.status(400).json({ error: '消息不能为空' })
  if (content.length > 200) return res.status(400).json({ error: '消息最多 200 字' })
  try {
    const result = await updateMessages((data) => {
      const threads = data.threads || []
      let t
      if (p.role === 'student') {
        if (!clubId) { const e = new Error('缺少社团'); e.status = 400; throw e }
        t = threads.find((x) => x.clubId === clubId && x.studentId === p.uid)
        if (!t) { t = { id: 'th' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), clubId, studentId: p.uid, msgs: [] }; threads.push(t) }
      } else if (p.role === 'club') {
        if (!studentId) { const e = new Error('缺少学生'); e.status = 400; throw e }
        t = threads.find((x) => x.clubId === p.clubId && x.studentId === studentId)
        if (!t) { t = { id: 'th' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), clubId: p.clubId, studentId, msgs: [] }; threads.push(t) }
        // 社团第一条私信记录 meta，便于学生端展示
        t.meta = t.meta || {}
        if (stuName) t.meta.stuName = stuName
      } else return { noMsg: true }
      t.msgs.push({ from: p.role === 'club' ? 'c' : 's', text: content, t: Date.now() })
      if (t.msgs.length > 200) t.msgs = t.msgs.slice(-200)
      return { id: t.id, msgs: t.msgs }
    })
    if (result.noMsg) return res.status(403).json({ error: '账号类型无法收发私信' })
    res.json({ id: result.id, msgs: result.msgs })
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message })
    res.status(500).json({ error: '发送失败，请稍后再试' })
  }
})

// 已读：POST {clubId?, studentId?} 把对方最后一条之前的都标成自己已读
router.post('/read', async (req, res) => {
  const p = auth(req, res)
  if (!p) return
  const { clubId, studentId } = req.body || {}
  try {
    await updateMessages((data) => {
      const threads = data.threads || []
      const mine = p.role === 'club'
        ? threads.filter((t) => t.clubId === clubId && t.studentId === studentId)
        : threads.filter((t) => t.clubId === clubId && t.studentId === p.uid)
      for (const t of mine) {
        const me = p.role === 'club' ? 'c' : 's'
        for (const m of t.msgs) {
          if (m.from !== me && !m.read) m.read = true
        }
      }
      return {}
    })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: '标记失败' })
  }
})

// 单会话拉取
router.get('/msgs', (req, res) => {
  const p = auth(req, res)
  if (!p) return
  const { clubId, studentId } = req.query
  const { threads } = loadMessages()
  let t = null
  if (p.role === 'student') {
    if (!clubId) return res.status(400).json({ error: '缺少社团' })
    t = threads.find((x) => x.clubId === clubId && x.studentId === p.uid)
  } else if (p.role === 'club') {
    if (!clubId || !studentId) return res.status(400).json({ error: '缺少对象' })
    t = threads.find((x) => x.clubId === clubId && x.studentId === studentId)
  } else return res.status(403).json({ error: '账号类型无法查看私信' })
  res.json({ msgs: t ? t.msgs : [], clubName: req.query.clubName || '' })
})

export default router