import { test, expect } from '@playwright/test'

/**
 * 响应式布局测试
 * 验证各断点下的布局正确性
 */

test.describe('响应式布局测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // 等待页面加载完成
    await page.waitForSelector('.sidebar-container')
  })

  test('桌面端布局 - 侧边栏和内容并排', async ({ page }) => {
    // 设置桌面端视口
    await page.setViewportSize({ width: 1280, height: 800 })
    
    // 检查布局结构
    const layout = page.locator('.max-w-7xl > div')
    await expect(layout).toHaveClass(/flex-row/)
    
    // 检查侧边栏可见
    const sidebar = page.locator('.sidebar-container')
    await expect(sidebar).toBeVisible()
    
    // 检查文章列表可见
    const posts = page.locator('.card').first()
    await expect(posts).toBeVisible()
  })

  test('平板端布局 - 侧边栏在上，内容在下', async ({ page }) => {
    // 设置平板端视口
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // 检查布局结构
    const layout = page.locator('.max-w-7xl > div')
    await expect(layout).toHaveClass(/flex-col/)
    
    // 检查侧边栏宽度
    const sidebar = page.locator('.sidebar-container')
    const width = await sidebar.evaluate(el => el.offsetWidth)
    expect(width).toBeGreaterThan(700) // 应该占满宽度
  })

  test('手机端布局 - 单列布局', async ({ page }) => {
    // 设置手机端视口
    await page.setViewportSize({ width: 375, height: 667 })
    
    // 检查布局结构
    const layout = page.locator('.max-w-7xl > div')
    await expect(layout).toHaveClass(/flex-col/)
    
    // 检查个人信息卡片可见
    const profile = page.locator('.profile-container')
    await expect(profile).toBeVisible()
    
    // 检查文章卡片可见
    const postCards = page.locator('.card')
    await expect(postCards.first()).toBeVisible()
  })

  test('个人信息卡片在各端可见', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 390, height: 844, name: 'iPhone 12' },
      { width: 768, height: 1024, name: 'iPad Mini' },
      { width: 1024, height: 1366, name: 'iPad Pro' },
      { width: 1920, height: 1080, name: 'Desktop' },
    ]

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      
      // 检查头像
      const avatar = page.locator('.avatar-image')
      await expect(avatar).toBeVisible()
      
      // 检查昵称
      const nickname = page.locator('.nickname')
      await expect(nickname).toBeVisible()
      
      // 检查简介
      const bio = page.locator('.bio')
      await expect(bio).toBeVisible()
      
      console.log(`✓ ${viewport.name}: 个人信息卡片显示正常`)
    }
  })

  test('文章列表在各端可见', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' },
    ]

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      
      // 等待文章加载
      await page.waitForSelector('.card')
      
      // 检查文章卡片
      const posts = page.locator('.card')
      const count = await posts.count()
      expect(count).toBeGreaterThan(0)
      
      // 检查文章标题
      const titles = page.locator('h3')
      await expect(titles.first()).toBeVisible()
      
      console.log(`✓ ${viewport.name}: 文章列表显示正常 (${count} 篇文章)`)
    }
  })
})

test.describe('交互适配测试', () => {
  test('触摸设备优化 - 按钮点击区域', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // 检查社交按钮
    const socialButtons = page.locator('.social-btn')
    const count = await socialButtons.count()
    
    for (let i = 0; i < count; i++) {
      const button = socialButtons.nth(i)
      const box = await button.boundingBox()
      
      // 确保点击区域至少 44x44px
      expect(box?.width).toBeGreaterThanOrEqual(44)
      expect(box?.height).toBeGreaterThanOrEqual(44)
    }
  })

  test('字体大小在各端可读', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },
      { width: 1920, height: 1080 },
    ]

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      
      // 检查正文最小字体大小
      const bodyText = page.locator('.bio')
      const fontSize = await bodyText.evaluate(el => {
        return window.getComputedStyle(el).fontSize
      })
      
      const sizeInPx = parseFloat(fontSize)
      expect(sizeInPx).toBeGreaterThanOrEqual(12) // 最小 12px
    }
  })
})
