import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import type { Post, Profile } from './types.js'

const CONTENT_DIR = process.env.CONTENT_PATH || path.join(process.cwd(), '../content')
const POSTS_DIR = path.join(CONTENT_DIR, 'posts')
const PROFILE_PATH = path.join(CONTENT_DIR, 'config', 'profile.json')

// 缓存
let cachedPosts: Post[] | null = null
let cachedProfile: Profile | null = null
let lastLoadTime = 0
const CACHE_TTL = 5000 // 5秒内不重复加载

function generateExcerpt(content: string, maxLength: number = 200): string {
  const text = content.replace(/[#*`\[\]()]/g, '').replace(/\n/g, ' ').trim()
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * 从文章内容中提取 Obsidian 格式的标签
 * 匹配 #标签名 格式，但排除代码块和 Markdown 标题
 */
function extractTagsFromContent(content: string): string[] {
  const tags: string[] = []
  const tagSet = new Set<string>()
  
  // 保护代码块
  let processedContent = content
  const codeBlocks: string[] = []
  
  // 提取代码块
  processedContent = processedContent.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match)
    return `<!--CODE_BLOCK_${codeBlocks.length - 1}-->`
  })
  
  // 提取行内代码
  processedContent = processedContent.replace(/`[^`]+`/g, (match) => {
    codeBlocks.push(match)
    return `<!--INLINE_CODE_${codeBlocks.length - 1}-->`
  })
  
  // 匹配 #标签名 格式
  // 支持中文、英文、数字、下划线、连字符、斜杠
  const tagRegex = /#([\u4e00-\u9fa5a-zA-Z0-9_\-\/\.]+)(?![\w\-\/\.])/g
  let match
  
  while ((match = tagRegex.exec(processedContent)) !== null) {
    const tagName = match[1]
    
    // 跳过纯数字（可能是颜色代码）
    if (/^[0-9a-fA-F]{3,6}$/.test(tagName)) {
      continue
    }
    
    // 跳过看起来像 URL hash 的情况
    if (match.index > 0) {
      const prevChar = processedContent[match.index - 1]
      if (prevChar === '[' || prevChar === '(' || prevChar === '/') {
        continue
      }
    }
    
    tagSet.add(tagName)
  }
  
  return Array.from(tagSet)
}

/**
 * 获取文件最后修改时间
 */
async function getFileMtime(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath)
    return stats.mtimeMs
  } catch {
    return 0
  }
}

/**
 * 检查是否需要重新加载（文件是否有变化）
 */
async function shouldReload(): Promise<boolean> {
  // 如果缓存为空，需要加载
  if (!cachedPosts) return true
  
  // 检查是否超过缓存时间
  const now = Date.now()
  if (now - lastLoadTime < CACHE_TTL) {
    return false
  }
  
  try {
    const files = await fs.readdir(POSTS_DIR)
    const mdFiles = files.filter(f => f.endsWith('.md'))
    
    // 检查文件数量是否变化
    if (mdFiles.length !== cachedPosts.length) {
      console.log('Post count changed, reloading...')
      return true
    }
    
    // 检查每个文件的修改时间
    for (const file of mdFiles) {
      const filePath = path.join(POSTS_DIR, file)
      const mtime = await getFileMtime(filePath)
      const postId = file.replace('.md', '')
      const cachedPost = cachedPosts.find(p => p.id === postId)
      
      // 如果文件修改时间晚于上次加载时间，需要重新加载
      if (mtime > lastLoadTime) {
        console.log(`File ${file} modified, reloading...`)
        return true
      }
      
      // 如果是新文件
      if (!cachedPost) {
        console.log(`New file ${file} detected, reloading...`)
        return true
      }
    }
    
    return false
  } catch (err) {
    console.error('Error checking reload:', err)
    return true
  }
}

async function loadPosts(forceReload = false): Promise<Post[]> {
  // 检查是否需要重新加载
  if (!forceReload && !await shouldReload()) {
    return cachedPosts!
  }

  try {
    console.log('Loading posts from disk...')
    const files = await fs.readdir(POSTS_DIR)
    const mdFiles = files.filter(f => f.endsWith('.md'))

    const posts: Post[] = []

    for (const file of mdFiles) {
      const filePath = path.join(POSTS_DIR, file)
      const content = await fs.readFile(filePath, 'utf-8')
      const { data, content: mdContent } = matter(content)

      // 从 frontmatter 获取标签
      const frontmatterTags = data.tags || []
      
      // 从内容中提取 Obsidian 格式标签
      const contentTags = extractTagsFromContent(mdContent)
      
      // 合并标签（去重）
      const allTags = Array.from(new Set([...frontmatterTags, ...contentTags]))

      posts.push({
        id: file.replace('.md', ''),
        title: data.title || file.replace('.md', ''),
        date: data.date || new Date().toISOString().split('T')[0],
        tags: allTags,
        wordCount: data.wordCount || mdContent.length,
        content: mdContent.trim(),
        excerpt: generateExcerpt(mdContent)
      })
    }

    cachedPosts = posts.sort((a, b) => b.date.localeCompare(a.date))
    lastLoadTime = Date.now()
    console.log(`Loaded ${cachedPosts.length} posts`)
    return cachedPosts
  } catch (err) {
    console.error('Failed to load posts:', err)
    return cachedPosts || []
  }
}

async function loadProfile(forceReload = false): Promise<Profile | null> {
  if (!forceReload && cachedProfile) {
    // 检查配置文件是否修改
    try {
      const mtime = await getFileMtime(PROFILE_PATH)
      if (mtime <= lastLoadTime) {
        return cachedProfile
      }
    } catch {
      // 如果检查失败，继续重新加载
    }
  }

  try {
    console.log('Loading profile from disk...')
    const content = await fs.readFile(PROFILE_PATH, 'utf-8')
    cachedProfile = JSON.parse(content)
    return cachedProfile
  } catch (err) {
    console.error('Failed to load profile:', err)
    return cachedProfile
  }
}

function clearCache() {
  console.log('Clearing cache...')
  cachedPosts = null
  cachedProfile = null
  lastLoadTime = 0
}

// Watch for file changes using chokidar-like approach with fs.watch
async function watchContent() {
  try {
    const { watch } = await import('fs')
    
    // 监听文章目录
    watch(POSTS_DIR, { recursive: true }, (eventType, filename) => {
      if (filename?.endsWith('.md')) {
        console.log(`Post file changed: ${filename}`)
        clearCache()
      }
    })
    
    // 监听配置文件
    watch(path.dirname(PROFILE_PATH), (eventType, filename) => {
      if (filename === 'profile.json') {
        console.log('Profile file changed')
        clearCache()
      }
    })
    
    console.log('Content watching enabled')
  } catch (err) {
    console.error('Failed to watch content:', err)
  }
}

export { loadPosts, loadProfile, clearCache, watchContent }
