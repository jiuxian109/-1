// 报名状态机共享规则（V2 P1）
// 状态：pending 待处理 / accepted 已通过 / rejected 已拒绝 / withdrawn 已撤回
export const SIGNUP_STATUSES = ['pending', 'accepted', 'rejected', 'withdrawn']

// Q4：拒绝必须选原因——3 个预设 + 自定义（≤30 字）
export const REJECT_PRESETS = [
  { key: 'full', label: '名额已满' },
  { key: 'mismatch', label: '条件不符' },
  { key: 'closed', label: '暂停招新' }
]

// Q5：超时升级与自动拒绝（3 天标红 → 7 天学生提示 → 10 天自动拒绝）
export const DAY = 86400000
export const RED_DAYS = 3
export const SLOW_DAYS = 7
export const TIMEOUT_DAYS = 10
export const AUTO_REJECT_LABEL = '社团超时未处理'

// 报名行 id：新数据写入时生成；历史数据按 userId+t 稳定推导（决定接口靠它定位行）
export function rosterId(r) {
  return r.id || ('r_' + (r.userId || 'na') + '_' + (r.t || 0))
}

// 存量兼容兜底：无 status 的历史报名视作已通过（Q10 本应清空，这里防脏数据）
export function normalizeRosterRow(r) {
  if (!r.status) r.status = 'accepted'
  return r
}

// 惰性判定：pending 且距今 > 10 天 → 自动拒绝，原因固定「社团超时未处理」
// 返回是否发生了变更（调用方负责落盘）
export function applyTimeouts(roster, now = Date.now()) {
  let changed = false
  for (const r of roster || []) {
    if (r.status === 'pending' && now - (r.t || 0) > TIMEOUT_DAYS * DAY) {
      r.status = 'rejected'
      r.rejectReason = AUTO_REJECT_LABEL
      r.reviewedAt = now
      changed = true
    }
  }
  return changed
}

// 附加派生字段：ageDays（提交后几天）、red（待处理超 3 天标红）
export function decorate(roster, now = Date.now()) {
  return (roster || []).map((r) => ({
    ...r,
    id: rosterId(r),
    ageDays: Math.floor((now - (r.t || now)) / DAY),
    red: r.status === 'pending' && now - (r.t || 0) >= RED_DAYS * DAY
  }))
}

// 待处理优先（越老越靠前），其余按提交时间倒序
export function sortRoster(list) {
  const pend = []
  const rest = []
  list.forEach((r) => (r.status === 'pending' ? pend : rest).push(r))
  pend.sort((a, b) => (a.t || 0) - (b.t || 0))
  rest.sort((a, b) => (b.t || 0) - (a.t || 0))
  return [...pend, ...rest]
}

// 待办红点口径：仍处于 pending 且未达 10 天（超时行会计入已拒绝）
export function pendingCount(roster, now = Date.now()) {
  return (roster || []).filter((r) => r.status === 'pending' && now - (r.t || 0) <= TIMEOUT_DAYS * DAY).length
}

export function rosterCounts(roster) {
  const counts = { pending: 0, accepted: 0, rejected: 0, withdrawn: 0 }
  for (const r of roster || []) {
    const s = r.status || 'accepted'
    if (counts[s] !== undefined) counts[s]++
  }
  return counts
}

// 拒绝原因解析：reasonKey（预设）或 reason（自定义 ≤30 字）；两者都缺 → null
export function resolveRejectReason(payload) {
  const body = payload || {}
  if (body.reasonKey) {
    const hit = REJECT_PRESETS.find((p) => p.key === body.reasonKey)
    return hit ? hit.label : null
  }
  const txt = String(body.reason || '').trim()
  if (!txt || txt.length > 30) return null
  return txt
}