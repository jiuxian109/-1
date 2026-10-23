// 分类 / 状态 / 插画选项（原 seed.js 里的常量，seed 数据已随后端化移除）
export const CATEGORIES = ['全部', '运动', '文艺', '学术', '公益', '兴趣']

export const STATUS_LABEL = {
  open: '招新进行中',
  soon: '招新未开始',
  end: '招新已结束'
}

export const ART_OPTIONS = [
  { v: 'dance', label: '街舞' }, { v: 'music', label: '音乐' },
  { v: 'photo', label: '摄影' }, { v: 'debate', label: '辩论' },
  { v: 'sport', label: '运动' }, { v: 'volunteer', label: '公益' },
  { v: 'science', label: '天文' }, { v: 'hanfu', label: '汉服' },
  { v: 'stage', label: '舞台' }
]

// 成员状态（与后端 server/routes/members.js 的 MEMBER_STATUSES 一致）
export const MEMBER_STATUS = {
  active: '在册',
  pending: '预备',
  quit: '已退出'
}

// 报名状态（与后端 server/signup-status.js 的 SIGNUP_STATUSES 一致）
export const SIGNUP_STATUS = {
  pending: '待处理',
  accepted: '已通过',
  rejected: '已拒绝',
  withdrawn: '已撤回'
}

// 拒绝报名预设原因（与后端 server/signup-status.js 的 REJECT_PRESETS 一致）
export const REJECT_REASONS = [
  { key: 'full', label: '名额已满' },
  { key: 'mismatch', label: '条件不符' },
  { key: 'closed', label: '暂停招新' }
]
