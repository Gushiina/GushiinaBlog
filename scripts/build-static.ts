#!/usr/bin/env tsx
/**
 * 静态站点生成脚本
 * 将博客构建为纯静态 HTML，用于 GitHub Pages 部署
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

/**
 * 从内容中提取标签
 */
function extractTags(content: string): string[] {
  const tags = new Set<string>()
  const tagRegex = /#([\u4e00-\u9fa5a-zA-Z0-9_\-]+)(?![\w\-])/g
  let match
  while ((match = tagRegex.exec(content)) !== null) {
    tags.add(match[1])
  }
  return Array.from(tags)
}

/**
 * 生成摘要
 */
function generateExcerpt(content: string, maxLength = 200): string {
  const text = content.replace(/[#*`\[\]()]/g, '').replace(/\n/g, ' ').trim()
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * 加载所有文章
 */
async function loadPosts(): Promise<Post[]> {
  const files = await fs.readdir(POSTS_DIR)
  const mdFiles = files.filter(f => f.endsWith('.md'))
  
  const posts: Post[] = []
  
  for (const file of mdFiles) {
    const filePath = path.join(POSTS_DIR, file)
    const content = await fs.readFile(filePath, 'utf-8')
    const { data, content: mdContent } = matter(content)
    
    // 合并 frontmatter 标签和内容标签
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

/**
 * 生成文章页面 HTML
 */
function generatePostHTML(post: Post, allPosts: Post[]): string {
  const relatedPosts = allPosts
    .filter(p => p.id !== post.id && p.tags.some(t => post.tags.includes(t)))
    .slice(0, 3)
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title} - GushiinaBlog</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github-dark.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: #333;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 20px 30px;
      margin-bottom: 20px;
      box-shadow: 0 4px 30px rgba(0,0,0,0.1);
    }
    .header h1 {
      font-size: 1.5rem;
      margin-bottom: 10px;
    }
    .header a {
      color: #667eea;
      text-decoration: none;
    }
    .post-meta {
      display: flex;
      gap: 15px;
      color: #666;
      font-size: 0.9rem;
      flex-wrap: wrap;
    }
    .tag {
      background: #667eea;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
    }
    .content {
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 4px 30px rgba(0,0,0,0.1);
      line-height: 1.8;
    }
    .content h1, .content h2, .content h3 {
      margin: 1.5em 0 0.5em;
      color: #333;
    }
    .content p {
      margin: 1em 0;
    }
    .content pre {
      background: #1e1e1e;
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      margin: 1em 0;
    }
    .content code {
      font-family: 'Fira Code', monospace;
      font-size: 0.9em;
    }
    .content :not(pre) > code {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .content img {
      max-width: 100%;
      border-radius: 8px;
    }
    .content table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
    }
    .content th, .content td {
      border: 1px solid #ddd;
      padding: 8px 12px;
      text-align: left;
    }
    .content th {
      background: #f5f5f5;
    }
    .sidebar {
      margin-top: 20px;
    }
    .sidebar-section {
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 4px 30px rgba(0,0,0,0.1);
    }
    .sidebar-section h3 {
      margin-bottom: 15px;
      color: #333;
    }
    .related-post {
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .related-post:last-child {
      border-bottom: none;
    }
    .related-post a {
      color: #667eea;
      text-decoration: none;
    }
    .related-post a:hover {
      text-decoration: underline;
    }
    .footer {
      text-align: center;
      padding: 40px 20px;
      color: rgba(255,255,255,0.8);
    }
    @media (max-width: 768px) {
      .container { padding: 10px; }
      .content { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1><a href="/GushiinaBlog/">← 返回首页</a></h1>
      <h1>${post.title}</h1>
      <div class="post-meta">
        <span>📅 ${post.date}</span>
        <span>📝 ${post.wordCount} 字</span>
        ${post.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
      </div>
    </header>
    
    <article class="content">
      ${post.html}
    </article>
    
    <aside class="sidebar">
      <div class="sidebar-section">
        <h3>🏷️ 标签</h3>
        <div>
          ${post.tags.map(tag => `<span class="tag">#${tag}</span>`).join(' ')}
        </div>
      </div>
      
      ${relatedPosts.length > 0 ? `
      <div class="sidebar-section">
        <h3>📚 相关文章</h3>
        ${relatedPosts.map(p => `
          <div class="related-post">
            <a href="/GushiinaBlog/post/${encodeURIComponent(p.id)}.html">${p.title}</a>
          </div>
        `).join('')}
      </div>
      ` : ''}
    </aside>
    
    <footer class="footer">
      <p>© 2026 咕咕的博客 | Powered by GushiinaBlog</p>
    </footer>
  </div>
</body>
</html>`
}

/**
 * 生成首页 HTML
 */
function generateIndexHTML(posts: Post[]): string {
  // 统计标签
  const tagCount = new Map<string, number>()
  posts.forEach(post => {
    post.tags.forEach(tag => {
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1)
    })
  })
  
  const sortedTags = Array.from(tagCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>咕咕的博客 - GushiinaBlog</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: #333;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 60px 20px;
      color: white;
    }
    .header h1 {
      font-size: 3rem;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    .header p {
      font-size: 1.2rem;
      opacity: 0.9;
    }
    .main {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 20px;
    }
    .posts {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .post-card {
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 30px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    .post-card:hover {
      transform: translateY(-4px);
    }
    .post-card h2 {
      margin-bottom: 12px;
    }
    .post-card h2 a {
      color: #333;
      text-decoration: none;
    }
    .post-card h2 a:hover {
      color: #667eea;
    }
    .post-meta {
      display: flex;
      gap: 15px;
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .tag {
      background: #667eea;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
    }
    .post-excerpt {
      color: #555;
      line-height: 1.6;
    }
    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .sidebar-section {
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 4px 30px rgba(0,0,0,0.1);
    }
    .sidebar-section h3 {
      margin-bottom: 15px;
      color: #333;
    }
    .tag-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .tag-cloud .tag {
      cursor: pointer;
    }
    .stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      text-align: center;
    }
    .stat-item {
      padding: 10px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #667eea;
    }
    .stat-label {
      font-size: 0.8rem;
      color: #666;
    }
    .footer {
      text-align: center;
      padding: 40px 20px;
      color: rgba(255,255,255,0.8);
    }
    @media (max-width: 768px) {
      .main {
        grid-template-columns: 1fr;
      }
      .header h1 {
        font-size: 2rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>咕咕的博客</h1>
      <p>记录学习与生活</p>
    </header>
    
    <main class="main">
      <div class="posts">
        ${posts.map(post => `
          <article class="post-card">
            <h2><a href="/GushiinaBlog/post/${encodeURIComponent(post.id)}.html">${post.title}</a></h2>
            <div class="post-meta">
              <span>📅 ${post.date}</span>
              <span>📝 ${post.wordCount} 字</span>
              ${post.tags.slice(0, 3).map(tag => `<span class="tag">#${tag}</span>`).join('')}
            </div>
            <p class="post-excerpt">${post.excerpt}</p>
          </article>
        `).join('')}
      </div>
      
      <aside class="sidebar">
        <div class="sidebar-section">
          <h3>📊 统计</h3>
          <div class="stats">
            <div class="stat-item">
              <div class="stat-value">${posts.length}</div>
              <div class="stat-label">文章</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${tagCount.size}</div>
              <div class="stat-label">标签</div>
            </div>
          </div>
        </div>
        
        <div class="sidebar-section">
          <h3>🏷️ 热门标签</h3>
          <div class="tag-cloud">
            ${sortedTags.map(([tag, count]) => `
              <span class="tag">#${tag} (${count})</span>
            `).join('')}
          </div>
        </div>
      </aside>
    </main>
    
    <footer class="footer">
      <p>© 2026 咕咕的博客 | Powered by GushiinaBlog</p>
    </footer>
  </div>
</body>
</html>`
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始生成静态站点...')
  
  // 清理输出目录
  await fs.rm(OUTPUT_DIR, { recursive: true, force: true })
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
  await fs.mkdir(path.join(OUTPUT_DIR, 'post'), { recursive: true })
  
  // 加载文章
  console.log('📚 加载文章...')
  const posts = await loadPosts()
  console.log(`✅ 加载了 ${posts.length} 篇文章`)
  
  // 生成首页
  console.log('🏠 生成首页...')
  const indexHTML = generateIndexHTML(posts)
  await fs.writeFile(path.join(OUTPUT_DIR, 'index.html'), indexHTML)
  
  // 生成文章页面
  console.log('📝 生成文章页面...')
  for (const post of posts) {
    const postHTML = generatePostHTML(post, posts)
    const postPath = path.join(OUTPUT_DIR, 'post', `${post.id}.html`)
    await fs.writeFile(postPath, postHTML)
  }
  
  // 复制静态资源
  console.log('📦 复制静态资源...')
  const publicDir = path.join(ROOT_DIR, 'DailyBlog', 'frontend', 'public')
  try {
    await fs.cp(publicDir, OUTPUT_DIR, { recursive: true, force: true })
  } catch (e) {
    console.log('⚠️ 没有 public 目录或复制失败')
  }
  
  console.log('✅ 静态站点生成完成!')
  console.log(`📁 输出目录: ${OUTPUT_DIR}`)
  console.log(`🌐 访问: file://${OUTPUT_DIR}/index.html`)
}

main().catch(console.error)
