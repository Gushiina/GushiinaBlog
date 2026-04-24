# GushiinaBlog

该项目是一个博客框架。是我尝试使用纯AI Agent模式下的作品。

只要按照将md放入指定的位置，去指定位置更改个人信息就可以直接拿出来使用了。


里面放了几篇我算法学习的笔记用来作为测试例。

目前个人还没有建站备案，所以暂时还没有自己的博客页面啦。

## ✨ 功能特性

- 📝 **Markdown 支持** - 完整的 Markdown 语法，支持代码高亮、表格、数学公式
- 🏷️ **标签系统** - 支持 Obsidian 风格的行内标签和 Frontmatter 标签
- 🔍 **全文搜索** - 基于 FlexSearch 的快速文章搜索
- 📱 **响应式设计** - 完美适配桌面、平板、手机三端
- 🎨 **代码高亮** - 使用 highlight.js 实现多语言代码高亮
- 📊 **标签图谱** - 使用 D3.js 可视化标签关系
- 🌙 **优雅主题** - 渐变色背景 + 卡片式布局
- ⚡ **快速加载** - 优化的构建和加载策略

## 🚀 快速开始

### 环境要求

- Node.js >= 20
- npm >= 10

### 本地开发

```bash
# 克隆项目
git clone https://github.com/Gushiina/GushiinaBlog.git
cd GushiinaBlog

# 安装后端依赖
cd DailyBlog/backend
npm install

# 安装前端依赖
cd ../frontend
npm install

# 启动开发服务器
# 终端1：后端
cd DailyBlog/backend
npm run dev

# 终端2：前端
cd DailyBlog/frontend
npm run dev
```

访问 http://localhost:5173 查看博客。

## 🏗️ 技术栈

### 后端
- **Node.js** - 运行时环境
- **Express** - Web 框架
- **TypeScript** - 类型安全的 JavaScript
- **gray-matter** - Frontmatter 解析

### 前端
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型系统
- **Vite** - 下一代前端构建工具
- **Pinia** - 状态管理
- **Vue Router** - 路由管理
- **Tailwind CSS** - 实用优先的 CSS 框架
- **highlight.js** - 代码语法高亮
- **marked** - Markdown 解析
- **D3.js** - 数据可视化
- **KaTeX** - 数学公式渲染

### 开发工具
- **ESLint** - 代码质量检查
- **Playwright** - 端到端测试

详细部署指南请参考 [DEPLOY.md](DEPLOY.md)。

## 📖 使用指南

### 创建文章

1. 在 `content/posts/` 目录创建 `.md` 文件
2. 添加 Frontmatter 元数据：
   ```markdown
   ---
   title: 文章标题
   date: 2024-01-15
   tags: [标签1, 标签2]
   ---
   
   如果是obsidian写的笔记，也会识别开头的 #标签

   # 正文内容
   ```
3. 保存后自动热重载

### 修改个人信息

编辑 `content/config/profile.json`：

```json
{
  "nickname": "你的昵称",
  "bio": "个人简介",
  "avatar": "assets/avatar.gif",
  "blog": {
    "title": "博客标题",
    "description": "博客描述"
  }
}
```

更多使用说明请参考 [docs/USER-GUIDE.md](docs/USER-GUIDE.md)。

## 🗂️ 项目结构

```
GushiinaBlog/
├── DailyBlog/
│   ├── backend/          # 后端服务
│   │   ├── src/          # 源代码
│   │   ├── Dockerfile    # 容器配置
│   │   └── package.json
│   └── frontend/         # 前端应用
│       ├── src/          # 源代码
│       ├── public/       # 静态资源
│       ├── Dockerfile    # 容器配置
│       └── package.json
├── content/              # 博客内容
│   ├── config/           # 配置文件
│   └── posts/            # Markdown 文章
├── docs/                 # 文档
├── docker-compose.yml    # Docker Compose 配置
└── README.md
```

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证开源。

### 许可证说明

MIT 许可证允许你：
- ✅ 自由使用、修改、分发本项目
- ✅ 商业使用
- ✅ 私有使用
- ✅ 再许可

唯一要求：**保留版权声明和许可声明**。

### 第三方依赖

本项目使用了众多优秀的开源项目，所有依赖均采用宽松的许可证（MIT、BSD、Apache 2.0、SIL OFL 等），详见 [LICENSE](LICENSE) 文件中的完整列表。

主要依赖包括：
- **Vue.js** - MIT License
- **Vite** - MIT License
- **Tailwind CSS** - MIT License
- **highlight.js** - BSD-3-Clause License
- **Fira Code 字体** - SIL Open Font License 1.1


## 🙏 致谢

感谢以下开源项目和工具：

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vitejs.dev/) - 下一代前端工具链
- [Express](https://expressjs.com/) - 快速、极简的 Web 框架
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [highlight.js](https://highlightjs.org/) - 代码语法高亮库
- [marked](https://marked.js.org/) - Markdown 解析器
- [D3.js](https://d3js.org/) - 数据可视化库
- [Fira Code](https://github.com/tonsky/FiraCode) - 等宽字体（SIL Open Font License）

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Gushiina">Gushiina</a>
</p>
