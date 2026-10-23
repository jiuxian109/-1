// JSON 文件库：极简持久层，users / clubs / events 三个集合，写时原子替换（tmp + rename）
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data')

function read(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'))
  } catch {
    return fallback
  }
}

function write(file, data) {
  fs.mkdirSync(DIR, { recursive: true })
  const target = path.join(DIR, file)
  const tmp = target + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
  fs.renameSync(tmp, target)
}

export const loadUsers = () => read('users.json', [])
export const saveUsers = (u) => write('users.json', u)
export const loadClubs = () => read('clubs.json', { clubs: [], nextClub: 'c1' })
export const saveClubs = (c) => write('clubs.json', c)
export const loadEvents = () => read('events.json', [])
export const saveEvents = (e) => write('events.json', e)
export const loadMessages = () => read('messages.json', { threads: [] })
export const saveMessages = (m) => write('messages.json', m)

// —— 写串行化：进程内互斥队列 ——
// 所有 handler 目前是同步的（load→改→save 在一个 tick 内完成，本身原子），
// 互斥队列是兜底：一旦某个 handler 引入 await，read-modify-write 也不会交错。
let chain = Promise.resolve()
export function serialize(fn) {
  const run = chain.then(fn, fn)
  chain = run.then(() => undefined, () => undefined)
  return run
}

// 读-改-写套件：fn 里改动 data；fn 抛错则不落盘。返回值透传。
export const updateClubs = (fn) =>
  serialize(async () => {
    const data = loadClubs()
    const result = await fn(data)
    saveClubs(data)
    return result
  })

export const updateEvents = (fn) =>
  serialize(async () => {
    const events = loadEvents()
    const result = await fn(events)
    saveEvents(events)
    return result
  })

export const updateMessages = (fn) =>
  serialize(async () => {
    const data = loadMessages()
    const result = await fn(data)
    saveMessages(data)
    return result
  })
