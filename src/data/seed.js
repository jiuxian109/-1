// 种子数据：8 个社团 + 篮球社 2 条报名名单
// 字段与百团 V1 产品定义对齐：id/name/category/art/intro/wechat/status/approved/activities[]/roster[]
export const CATEGORIES = ['全部', '运动', '文艺', '学术', '公益', '兴趣']

export const STATUS_LABEL = {
  open: '招新进行中',
  soon: '招新未开始',
  end: '招新已结束'
}

export const seed = [
  {
    id: 'c1', name: '街舞社', category: '文艺', art: 'dance',
    intro: '街舞社是校内最有节奏感的一群人的集合。我们跳 hip-hop、爵士与 urban，每学期排演一支齐舞，也欢迎零基础的新人从第一节课开始。这里没有门槛，只有一起流汗、一起上台的伙伴。',
    wechat: 'dance_club_2025', status: 'open',
    activities: [
      { id: 'a1', title: '迎新晚会开场齐舞', date: '2025-09-18', note: '十六个人、一支齐舞，把迎新晚会的场子点着。排练四周，正式演出三分半。', type: 'dance', seed: 'd1', photos: 6 },
      { id: 'a2', title: '教学楼快闪', date: '2025-10-25', note: '课间十分钟，在连廊上突然响起音乐，路过的同学一起跳了最后一小节。', type: 'dance', seed: 'd2', photos: 4 },
      { id: 'a3', title: '期末汇演·首支原创编舞', date: '2025-11-30', note: '把这一学期的所有练习，编成一支六分钟的原创作品，献给每一次排练室熄灯后还亮着的自己。', type: 'dance', seed: 'd3', photos: 9 }
    ],
    roster: []
  },
  {
    id: 'c2', name: '摄影社', category: '兴趣', art: 'photo',
    intro: '我们相信镜头是另一双眼睛。摄影社定期组织外拍、暗房体验与作品点评，从构图、光线到后期一步步带你入门。你不需要昂贵的器材，只需要愿意停下来看这个世界。',
    wechat: 'camera_eye_9', status: 'open',
    activities: [
      { id: 'a4', title: '老城区扫街', date: '2025-09-07', note: '三十个人、一个下午，在城墙根下按下一千次快门，选出十二张最好的贴在社里。', type: 'photo', seed: 'p1', photos: 7 },
      { id: 'a5', title: '星空延时分享会', date: '2025-10-12', note: '一起爬到楼顶，支起三脚架等银河升起，也聊聊每一张照片背后漫长的等待。', type: 'photo', seed: 'p2', photos: 5 }
    ],
    roster: []
  },
  {
    id: 'c3', name: '篮球社', category: '运动', art: 'sport',
    intro: '篮球社不只是校队，更是所有爱打球的人的主场。每周三次固定训练与友谊赛，从运球基本功到战术配合都有老队员带。无论水平高低，只要你上场，就有人给你传球。',
    wechat: 'hoop_never_stop', status: 'open',
    activities: [
      { id: 'a6', title: '新生杯 3v3', date: '2025-09-28', note: '八支队伍、一个下午的小组赛加淘汰赛，最后一场打到了加时。', type: 'sport', seed: 'b1', photos: 6 },
      { id: 'a7', title: '跨校友谊赛', date: '2025-10-19', note: '客场作战，比分落后一整场，第四节追到只差两分。输赢之外，拼到最后一秒。', type: 'sport', seed: 'b2', photos: 8 }
    ],
    roster: [
      { name: '林一凡', sid: '2025010101', phone: '13800001234', wechat: 'linyf', why: '打过高中校队，想继续打。' },
      { name: '陈思远', sid: '2025010142', phone: '13900005678', wechat: 'csy_hoop', why: '零基础但很想练。' }
    ]
  },
  {
    id: 'c4', name: '辩论队', category: '学术', art: 'debate',
    intro: '辩论队是一群把「再想想」当口头禅的人。我们每周模辩、拆题、复盘，训练的是逻辑、表达与在压力下依然讲道理的能力。不敢开口的人，在这里会找到第一句属于自己的话。',
    wechat: 'debate_say_it', status: 'open',
    activities: [
      { id: 'a8', title: '校内赛·十六进八', date: '2025-09-21', note: '辩题：短视频让生活更丰富还是更贫瘠。正反双方各执一词，观众席坐到了门口。', type: 'debate', seed: 'db1', photos: 5 },
      { id: 'a9', title: '省赛备赛公开复盘', date: '2025-10-26', note: '把省赛失利的每一分钟拆开重看，讲清楚哪一步判断错了，比赢更难得。', type: 'debate', seed: 'db2', photos: 3 }
    ],
    roster: []
  },
  {
    id: 'c5', name: '合唱团', category: '文艺', art: 'music',
    intro: '合唱团有六十个声部各异的普通人，一起练成一件乐器。每周两次排练，从发声到分声部再到合排，唱古典也唱流行改编。五音不全不是问题，愿意开口就是最大的天赋。',
    wechat: 'choir_60', status: 'soon',
    activities: [
      { id: 'a10', title: '秋季音乐会·《海阔天空》改编', date: '2025-11-08', note: '把一首流行歌唱成四声部，谢幕时全场跟着一起哼。', type: 'music', seed: 'm1', photos: 8 }
    ],
    roster: []
  },
  {
    id: 'c6', name: '志愿者协会', category: '公益', art: 'volunteer',
    intro: '志愿者协会相信小事能累积成改变。我们长期组织社区支教、旧物回收与校园导览，也承接校内外公益活动的执行。每一次报名、每一个下午，都是有人真实受益的一点点。',
    wechat: 'we_volunteer', status: 'open',
    activities: [
      { id: 'a11', title: '乡村小学线上支教', date: '2025-09-13', note: '每周二晚连线三百公里外的一间教室，带孩子们读绘本、做实验。', type: 'volunteer', seed: 'v1', photos: 6 },
      { id: 'a12', title: '旧物回收日', date: '2025-10-18', note: '一个下午回收了二十三箱衣物与图书，分类、打包、送出。', type: 'volunteer', seed: 'v2', photos: 5 }
    ],
    roster: []
  },
  {
    id: 'c7', name: '天文社', category: '学术', art: 'science',
    intro: '天文社在楼顶有一台望远镜，和一群愿意为一片星空熬夜的人。我们做观测、读星图、讲天体物理的入门，也在流星雨来临的夜里一起守候。宇宙很大，但抬头这件事很小。',
    wechat: 'look_up_2024', status: 'end',
    activities: [
      { id: 'a13', title: '双子座流星雨观测', date: '2025-10-14', note: '零下两度的楼顶，二十个人裹着睡袋数了整夜流星。', type: 'science', seed: 's1', photos: 7 }
    ],
    roster: []
  },
  {
    id: 'c8', name: '汉服社', category: '兴趣', art: 'hanfu',
    intro: '汉服社不只穿汉服，更研究一件衣服背后的形制、纹样与礼仪。我们做传统节日雅集、妆造教学与校园巡游，也欢迎完全不了解的新人从第一件衣裳开始认识传统。',
    wechat: 'hanfu_ji', status: 'open',
    activities: [
      { id: 'a14', title: '中秋雅集', date: '2025-09-29', note: '提灯、拜月、分月饼，把课本里的中秋过成眼前的一天。', type: 'hanfu', seed: 'h1', photos: 8 },
      { id: 'a15', title: '汉服巡游·秋', date: '2025-10-20', note: '三十人沿校园主路缓行，路过的人群慢慢停下拍照。', type: 'hanfu', seed: 'h2', photos: 6 }
    ],
    roster: []
  }
]
