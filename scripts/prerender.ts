#!/usr/bin/env tsx
/**
 * 预渲染脚本 - 使用 Puppeteer 生成静态 HTML
 * 保留原有 Vue 应用的所有样式和功能
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.join(__dirname, '..')
const FRONTEND_DIR = path.join(ROOT_DIR, 'DailyBlog', 'frontend')
const BACKEND_DIR = path.join(ROOT_DIR, 'DailyBlog', 'backend')
const OUTPUT_DIR = path.join(ROOT_DIR, 'dist-static')

// 等待函数
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 启动服务
async function startServices() {
  console.log('🚀 启动后端服务...')
  const backend = spawn('npm', ['run', 'dev'], {
    cwd: BACKEND_DIR,
    stdio: 'pipe',
    shell: true
  })

  console.log('🚀 启动前端构建...')
  await new Promise((resolve, reject) => {
    const build = spawn('npm', ['run', 'build'], {
      cwd: FRONTEND_DIR,
      stdio: 'inherit',
      shell: true
    })
    build.on('close', (code) => {
      if (code === 0) resolve(null)
      else reject(new Error(`构建失败: ${code}`))
    })
  })

  // 等待后端启动
  await wait(3000)

  return { backend }
}

// 主函数
async function main() {
  console.log('🎯 开始预渲染...')

  // 清理输出目录
  await fs.rm(OUTPUT_DIR, { recursive: true, force: true })

  // 启动服务
  const { backend } = await startServices()

  try {
    // 动态导入 puppeteer
    const { default: puppeteer } = await import('puppeteer')

    console.log('🌐 启动浏览器...')
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    // 创建页面
    const page = await browser.newPage()

    // 访问首页并等待加载完成
    console.log('📄 渲染首页...')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' })
    await wait(2000) // 等待 Vue 完全渲染

    // 获取首页 HTML
    let homeHtml = await page.content()

    // 修改资源路径为相对路径
    homeHtml = homeHtml
      .replace(/href="\//g, 'href="/GushiinaBlog/')
      .replace(/src="\//g, 'src="/GushiinaBlog/')

    // 保存首页
    await fs.mkdir(OUTPUT_DIR, { recursive: true })
    await fs.writeFile(path.join(OUTPUT_DIR, 'index.html'), homeHtml)
    console.log('✅ 首页渲染完成')

    // 获取所有文章链接
    const postLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href^="/post/"]')
      return Array.from(links).map(link => link.getAttribute('href'))
    })

    // 去重
    const uniqueLinks = [...new Set(postLinks)]
    console.log(`📝 发现 ${uniqueLinks.length} 篇文章`)

    // 渲染每篇文章
    for (const link of uniqueLinks) {
      const postId = link.replace('/post/', '')
      console.log(`  渲染: ${postId}`)

      await page.goto(`http://localhost:3000${link}`, { waitUntil: 'networkidle0' })
      await wait(1500)

      let postHtml = await page.content()
      postHtml = postHtml
        .replace(/href="\//g, 'href="/GushiinaBlog/')
        .replace(/src="\//g, 'src="/GushiinaBlog/')

      // 使用目录结构
      const postDir = path.join(OUTPUT_DIR, 'post', postId)
      await fs.mkdir(postDir, { recursive: true })
      await fs.writeFile(path.join(postDir, 'index.html'), postHtml)
    }

    await browser.close()
    console.log('✅ 所有页面渲染完成')

    // 复制 dist 目录中的资源
    const distDir = path.join(FRONTEND_DIR, 'dist')
    const assetsDir = path.join(distDir, 'assets')
    const targetAssetsDir = path.join(OUTPUT_DIR, 'assets')

    try {
      await fs.cp(assetsDir, targetAssetsDir, { recursive: true })
      console.log('✅ 资源文件复制完成')
    } catch (e) {
      console.log('⚠️ 复制资源文件失败:', e)
    }

    // 复制其他静态资源
    const publicDir = path.join(ROOT_DIR, 'DailyBlog', 'content')
    try {
      await fs.cp(publicDir, OUTPUT_DIR, { recursive: true, force: true })
    } catch (e) {
      console.log('⚠️ 复制 content 目录失败:', e)
    }

  } finally {
    // 关闭后端服务
    backend.kill()
  }

  console.log('')
  console.log('🎉 预渲染完成!')
  console.log(`📁 输出目录: ${OUTPUT_DIR}`)
}

main().catch(err => {
  console.error('❌ 错误:', err)
  process.exit(1)
})
