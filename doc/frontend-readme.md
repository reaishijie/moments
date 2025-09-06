# 瞬刻 - 前端应用文档

## 项目概述

瞬刻前端是一个基于 Vue 3 + TypeScript + Vite + Pinia 构建的现代化社交媒体应用。采用移动端优先的响应式设计，提供流畅的用户体验和丰富的交互功能。

## 程序设计

### 架构设计

```
frontend/
├── public/                 # 静态资源
│   └── img/               # 图片资源
├── src/                   # 源代码目录
│   ├── api/               # API 接口层
│   │   ├── request.ts     # HTTP 请求配置
│   │   ├── auth.ts        # 认证接口
│   │   ├── articles.ts    # 文章接口
│   │   ├── comments.ts    # 评论接口
│   │   └── users.ts       # 用户接口
│   ├── components/        # 可复用组件
│   │   ├── article/       # 文章相关组件
│   │   │   ├── ArticleActions.vue    # 文章操作组件
│   │   │   ├── ArticleItem.vue       # 文章项组件
│   │   │   ├── ArticleList.vue       # 文章列表组件
│   │   │   ├── HomeArticleItem.vue   # 首页文章项
│   │   │   └── Review.vue            # 文章详情组件
│   │   ├── user/          # 用户相关组件
│   │   │   └── Auth.vue   # 认证组件（注册与登录）
│   │   ├── Brief.vue      # 简介组件
│   │   ├── Header.vue     # 头部组件
│   │   └── MessageList.vue # 消息列表组件
│   ├── router/            # 路由配置
│   │   └── index.ts       # 路由定义
│   ├── store/             # 状态管理
│   │   ├── auth.ts        # 认证状态
│   │   ├── user.ts        # 用户状态
│   │   ├── article.ts     # 文章状态
│   │   ├── feed.ts        # 动态状态
│   │   └── message.ts     # 消息状态
│   ├── types/             # TypeScript 类型定义
│   │   ├── user.ts        # 用户类型
│   │   ├── article.ts     # 文章类型
│   │   └── comments.ts    # 评论类型
│   ├── utils/             # 工具函数
│   │   ├── guest.ts       # 游客工具
│   │   ├── location.ts    # 位置工具
│   │   └── time.ts        # 时间工具
│   ├── views/             # 页面组件
│   │   ├── Index.vue      # 首页
│   │   ├── Home.vue       # 用户主页
│   │   ├── Detail.vue     # 文章详情页
│   │   ├── Profile.vue    # 个人资料页
│   │   ├── Post.vue       # 发表文章页
│   │   ├── Demo.vue       # 演示页面
│   │   └── NotFound.vue   # 404页面
│   ├── App.vue            # 根组件
│   ├── main.ts            # 应用入口
│   └── main.css           # 全局样式
├── dist/                  # 构建输出目录
├── package.json           # 项目配置
├── vite.config.ts         # Vite 配置
└── tsconfig.json         # TypeScript 配置
```

### 设计模式

#### 组件化架构
- **原子组件**: 最小可复用的UI元素
- **分子组件**: 由原子组件组合而成的功能模块
- **页面组件**: 完整的页面级组件

#### 状态管理
- 使用 Pinia 进行状态管理
- 模块化状态划分：认证、用户、文章、动态、消息
- 持久化存储关键状态

#### 路由设计
- 基于 Vue Router 4
- 动态路由参数验证
- 路由守卫实现权限控制
- 404 错误页面处理

### 技术栈

- **框架**: Vue 3 (Composition API)
- **语言**: TypeScript
- **构建工具**: Vite
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP 客户端**: Axios
- **CSS**: 原生 CSS + Scoped Styles
- **图标**: @vicons/fa (FontAwesome)
- **工具库**: nanoid (游客ID生成)

## 功能实现

### 1. 用户认证系统

#### 登录注册
- 模态框式登录/注册界面
- 表单验证和错误提示
- JWT Token 存储和管理
- 自动登录状态维护

#### 权限控制
- 路由级别的权限验证
- 组件级别的条件渲染
- API 请求自动添加认证头

### 2. 文章管理系统

#### 文章展示
- 瀑布流式文章列表
- 文字、图片、视频多类型支持
- 实时点赞数和评论数
- 文章位置、时间信息显示

#### 文章操作
- 发表新文章
- 点赞/取消点赞
- 文章详情查看
- 作者主页跳转

#### 内容编辑
- 图片外链预览
- 位置信息获取
- 发布状态（置顶、广告）管理

### 3. 用户系统

#### 用户主页
- 个人信息展示
- 发表文章列表
- 头像和背景设置
- 个人简介编辑

#### 个人资料
- 头像上传
- 个人信息编辑
- 密码修改
- 账户安全设置

### 4. 评论系统

- 评论发表和回复
- 评论时间显示
- 评论者信息展示

### 5. 位置服务

#### 地理定位
- 点击自动获取当前位置
- 位置信息显示
- 基于位置的内容筛选

### 6. 响应式设计

#### 移动端优化
- 375px-520px 最佳显示宽度
- 触摸友好的交互设计
- 滑动和手势支持
- 移动端导航优化

## 程序开发方法

### 开发环境搭建

1. **环境要求**
   - Node.js >= 16.x
   - npm 或 yarn
   - 现代浏览器（Chrome/Firefox/Safari）

2. **安装依赖**

   ```bash
   cd frontend
   npm install
   ```

3. **环境配置**
   将`.env.example`重命名为 `.env` 文件，如果前后端不在一个服务器需修改后端接口：

   ```env
   VITE_API_BASE_URL=http://localhost:9889/api
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

### 开发规范

#### 组件开发规范
```vue
<script setup lang="ts" name="ComponentName">
// Composition API 语法
// 导入依赖
// 定义 props 和 emits
// 响应式数据定义
// 计算属性和方法
// 生命周期钩子
</script>

<template>
  <!-- 模板内容 -->
</template>

<style scoped>
/* 组件样式 */
</style>
```

#### TypeScript 类型定义
```typescript
// 接口定义
export interface User {
  id: number
  username: string
  nickname?: string
  avatar?: string
}

// API 响应类型
export interface ApiResponse<T> {
  status: string
  data: T
  message?: string
  error?: string
}
```

#### API 接口规范
```typescript
// 使用统一的请求封装
import service from '@/api/request'

export const getArticles = (params: ArticleParams) => {
  return service({
    url: '/articles',
    method: 'get',
    params,
  })
}
```

### 状态管理模式

#### Pinia Store 结构：首页、文章详情、用户、评论分别管理
### 样式组织

#### CSS 架构
- **全局样式**: `main.css` 定义全局样式和变量
- **组件样式**: 每个组件使用 scoped 样式
- **工具类**: 常用的工具类样式
- **响应式设计**: 移动端优先的断点设计

## 上线方法

#### 构建生产版本
```bash
# 安装依赖
npm install

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 联系方式

如有问题，请联系开发团队或提交 Issue。
