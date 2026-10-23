import { Router } from 'express'
import crypto from 'node:crypto'
import { loadUsers, saveUsers, loadClubs, saveClubs } from '../db.js'
import { hashPassword, verifyPassword, signToken, verifyToken, bearer } from '../auth.js'

const router = Router()

const uid = () => 'u' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex')

function publicUser(u) {
  const club = u.clubId ? loadClubs().clubs.find((c) => c.id === u.clubId) : null
  return {
    id: u.id,
    role: u.role,
    phone: u.phone,
    name: u.name || '',
    clubId: u.clubId || null,
    clubName: club ? club.name : ''
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
      roster: [],
      viewCount: 0
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

export default router
