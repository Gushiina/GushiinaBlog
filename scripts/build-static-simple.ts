#!/usr/bin/env tsx
/**
 * 简化版静态构建脚本
 * 1. 生成数据 JSON 文件
 * 2. 构建 Vue 应用
 * 3. 复制到输出目录
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'
import matter from 'gray-matter'
import { marked } from 'marked'
import hljs from 'highlight.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.join(__dirname, '..')
const FRONTEND_DIR = path.join(ROOT_DIR, 'DailyBlog', 'frontend')
const CONTENT_DIR = path.join(ROOT_DIR, 'DailyBlog', 'content')
const POSTS_DIR = path.join(CONTENT_DIR, 'posts')
const DIST_DIR = path.join(FRONTEND_DIR, 'dist')
const OUTPUT_DIR = path.join(ROOT_DIR, 'dist-static')

// 配置 marked
marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  },
  gfm: true,
  breaks: true
})

interface Post {
  id: string
  title: string
  date: string
  tags: string[]
  wordCount: number
  content: string
  excerpt: string
  html: string
}

function extractTags(content: string): string[] {
  const tags = new Set<string>()
  const tagRegex = /#([\u4e00-\u9fa5a-zA-Z0-9_\-]+)(?![\w\-])/g
  let match
  while ((match = tagRegex.exec(content)) !== null) {
    tags.add(match[1])
  }
  return Array.from(tags)
}

function generateExcerpt(content: string, maxLength = 200): string {
  const text = content.replace(/[#*`\[\]()]/g, '').replace(/\n/g, ' ').trim()
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

async function loadPosts(): Promise<Post[]> {
  const files = await fs.readdir(POSTS_DIR)
  const mdFiles = files.filter(f => f.endsWith('.md'))

  const posts: Post[] = []

  for (const file of mdFiles) {
    const filePath = path.join(POSTS_DIR, file)
    const content = await fs.readFile(filePath, 'utf-8')
    const { data, content: mdContent } = matter(content)

    const frontmatterTags = data.tags || []
    const contentTags = extractTags(mdContent)
    const allTags = Array.from(new Set([...frontmatterTags, ...contentTags]))

    posts.push({
      id: file.replace('.md', ''),
      title: data.title || file.replace('.md', ''),
      date: data.date || new Date().toISOString().split('T')[0],
      tags: allTags,
      wordCount: mdContent.length,
      content: mdContent,
      excerpt: generateExcerpt(mdContent),
      html: marked(mdContent)
    })
  }

  return posts.sort((a, b) => b.date.localeCompare(a.date))
}

async function loadProfile() {
  const profilePath = path.join(CONTENT_DIR, 'config', 'profile.json')
  const content = await fs.readFile(profilePath, 'utf-8')
  return JSON.parse(content)
}

function exec(command: string, cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ')
    const proc = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    })
    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Command failed: ${command}`))
    })
  })
}

async function main() {
  console.log('🚀 开始构建静态站点...')

  // 1. 生成数据文件到 public 目录
  console.log('📚 生成数据文件...')
  const posts = await loadPosts()
  const profile = await loadProfile()

  const tagCount = new Map<string, number>()
  const yearMonthCount = new Map<string, number>()

  posts.forEach(post => {
    post.tags.forEach(tag => {
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1)
    })
    const yearMonth = post.date.substring(0, 7)
    yearMonthCount.set(yearMonth, (yearMonthCount.get(yearMonth) || 0) + 1)
  })

  const stats = {
    totalPosts: posts.length,
    totalTags: tagCount.size,
    tagDistribution: Object.fromEntries(tagCount),
    yearMonthDistribution: Object.fromEntries(yearMonthCount)
  }

  // 创建 public/data 目录
  const publicDataDir = path.join(FRONTEND_DIR, 'public', 'data')
  await fs.mkdir(publicDataDir, { recursive: true })

  await fs.writeFile(
    path.join(publicDataDir, 'posts.json'),
    JSON.stringify(posts, null, 2)
  )
  await fs.writeFile(
    path.join(publicDataDir, 'profile.json'),
    JSON.stringify(profile, null, 2)
  )
  await fs.writeFile(
    path.join(publicDataDir, 'stats.json'),
    JSON.stringify(stats, null, 2)
  )

  console.log(`✅ 数据文件生成完成: ${posts.length} 篇文章`)

  // 2. 构建前端（使用根路径，适合本地测试）
  console.log('🏗️  构建前端应用...')
  await new Promise((resolve, reject) => {
    const proc = spawn('npm', ['run', 'build'], {
      cwd: FRONTEND_DIR,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, VITE_BASE_URL: '/' }
    })
    proc.on('close', (code) => {
      if (code === 0) resolve(null)
      else reject(new Error(`Build failed: ${code}`))
    })
  })

  // 3. 复制到输出目录
  console.log('📦 复制构建产物...')
  await fs.rm(OUTPUT_DIR, { recursive: true, force: true })
  await fs.cp(DIST_DIR, OUTPUT_DIR, { recursive: true })

  // 4. 创建 404.html（GitHub Pages SPA 支持）
  const indexHtml = await fs.readFile(path.join(OUTPUT_DIR, 'index.html'), 'utf-8')
  await fs.writeFile(path.join(OUTPUT_DIR, '404.html'), indexHtml)

  // 5. 复制 content 目录的静态资源
  console.log('📦 复制静态资源...')
  try {
    const contentAssetsDir = path.join(CONTENT_DIR, 'assets')
    const targetAssetsDir = path.join(OUTPUT_DIR, 'assets')
    await fs.cp(contentAssetsDir, targetAssetsDir, { recursive: true, force: true })
  } catch (e) {
    console.log('⚠️ 复制 assets 失败或不存在')
  }

  // 复制文章中的图片
  try {
    const refPicDir = path.join(CONTENT_DIR, 'ReferencePicture')
    const targetRefPicDir = path.join(OUTPUT_DIR, 'ReferencePicture')
    await fs.cp(refPicDir, targetRefPicDir, { recursive: true, force: true })
  } catch (e) {
    console.log('⚠️ 复制 ReferencePicture 失败或不存在')
  }

  console.log('')
  console.log('✅ 构建完成!')
  console.log(`📁 输出目录: ${OUTPUT_DIR}`)
  console.log(`🌐 本地预览: npx serve ${OUTPUT_DIR}`)
}

main().catch(err => {
  console.error('❌ 错误:', err)
  process.exit(1)
})
