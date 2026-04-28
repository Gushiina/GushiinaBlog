#!/usr/bin/env tsx
/**
 * 生成静态数据文件
 * 将 Markdown 文章转换为 JSON，供静态站点使用
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'
import { marked } from 'marked'
import hljs from 'highlight.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.join(__dirname, '..')
const CONTENT_DIR = path.join(ROOT_DIR, 'DailyBlog', 'content')
const POSTS_DIR = path.join(CONTENT_DIR, 'posts')
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

async function main() {
  console.log('🚀 生成静态数据...')

  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  // 加载数据
  const posts = await loadPosts()
  const profile = await loadProfile()

  // 生成统计数据
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

  // 保存数据文件
  const dataDir = path.join(OUTPUT_DIR, 'data')
  await fs.mkdir(dataDir, { recursive: true })

  await fs.writeFile(
    path.join(dataDir, 'posts.json'),
    JSON.stringify(posts, null, 2)
  )

  await fs.writeFile(
    path.join(dataDir, 'profile.json'),
    JSON.stringify(profile, null, 2)
  )

  await fs.writeFile(
    path.join(dataDir, 'stats.json'),
    JSON.stringify(stats, null, 2)
  )

  console.log(`✅ 生成了 ${posts.length} 篇文章的数据`)
  console.log(`✅ 统计: ${stats.totalTags} 个标签`)

  // 生成搜索索引
  const searchIndex = posts.map(post => ({
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content.substring(0, 5000),
    tags: post.tags,
    date: post.date
  }))

  await fs.writeFile(
    path.join(dataDir, 'search-index.json'),
    JSON.stringify(searchIndex, null, 2)
  )

  console.log('✅ 搜索索引生成完成')
}

main().catch(console.error)
