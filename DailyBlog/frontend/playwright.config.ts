import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright 跨浏览器测试配置
 * 用于 CI/CD 中的自动化浏览器兼容性测试
 */
export default defineConfig({
  testDir: './e2e',
  
  // 完全并行运行测试
  fullyParallel: true,
  
  // 禁止在 CI 中并行测试
  forbidOnly: !!process.env.CI,
  
  // 重试次数
  retries: process.env.CI ? 2 : 0,
  
  // 并行工作进程数
  workers: process.env.CI ? 1 : undefined,
  
  // 报告器配置
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  
  // 共享配置
  use: {
    // 基础 URL
    baseURL: 'http://localhost:4173',
    
    // 收集追踪信息
    trace: 'on-first-retry',
    
    // 截图配置
    screenshot: 'only-on-failure',
    
    // 视频配置
    video: 'on-first-retry',
  },
  
  // 项目配置 - 不同浏览器和设备
  projects: [
    // Desktop Chrome
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    // Desktop Firefox
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    // Desktop Safari
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    // iPhone 12
    {
      name: 'Mobile Chrome - iPhone 12',
      use: { 
        ...devices['iPhone 12'],
        browserName: 'chromium'
      },
    },
    
    // iPhone 12 Safari
    {
      name: 'Mobile Safari - iPhone 12',
      use: { 
        ...devices['iPhone 12'],
        browserName: 'webkit'
      },
    },
    
    // iPad Mini
    {
      name: 'Tablet Chrome - iPad Mini',
      use: { 
        ...devices['iPad Mini'],
        browserName: 'chromium'
      },
    },
    
    // iPad Mini Safari
    {
      name: 'Tablet Safari - iPad Mini',
      use: { 
        ...devices['iPad Mini'],
        browserName: 'webkit'
      },
    },
    
    // iPad Pro
    {
      name: 'Tablet Chrome - iPad Pro',
      use: { 
        ...devices['iPad Pro 11'],
        browserName: 'chromium'
      },
    },
  ],
  
  // 本地开发服务器配置
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
})
