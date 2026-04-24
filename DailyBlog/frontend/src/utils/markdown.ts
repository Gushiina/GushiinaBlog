import { marked } from 'marked'
import hljs from 'highlight.js'
import katex from 'katex'
import DOMPurify from 'dompurify'

// 导入所有 highlight.js 语言支持（完整包）
import 'highlight.js/lib/common'

// 导入 Atom One Light 主题
import 'highlight.js/styles/atom-one-light.css'

// 语言别名映射表
const languageAliases: Record<string, string> = {
  'c++': 'cpp',
  'C++': 'cpp',
  'cpp': 'cpp',
  'c': 'c',
  'C': 'c',
  'java': 'java',
  'Java': 'java',
  'python': 'python',
  'Python': 'python',
  'py': 'python',
  'javascript': 'javascript',
  'JavaScript': 'javascript',
  'js': 'javascript',
  'typescript': 'typescript',
  'TypeScript': 'typescript',
  'ts': 'typescript',
  'rust': 'rust',
  'Rust': 'rust',
  'rs': 'rust',
  'go': 'go',
  'Go': 'go',
  'golang': 'go',
  'html': 'html',
  'HTML': 'html',
  'css': 'css',
  'CSS': 'css',
  'json': 'json',
  'JSON': 'json',
  'xml': 'xml',
  'XML': 'xml',
  'sql': 'sql',
  'SQL': 'sql',
  'bash': 'bash',
  'Bash': 'bash',
  'shell': 'bash',
  'Shell': 'bash',
  'sh': 'bash',
  'yaml': 'yaml',
  'YAML': 'yaml',
  'yml': 'yaml',
  'markdown': 'markdown',
  'Markdown': 'markdown',
  'md': 'markdown'
}

/**
 * 规范化语言标识符
 */
function normalizeLanguage(lang: string): string {
  return languageAliases[lang] || lang.toLowerCase()
}

/**
 * 检查语言是否受支持
 */
function isLanguageSupported(lang: string): boolean {
  return !!hljs.getLanguage(lang)
}

/**
 * 获取语言显示名称
 */
function getLanguageDisplayName(lang: string): string {
  const displayNames: Record<string, string> = {
    'cpp': 'C++',
    'c': 'C',
    'java': 'Java',
    'python': 'Python',
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'rust': 'Rust',
    'go': 'Go',
    'html': 'HTML',
    'css': 'CSS',
    'json': 'JSON',
    'xml': 'XML',
    'sql': 'SQL',
    'bash': 'Bash',
    'yaml': 'YAML',
    'markdown': 'Markdown'
  }
  return displayNames[lang] || lang.toUpperCase()
}

// 配置 marked 的 renderer 来自定义代码块
const renderer = new marked.Renderer()

// 自定义代码块渲染
renderer.code = function(code: string, language?: string, escaped?: boolean): string {
  const lang = language || ''
  const normalizedLang = normalizeLanguage(lang)
  const displayName = getLanguageDisplayName(normalizedLang)
  
  let highlightedCode: string
  
  if (normalizedLang && isLanguageSupported(normalizedLang)) {
    try {
      highlightedCode = hljs.highlight(code, { language: normalizedLang }).value
    } catch (e) {
      console.error('[Markdown] Highlight error:', e)
      highlightedCode = hljs.highlightAuto(code).value
    }
  } else {
    highlightedCode = hljs.highlightAuto(code).value
  }
  
  // 生成带容器和语言标识的代码块
  return `
    <div class="code-block-container">
      <div class="code-block-header">
        <span class="code-language">${displayName}</span>
      </div>
      <pre class="code-block"><code class="hljs ${normalizedLang}">${highlightedCode}</code></pre>
    </div>
  `
}

// 配置 marked
marked.setOptions({
  renderer: renderer,
  breaks: true,
  gfm: true
})

/**
 * 判断是否为外部 URL（以 http:// 或 https:// 开头）
 */
function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim())
}

/**
 * 生成图片 HTML 标签
 */
