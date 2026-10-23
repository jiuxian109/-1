// 重置数据基线（P2 验收后清理）
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const dataDir = join(dirname(fileURLToPath(import.meta.url)), 'server', 'data')
const users = [
  { id: 'umvkwdkptb53582fd', role: 'club', phone: '17860110587', passwordHash: '6de93748709244e82b345dbf32d0e700:200d78884695dcf1c3d5aaebbf301d29d74eb5c30309d73327d13b63db777186', name: '', clubId: 'c1' }
]
const clubs = {
  clubs: [
    { id: 'c1', name: '影音', category: '兴趣', art: 'stage', intro: '', wechat: '', status: 'soon', bg: '', approved: true, activities: [], roster: [] }
  ],
  nextClub: 'c2'
}
const events = []
writeFileSync(join(dataDir, 'users.json'), JSON.stringify(users, null, 2))
writeFileSync(join(dataDir, 'clubs.json'), JSON.stringify(clubs, null, 2))
writeFileSync(join(dataDir, 'events.json'), JSON.stringify(events, null, 2))
console.log('users', users.length, 'clubs', clubs.clubs.length, 'events', events.length, '->', dataDir)