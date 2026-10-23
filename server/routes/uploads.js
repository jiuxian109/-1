import { Router } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { verifyToken, bearer } from '../auth.js'

const router = Router()

const UPLOAD_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads')
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const MAX_BYTES = 4 * 1024 * 1024

fs.mkdirSync(UPLOAD_DIR, { recursive: true })

// 社团端：上传活动照片（dataURL → 落盘 → 返回可访问路径）
router.post('/', (req, res) => {
  const p = verifyToken(bearer(req))
  if (!p) return res.status(401).json({ error: '请先登录' })
  if (p.role !== 'club') return res.status(403).json({ error: '只有社团账号可以上传照片' })

  const raw = String((req.body && req.body.data) || '')
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(raw)
  if (!m) return res.status(400).json({ error: '仅支持 JPG / PNG / WebP 图片' })

  const buf = Buffer.from(m[2], 'base64')
  if (!buf.length) return res.status(400).json({ error: '图片内容为空' })
  if (buf.length > MAX_BYTES) return res.status(400).json({ error: '单张图片需小于 4MB' })

  const name = Date.now().toString(36) + '-' + crypto.randomBytes(6).toString('hex') + '.' + EXT[m[1]]
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf)
  res.json({ url: '/uploads/' + name })
})

export default router
