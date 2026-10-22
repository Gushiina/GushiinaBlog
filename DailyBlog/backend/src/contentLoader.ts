import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { fileURLToPath } from 'node:url'
import type { Post, Profile } from './types.js'

export const CONTENT_DIR = path.resolve(process.env.CONTENT_PATH || fileURLToPath(new URL('../../content', import.meta.url)))
const POSTS_DIR = path.join(CONTENT_DIR, 'posts')
const PROFILE_PATH = path.join(CONTENT_DIR, 'config', 'profile.json')
let cachedPosts: Post[] | null = null
let lastLoadTime = 0
const CACHE_TTL = 5000
export async function listFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => [])
  const nested = await Promise.all(entries.filter(e => !e.name.startsWith('.')).map(e => e.isDirectory() ? listFiles(path.join(directory, e.name)) : Promise.resolve([path.join(directory, e.name)])))
  return nested.flat()
}
function plainText(content: string) {
  return content.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, ' ').replace(/!\[\[[^\]]+\]\]|!\[[^\]]*\]\([^)]+\)/g, ' ').replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, '$2 $1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[#*`>~=$|]/g, '').replace(/\s+/g, ' ').trim()
}
function extractTags(content: string) {
  const prose = content.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`|\[[^\]]*\]\([^)]+\)/g, ' ')
  return [...prose.matchAll(/(?:^|\s)#([\p{L}\p{N}_-]+(?:\/[\p{L}\p{N}_-]+)*)/gu)].map(m => m[1]).filter(tag => !/^\d+$/.test(tag))
}
function normalizeDate(value: unknown, fallback: Date): string {
  const date = value ? new Date(String(value)) : fallback
  return Number.isNaN(date.getTime()) ? fallback.toISOString().slice(0, 10) : date.toISOString().slice(0, 10)
}
export async function loadPosts(forceReload = false): Promise<Post[]> {
  if (!forceReload && cachedPosts && Date.now() - lastLoadTime < CACHE_TTL) return cachedPosts
  const files = (await listFiles(POSTS_DIR)).filter(f => /\.md$/i.test(f))
  const posts = await Promise.all(files.map(async file => {
    try {
      const source = await fs.readFile(file, 'utf8')
      const { data, content } = matter(source)
      const stat = await fs.stat(file)
      const id = path.relative(POSTS_DIR, file).replace(/\\/g, '/').replace(/\.md$/i, '')
      const frontTags = Array.isArray(data.tags) ? data.tags : typeof data.tags === 'string' ? data.tags.split(/[,，\s]+/) : []
      const tags = [...new Set([...frontTags.map(String).map(t => t.replace(/^#/, '')), ...extractTags(content)].filter(Boolean))]
      const text = plainText(content)
      return { id, title: String(data.title || id.split('/').pop()), date: normalizeDate(data.date || data.created, stat.mtime), tags, wordCount: text.replace(/\s/g, '').length, content: content.trim(), excerpt: text.slice(0, 140) + (text.length > 140 ? '…' : '') } satisfies Post
    } catch (error) { console.error('Could not load note:', file, error); return null }
  }))
  cachedPosts = posts.filter((p): p is Post => p !== null).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'zh-CN'))
  lastLoadTime = Date.now()
  return cachedPosts
}
export async function loadProfile(): Promise<Profile | null> {
  try { return JSON.parse(await fs.readFile(PROFILE_PATH, 'utf8')) } catch { return null }
}
export function clearCache() { cachedPosts = null; lastLoadTime = 0 }
export async function watchContent() { /* Content is refreshed at most every five seconds, including nested notes. */ }

// Resolve only indexed files, never a client-supplied filesystem path.
export async function resolveAttachment(request: string, note: string): Promise<string | null> {
  const relative = request.replace(/\\/g, '/').replace(/^\.\//, '')
  if (/^\//.test(relative) || relative.split('/').includes('..')) return null
  const files = (await listFiles(CONTENT_DIR)).filter(f => /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(f))
  const directory = path.posix.dirname(note)
  const candidates = [path.posix.join('posts', directory, relative), relative, 'posts/' + relative]
  for (const candidate of candidates) {
    const result = files.find(f => path.relative(CONTENT_DIR, f).replace(/\\/g, '/') === candidate)
    if (result) return result
  }
  const matches = files.filter(f => path.basename(f) === path.posix.basename(relative))
  return matches.length === 1 ? matches[0] : null
}
