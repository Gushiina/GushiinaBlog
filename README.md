# 咕诗奈的博客 / 不规则脑电波

个人博客重构版。手机按专栏文章阅读，PC 使用个人站与杂志网格布局。

## 两套视觉，两种交付

- **Aero 玻璃**：蓝粉玻璃、凝胶按钮、二次元头像窗口、带鼠标惯性的液态玻璃着色器。
- **荧光拼贴**：荧光绿与粉色贴纸、硬边框、跳帧星星与贴纸动效。
- 首次访问默认荧光拼贴；风格、明暗独立切换并保存在本机。两套主题共用字号、布局与控件尺寸。
- 系统开启“减少动态效果”时关闭装饰动画；液态渲染在离屏、后台、拼贴主题下暂停，低性能设备自动降级。

构建产物均为可放到 GitHub Pages 的单文件网页，均保留动效：

| 文件 | 用途 |
| --- | --- |
| `DailyBlog/frontend/dist/index.html` | 预渲染 HTML，21 篇现有文章已经写进页面；交互使用轻量 JavaScript，无 Vue 运行时 |
| `DailyBlog/frontend/dist/vue.html` | Vue 单文件版本，完整组件、状态和路由逻辑 |

本地附件、头像、代码、样式和公式字体均内联。笔记中的外链网站和外部图片仍需联网访问。

## 本地开发与构建

Node.js 22.12 或更高版本：

```sh
cd DailyBlog/frontend
npm ci
npm run dev
```

开发预览使用 Vue 版。完整构建：

```sh
npm run type-check
npm test
npm run build
npm run preview
```

预览 `http://localhost:4173/` 为预渲染 HTML，`http://localhost:4173/vue.html` 为 Vue 版。
浏览器测试：首次运行 `npx playwright install chromium`，然后 `npm run test:e2e`。

## GitHub Pages

仓库 Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**。
提交到 `master` 后，工作流自动检查、构建并发布两版。文章使用 Hash 链接，支持仓库子路径、中文文章名和刷新。
也可以直接上传构建后的 `dist/index.html`，或用 `dist/vue.html` 改名为 `index.html` 托管 Vue 版。

## 从 Obsidian 发布笔记

文章放在 `DailyBlog/content/posts/`，支持子目录；附件可放在 `DailyBlog/content/` 内并保留相对目录。旧的 `frontend/public/ReferencePicture/` 也兼容。个人资料在 `DailyBlog/content/config/profile.json`。

支持普通 Markdown、GFM 表格、任务列表、代码高亮和复制、KaTeX 数学公式、脚注、`==高亮==`、Obsidian 行内标签、图片嵌入与尺寸、笔记双链、标题锚点、可折叠 Callout。

笔记嵌入 `![[笔记]]` 目前显示为已发布笔记链接。块引用、Canvas、Dataview、插件专属语法和 Mermaid 图形尚未实现。缺少附件会显示说明卡片；只有唯一文件名才使用跨目录兜底，避免同名附件错误匹配。

不带日期的文章采用源文件修改日期；正式发布建议添加 `date`，以保证不同机器构建时归档日期一致。

```md
---
title: 今天的笔记
date: 2026-10-22
tags: [Unity, 学习]
---

> [!tip] 小提示
> 可以直接使用 Obsidian 提示块。
```

内容修改后重新构建；GitHub Actions 会在推送时完成这一步。

## 项目结构

- `DailyBlog/frontend/src/`：Vue 页面、主题、Markdown 渲染和液态着色器。
- `DailyBlog/frontend/src/static-client.ts`：HTML 版交互，不依赖 Vue。
- `DailyBlog/frontend/scripts/content.ts`：Obsidian 内容与附件打包。
- `DailyBlog/frontend/scripts/export-static.mjs`：预渲染单文件 HTML。
- `.github/workflows/browser-test.yml`：检查与 GitHub Pages 发布。

原项目的 Node 后端保留用于历史兼容；新的开发、构建和 Pages 发布流程都不需要启动它。

## 视觉参考

Aero 参考 [CARI 的 Frutiger Aero 资料](https://cari.institute/aesthetics/frutiger-aero)与 Windows Vista / 7 的玻璃、高光和渐变特征。图形与控件用 CSS、WebGL 制作；二次元头像沿用原仓库素材。
