import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import authRoutes from './routes/auth.js'
import clubRoutes from './routes/clubs.js'
import eventRoutes from './routes/events.js'

const app = express()
const PORT = process.env.PORT || 3001
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/clubs', clubRoutes)
app.use('/api/events', eventRoutes)
app.get('/api/health', (req, res) => res.json({ ok: true }))

// 生产模式：托管前端 build 产物（hash 路由，无需 SPA 回退）
app.use(express.static(dist))

app.use('/api', (req, res) => res.status(404).json({ error: 'Not Found' }))

app.listen(PORT, () => {
  console.log(`百团 C 端后端已启动：http://127.0.0.1:${PORT}`)
})