function generateImgTag(src: string, alt: string): string {
  return `<img src="${src}" alt="${alt || ''}" class="max-w-full h-auto rounded-lg shadow-md my-4" loading="lazy" onerror="this.onerror=null; this.classList.add('img-error'); console.error('Image failed to load:', this.src);" />`
}

/**
 * 处理本地图片路径
 * 将文件名转换为 /ReferencePicture/ 路径
 */
function processLocalImagePath(path: string): string {
  // 提取纯文件名
  let cleanFilename = path.replace(/^.*[/\\]/, '')
  cleanFilename = cleanFilename.replace(/^\//, '')
  cleanFilename = cleanFilename.split('?')[0]
  cleanFilename = cleanFilename.split('#')[0]
  
  const encodedFilename = encodeURIComponent(cleanFilename)
  return `/ReferencePicture/${encodedFilename}`
}

/**
 * 处理图片：将 Markdown 图片语法转换为 HTML img 标签
 */
function processImages(content: string): string {
  // 1. 先处理被链接包裹的图片 [![alt](img)](link)
  // 这种格式需要特殊处理，保留链接但转换图片
  content = content.replace(/\[(!\[([^\]]*)\]\(([^)]+)\))\]\(([^)]+)\)/g, (match, imgPart, alt, imgUrl, linkUrl) => {
    // 判断图片是外部还是本地
    let imgSrc: string
    if (isExternalUrl(imgUrl)) {
      imgSrc = imgUrl
      console.log('[Markdown] Processing external linked image:', imgSrc)
    } else {
      imgSrc = processLocalImagePath(imgUrl)
      console.log('[Markdown] Processing local linked image:', imgSrc)
    }
    
    const imgHtml = generateImgTag(imgSrc, alt)
    return `[${imgHtml}](${linkUrl})`
  })

  // 2. 处理 Obsidian 格式 ![[filename.png]]
  content = content.replace(/!\[\[([^\]]+)\]\]/g, (match, filename) => {
    const cleanFilename = filename.split(/[/\\]/).pop() || filename
    const imgSrc = processLocalImagePath(cleanFilename)
    console.log('[Markdown] Processing Obsidian image:', imgSrc)
    return generateImgTag(imgSrc, cleanFilename)
  })

  // 3. 处理标准 Markdown 格式 ![alt](path)
  // 使用非贪婪匹配，支持空格和中文
  content = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, path) => {
    let imgSrc: string
    if (isExternalUrl(path)) {
      imgSrc = path
      console.log('[Markdown] Processing external image:', imgSrc)
    } else {
      imgSrc = processLocalImagePath(path)
      console.log('[Markdown] Processing local image:', imgSrc)
    }
    
    return generateImgTag(imgSrc, alt)
  })

  return content
}

/**
 * 处理 Obsidian 标签：将 #标签 转换为可点击的链接
 * 匹配规则：
 * 1. #标签名 - 普通标签
 * 2. 标签名不能包含空格
 * 3. 标签名可以包含中文、英文、数字、下划线、连字符
 * 4. 避免匹配 Markdown 标题 #
 * 5. 避免匹配 URL 中的 #
 * 6. 避免匹配代码块中的内容
 */
