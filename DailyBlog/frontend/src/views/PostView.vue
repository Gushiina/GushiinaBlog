<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBlogStore } from '@/stores/blog'
import { storeToRefs } from 'pinia'
import { parseMarkdown } from '@/utils/markdown'
import Sidebar from '@/components/Sidebar.vue'
import type { Post } from '@/types'

const route = useRoute()
const router = useRouter()
const blogStore = useBlogStore()
const { profile } = storeToRefs(blogStore)

const post = ref<Post | null>(null)
const loading = ref(true)

const htmlContent = computed(() => {
  if (!post.value?.content) return ''
  return parseMarkdown(post.value.content)
})

onMounted(async () => {
  const postId = route.params.id as string
  post.value = await blogStore.fetchPost(postId)
  loading.value = false
})

function goBack() {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen p-6">
    <div class="max-w-7xl mx-auto flex gap-6 layout-container">
      <Sidebar />
      <main class="flex-1 article-main">
        <!-- 返回按钮 - 在移动端显示 -->
        <button
          @click="goBack"
          class="mobile-back-btn"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          返回列表
        </button>

        <!-- 加载状态 -->
        <div v-if="loading" class="card p-12 text-center article-card">
          <div class="loading-spinner"></div>
          <p class="text-gray-600 text-lg mt-4">加载中...</p>
        </div>

        <!-- 文章不存在 -->
        <div v-else-if="!post" class="card p-12 text-center article-card">
          <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-gray-600 text-lg">文章不存在</p>
          <button @click="goBack" class="mt-4 text-blue-500 hover:underline">返回首页</button>
        </div>

        <!-- 文章内容 -->
        <article v-else class="card article-card">
          <!-- 文章头部 -->
          <header class="article-header">
            <h1 class="article-title">{{ post.title }}</h1>
            <div class="article-meta">
              <span class="meta-item">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                </svg>
                {{ post.date }}
              </span>
              <span class="meta-item">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                </svg>
                {{ post.wordCount }} 字
              </span>
              <span class="meta-item">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                {{ post.readingTime }} 分钟阅读
              </span>
            </div>
            <!-- 标签 -->
            <div class="article-tags" v-if="post.tags.length > 0">
              <span
                v-for="tag in post.tags"
                :key="tag"
                class="tag-link"
                @click="router.push(`/?tag=${encodeURIComponent(tag)}`)"
              >
                #{{ tag }}
              </span>
            </div>
          </header>

          <!-- 文章正文 -->
          <div
            class="article-content markdown-content"
            v-html="htmlContent"
          ></div>

          <!-- 文章底部 -->
          <footer class="article-footer">
            <div class="footer-divider"></div>
            <p class="footer-text">
              本文由 {{ profile?.nickname }} 发布于 {{ post.date }}
            </p>
            <div class="footer-actions">
              <button @click="goBack" class="action-btn">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                返回文章列表
              </button>
            </div>
          </footer>
        </article>

        <!-- 页脚 -->
        <footer class="card p-6 text-center text-gray-500 footer-card">
          {{ profile?.blog.footer }}
        </footer>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* 布局容器 */
.layout-container {
  transition: all 0.3s ease;
}

/* 文章主区域 - 自动扩展填充可用空间 */
.article-main {
  flex: 1;
  min-width: 0; /* 关键：允许flex子项收缩 */
  max-width: 100%;
  transition: all 0.3s ease;
}

/* 移动端返回按钮 */
.mobile-back-btn {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border: 1px solid #d1d5db;
  border-radius: 10px;
  color: #4b5563;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-back-btn:hover {
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  transform: translateY(-1px);
}

/* 文章卡片 */
.article-card {
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border: 1px solid #e1e4e8;
  border-radius: 16px;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.06),
    0 1px 3px rgba(0, 0, 0, 0.02),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  overflow: hidden;
  transition: all 0.3s ease;
}

.article-card:hover {
  box-shadow: 
    0 8px 30px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

/* 加载动画 */
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 文章头部 */
.article-header {
  padding: 2rem 2.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.article-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
  line-height: 1.3;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-link {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #93c5fd;
}

.tag-link:hover {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
}

/* 文章内容 */
.article-content {
  padding: 2rem 2.5rem;
  color: #24292e;
  line-height: 1.8;
  font-size: 1.05rem;
}

/* Markdown 内容样式 */
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  color: #1f2937;
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-content :deep(h1) { font-size: 1.75rem; }
.markdown-content :deep(h2) { font-size: 1.5rem; }
.markdown-content :deep(h3) { font-size: 1.25rem; }
.markdown-content :deep(h4) { font-size: 1.125rem; }

.markdown-content :deep(p) {
  margin-bottom: 1.25rem;
}

.markdown-content :deep(a) {
  color: #2563eb;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s ease;
}

.markdown-content :deep(a:hover) {
  border-bottom-color: #2563eb;
}

.markdown-content :deep(code:not(.hljs)) {
  background-color: #f3f4f6;
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  font-family: 'Fira Code', 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.85em;
  color: #e11d48;
}

.markdown-content :deep(pre) {
  background-color: #282c34;
  color: #abb2bf;
  padding: 0;
  border-radius: 10px;
  overflow-x: auto;
  margin: 1.5rem 0;
}

.markdown-content :deep(pre code.hljs) {
  background-color: transparent;
  padding: 1.5rem;
  color: inherit;
  font-size: 1rem;
  font-family: 'Fira Code', 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;
  margin: 1.5rem 0;
  color: #4b5563;
  font-style: italic;
  background: linear-gradient(90deg, #eff6ff 0%, transparent 100%);
  padding: 1rem 1rem 1rem 1.5rem;
  border-radius: 0 8px 8px 0;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.markdown-content :deep(li) {
  margin: 0.5rem 0;
}

.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1.5rem 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  text-align: left;
}

.markdown-content :deep(th) {
  background-color: #f9fafb;
  font-weight: 600;
}

.markdown-content :deep(tr:nth-child(even)) {
  background-color: #f9fafb;
}

/* 文章底部 */
.article-footer {
  padding: 2rem 2.5rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-top: 1px solid #e5e7eb;
}

.footer-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%);
  margin-bottom: 1.5rem;
}

.footer-text {
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.footer-actions {
  display: flex;
  justify-content: center;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border: 1px solid #d1d5db;
  border-radius: 10px;
  color: #4b5563;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
}

/* 页脚卡片 */
.footer-card {
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border: 1px solid #e1e4e8;
  border-radius: 16px;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.06),
    0 1px 3px rgba(0, 0, 0, 0.02);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .layout-container {
    flex-direction: column;
  }
  
  .article-main {
    width: 100%;
  }
  
  .article-header,
  .article-content,
  .article-footer {
    padding: 1.5rem;
  }
  
  .article-title {
    font-size: 1.75rem;
  }
}

@media (max-width: 640px) {
  .mobile-back-btn {
    display: inline-flex;
  }
  
  .article-header,
  .article-content,
  .article-footer {
    padding: 1.25rem;
  }
  
  .article-title {
    font-size: 1.5rem;
  }
  
  .article-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .markdown-content {
    font-size: 1rem;
  }
  
  .markdown-content :deep(pre) {
    padding: 1rem;
    margin: 1rem -0.5rem;
    border-radius: 0;
  }
}
</style>
