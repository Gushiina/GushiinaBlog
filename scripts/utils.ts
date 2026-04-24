/**
 * 工具函数模块
 * 提供日志、文件操作、路径解析等通用功能
 */

import fs from 'fs/promises'
import path from 'path'
import { COLORS, type LogType, type FileStats, PATHS } from './types.js'

/**
 * 输出彩色日志
 * @param message - 日志消息
 * @param type - 日志类型
 */
export function log(message: string, type: LogType = 'info'): void {
  const colorMap: Record<LogType, string> = {
    info: COLORS.cyan,
    success: COLORS.green,
    warning: COLORS.yellow,
    error: COLORS.red,
  }
  console.log(`${colorMap[type]}${COLORS.bright}[${type.toUpperCase()}]${COLORS.reset} ${message}`)
}

/**
 * 输出错误日志并退出进程
 * @param message - 错误消息
 */
export function error(message: string): never {
  log(message, 'error')
  process.exit(1)
}

/**
 * 安全地删除目录
 * @param dirPath - 目录路径
 */
export async function safeRemoveDir(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true })
  } catch (err) {
    // 目录不存在时忽略错误
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err
    }
  }
}

/**
 * 安全地创建目录
 * @param dirPath - 目录路径
 */
export async function safeMkdir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true })
}

/**
 * 复制目录内容
 * @param src - 源目录
 * @param dest - 目标目录
 */
export async function copyDir(src: string, dest: string): Promise<void> {
  await fs.cp(src, dest, { recursive: true })
}

/**
 * 递归统计文件数量和大小
 * @param dir - 目录路径
 * @returns 文件统计信息
 */
export async function countFiles(dir: string): Promise<FileStats> {
  let totalFiles = 0
  let totalSize = 0

  const files = await fs.readdir(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = await fs.stat(filePath)

    if (stat.isDirectory()) {
      const subStats = await countFiles(filePath)
      totalFiles += subStats.totalFiles
      totalSize += subStats.totalSize
    } else {
      totalFiles++
      totalSize += stat.size
    }
  }

  return { totalFiles, totalSize }
}

/**
 * 验证必需文件是否存在
 * @param baseDir - 基础目录
 * @param requiredFiles - 必需文件列表（相对路径）
 */
export async function validateFiles(
  baseDir: string,
  requiredFiles: string[]
): Promise<boolean> {
  let allExist = true

  for (const file of requiredFiles) {
    const filePath = path.join(baseDir, file)
    try {
      await fs.access(filePath)
      log(`✓ ${file} 存在`, 'success')
    } catch {
      log(`✗ ${file} 缺失`, 'error')
      allExist = false
    }
  }

  return allExist
}

/**
 * 解析 Markdown 文件的 frontmatter
 * @param content - Markdown 内容
 * @returns 解析后的元数据
 */
export function parseFrontmatter(content: string): Record<string, any> {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  const metadata: Record<string, any> = {}

  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1]
    frontmatter.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split(':')
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim()
        // 处理数组格式
        if (value.startsWith('[') && value.endsWith(']')) {
          metadata[key.trim()] = value
            .slice(1, -1)
            .split(',')
            .map((v) => v.trim().replace(/^["']|["']$/g, ''))
        } else {
          metadata[key.trim()] = value.replace(/^["']|["']$/g, '')
        }
      }
    })
  }

  return metadata
}

/**
 * 提取 Markdown 正文（移除 frontmatter）
 * @param content - Markdown 内容
 * @returns 正文内容
 */
export function extractBody(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---/, '').trim()
}

/**
 * 生成文章摘要
 * @param body - 正文内容
 * @param maxLength - 最大长度
 * @returns 摘要文本
 */
export function generateExcerpt(body: string, maxLength: number = 200): string {
  const cleanText = body.slice(0, maxLength).replace(/[#*`]/g, '')
  return cleanText + (body.length > maxLength ? '...' : '')
}

/**
 * 格式化文件大小
 * @param bytes - 字节数
 * @returns 格式化后的字符串（如 "1.5 MB"）
 */
export function formatFileSize(bytes: number): string {
  const mb = bytes / 1024 / 1024
  return `${mb.toFixed(2)} MB`
}

/**
 * 生成部署说明文档
 * @param staticDir - 静态文件目录
 */
export async function generateDeployGuide(staticDir: string): Promise<void> {
  const guide = `# GitHub Pages 部署指南

## 构建完成 ✓

静态网站已生成到当前目录。

## 快速部署

### 方法 1: 使用 gh-pages 工具 (推荐)

\`\`\`bash
# 安装 gh-pages
npm install -g gh-pages

# 部署到 GitHub Pages
gh-pages -d .
\`\`\`

### 方法 2: 手动部署

1. 创建 GitHub 仓库
2. 初始化 git 并推送:

\`\`\`bash
git init
git add .
git commit -m "Initial static site"
git branch -M main
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
\`\`\`

3. 在 GitHub 仓库设置中启用 GitHub Pages
4. 选择 \`main\` 分支作为源

### 方法 3: GitHub Actions 自动部署

已配置自动部署工作流，推送到 main 分支会自动部署。

在 GitHub 仓库设置中:
1. Settings → Pages → Source: GitHub Actions
2. 推送代码到 main 分支

## 本地预览

\`\`\`bash
# 使用 Python
python -m http.server 8080

# 或使用 Node.js
npx serve .

# 访问 http://localhost:8080
\`\`\`

## 目录结构

\`\`\`
.
├── index.html          # 首页
├── 404.html            # 404 页面
├── api/                # API 数据
│   ├── posts.json      # 文章列表
│   ├── profile.json    # 个人信息
│   └── posts/          # 单篇文章数据
├── post/               # 文章页面
│   └── */index.html
└── assets/             # 静态资源
\`\`\`

## 自定义域名 (可选)

1. 创建 \`CNAME\` 文件
2. 写入你的域名: \`blog.yourdomain.com\`
3. 重新部署

## 注意事项

- 所有 API 请求已转换为本地 JSON 文件
- 路由使用 History 模式，已配置 404.html
- 图片和资源使用相对路径
`

  await fs.writeFile(path.join(staticDir, 'DEPLOY.md'), guide, 'utf-8')
}

/**
 * 打印构建成功的横幅
 * @param duration - 构建耗时（秒）
 * @param outputDir - 输出目录
 */
export function printSuccessBanner(duration: string, outputDir: string): void {
  console.log(`
${COLORS.green}${COLORS.bright}
╔══════════════════════════════════════════════════════════╗
║         构建成功! ✓                                      ║
║         耗时: ${duration}s                                          ║
╚══════════════════════════════════════════════════════════╝
${COLORS.reset}

静态网站位置: ${outputDir}

下一步:
1. 本地预览: cd ${path.basename(outputDir)} && npx serve .
2. 部署到 GitHub Pages: 查看 ${path.basename(outputDir)}/DEPLOY.md
3. 或使用: npx gh-pages -d ${path.basename(outputDir)}
`)
}
