# 百团 · C 端

面向**普通学生**和**社团管理员**的校园社团招新与风采平台（Vue 3 + Vite 前端 + Express 真实后端）。

- 学生端：注册/登录 → 逛社团 → 看主页与「活动年册」→ 登录后报名
- 社团端：注册即建社团 → 维护主页 → 发布活动 → 查看/导出报名名单 → 自查报名漏斗

> 这是「百团」的 C 端工程（无全校管理方）。V1 完整版（含管理方审核台/数据台）见同级 `b/`。

## 快速开始

```bash
npm install
```

**开发模式**（前端 5173，接口代理到 3001）：

```bash
npm run server   # 终端 1：后端 http://127.0.0.1:3001
npm run dev      # 终端 2：前端 http://127.0.0.1:5173
```

**生产/单端口模式**（构建 + 后端同时托管前端）：

```bash
npm start        # = npm run build && npm run server，访问 http://127.0.0.1:3001
```

> 构建产物是 ES Module，需通过 http 访问，不能直接 `file://` 打开。

## 从零开始

仓库**不含种子数据**：首次启动时社团、用户、报名都为空。

1. 打开「我的 → 注册账号」
2. 选「我是社团」，填手机号/密码/社团名称 → 自动创建社团并进入工作台
3. 用另一个手机号注册「学生」，即可在发现页看到该社团并报名

数据落在 `server/data/*.json`（首次写入自动创建）。想清空重来，删除 `server/data/` 即可。

## 账号与登录

- 凭据：**手机号（11 位）+ 密码（≥6 位）**，一个手机号一个账号
- 角色：`student`（学生）/ `club`（社团管理员）
- 社团注册会**同时创建社团**，账号通过 `clubId` 与社团绑定
- 登录后 token 存 `localStorage`（`baituan.c.token`），刷新自动恢复会话
- 学生/社团**均可浏览公开页面**；**报名需学生登录**，社团端路由需社团身份（否则跳登录并回跳）

## 路由

| 端 | 路由 | 说明 |
| --- | --- | --- |
| 公开 | `#/` | 发现页：搜索 + 分类筛选 + 社团卡片流 |
| 公开 | `#/club/:id` | 社团主页：封面、简介、按月份分组的「活动年册」、报名入口 |
| 公开 | `#/login` · `#/register` | 登录 / 注册（注册可选学生或社团） |
| 学生 | `#/signup/:id` | 报名表单（姓名/学号/手机号/微信/一句话 + 同意勾选），需登录 |
| 学生 | `#/success/:id?row=N` | 报名成功：花名册第 N 行（手机号脱敏） |
| 二者 | `#/me` | 「我的」：身份卡 + 学生逛社团入口 / 社团工作台入口 + 退出 |
| 社团 | `#/club-admin` | 工作台：报名人数/发布活动/主页浏览 + 报名漏斗 |
| 社团 | `#/club-admin/edit` | 编辑主页（名称/分类/插画/简介/微信/招新状态，预填现有值） |
| 社团 | `#/club-admin/activity` | 发布活动（标题/日期/画面/记录≤200 字/照片数 1–9 实时预览） |
| 社团 | `#/club-admin/roster` | 报名名单（完整手机号，仅社团可见）+ 导出 CSV |

## API

后端 `server/`，默认 `http://127.0.0.1:3001`，统一前缀 `/api`。

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | — | 注册；`role=student` 或 `club`（club 需 `clubName`，返回 `clubId`） |
| POST | `/api/auth/login` | — | 手机号 + 密码，返回 `{ token, user }` |
| GET | `/api/auth/me` | 任意登录 | 当前用户（社团回带 `clubName`） |
| GET | `/api/clubs` | — | 社团列表 |
| GET | `/api/clubs/:id` | — | 社团详情（浏览数 +1） |
| POST | `/api/clubs/:id/signup` | 学生 | 报名，返回 `{ row }` 名册行号 |
| PUT | `/api/clubs/:id` | 社团（须本人） | 更新主页 6 字段 |
| POST | `/api/clubs/:id/activities` | 社团（须本人） | 发布活动 |
| GET | `/api/clubs/:id/roster` | 社团（须本人） | 报名名单（含完整手机号） |
| GET | `/api/clubs/:id/stats` | 社团（须本人） | 报名漏斗：进主页/点报名/提交 |
| POST | `/api/events` | — | 埋点（impression / view_club / click_signup） |
| GET | `/api/health` | — | 健康检查 |

校验与错误：手机号 `/^1\d{10}$/`、密码 ≥6、重复手机号 409；未登录 401；越权（学生改社团、看名单）403。

## 安全说明

- 密码用 `crypto.scrypt` 加盐哈希存储（`salt:hash`），不落明文
- token 为 HMAC-SHA256 签名（base64url），默认 24h 过期；SECRET 可用环境变量覆盖：
  ```bash
  BAITUAN_SECRET=your-random-secret npm run server
  ```
  **生产环境务必设置 `BAITUAN_SECRET`**，默认值仅用于本地开发。
- 报名名单（完整手机号）仅社团本人可读；面向学生公开的页面手机号一律脱敏
- 这是教学/演示级实现，未做：短信验证码、找回密码、令牌刷新、限流、CSRF 防护

## 数据与埋点

- 持久层：`server/data/users.json` · `clubs.json` · `events.json`（原子写：tmp + rename）
- 埋点 4 层：曝光 / 进主页 / 点报名 / 提交报名；社团工作台可看「进主页 → 点报名 → 提交」漏斗
- 封面插画为代码生成的扁平 SVG（`src/lib/art.js`，9 类场景），无外部图片依赖

## 设计

复用「百团」设计 token：暖纸底 `--ground #F6F4EF` + 墨色 `--ink #17150F` + 主题蓝 `--accent #2450E6`；移动优先，手机壳 `max-width: 430px` 居中；动效 `transform/opacity` only，带 `prefers-reduced-motion` 回退。

## 目录结构

```
c/
├── index.html
├── vite.config.js          # base './'，dev 5173，/api 代理 → 3001
├── package.json
├── server/                 # Express 后端
│   ├── index.js            # 挂载 /api + 托管 dist
│   ├── auth.js             # scrypt 密码 + HMAC token
│   ├── db.js               # JSON 文件库（原子写）
│   ├── data/               # 运行时生成，删除即「从零开始」
│   └── routes/
│       ├── auth.js         # register / login / me
│       ├── clubs.js        # 列表 / 详情 / 报名 / 编辑 / 活动 / 名单 / 统计
│       └── events.js       # 埋点
├── dist/                   # 构建产物
└── src/
    ├── main.js             # 启动时先恢复会话再挂载
    ├── router/index.js     # 11 条路由 + 登录守卫
    ├── App.vue
    ├── assets/styles.css
    ├── components/         # ClubArt / ClubCard / StatusTag / TopBar / TabBar
    ├── data/constants.js   # CATEGORIES / STATUS_LABEL / ART_OPTIONS
    ├── lib/art.js
    ├── store/clubs.js      # API client 单例（token + 请求封装）
    └── views/
        ├── Discover.vue  ClubDetail.vue  Signup.vue  Success.vue  Me.vue
        ├── Login.vue  Register.vue
        └── club/         Dashboard.vue  EditProfile.vue  NewActivity.vue  Roster.vue
```

## 验证记录

- 后端 24 条端到端断言全部通过（注册 / 登录 / 鉴权 / 报名 / 名单 / 统计 / 埋点）
- 前端 11 条路由无头浏览器渲染通过；CDP 真实交互验证通过：编辑页预填、学生报名提交、社团登录、学生注册、未登录报名被守卫拦截
