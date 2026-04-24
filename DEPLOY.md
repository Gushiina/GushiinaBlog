# GushiinaBlog 部署指南

本文档介绍如何部署 GushiinaBlog。

## 目录

- [快速开始](#快速开始)
- [环境要求](#环境要求)
- [开发部署](#开发部署)
- [常见问题排查](#常见问题排查)

---

## 快速开始

### 克隆项目

```bash
git clone https://github.com/Gushiina/GushiinaBlog.git
cd GushiinaBlog
```

---

## 环境要求

### 必需环境

| 软件 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 20 | JavaScript 运行时 |
| npm | >= 10 | 包管理器 |
| git | 任意 | 版本控制 |

### 验证环境

```bash
node --version  # 应显示 v20.x.x
npm --version   # 应显示 10.x.x
```

---

## 开发部署

### 1. 安装后端依赖

```bash
cd DailyBlog/backend
npm install
```

### 2. 安装前端依赖

```bash
cd ../frontend
npm install
```

### 3. 启动开发服务器

**终端 1 - 启动后端：**

```bash
cd DailyBlog/backend
npm run dev
```

后端服务将运行在 http://localhost:3001

**终端 2 - 启动前端：**

```bash
cd DailyBlog/frontend
npm run dev
```

前端服务将运行在 http://localhost:3000

### 4. 访问博客

打开浏览器访问 http://localhost:3000

---

## 常见问题排查

### 1. Node.js 版本过低

**问题：** 提示 Node.js 版本过低

**解决：**
```bash
# 使用 nvm 升级（推荐）
nvm install 20
nvm use 20

# 或从官网下载安装
# https://nodejs.org/
```

### 2. 端口被占用

**问题：** 启动服务时提示端口 3000 或 3001 被占用

**解决：**
```bash
# Linux/macOS
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### 3. 依赖安装失败

**问题：** npm install 失败

**解决：**
```bash
# 清理缓存并重试
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 4. PowerShell 执行策略（Windows）

**问题：** 无法执行 PowerShell 脚本

**解决：**
```powershell
# 以管理员身份运行
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 支持

如有问题，请通过以下方式联系：

- GitHub Issues: https://github.com/Gushiina/GushiinaBlog/issues
