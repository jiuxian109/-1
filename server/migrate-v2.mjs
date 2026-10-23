// V2 存量报名清理脚本（Q10 拍板：清空重来）
// 用法：node server/migrate-v2.mjs         —— dry-run，只打印计数
//       node server/migrate-v2.mjs --apply —— 实际清空各社团 roster（保留成员名册与其余数据）
import { loadClubs, saveClubs, loadEvents, saveEvents } from './db.js'

const apply = process.argv.includes('--apply')
const data = loadClubs()
let total = 0
for (const c of data.clubs) total += (c.roster || []).length

const ev = loadEvents()
const submitEvents = ev.filter((e) => e.type === 'submit_signup').length

console.log(`社团 ${data.clubs.length} 个，存量报名记录 ${total} 条，events 中 submit_signup ${submitEvents} 条`)
if (apply) {
  for (const c of data.clubs) c.roster = []
  saveClubs(data)
  saveEvents(ev.filter((e) => e.type !== 'submit_signup'))
  console.log('已执行：roster 已清空，submit_signup 事件已删除。')
} else {
  console.log('dry-run：未做任何修改。确认后加 --apply 执行。')
}