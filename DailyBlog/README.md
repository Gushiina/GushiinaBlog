# DailyBlog - 咕咕的个人博客

一个使用 Vue 3 + TypeScript + Node.js 构建的个人博客系统，采用 Frutiger Aero 风格设计。

## 功能特性

- ✅ Markdown 原生支持
- ✅ 全文搜索 + 标签筛选 + 时间筛选
- ✅ 标签云图展示
- ✅ Frutiger Aero 风格 UI
- ✅ Docker 一键部署
- ✅ 响应式设计

## 技术栈

### 前端
- Vue 3 (Composition API)
- TypeScript
- Vite
- Pinia (状态管理)
- Vue Router
- Tailwind CSS
- Marked (Markdown 解析)
- DOMPurify (XSS 防护)

### 后端
- Node.js
- Express
- TypeScript
- gray-matter (Markdown Front Matter 解析)

### 部署
- Docker + Docker Compose
- Nginx

## 项目结构

```
DailyBlog/
├── frontend/          # 前端项目
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── stores/
│   │   ├── types/
│   │   └── assets/
│   ├── Dockerfile
│   └── nginx.conf
├── backend/           # 后端项目
│   ├── src/
│   │   ├── index.ts
│   │   ├── contentLoader.ts
│   │   └── types.ts
│   └── Dockerfile
├── content/           # 博客内容
│   ├── posts/         # Markdown 文章
│   └── config/        # 配置文件
│       └── profile.json
├── docker-compose.yml
└── README.md
```

## 快速开始

### 本地开发

#### 1. 安装依赖

```bash
cd frontend
npm install

cd ../backend
npm install
```

#### 2. 启动后端（新终端）

```bash
cd backend
npm run dev
```

后端将在 http://localhost:3001 启动

#### 3. 启动前端（新终端）

```bash
cd frontend
npm run dev
```

前端将在 http://localhost:3000 启动

### Docker 部署

#### 1. 构建并启动

```bash
docker-compose up -d --build
```

#### 2. 查看日志

```bash
docker-compose logs -f
```

#### 3. 停止服务

```bash
docker-compose down
```

访问 http://localhost:3000 即可看到博客！

## 内容管理

### 添加文章

在 `content/posts/` 目录下创建 `.md` 文件，格式如下：

```markdown
---
title: "文章标题"
date: "2024-04-23"
tags: ["标签1", "标签2"]
wordCount: 520
---

这里是文章内容...
```

### 修改个人信息

编辑 `content/config/profile.json` 文件：

```json
{
  "nickname": "你的昵称",
  "avatar": "/avatar.png",
  "bio": "个人简介",
  "social": {
    "github": "https://github.com/...",
    "bilibili": "https://space.bilibili.com/...",
    "steam": "https://steamcommunity.com/id/...",
    "email": "mailto:your@email.com"
  },
  "blog": {
    "title": "博客标题",
    "description": "博客描述",
    "footer": "页脚信息"
  }
}
```

## 服务器部署指南

### 1. 准备服务器

购买一台云服务器（阿里云、腾讯云、DigitalOcean 等），推荐配置：
- 1核 2G 以上
- Ubuntu 20.04+ 或 CentOS 7+

### 2. 安装 Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo apt install docker-compose
```

### 3. 上传代码

使用 Git 或 SCP 将代码上传到服务器。

```bash
git clone <你的仓库地址>
cd DailyBlog
```

### 4. 配置域名（可选）

在域名管理后台将域名解析到服务器 IP。

如需 HTTPS，可以使用 Let's Encrypt + Nginx 配置。

### 5. 启动服务

```bash
docker-compose up -d --build
```

### 6. 完成！

访问你的域名或服务器 IP 即可看到博客！

## API 接口

- `GET /api/health` - 健康检查
- `GET /api/profile` - 获取个人信息
- `GET /api/posts` - 获取文章列表（不含内容）
- `GET /api/posts/:id` - 获取单篇文章（含内容）

## 开发说明

### 搜索功能

搜索在前端完成，基于关键词、标签、日期筛选。

### 添加头像

将头像图片放入 `content/config/` 或前端 `public/` 目录，然后修改 `profile.json` 中的 `avatar` 字段。

## License

MIT
