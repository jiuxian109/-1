import { Router } from 'express'
import { updateEvents } from '../db.js'

const router = Router()

// 埋点：POST { type, clubId? }（口径统一：所有行为事件只走这一条事件流）
router.post('/', (req, res) => {
  const { type, clubId } = req.body || {}
  if (!type) return res.status(400).json({ error: 'type 必填' })
  updateEvents((events) => {
    events.push({ type, clubId: clubId || null, t: Date.now() })
  })
  res.json({ ok: true })
})

export default router
