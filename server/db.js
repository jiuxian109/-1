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
