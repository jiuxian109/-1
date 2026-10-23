import { Router } from 'express'
import crypto from 'node:crypto'
import { loadUsers, saveUsers, loadClubs, saveClubs, updateClubs } from '../db.js'
import { hashPassword, verifyPassword, signToken, verifyToken, bearer } from '../auth.js'
import { applyTimeouts } from '../signup-status.js'

const router = Router()

const uid = () => 'u' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex')

// 学生端：这个账号在哪些社团的名册里（只回在册/预备）
function membershipsOf(u) {
  if (u.role !== 'student') return []
  const out = []
  for (const c of loadClubs().clubs) {
    for (const m of Array.isArray(c.members) ? c.members : []) {
      if (m.status === 'quit') continue
      const hit = m.userId ? m.userId === u.id : m.phone === u.phone
      if (!hit) continue
      out.push({ clubId: c.id, clubName: c.name, role: m.role || '成员', dept: m.dept || '', status: m.status })
    }
  }
  return out
}

function publicUser(u) {
  const club = u.clubId ? loadClubs().clubs.find((c) => c.id === u.clubId) : null
  return {
    id: u.id,
    role: u.role,
    phone: u.phone,
    name: u.name || '',
    clubId: u.clubId || null,
    clubName: club ? club.name : '',
    memberships: membershipsOf(u)
  }
}

// 注册：学生（手机号+密码） 或 社团（手机号+密码+社团名称，注册即新建社团）
router.post('/register', (req, res) => {
  const { role, phone, password, name, clubName } = req.body || {}
  if (!phone || !password) return res.status(400).json({ error: '手机号和密码必填' })
  if (!/^1\d{10}$/.test(String(phone))) return res.status(400).json({ error: '请输入 11 位手机号' })
  if (String(password).length < 6) return res.status(400).json({ error: '密码至少 6 位' })

  const users = loadUsers()
  if (users.some((u) => u.phone === String(phone))) return res.status(409).json({ error: '该手机号已注册' })

  const isClub = role === 'club'
  const user = {
    id: uid(),
    role: isClub ? 'club' : 'student',
    phone: String(phone),
    passwordHash: hashPassword(password),
    name: isClub ? '' : (name || ''),
    clubId: null
  }

  if (isClub) {
    if (!clubName || !String(clubName).trim()) return res.status(400).json({ error: '请填写社团名称' })
    const clubs = loadClubs()
    const club = {
      id: clubs.nextClub,
      name: String(clubName).trim(),
      category: '兴趣',
      art: 'stage',
      intro: '',
      wechat: '',
      status: 'soon',
      bg: '',
      approved: true,
      activities: [],
      roster: []
    }
    clubs.nextClub = 'c' + (parseInt(clubs.nextClub.slice(1), 10) + 1)
    clubs.clubs.push(club)
    saveClubs(clubs)
    user.clubId = club.id
  }

  users.push(user)
  saveUsers(users)
  const token = signToken({ uid: user.id, role: user.role, clubId: user.clubId })
  res.json({ token, user: publicUser(user) })
})

router.post('/login', (req, res) => {
  const { phone, password } = req.body || {}
  const user = loadUsers().find((u) => u.phone === String(phone))
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: '手机号或密码错误' })
  }
  const token = signToken({ uid: user.id, role: user.role, clubId: user.clubId })
  res.json({ token, user: publicUser(user) })
})

router.get('/me', (req, res) => {
  const payload = verifyToken(bearer(req))
  if (!payload) return res.status(401).json({ error: '未登录或登录已过期' })
  const user = loadUsers().find((u) => u.id === payload.uid)
  if (!user) return res.status(401).json({ error: '账号不存在' })
  res.json({ user: publicUser(user) })
})

// 学生端：我的报名（跨社团汇总本人报名行，含状态/拒绝原因/处理时长）
router.get('/me/signups', async (req, res) => {
  const payload = verifyToken(bearer(req))
  if (!payload) return res.status(401).json({ error: '未登录或登录已过期' })
  const user = loadUsers().find((u) => u.id === payload.uid)
  if (!user) return res.status(401).json({ error: '账号不存在' })
  if (user.role !== 'student') return res.status(403).json({ error: '仅学生账号可查看我的报名' })
  try {
    // 读取时顺带结算超时报名（与名单页同一口径），一次遍历全量社团
    const data = await updateClubs((db) => {
      for (const c of db.clubs) applyTimeouts(c.roster || [])
      return db
    })
    const now = Date.now()
    const signups = []
    for (const c of data.clubs) {
      for (const r of c.roster || []) {
        if (r.userId !== user.id) continue
        signups.push({
          id: r.id && r.id.startsWith('r') ? r.id : ('r' + user.id + '_' + (r.t || 0)),
          clubId: c.id,
          clubName: c.name,
          category: c.category,
          art: c.art,
          status: r.status || 'accepted',
          rejectReason: r.rejectReason || '',
          t: r.t || 0,
          ageDays: Math.floor((now - (r.t || now)) / 86400000)
        })
      }
    }
    signups.sort((a, b) => b.t - a.t)
    res.json({ signups })
  } catch (e) {
    console.error('[my-signups]', e)
    res.status(500).json({ error: '加载我的报名失败，请稍后再试' })
  }
})

export default router
