import { Router } from 'express'
import { loadEvents, saveEvents } from '../db.js'

const router = Router()

// 埋点：POST { type, clubId? }
router.post('/', (req, res) => {
  const { type, clubId } = req.body || {}
  if (!type) return res.status(400).json({ error: 'type 必填' })
  const events = loadEvents()
  events.push({ type, clubId: clubId || null, t: Date.now() })
  saveEvents(events)
  res.json({ ok: true })
})

export default router
