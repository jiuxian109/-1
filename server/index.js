import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import authRoutes from './routes/auth.js'
import clubRoutes from './routes/clubs.js'
import memberRoutes from './routes/members.js'
import eventRoutes from './routes/events.js'
import uploadRoutes from './routes/uploads.js'
import { startUpkeep } from './upkeep.js'

// 启动即执行一次维护（当日备份 + 上传回收），此后每 24h 一次
startUpkeep()

const app = express()
const PORT = process.env.PORT || 3001
const here = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(here, '..', 'dist')
const uploads = path.join(here, 'uploads')

app.use(cors())
// 活动照片以 dataURL 形式提交，放宽 JSON 体积上限（客户端已压到 1600px / JPEG）
app.use(express.json({ limit: '12mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/clubs', memberRoutes) // /:id/members*、/:id/depts
app.use('/api/clubs', clubRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/uploads', uploadRoutes)
app.get('/api/health', (req, res) => res.json({ ok: true }))

// 生产模式：托管活动照片与前端 build 产物（hash 路由，无需 SPA 回退）
app.use('/uploads', express.static(uploads, { maxAge: '7d' }))
app.use(express.static(dist))

app.use('/api', (req, res) => res.status(404).json({ error: 'Not Found' }))

app.listen(PORT, () => {
  console.log(`百团 C 端后端已启动：http://127.0.0.1:${PORT}`)
})
