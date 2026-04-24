/**
 * TypeScript 类型定义
 * 用于静态网站生成脚本
 */

/**
 * 文章元数据接口
 */
export interface PostMetadata {
  title?: string
  date?: string
  tags?: string[]
  [key: string]: any
}

/**
 * 文章数据接口
 */
export interface Post {
  id: string
  title: string
  date: string
  tags: string[]
  excerpt: string
  content: string
  wordCount: number
}

/**
 * 个人信息接口
 */
export interface Profile {
  nickname: string
  bio: string
  avatar: string
  social: {
    github?: string
    bilibili?: string
    email?: string
    [key: string]: string | undefined
  }
  blog: {
    title: string
    description: string
    footer: string
  }
}

/**
 * 构建配置接口
 */
export interface BuildConfig {
  rootDir: string
  frontendDir: string
  contentDir: string
  distDir: string
  staticDir: string
}

/**
 * 日志类型
 */
export type LogType = 'info' | 'success' | 'warning' | 'error'

/**
 * 颜色配置接口
 */
export interface ColorConfig {
  reset: string
  bright: string
  green: string
  yellow: string
  red: string
  cyan: string
}

/**
 * 文件统计信息
 */
export interface FileStats {
  totalFiles: number
  totalSize: number
}

/**
 * 构建结果
 */
export interface BuildResult {
  success: boolean
  duration: number
  fileCount: number
  sizeInMB: string
  outputDir: string
}

/**
 * 路径配置常量
 */
export const PATHS = {
  POSTS_DIR: 'posts',
  CONFIG_DIR: 'config',
  PROFILE_FILE: 'profile.json',
  API_DIR: 'api',
  ASSETS_DIR: 'assets',
  POST_ROUTE_DIR: 'post',
} as const

/**
 * 颜色常量
 */
export const COLORS: ColorConfig = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
} as const
