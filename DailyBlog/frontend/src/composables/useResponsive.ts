/**
 * 响应式组合式函数
 * 提供响应式布局相关的状态和工具函数
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'

// 断点定义
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const

type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'large'

/**
 * 响应式状态管理
 */
export function useResponsive() {
  // 当前视口宽度
  const windowWidth = ref(window.innerWidth)
  
  // 当前断点
  const currentBreakpoint = computed<Breakpoint>(() => {
    const width = windowWidth.value
    if (width < BREAKPOINTS.mobile) return 'mobile'
    if (width < BREAKPOINTS.tablet) return 'tablet'
    if (width < BREAKPOINTS.desktop) return 'desktop'
    return 'large'
  })
  
  // 设备类型判断
  const isMobile = computed(() => currentBreakpoint.value === 'mobile')
  const isTablet = computed(() => currentBreakpoint.value === 'tablet')
  const isDesktop = computed(() => ['desktop', 'large'].includes(currentBreakpoint.value))
  
  // 是否是触摸设备
  const isTouch = ref(false)
  
  // 更新窗口宽度
  const updateWidth = () => {
    windowWidth.value = window.innerWidth
  }
  
  // 检测触摸设备
  const detectTouch = () => {
    isTouch.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }
  
  // 监听窗口变化
  let resizeObserver: ResizeObserver | null = null
  
  onMounted(() => {
    updateWidth()
    detectTouch()
    
    // 使用 ResizeObserver 监听窗口变化
    resizeObserver = new ResizeObserver(updateWidth)
    resizeObserver.observe(document.body)
  })
  
  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect()
    }
  })
  
  return {
    windowWidth,
    currentBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
    breakpoints: BREAKPOINTS,
  }
}

/**
 * 响应式字体大小
 */
export function useResponsiveFontSize() {
  const { currentBreakpoint } = useResponsive()
  
  const fontSize = computed(() => {
    switch (currentBreakpoint.value) {
      case 'mobile':
        return {
          h1: '1.75rem',
          h2: '1.5rem',
          h3: '1.25rem',
          body: '0.9375rem',
          small: '0.8125rem',
          code: '0.8125rem',
        }
      case 'tablet':
        return {
          h1: '2rem',
          h2: '1.75rem',
          h3: '1.375rem',
          body: '1rem',
          small: '0.875rem',
          code: '0.875rem',
        }
      case 'desktop':
      case 'large':
        return {
          h1: '2.25rem',
          h2: '2rem',
          h3: '1.5rem',
          body: '1.0625rem',
          small: '0.875rem',
          code: '0.9375rem',
        }
    }
  })
  
  return { fontSize }
}

/**
 * 响应式间距
 */
export function useResponsiveSpacing() {
  const { currentBreakpoint } = useResponsive()
  
  const spacing = computed(() => {
    switch (currentBreakpoint.value) {
      case 'mobile':
        return {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '0.75rem',
          lg: '1rem',
          xl: '1.25rem',
          xxl: '1.5rem',
        }
      case 'tablet':
        return {
          xs: '0.5rem',
          sm: '0.75rem',
          md: '1rem',
          lg: '1.25rem',
          xl: '1.5rem',
          xxl: '2rem',
        }
      case 'desktop':
      case 'large':
        return {
          xs: '0.5rem',
          sm: '0.75rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          xxl: '2.5rem',
        }
    }
  })
  
  return { spacing }
}
