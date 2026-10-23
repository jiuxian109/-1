// 日常维护：当日备份（数据目录）+ 上传文件回收（超期且无引用的文件）
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadClubs } from './db.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DATA = path.join(HERE, 'data')
const UPLOADS = path.join(HERE, 'uploads')
const BACKUP_DIR = path.join(DATA, 'backups')

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 当日首次调用时把三个集合整体复制进 data/backups/YYYY-MM-DD/，只保留最近 14 天
export function backupDaily() {
  try {
    const dir = path.join(BACKUP_DIR, today())
    if (fs.existsSync(dir)) return
    fs.mkdirSync(dir, { recursive: true })
    for (const f of ['users.json', 'clubs.json', 'events.json']) {
      const src = path.join(DATA, f)
      if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dir, f))
    }
    const dirs = fs.readdirSync(BACKUP_DIR).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort()
    while (dirs.length > 14) {
      fs.rmSync(path.join(BACKUP_DIR, dirs.shift()), { recursive: true, force: true })
    }
  } catch (err) {
    console.error('[upkeep] 备份失败：', err.message)
  }
}

// 删除超过 maxAgeDays 且未被任何 club.bg / 活动 photos 引用的上传文件
export function sweepUploads(maxAgeDays = 30) {
  try {
    if (!fs.existsSync(UPLOADS)) return 0
    const refs = new Set()
    for (const c of loadClubs().clubs) {
      if (c.bg) refs.add(c.bg)
      for (const a of c.activities || []) for (const u of a.photos || []) refs.add(u)
    }
    const cutoff = Date.now() - maxAgeDays * 86400e3
    let removed = 0
    for (const f of fs.readdirSync(UPLOADS)) {
      const p = path.join(UPLOADS, f)
      const st = fs.statSync(p)
      if (!st.isFile()) continue
      if (refs.has('/uploads/' + f)) continue
      if (st.mtimeMs > cutoff) continue
      fs.rmSync(p, { force: true })
      removed++
    }
    return removed
  } catch (err) {
    console.error('[upkeep] 上传回收失败：', err.message)
    return 0
  }
}

// 服务启动时执行一次，之后每 24h 一次；timer 不阻止进程退出
export function startUpkeep() {
  backupDaily()
  sweepUploads()
  const timer = setInterval(() => {
    backupDaily()
    sweepUploads()
  }, 24 * 3600 * 1000)
  timer.unref?.()
}