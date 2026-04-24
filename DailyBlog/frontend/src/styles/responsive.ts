/**
 * 响应式设计系统配置
 * 
 * 断点定义：
 * - Mobile: < 768px (手机端)
 * - Tablet: 768px - 1023px (平板端)
 * - Desktop: >= 1024px (PC端)
 * 
 * 采用 Mobile-First 策略，默认样式为移动端，通过 min-width 媒体查询向上适配
 */

export const breakpoints = {
  /** 平板端起始宽度 */
  tablet: 768,
  /** PC端起始宽度 */
  desktop: 1024,
  /** 大屏幕起始宽度 */
  large: 1280,
} as const

export type Breakpoint = keyof typeof breakpoints

/**
 * 媒体查询字符串生成器
 */
export const media = {
  /** 平板端及以上 */
  tablet: `(min-width: ${breakpoints.tablet}px)`,
  /** PC端及以上 */
  desktop: `(min-width: ${breakpoints.desktop}px)`,
  /** 大屏幕及以上 */
  large: `(min-width: ${breakpoints.large}px)`,
  /** 仅平板端 */
  onlyTablet: `(min-width: ${breakpoints.tablet}px) and (max-width: ${breakpoints.desktop - 1}px)`,
  /** 仅移动端 */
  onlyMobile: `(max-width: ${breakpoints.tablet - 1}px)`,
} as const

/**
 * 响应式字体大小系统
 * 使用 clamp 实现流体排版，在断点间平滑过渡
 */
export const typography = {
  /** 页面标题 */
  h1: {
    mobile: '1.75rem',    // 28px
    tablet: '2rem',       // 32px
    desktop: '2.25rem',   // 36px
  },
  /** 文章标题 */
  h2: {
    mobile: '1.5rem',     // 24px
    tablet: '1.75rem',    // 28px
    desktop: '2rem',      // 32px
  },
  /** 小节标题 */
  h3: {
    mobile: '1.25rem',    // 20px
    tablet: '1.375rem',   // 22px
    desktop: '1.5rem',    // 24px
  },
  /** 正文 */
  body: {
    mobile: '0.9375rem',  // 15px
    tablet: '1rem',       // 16px
    desktop: '1.0625rem', // 17px
  },
  /** 小字 */
  small: {
    mobile: '0.8125rem',  // 13px
    tablet: '0.875rem',   // 14px
    desktop: '0.875rem',  // 14px
  },
  /** 代码块 */
  code: {
    mobile: '0.8125rem',  // 13px
    tablet: '0.875rem',   // 14px
    desktop: '0.9375rem', // 15px
  },
} as const

/**
 * 间距系统
 * 基于 4px 的基准单位
 */
export const spacing = {
  xs: { mobile: '0.25rem', tablet: '0.5rem', desktop: '0.5rem' },   // 4-8px
  sm: { mobile: '0.5rem', tablet: '0.75rem', desktop: '0.75rem' },  // 8-12px
  md: { mobile: '0.75rem', tablet: '1rem', desktop: '1rem' },       // 12-16px
  lg: { mobile: '1rem', tablet: '1.25rem', desktop: '1.5rem' },     // 16-24px
  xl: { mobile: '1.25rem', tablet: '1.5rem', desktop: '2rem' },     // 20-32px
  xxl: { mobile: '1.5rem', tablet: '2rem', desktop: '2.5rem' },     // 24-40px
} as const

/**
 * 布局配置
 */
export const layout = {
  /** 容器最大宽度 */
  maxWidth: {
    mobile: '100%',
    tablet: '720px',
    desktop: '1200px',
    large: '1400px',
  },
  /** 侧边栏宽度 */
  sidebar: {
    mobile: '100%',
    tablet: '280px',
    desktop: '320px',
  },
  /** 内容区宽度 */
  content: {
    mobile: '100%',
    tablet: 'calc(100% - 280px)',
    desktop: 'calc(100% - 320px)',
  },
  /** 栅格列数 */
  gridColumns: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
    large: 4,
  },
} as const

/**
 * 触摸设备检测
 * 用于区分触控和鼠标操作
 */
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * 当前断点检测
 */
export const getCurrentBreakpoint = (): Breakpoint | null => {
  const width = window.innerWidth
  if (width >= breakpoints.desktop) return 'desktop'
  if (width >= breakpoints.tablet) return 'tablet'
  return null // mobile
}

/**
 * 监听断点变化
 */
export const watchBreakpoint = (
  callback: (breakpoint: Breakpoint | null) => void
): (() => void) => {
  const mediaQuery = window.matchMedia(media.tablet)
  const mediaQueryDesktop = window.matchMedia(media.desktop)
  
  const handler = () => {
    callback(getCurrentBreakpoint())
  }
  
  mediaQuery.addEventListener('change', handler)
  mediaQueryDesktop.addEventListener('change', handler)
  
  // 立即执行一次
  handler()
  
  return () => {
    mediaQuery.removeEventListener('change', handler)
    mediaQueryDesktop.removeEventListener('change', handler)
  }
}
