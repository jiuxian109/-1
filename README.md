# 百团 · C 端

面向**普通学生**和**社团管理员**的校园社团招新与风采展示应用（Vue 3 + Vite 单页应用）。

- 学生端：逛社团、看社团主页与活动年册、线上报名
- 社团端：维护主页、发布活动、查看/导出报名名单、自查报名漏斗

> 这是「百团」的 C 端工程。V1 完整版（含全校管理方审核台/数据台）见同级的 `b/`（原生 H5 原型）。

## 快速开始

```bash
npm install
npm run dev      # 开发：http://127.0.0.1:5173
npm run build    # 构建产物到 dist/
npm run preview  # 预览构建产物：http://127.0.0.1:4173
```

> 构建产物是 ES Module，需通过 http 服务访问（dev/preview），不能直接 `file://` 打开。

## 功能与路由

| 端 | 路由 | 说明 |
| --- | --- | --- |
| 学生 | `#/` | 发现页：搜索 + 分类筛选 + 社团卡片流 |
| 学生 | `#/club/:id` | 社团主页：封面、简介、按月份沉淀的「活动年册」、报名入口 |
| 学生 | `#/signup/:id` | 报名表单（姓名/学号/手机号/微信/一句话，手机号校验 + 同意勾选） |
| 学生 | `#/success/:id?row=N` | 报名成功：显示花名册第 N 行（手机号脱敏） |
| 学生 | `#/me` | 「我的」：身份卡 + 切换学生/社团身份 + 创建社团 |
| 社团 | `#/club-admin` | 工作台：报名人数/发布活动/主页浏览 + 报名漏斗 |
| 社团 | `#/club-admin/edit` | 编辑社团主页（6 字段 + 封面插画） |
| 社团 | `#/club-admin/activity` | 发布活动（标题/日期/画面/记录≤200字/照片数 1–9 实时预览） |
| 社团 | `#/club-admin/roster` | 报名名单（完整手机号 + 导出 CSV） |

## 身份模型

单页内以 `localStorage`（`baituan.c.identity`）记录身份：`{ role: 'student' | 'club', clubId }`。

- 默认学生身份，在「我的」页可切换到任一社团身份（社团端路由有守卫，非社团身份自动跳回「我的」）。
- 这是纯前端原型，没有真实登录；身份切换仅用于演示「学生逛/报名 → 社团维护/看名单」的闭环。

## 数据与埋点

- 数据层为 `src/store/clubs.js` 的响应式单例 store，持久化到 `localStorage`（`baituan.c.db` / `baituan.c.events` / `baituan.c.identity`）。
- 种子数据 8 个社团（`src/data/seed.js`）：街舞/摄影/篮球/辩论/合唱/志愿者/天文/汉服社，篮球社预置 2 条报名记录。
- 封面插画为代码生成的扁平 SVG（`src/lib/art.js`，9 类场景），无外部图片依赖。
- 埋点 4 层（曝光 / 进主页 / 点报名 / 提交报名），供社团工作台自查报名漏斗（进主页→点报名→提交）。

## 设计

复用「百团」设计 token：暖纸底 `--ground #F6F4EF` + 墨色 `--ink #17150F` + 主题蓝 `--accent #2450E6`；移动优先，手机壳 `max-width: 430px` 居中；动效为 `transform/opacity` only，带 `prefers-reduced-motion` 回退。

## 目录结构

```
c/
├── index.html
├── vite.config.js
├── package.json
├── dist/              # 构建产物（含截图见 shots/）
└── src/
    ├── main.js
    ├── router/index.js
    ├── App.vue
    ├── assets/styles.css
    ├── components/    # ClubArt / ClubCard / StatusTag / TopBar / TabBar
    ├── data/seed.js
    ├── lib/art.js
    ├── store/clubs.js
    └── views/
        ├── Discover.vue  ClubDetail.vue  Signup.vue  Success.vue  Me.vue
        └── club/         Dashboard.vue  EditProfile.vue  NewActivity.vue  Roster.vue  NewClub.vue
```

## 截图

`shots/` 下 5 张代表性截图：发现页（390/1440）、社团主页（390）、报名页（390）、社团工作台（390）。
