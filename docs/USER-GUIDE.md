# GushiinaBlog 使用指南

## 目录

1. [环境配置](#环境配置)
2. [个人信息修改](#个人信息修改)
3. [头像更换](#头像更换)
4. [Markdown文档管理](#markdown文档管理)
5. [图片资源引用](#图片资源引用)
6. [部署指南](#部署指南)

---

## 环境配置

### 开发环境

#### 1. 克隆项目

```bash
git clone <repository-url>
cd GushiinaBlog
```

#### 2. 安装依赖

```bash
# 后端依赖
cd DailyBlog/backend
npm install

# 前端依赖
cd ../frontend
npm install
```

#### 3. 启动开发服务器

```bash
# 终端1：启动后端
cd DailyBlog/backend
npm run dev

# 终端2：启动前端
cd DailyBlog/frontend
npm run dev
```

访问 http://localhost:5173 查看博客。


## 个人信息修改

### 配置文件位置

个人资料配置文件：`content/config/profile.json`

### 配置项说明

```json
{
  "nickname": "你的昵称",
  "bio": "个人简介",
  "avatar": "头像路径",
  "blog": {
    "title": "博客标题",
    "description": "博客描述",
    "footer": "页脚文字"
  },
  "social": {
    "github": "GitHub链接",
    "bilibili": "B站链接",
    "email": "邮箱地址"
  }
}
```

### 修改步骤

1. 打开 `content/config/profile.json`
2. 修改对应字段
3. 保存文件（后端会自动热重载）
4. 刷新浏览器查看效果

---

## 头像更换

### 方法一：替换文件

1. 准备头像图片（推荐尺寸：400x400像素）
2. 将图片放入 `DailyBlog/frontend/public/assets/`
3. 修改 `content/config/profile.json` 中的 `avatar` 字段：
   ```json
   "avatar": "assets/your-avatar.png"
   ```

### 方法二：使用外部链接

```json
"avatar": "https://example.com/your-avatar.jpg"
```

### 头像格式建议

- 格式：PNG 或 JPG
- 尺寸：400x400 像素
- 大小：不超过 500KB
- 风格：正方形，面部居中

---

## Markdown文档管理

### 文章存放位置

所有文章存放在 `content/posts/` 目录下。

### 文件命名规范

```
分类编号.文章标题.md

例如：
- 数组1.二分查找法.md
- 链表3.206.反转链表.md
```

### 文章格式

```markdown
---
title: 文章标题
date: 2024-01-15
tags: [标签1, 标签2]
wordCount: 1200
---

# 正文标题

正文内容...

## 二级标题

- 列表项1
- 列表项2

```代码语言
代码块内容
```
```

### Frontmatter字段

| 字段 | 必填 | 说明 |
|------|------|------|
| title | 是 | 文章标题 |
| date | 否 | 发布日期（YYYY-MM-DD） |
| tags | 否 | 标签数组 |
| wordCount | 否 | 字数统计 |

### Obsidian标签支持

除了在 frontmatter 中定义标签，还支持 Obsidian 格式的行内标签：

```markdown
#标签名 这是带标签的段落内容
```

支持的标签格式：
- `#中文标签`
- `#english-tag`
- `#tag123`
- `#tag/subtag`

### 创建新文章步骤

1. 在 `content/posts/` 创建 `.md` 文件
2. 添加 frontmatter 元数据
3. 编写 Markdown 内容
4. 保存文件，自动热重载

---

## 图片资源引用

### 图片存放位置

```
DailyBlog/frontend/public/
├── ReferencePicture/    # 文章引用图片
└── assets/             # 静态资源（头像等）
```

### 引用方式

#### 方式一：Markdown语法

```markdown
![图片描述](ReferencePicture/图片文件名.png)
```

#### 方式二：HTML语法（更灵活）

```html
<img src="ReferencePicture/图片文件名.png" alt="描述" width="600">
```

### 图片优化建议

1. **格式选择**
   - 照片：JPG
   - 截图/图标：PNG
   - 动画：GIF/WebP

2. **尺寸控制**
   - 文章配图：最大宽度 1200px
   - 缩略图：400x300px
   - 图标：64x64px

3. **压缩工具推荐**
   - TinyPNG (在线)
   - ImageOptim (Mac)
   - Squoosh (Google)

4. **命名规范**
   ```
   文章编号.描述-时间戳.png
   例如：6.链表相交-1776738062971.png
   ```

### 图片懒加载

博客已内置图片懒加载，无需额外配置。

---