function processTags(content: string): string {
  // 存储代码块和行内代码，避免在代码中处理标签
  const codeBlocks: { placeholder: string, code: string }[] = []
  let codeIndex = 0

  // 1. 保护代码块 ```...```
  content = content.replace(/```[\s\S]*?```/g, (match) => {
    const placeholder = `<!--CODE_BLOCK_${codeIndex}-->`
    codeBlocks.push({ placeholder, code: match })
    codeIndex++
    return placeholder
  })

  // 2. 保护行内代码 `...`
  content = content.replace(/`[^`]+`/g, (match) => {
    const placeholder = `<!--INLINE_CODE_${codeIndex}-->`
    codeBlocks.push({ placeholder, code: match })
    codeIndex++
    return placeholder
  })

  // 3. 处理标签 #标签名
  // 匹配规则：
  // - 以 # 开头
  // - 后面跟着非空格字符（标签内容）
  // - 标签内容可以包含中文、英文、数字、下划线、连字符
  // - 使用负向前瞻避免匹配 # 后面直接跟空格或换行（Markdown 标题）
  // - 使用负向前瞻避免匹配 URL 中的 #
  content = content.replace(
    /#([\u4e00-\u9fa5a-zA-Z0-9_\-\/\.]+)(?![\w\-\/\.])/g,
    (match, tagName) => {
      // 跳过纯数字（可能是颜色代码）
      if (/^[0-9a-fA-F]{3,6}$/.test(tagName)) {
        return match
      }
      
      // 生成标签链接，点击后会触发筛选
      console.log('[Markdown] Processing tag:', tagName)
      return `<a href="/?tag=${encodeURIComponent(tagName)}" class="obsidian-tag" data-tag="${tagName}">#${tagName}</a>`
    }
  )

  // 4. 恢复代码块
  codeBlocks.forEach(({ placeholder, code }) => {
    content = content.replace(placeholder, code)
  })

  return content
}

// 重新设计：直接在 Markdown 解析前处理所有内容
export function parseMarkdown(content: string): string {
  console.log('[Markdown] Starting to parse markdown, content length:', content.length)
  
  // 存储 LaTeX 公式
  const latexBlocks: { placeholder: string, latex: string, displayMode: boolean }[] = []
  let latexIndex = 0

  // 1. 先提取并保护 LaTeX 块级公式 $$...$$
  content = content.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
    const placeholder = `<!--LATEX_${latexIndex}-->`
    latexBlocks.push({
      placeholder,
      latex: latex.trim(),
      displayMode: true
    })
    latexIndex++
    return placeholder
  })

  // 2. 提取并保护 LaTeX 行内公式 $...$
  content = content.replace(/(?<!\$)\$(?!\$)([^\$\n]+?)\$(?!\$)/g, (match, latex) => {
    const placeholder = `<!--LATEX_${latexIndex}-->`
    latexBlocks.push({
      placeholder,
      latex: latex.trim(),
      displayMode: false
    })
    latexIndex++
    return placeholder
  })

  // 3. 处理所有图片（在 Markdown 解析前转换成 HTML）
  content = processImages(content)

  // 4. 处理 Obsidian 标签 #标签
  content = processTags(content)

  // 5. 使用 marked 解析 Markdown
  let html = marked.parse(content) as string

  // 5. 渲染 LaTeX 公式
  latexBlocks.forEach(({ placeholder, latex, displayMode }) => {
    try {
      const rendered = katex.renderToString(latex, {
        displayMode,
        throwOnError: false
      })
      html = html.replace(placeholder, rendered)
    } catch (e) {
      console.error('KaTeX render error:', e, 'Latex:', latex)
      html = html.replace(placeholder, displayMode ? `$$${latex}$$` : `$${latex}$`)
    }
  })

  // 6. 清理 HTML 防止 XSS
  html = DOMPurify.sanitize(html, {
    ADD_TAGS: ['math', 'annotation', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'mfrac', 'semantics', 'annotation', 'span', 'svg', 'g', 'path', 'line', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'text', 'tspan', 'defs', 'clipPath', 'mask', 'pattern', 'linearGradient', 'radialGradient', 'stop', 'use', 'symbol', 'img'],
    ADD_ATTR: ['xmlns', 'encoding', 'display', 'aria-hidden', 'role', 'viewBox', 'preserveAspectRatio', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset', 'transform', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'width', 'height', 'points', 'd', 'opacity', 'visibility', 'overflow', 'clip-path', 'mask', 'filter', 'gradientUnits', 'gradientTransform', 'spreadMethod', 'offset', 'stop-color', 'stop-opacity', 'href', 'xlink:href', 'class', 'style', 'src', 'alt', 'loading', 'onerror']
  })

  console.log('[Markdown] Parsing completed')
  return html
}

// 导出 marked 和 hljs 以便其他地方使用
export { marked, hljs, katex }
