# 瞬刻 - 前端应用文档

## 项目概述

瞬刻前端是基于 Vue 3 + TypeScript + Vite + Pinia 构建的现代化内容发布平台前端。采用移动端优先的响应式设计，支持浅色/深色主题、文字/图片/视频内容、双 Token 认证、邮箱验证码登录、评论与表情、通知中心、友情链接等能力，并提供完整的管理后台。

## 技术栈

- 框架：Vue 3（Composition API、`<script setup>`）
- 语言：TypeScript
- 构建工具：Vite
- 状态管理：Pinia + pinia-plugin-persistedstate
- 路由：Vue Router 4
- HTTP 客户端：Axios
- 人机校验：@hcaptcha/vue3-hcaptcha
- 工具库：nanoid
- 包管理：pnpm

## 目录结构

```text
frontend/
├── public/                        # 静态资源（img/ 等）
├── src/
│   ├── api/                       # API 接口层
│   │   ├── request.ts             # Axios 实例与拦截器
│   │   ├── auth.ts                # 认证接口
│   │   ├── users.ts               # 用户接口
│   │   ├── articles.ts            # 文章接口
│   │   ├── comments.ts            # 评论接口
│   │   ├── notices.ts             # 通知接口
│   │   ├── link.ts                # 友情链接接口
│   │   ├── upload.ts              # 上传接口
│   │   └── admin.ts               # 后台接口
│   ├── components/                # 可复用组件
│   │   ├── article/               # 文章相关
│   │   │   ├── ArticleActions.vue     # 文章操作（点赞/评论）
│   │   │   ├── ArticleItem.vue        # 文章项
│   │   │   ├── ArticleList.vue        # 文章列表
│   │   │   ├── HomeArticleItem.vue    # 首页文章项
│   │   │   ├── Media.vue              # 媒体展示（图片/视频）
│   │   │   └── Review.vue             # 文章详情
│   │   ├── user/
│   │   │   └── Auth.vue               # 认证（账密/邮箱验证码/注册）
│   │   ├── captcha/
│   │   │   └── HCaptcha.vue           # hCaptcha 包裹
│   │   ├── emoji/
│   │   │   ├── EmojiPicker.vue        # 表情选择器
│   │   │   └── EmojiText.vue          # 表情文本渲染
│   │   ├── notice/
│   │   │   └── NoticePopover.vue      # 通知气泡
│   │   ├── utils/
│   │   │   ├── AvatarImage.vue        # 头像（失败回退 /img/avatar.jpg）
│   │   │   ├── Upload.vue             # 上传组件
│   │   │   └── Func.vue               # 通用工具组件
│   │   ├── admin/                     # 后台组件
│   │   │   ├── HeaderBar.vue
│   │   │   ├── Sidebar.vue
│   │   │   ├── Article.vue
│   │   │   ├── Comment.vue
│   │   │   ├── User.vue
│   │   │   ├── Link.vue
│   │   │   ├── Setting.vue            # 设置容器
│   │   │   └── Setting/               # 设置子页
│   │   │       ├── Basic.vue
│   │   │       ├── User.vue
│   │   │       ├── Email.vue
│   │   │       ├── Verify.vue
│   │   │       ├── Upload.vue
│   │   │       ├── Other.vue
│   │   │       ├── ConfigForm.vue
│   │   │       └── types.ts
│   │   ├── Brief.vue              # 站点简介
│   │   ├── Header.vue            # 顶部栏
│   │   └── MessageList.vue       # 消息列表
│   ├── config/
│   │   └── emojis.ts             # 表情数据
│   ├── layouts/                   # 布局
│   │   ├── FrontLayout.vue        # 前台布局
│   │   └── AdminLayout.vue        # 后台布局
│   ├── router/
│   │   ├── index.ts               # 路由装配与守卫
│   │   ├── frontend.ts            # 前台路由
│   │   └── admin.ts               # 后台路由
│   ├── store/                     # Pinia 状态
│   │   ├── auth.ts                # 认证状态
│   │   ├── user.ts                # 用户状态
│   │   ├── default.ts             # 站点默认配置
│   │   ├── article.ts             # 文章状态
│   │   ├── feed.ts                # 动态流状态
│   │   ├── message.ts             # 消息状态
│   │   ├── notice.ts              # 通知状态
│   │   ├── theme.ts               # 主题（暗/亮）
│   │   └── admin/                 # 后台状态
│   │       ├── setting.ts
│   │       └── sidebar.ts
│   ├── types/                     # TypeScript 类型
│   │   ├── user.ts
│   │   ├── article.ts
│   │   ├── comments.ts
│   │   ├── link.ts
│   │   ├── notice.ts
│   │   └── admin.ts
│   ├── utils/
│   │   ├── request.ts / func.ts   # 通用工具
│   │   ├── guest.ts               # 游客标识
│   │   ├── location.ts            # 位置工具
│   │   ├── sanitizeHtml.ts        # HTML 净化
│   │   └── time.ts                # 时间工具
│   ├── views/                     # 页面
│   │   ├── Index.vue              # 首页（动态流）
│   │   ├── Detail.vue             # 文章详情
│   │   ├── Home.vue               # 用户主页 /home/:username
│   │   ├── Profile.vue            # 个人资料
│   │   ├── Post.vue               # 发表/编辑文章
│   │   ├── Notifications.vue      # 消息通知
│   │   ├── Links.vue              # 友情链接
│   │   ├── Demo.vue               # 演示页
│   │   ├── NotFound.vue           # 404
│   │   └── admin/
│   │       └── Dashboard.vue      # 控制台
│   ├── App.vue
│   ├── main.ts
│   └── main.css                   # 全局样式与 CSS 变量
├── .env.example
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 路由

路由按前台、后台拆分，统一在 `router/index.ts` 装配并配置守卫：

- **前台**（`frontend.ts`，`FrontLayout`）：首页、文章详情、用户主页、个人资料、发表/编辑文章、消息通知、友情链接、推广跳转。
- **后台**（`admin.ts`，`AdminLayout`）：控制台、用户管理、文章管理、评论管理、友链管理、系统设置（基础/用户/邮箱/验证/上传/其他）。

### 路由守卫

- `/admin` 路径要求 `role === 1`，否则重定向首页。
- `meta.login` 标记需要登录的页面，未登录提示并跳转首页。
- 切换路由时通过 `meta.title` 更新 `document.title`，并通过 `scrollBehavior` 还原滚动位置。

## 状态管理

使用 Pinia 模块化划分，关键字段持久化（pinia-plugin-persistedstate）：

| Store | 职责 |
| --- | --- |
| `auth` | 登录态、Access/Refresh Token、刷新逻辑 |
| `user` | 当前用户资料 |
| `default` | 站点默认配置（名称、Logo、简介等，来自后台 config） |
| `article` | 文章列表与详情 |
| `feed` | 首页动态流 |
| `message` | 全局消息提示 |
| `notice` | 通知列表与未读数 |
| `theme` | 浅色/深色主题切换 |
| `admin/setting`、`admin/sidebar` | 后台设置与侧边栏状态 |

## 认证

- 双 Token：Access Token 短时用于接口认证，Refresh Token 长时用于换取新 Access Token；过期或失效时自动刷新或引导登录。
- 三种入口统一在 `components/user/Auth.vue`：
  - 账号密码登录
  - 邮箱验证码登录
  - 注册（可选 hCaptcha + 邮箱验证码）
- Axios 拦截器自动携带 `Authorization` 头，401 时触发刷新。

## 主要功能

### 文章

- 文字 / 图片（多图，单图按原始宽高比展示）/ 视频（含封面）三种类型。
- 发布文章支持位置获取、标签、置顶、广告跳转配置。
- 文章详情含评论、点赞（登录用户与游客）。

### 评论

- 多级嵌套回复，支持表情选择与表情文本渲染。
- 评论时间格式化、软删除。

### 用户

- 用户主页展示资料与发布列表，支持头像/背景展示。
- 个人资料页支持头像、背景、昵称、简介、密码修改。

### 通知

- 消息通知页（系统/评论/点赞/警告等），未读数、批量已读、删除。

### 主题

- 全局浅色/深色模式（CSS 变量驱动），回到顶部按钮。

### 后台

- 管理员可见，含控制台、用户/文章/评论/友链管理与系统设置（基础/用户/邮箱/验证/上传/其他）。
- `AvatarImage.vue` 头像加载失败回退 `/img/avatar.jpg`。

## 前端开发规范

- 组件 `name` 与文件名采用 PascalCase，`<script setup lang="ts" name="ComponentName">`。
- API 模块用统一 `request.ts` 封装，资源化命名（`articles.ts`、`comments.ts`）。
- 样式使用原生 CSS + Scoped，全局变量集中在 `main.css`。
- 使用 `AvatarImage.vue` 渲染用户头像以统一失败回退。
- `FrontLayout` 下页面组合 `Header`、`Brief` 等共享组件保持一致。

## 本地开发

### 环境要求

- Node.js 24+
- pnpm 11+

### 安装与配置

```bash
cd frontend
pnpm install
cp .env.example .env
```

编辑 `frontend/.env`：

```env
VITE_APP_TITLE=瞬刻
VITE_APP_KEYWORD=瞬刻,微信朋友圈,记录瞬间,博客程序,内容发布,博客
VITE_APP_DESCRIPTION=一个可以发布笔记、图片、视频的内容平台
# 前后端同域部署时用相对路径
VITE_API_BASE_URL=/api
# 前后端分离部署时用后端地址
# VITE_API_BASE_URL=http://localhost:9889/api
```

### 常用命令

```bash
pnpm run dev       # 启动开发服务
pnpm run build     # 类型检查并构建
pnpm run preview   # 预览构建产物
```

## 部署

构建产物在 `frontend/dist`，可部署到 Nginx/OpenResty、静态托管或 CDN。单页应用伪静态：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

前后端同域部署时，前端 `VITE_API_BASE_URL=/api`，由 `build.sh` 将 `dist` 复制为后端 `public/` 一并托管。
